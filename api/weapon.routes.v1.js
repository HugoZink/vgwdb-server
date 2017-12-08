var express = require('express');
var routes = express.Router();
var neodb = require('../config/neo.db');
var mongodb = require('../config/mongo.db');

var Weapon = require('../model/weapon.model');
var WeaponDocument = require('../model/weapon.document.model');

routes.get('/weapons', function(req, res){
    res.contentType('application/json');

    let weapons = [];

    let session = neodb.session();

    //Get all weapons, along with their manufacturers and the games they appear in.
    let query = `MATCH (w:Weapon)<-[:MANUFACTURES]-(m:Manufacturer)
    MATCH (w)<-[rw:FEATURES]-(g:Game)
    RETURN ID(w) AS id, w.name AS name,
    {id: ID(m), name: m.name} AS manufacturer,
    collect({id: ID(g), name: g.name, ingameName: rw.ingameName}) AS games,
    w.documentId AS documentId`;

    session.run(query)
    .then(function(result){
        session.close();

        let weaponDocuments = {}

        //Get all Mongo documents
        WeaponDocument.find({}).then(function(weaponDocs){

            //Index documents by their ID
            for(let weaponDoc of weaponDocs){
                weaponDocuments[weaponDoc._id] = weaponDoc;
            }

            //Create instances of the Weapon model by combining Neo4J and MongoDB data
            result.records.forEach(function(rec){
                weapons.push(new Weapon(rec._fields[0], rec._fields[1], rec._fields[2], rec._fields[3], weaponDocuments[rec._fields[4]]));
            });

            res.status(200).json(weapons);
        });
    })
    .catch(function(err){
        console.log(err);
        res.status(400).json(err);

        session.close();
    });
});



routes.get('/weapons/:id', function(req, res){
    res.contentType('application/json');

    let session = neodb.session();

    //Get a single weapon, along with their manufacturers and the games they appear in.
    let query = `MATCH (w:Weapon)<-[:MANUFACTURES]-(m:Manufacturer)
    MATCH (w)<-[rw:FEATURES]-(g:Game)
    WHERE ID(w) = {id}
    RETURN ID(w) AS id, w.name AS name,
    {id: ID(m), name: m.name} AS manufacturer,
    collect({id: ID(g), name: g.name, ingameName: rw.ingameName}) AS games,
    w.documentId AS documentId`;

    session.run(query, {id: Number(req.params.id)})
    .then(function(result){
        session.close();

        let rec = result.records[0];

        //Get related Mongo document
        WeaponDocument.findOne({_id: rec._fields[4]}).then(function(weaponDoc){

            //Create an instance of the Weapon model by combining Neo4J and MongoDB data
            let weapon = new Weapon(rec._fields[0], rec._fields[1], rec._fields[2], rec._fields[3], weaponDoc);

            res.status(200).json(weapon);
        });
    })
    .catch(function(err){
        console.log(err);
        res.status(400).json(err);

        session.close();
    });
});

module.exports = routes;