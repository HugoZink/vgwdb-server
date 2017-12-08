var express = require('express');
var routes = express.Router();
var neodb = require('../config/neo.db');
var mongodb = require('../config/mongo.db');

var Game = require('../model/game.model');
var GameDocument = require('../model/game.document.model');

routes.get('/games', function(req, res){
    res.contentType('application/json');

    let games = [];

    let session = neodb.session();

    //Get all games, along with their developer and their featured weapons.
    let query = `MATCH (g:Game)<-[rd:DEVELOPED]-(d:Developer)
    MATCH (g)-[rw:FEATURES]->(w:Weapon)
    RETURN ID(g) AS id, g.name AS name,
    { id: ID(d), name: d.name } AS developer,
    collect({ id: ID(w), name: w.name, ingameName: rw.ingameName, documentId: w.documentId }) AS weapons,
    g.documentId AS documentId`;
    
    session.run(query)
    .then(function(result){

        session.close();

        let gameDocuments = {};

        //Get all mongo documents
        GameDocument.find({})
        .then(function(gameDocs){

            //Index documents by their id
            for(let gameDoc of gameDocs){
                gameDocuments[gameDoc._id] = gameDoc;
            }

            //Create instances of the Game model by combining the Neo4J and Mongo data
            result.records.forEach(function(rec){
                games.push(new Game(rec._fields[0], rec._fields[1], rec._fields[2], rec._fields[3], gameDocuments[rec._fields[4]]));
            });

            res.status(200).json(games);
        });
    })
    .catch(function(err){
        console.log(err);
        res.status(400).json(err);

        session.close();
    });
});

routes.get('/games/:id', function(req, res){

    let session = neodb.session();

    //Get a single game, along with its developer and its featured weapons.
    let query = `MATCH (g:Game)<-[rd:DEVELOPED]-(d:Developer)
    MATCH (g)-[rw:FEATURES]->(w:Weapon)
    WHERE ID(g) = {id}
    RETURN ID(g) AS id, g.name AS name,
    { id: ID(d), name: d.name } AS developer,
    collect({ id: ID(w), name: w.name, ingameName: rw.ingameName, documentId: w.documentId }) AS weapons,
    g.documentId AS documentId`;
    
    session.run(
        query,
        {id: Number(req.params.id)})
    .then(function(result){
        session.close();

        var record = result.records[0];

        //Find the associated document
        GameDocument.findOne({_id: record._fields[4]})
        .then(function(gameDoc){
            res.status(200).json(new Game(record._fields[0], record._fields[1], record._fields[2], record._fields[3], gameDoc));
        });        
    })
    .catch(function(err){
        console.log(err);
        res.status(400).json(err);

        session.close();
    });
});

module.exports = routes;