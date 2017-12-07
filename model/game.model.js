class Game {
    constructor(id, name, developer, weapons){
        this.id = id;
        this.name = name;
        this.developer = developer;
        this.weapons = weapons;

        //Convert Neo4J Integer objects to regular JS numbers
        this.id = this.id.toNumber();
        this.developer.id = this.developer.id.toNumber();
        this.developer.developed = this.developer.developed.toNumber();
        
        for(let weapon of this.weapons){
            weapon.id = weapon.id.toNumber();
        }
    }
}

module.exports = Game;