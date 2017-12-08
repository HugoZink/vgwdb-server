const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const WeaponSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    designed: {
        type: String,
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

const Weapon = mongoose.model('weapon', WeaponSchema);

module.exports = Weapon;