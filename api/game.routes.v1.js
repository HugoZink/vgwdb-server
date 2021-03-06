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
    OPTIONAL MATCH (g)-[rw:FEATURES]->(w:Weapon)
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
    OPTIONAL MATCH (g)-[rw:FEATURES]->(w:Weapon)
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

//Create game/games
routes.post('/games', function(req, res){

    res.contentType('application/json');

    let games = [];

    //If only a single object was posted, wrap it in an array.
    //This prevents code duplication by still entering the for loop.
    let arrayPosted = false;
    if(req.body instanceof Array) {
        games = req.body;
        arrayPosted = true;
    }
    else {
        games = [req.body];
    }

    let session = neodb.session();

    //Neo4j query for inserting games and linking to developer
    let query = `CREATE (g:Game{name: {gameName}, documentId: {documentId}})
    WITH g
    MATCH (d:Developer{name: {devName}})
    MERGE (d)-[:DEVELOPED]->(g)
    RETURN ID(g) AS id, g.name AS name,
    {id: ID(d), name: d.name} AS developer`;

    //If multiple games were posted, this array will hold all newly created games.
    let responseArr = [];

    for(let game of games) {

        let gameDoc = new GameDocument({
            name: game.name,
            released: game.released,
            imagePath: game.imagePath,
            description: game.description
        });

        //Save details in Mongo database, then use document ID to save it in neo4j
        gameDoc.save().then(function(newGameDoc){

            session.run(query, { 
                gameName: newGameDoc.name,
                documentId: newGameDoc._id.toString(),
                devName: game.developer.name
            })
            .then(function(result){

                let record = result.records[0];

                let newGame = new Game(record._fields[0], newGameDoc.name, record._fields[2], [], newGameDoc);

                //If only a single game was posted, return the new object right now.
                //Otherwise, add it to an array, and post it if it was the last one.
                if(!arrayPosted) {
                    res.status(201).json(newGame);
                }
                else {
                    responseArr.push(newGame);
                    if(responseArr.length === req.body.length) {
                        res.status(201).json(responseArr);
                    }
                }

                session.close();
            });

        });
    }
});

//Update a game
routes.put('/games/:id', function(req, res){

    res.contentType('application/json');
    
    let session = neodb.session();

    //Find the given game, and update it.
    //Remove old developer and assign the new one.
    //Finally, return the new data.
    let query = `MATCH (g:Game)
    WHERE ID(g) = {id}
    SET g.name = {newName}
    WITH g
    MATCH (d:Developer)-[rd:DEVELOPED]->(g)
    DELETE rd
    WITH g, d
    MATCH (d:Developer{name: {developerName}})
    MERGE (d)-[:DEVELOPED]->(g)
    WITH g, d
    OPTIONAL MATCH (g)-[rw:FEATURES]->(w:Weapon)
    RETURN ID(g) AS id, g.name AS name,
    {id: ID(d), name: d.name} AS developer,
    collect({ id: ID(w), name: w.name, ingameName: rw.ingameName, documentId: w.documentId }) AS weapons,
    g.documentId AS documentId`;

    //Update node in neo4j database
    session.run(query, {id: Number(req.params.id), newName: req.body.name, developerName: req.body.developer.name})
    .then(function(result){

        let record = result.records[0];

        //Find game document in Mongo database
        GameDocument.findById(record._fields[4], function(err, gameDoc){

            if(err)
                throw err;

            gameDoc.name = req.body.name;
            gameDoc.released = req.body.released;
            gameDoc.imagePath = req.body.imagePath;
            gameDoc.description = req.body.description;

            //Update document in Mongo database
            gameDoc.save(function(err, newGameDoc){
                
                let response = new Game(record._fields[0], newGameDoc.name, record._fields[2], record._fields[3], newGameDoc);

                res.status(202).json(response);

                session.close();
            });
        });
    });
});

//Delete a game
routes.delete('/games/:id', function(req, res){
    let session = neodb.session();

    //Delete game, but fetch the document ID to delete it from Mongo too.
    let query = `MATCH (g:Game)
    WHERE ID(g) = {id}
    WITH g, g.documentId AS documentId
    DETACH DELETE g
    RETURN documentId`;

    session.run(query, {id: Number(req.params.id)})
    .then(function(result){
        let documentId = result.records[0]._fields[0];

        GameDocument.findByIdAndRemove(documentId, function(err, game){

            if(err)
                throw err;

            res.status(204).end();

            session.close();
        });
    });
});

module.exports = routes;