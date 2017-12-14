var express = require('express');
var routes = express.Router();
var neodb = require('../config/neo.db');

var Developer = require('../model/developer.model');

routes.get('/developers', function(req, res){

    res.contentType('application/json');

    let session = neodb.session();
    
    let query = `MATCH (d:Developer)
    OPTIONAL MATCH (d)-[:DEVELOPED]->(g:Game)
    RETURN ID(d) AS id, d.name AS name, d.founded AS founded,
    collect({id: ID(g), name: g.name}) AS games`;

    session.run(query)
    .then(function(result){
        let records = result.records;

        let developers = [];
        for(let record of records){
            developers.push(new Developer(record._fields[0], record._fields[1], record._fields[2], record._fields[3]));
        }

        res.status(200).json(developers);

        session.close();
    });
});

routes.get('/developers/:id', function(req, res){
    
    res.contentType('application/json');

    let session = neodb.session();
    
    let query = `MATCH (d:Developer)
    WHERE ID(d) = {id}
    OPTIONAL MATCH (d)-[:DEVELOPED]->(g:Game)
    RETURN ID(d) AS id, d.name AS name, d.founded AS founded,
    collect({id: ID(g), name: g.name}) AS games`;

    session.run(query, {id: Number(req.params.id)})
    .then(function(result){
        let record = result.records[0];

        let developer = new Developer(record._fields[0], record._fields[1], record._fields[2], record._fields[3]);

        res.status(200).json(developer);

        session.close();
    });
});

//Create new developer
routes.post('/developers', function(req, res){
    res.contentType('application/json');
    
    let session = neodb.session();

    let postedDevelopers = [];

    //If only a single object was posted, wrap it in an array.
    //This prevents code duplication.
    let arrayPosted = false;
    if(req.body instanceof Array) {
        postedDevelopers = req.body;
        arrayPosted = true;
    }
    else {
        postedDevelopers = [req.body];
    }

    let responseArr = [];

    for(let developer of postedDevelopers) {
        var query = `CREATE (d:Developer{name: {name}, founded: {founded}})
        RETURN ID(d) AS id, d.name AS name, d.founded AS founded`;

        session.run(query, {name: developer.name, founded: Number(developer.founded)})
        .then(function(result){

            let record = result.records[0];

            let developerResponse = new Developer(record._fields[0], record._fields[1], record._fields[2], []);

            //If only a single developer was posted, return the new object right now.
            //Otherwise, add it to an array, and post it if it was the last one.
            if(!arrayPosted) {
                res.status(201).json(developerResponse);
            }
            else {
                responseArr.push(developerResponse);
                if(responseArr.length === req.body.length) {
                    res.status(201).json(responseArr);
                }
            }

            session.close();
        });
    }
});

//Update developer
routes.put('/developers/:id', function(req, res){
    
    res.contentType('application/json');

    let session = neodb.session();

    let developerId = Number(req.params.id);

    //Find developer, update its properties, then return the new developer with its games.
    let query = `MATCH (d:Developer)
    WHERE ID(d) = {id}
    SET d.name = {name}, d.founded = {founded}
    WITH d
    OPTIONAL MATCH (d)-[:DEVELOPED]->(g:Game)
    RETURN ID(d) AS id, d.name AS name, d.founded AS founded,
    collect({id: ID(g), name: g.name}) AS games`;

    session.run(query, { id: developerId, name: req.body.name, founded: req.body.founded })
    .then(function(result){

        let record = result.records[0];

        let developer = new Developer(record._fields[0], record._fields[1], record._fields[2], record._fields[3]);

        res.status(202).json(developer);

        session.close();
    });
});
    
//Delete a developer
routes.delete('/developers/:id', function(req, res){

    let session = neodb.session();

    let developerId = Number(req.params.id);

    //Find and delete developer
    let query = `MATCH (d:Developer)
    WHERE ID(d) = {id}
    DETACH DELETE d`;

    session.run(query, {id: developerId})
    .then(function(result){

        res.status(204).end();

        session.close();
    });
});

module.exports = routes;