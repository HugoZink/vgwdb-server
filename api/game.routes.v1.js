var express = require('express');
var routes = express.Router();
var Game = require('../model/game.model');

var neodb = require('../config/neo.db');

routes.get('/games', function(req, res){
    res.contentType('application/json');

    let games = [];

    var session = neodb.session();

    //Get all games, along with their developer and their featured weapons.
    let query = `MATCH (g:Game)<-[rd:DEVELOPED]-(d:Developer)
    MATCH (g)-[rw:FEATURES]->(w:Weapon)
    RETURN ID(g) AS id, g.name AS name,
    { id: ID(d), name: d.name, developed: rd.year } AS developer,
    collect({ id: ID(w), name: w.name, ingameName: rw.ingameName }) AS weapons`;
    
    session.run(query)
    .then(function(result){

        session.close();

        result.records.forEach(function(rec){
            games.push(new Game(rec._fields[0], rec._fields[1], rec._fields[2], rec._fields[3]));
        });

        res.status(200).json(games);
    })
    .catch(function(err){
        console.log(err);
        res.status(400).json(err);

        session.close();
    });
});

routes.get('/games/:id', function(req, res){

    var session = neodb.session();

    //Get a single game, along with its developer and its featured weapons.
    let query = `MATCH (g:Game)<-[rd:DEVELOPED]-(d:Developer)
    MATCH (g)-[rw:FEATURES]->(w:Weapon)
    WHERE ID(g) = {id}
    RETURN ID(g) AS id, g.name AS name,
    { id: ID(d), name: d.name, developed: rd.year } AS developer,
    collect({ id: ID(w), name: w.name, ingameName: rw.ingameName }) AS weapons`;
    
    session.run(
        query,
        {id: Number(req.params.id)})
    .then(function(result){
        session.close();

        var record = result.records[0];

        res.status(200).json(new Game(record._fields[0], record._fields[1], record._fields[2], record._fields[3]));
    })
    .catch(function(err){
        console.log(err);
        res.status(400).json(err);

        session.close();
    });
});

module.exports = routes;