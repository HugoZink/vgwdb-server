var express = require('express');
var routes = express.Router();
var neodb = require('../config/neo.db');

var Manufacturer = require('../model/manufacturer.model');

routes.get('/manufacturers', function(req, res){

    let session = neodb.session();

    let query = `MATCH (m:Manufacturer)
    OPTIONAL MATCH (m)-[:MANUFACTURES]->(w:Weapon)
    RETURN ID(m) AS id, m.name AS name, m.founded AS founded,
    collect({id: ID(w), name: w.name}) AS weapons`;

    session.run(query)
    .then(function(result){
        let records = result.records;

        let manufacturers = [];
        for(let record of records){
            manufacturers.push(new Manufacturer(record._fields[0], record._fields[1], record._fields[2], record._fields[3]));
        }

        res.status(200).json(manufacturers);

        session.close();
    })
    .catch(function(err){
        console.log(err);

        session.close();
    });
});

routes.get('/manufacturers/:id', function(req, res){
    
        let session = neodb.session();
    
        let query = `MATCH (m:Manufacturer)
        WHERE ID(m) = {id}
        OPTIONAL MATCH (m)-[:MANUFACTURES]->(w:Weapon)
        RETURN ID(m) AS id, m.name AS name, m.founded AS founded,
        collect({id: ID(w), name: w.name}) AS weapons`;
    
        session.run(query, {id: Number(req.params.id)})
        .then(function(result){
            let record = result.records[0];
    
            let manufacturer = new Manufacturer(record._fields[0], record._fields[1], record._fields[2], record._fields[3]);
    
            res.status(200).json(manufacturer);

            session.close();
        })
        .catch(function(err){
            console.log(err);
    
            session.close();
        });
    });

module.exports = routes;