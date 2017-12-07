var express = require('express');
var routes = express.Router();
var neodb = require('../config/neo.db');

var Weapon = require('../model/weapon.model');

routes.get('/weapons', function(req, res){
    res.contentType('application/json');

    let weapons = [];

    let session = neodb.session();

    let query = `MATCH (w:Weapon)<-[:MANUFACTURES]-(m:Manufacturer)
    MATCH (w)<-[rw:FEATURES]-(g:Game)
    RETURN ID(w) AS id, w.name AS name, w.designed AS designed,
    {id: ID(m), name: m.name} AS manufacturer,
    collect({id: ID(g), name: g.name, ingameName: rw.ingameName}) AS games`;

    session.run(query)
    .then(function(result){
        session.close();

        result.records.forEach(function(rec){
            weapons.push(new Weapon(rec._fields[0], rec._fields[1], rec._fields[2], rec._fields[3], rec._fields[4]));
        });

        res.status(200).json(weapons);
    })
    .catch(function(err){
        console.log(err);
        res.status(400).json(err);

        session.close();
    });
});

module.exports = routes;