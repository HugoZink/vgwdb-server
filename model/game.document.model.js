const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const GameSchema = new Schema({
    name: {
        type: String,
        required: true
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

const Game = mongoose.model('game', GameSchema);

module.exports = Game;