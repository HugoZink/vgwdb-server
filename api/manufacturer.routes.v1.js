var express = require('express');
var routes = express.Router();
var neodb = require('../config/neo.db');

var Manufacturer = require('../model/manufacturer.model');

routes.get('/manufacturers', function(req, res){

    res.contentType('application/json');

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

    res.contentType('application/json');
    
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

routes.post('/manufacturers', function(req, res){

    let session = neodb.session();

    let postedManufacturers = [];

    //If only a single object was posted, wrap it in an array.
    //This prevents code duplication.
    let arrayPosted = false;
    if(req.body instanceof Array) {
        postedManufacturers = req.body;
        arrayPosted = true;
    }
    else {
        postedManufacturers = [req.body];
    }

    let responseArr = [];

    for(let manufacturer of postedManufacturers) {
        var query = `CREATE (m:Manufacturer{name: {name}, founded: {founded}})
        RETURN ID(m) AS id, m.name AS name, m.founded AS founded`;

        session.run(query, {name: manufacturer.name, founded: Number(manufacturer.founded)})
        .then(function(result){

            let record = result.records[0];

            let manufacturerResponse = new Manufacturer(record._fields[0], record._fields[1], record._fields[2], []);

            //If only a single manufacturer was posted, return the new object right now.
            //Otherwise, add it to an array, and post it if it was the last one.
            if(!arrayPosted) {
                res.status(201).json(manufacturerResponse);
            }
            else {
                responseArr.push(manufacturerResponse);
                if(responseArr.length === req.body.length) {
                    res.status(201).json(responseArr);
                }
            }
        });
    }
});

module.exports = routes;