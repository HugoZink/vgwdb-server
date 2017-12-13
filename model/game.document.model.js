const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const Schema = mongoose.Schema;

const GameSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    released: {
        type: Number,
        required: true
    },
    imagePath: {
        type: String,
        required: false
    },
    description: {
        type: String,
        required: false
    }
}, {
    timestamps: true
});

//Add uniqueness validator to schema
GameSchema.plugin(uniqueValidator);

const Game = mongoose.model('game', GameSchema);

module.exports = Game;