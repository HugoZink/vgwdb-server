class Game {
    constructor(id, name, developer, weapons, document){
        this.id = id;
        this.name = name;
        this.developer = developer;
        this.weapons = [];

        //Convert Neo4J Integer objects to regular JS numbers
        this.id = this.id.toNumber();
        this.developer.id = this.developer.id.toNumber();
        
        if(weapons){
            for(let weapon of weapons){
                //Ignore null values
                if(weapon.id == null || weapon.id.low == null) {
                    continue;
                }

                weapon.id = weapon.id.toNumber();
                this.weapons.push(weapon);
            }
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