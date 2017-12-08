class Game {
    constructor(id, name, developer, weapons, document){
        this.id = id;
        this.name = name;
        this.developer = developer;
        this.weapons = weapons;

        //Convert Neo4J Integer objects to regular JS numbers
        this.id = this.id.toNumber();
        this.developer.id = this.developer.id.toNumber();
        
        for(let weapon of this.weapons){
            weapon.id = weapon.id.toNumber();
        }

        //Fetch data from MongoDB document (if it exists)
        if(document) {
            this.description = document.description;
            this.imagePath = document.imagePath;
            this.released = document.released;
        }
    }
}

module.exports = Game;