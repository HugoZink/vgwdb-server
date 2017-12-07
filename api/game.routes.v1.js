var express = require('express');
var routes = express.Router();

var neodb = require('../config/neo.db');

routes.get('/games', function(req, res){
    res.contentType('application/json');

    let games = [];

    var session = neodb.session();

    session.run('MATCH (g:Game) RETURN ID(g) AS id, g.name AS name')
    .then(function(result){

        session.close();

        result.records.forEach(function(rec){
            games.push({
                id: rec._fields[0].toNumber(),
                name: rec._fields[1]
            });
        });

        res.status(200).json(games);
    })
    .catch(function(err){
        session.close();
        res.status(400).json(err);
    });
});

routes.get('/games/:id', function(req, res){

    var session = neodb.session();
    
    session.run('MATCH(g) WHERE ID(g) = {id} RETURN ID(g), g.name', {id: Number(req.params.id)})
    .then(function(result){
        session.close();

        var record = result.records[0];

        res.status(200).json({
            id: record._fields[0].toNumber(),
            name: record._fields[1]
        })
    })
    .catch(function(err){
        session.close();

        res.status(400).json(err);
    });

});

module.exports = routes;