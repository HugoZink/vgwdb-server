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

module.exports = routes;