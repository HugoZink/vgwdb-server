var express = require('express');
var routes = express.Router();
var neodb = require('../config/neo.db');
var mongodb = require('../config/mongo.db');

var Weapon = require('../model/weapon.model');
var WeaponDocument = require('../model/weapon.document.model');

//Get all weapons
routes.get('/weapons', function(req, res){
    res.contentType('application/json');

    let weapons = [];

    let session = neodb.session();

    //Get all weapons, along with their manufacturers and the games they appear in.
    let query = `MATCH (w:Weapon)<-[:MANUFACTURES]-(m:Manufacturer)
    OPTIONAL MATCH (w)<-[rw:FEATURES]-(g:Game)
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

                //If no related games were found, instantiate an empty array
                let weaponGames = rec._fields[3];
                if(!weaponGames || !weaponGames[0].id) {
                    weaponGames = [];
                }

                weapons.push(new Weapon(rec._fields[0], rec._fields[1], rec._fields[2], weaponGames, weaponDocuments[rec._fields[4]]));
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

//Get one weapon
routes.get('/weapons/:id', function(req, res){
    res.contentType('application/json');

    let session = neodb.session();

    //Get a single weapon, along with their manufacturers and the games they appear in.
    let query = `MATCH (w:Weapon)<-[:MANUFACTURES]-(m:Manufacturer)
    WHERE ID(w) = {id}
    OPTIONAL MATCH (w)<-[rw:FEATURES]-(g:Game)
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

            //If no related games were found, instantiate an empty array
            let weaponGames = rec._fields[3];
            if(!weaponGames || !weaponGames[0].id) {
                weaponGames = [];
            }

            //Create an instance of the Weapon model by combining Neo4J and MongoDB data
            let weapon = new Weapon(rec._fields[0], rec._fields[1], rec._fields[2], weaponGames, weaponDoc);

            res.status(200).json(weapon);
        });
    })
    .catch(function(err){
        console.log(err);
        res.status(400).json(err);

        session.close();
    });
});

//Create weapon
routes.post('/weapons', function(req, res){

    res.contentType('application/json');
    
    let session = neodb.session();

    let weapons = [];

    //If only a single object was posted, wrap it in an array.
    //This prevents code duplication.
    let arrayPosted = false;
    if(req.body instanceof Array) {
        weapons = req.body;
        arrayPosted = true;
    }
    else {
        weapons = [req.body];
    }

    let responseArr = [];

    for(let weapon of weapons) {
        let weaponDocument = new WeaponDocument({
            name: weapon.name,
            designed: weapon.designed,
            imagePath: weapon.imagePath,
            description: weapon.description
        });

        //Save details in Mongo database, then use document ID to save it in neo4j
        weaponDocument.save().then(function(newWeaponDoc){
            
            var query = `MATCH(m:Manufacturer)
            WHERE ID(m) = {manufacturerId}
            CREATE (w:Weapon{documentId: {docId}, name: {name}})<-[:MANUFACTURES]-(m)
            RETURN ID(w) AS id, w.name AS name,
            {id: ID(m), name: m.name} AS manufacturer,
            w.documentId AS documentId`;

            session.run(query, {
                manufacturerId: Number(weapon.manufacturer.id),
                docId: newWeaponDoc._id.toString(),
                name: weapon.name
            })
            .then(function(result){

                let record = result.records[0];

                let newWeapon = new Weapon(record._fields[0], record._fields[1], record._fields[2], [], newWeaponDoc);

                //If only a single weapon was posted, return the new object right now.
                //Otherwise, add it to an array, and post it if it was the last one.
                if(!arrayPosted) {
                    res.status(200).json(newWeapon);
                }
                else {
                    responseArr.push(newWeapon);
                    if(responseArr.length === req.body.length) {
                        res.status(201).json(responseArr);
                    }
                }
            });
        });
    }
});

//Update weapon
routes.put('/weapons/:id', function(req, res){

    res.contentType('application/json');

    let session = neodb.session;

    let query = `MATCH (w:Weapon)<-[:MANUFACTURES]-(m:Manufacturer)
    WHERE ID(w) = {id}
    OPTIONAL MATCH (w)<-[rw:FEATURES]-(g:Game)
    SET w.name = '{newName}'
    RETURN ID(w) AS id, w.name AS name,
    {id: ID(m), name: m.name} AS manufacturer,
    collect({id: ID(g), name: g.name, ingameName: rw.ingameName}) AS games,
    w.documentId AS documentId;`;

    session.run(query, {id: Number(req.params.id), newName: req.body.name})
    .then(function(records){

        let record = records[0];

        let weaponDoc = WeaponDocument.findById(record._fields[4]);

        weaponDoc.name = req.body.name;
        weaponDoc.designed = req.body.designed;
        weaponDoc.imagePath = req.body.imagePath;
        weaponDoc.description = req.body.description;

        weaponDoc.save().then(function(newDoc){

            let response = new Weapon(record._fields[0], record._fields[1], record._fields[2], record._fields[3], newDoc);

            res.status(202).json(response);
        });
    });
});

//Delete all weapons
/*
routes.delete('/weapons', function(req, res){

    let session = neodb.session();

    let query = `MATCH (w:Weapon)
    DETACH DELETE w`;

    session.run(query).then(function(){

        WeaponDocument.remove({}).then(function(){

            res.status(204).end();

        });

    });

});
*/

//Delete one weapon
routes.delete('/weapons/:id', function(req, res){

    let session = neodb.session();

    let query = `MATCH (w:Weapon)
    WHERE ID(w) = {id}
    WITH w, w.documentId AS documentId
    DETACH DELETE w
    RETURN documentId`;

    session.run(query, {id: Number(req.params.id)})
    .then(function(result){

        let documentId = result.records[0]._fields[0];

        console.log(documentId);

        WeaponDocument.findByIdAndRemove(documentId, function(err, weapon){

            console.log('Tried to delete weapon');

            if(err)
                throw err;

            res.status(204).end();
        });
    });
});

module.exports = routes;