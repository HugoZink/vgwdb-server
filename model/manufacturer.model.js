class Manufacturer {
    constructor(id, name, founded, weapons){
        this.id = id;
        this.name = name;
        this.founded = founded;
        this.weapons = weapons;

        //Convert Neo4J Integer objects to regular JS numbers
        this.id = this.id.toNumber();
        this.founded = this.founded.toNumber();
        for(let weapon of this.weapons) {
            weapon.id = weapon.id.toNumber();
        }
    }
}

module.exports = Manufacturer;