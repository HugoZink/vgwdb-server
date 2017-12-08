class Weapon {
    constructor(id, name, manufacturer, games, document) {
        this.id = id;
        this.name = name;
        this.manufacturer = manufacturer;
        this.games = games;

        //Convert Neo4J Integer objects to regular JS numbers
        this.id = this.id.toNumber();
        this.manufacturer.id = this.manufacturer.id.toNumber();

        for(let game of this.games) {
            game.id = game.id.toNumber();
        }

        //Fetch data from MongoDB document (if it exists)
        if(document) {
            this.description = document.description;
            this.designed = document.designed;
            this.imagePath = document.imagePath;
        }
    }
}

module.exports = Weapon;