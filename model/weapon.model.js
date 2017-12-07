class Weapon {
    constructor(id, name, designed, manufacturer, games) {
        this.id = id;
        this.name = name;
        this.designed = designed;
        this.manufacturer = manufacturer;
        this.games = games;

        //Convert Neo4J Integer objects to regular JS numbers
        this.id = this.id.toNumber();
        this.manufacturer.id = this.manufacturer.id.toNumber();

        for(let game of this.games) {
            game.id = game.id.toNumber();
        }
    }
}

module.exports = Weapon;