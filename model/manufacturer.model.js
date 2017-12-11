class Manufacturer {
    constructor(id, name, founded, weapons){
        this.id = id;
        this.name = name;
        this.founded = founded;
        this.weapons = [];

        //Convert Neo4J Integer objects to regular JS numbers
        this.id = this.id.toNumber();

        if(typeof this.founded !== 'number') {
            this.founded = this.founded.toNumber();
        }

        if(weapons){
            for(let weapon of weapons) {
                //Filter out null values
                if(!weapon.id) {
                    continue;
                }

                weapon.id = weapon.id.toNumber();
                this.weapons.push(weapon);
            }
        }
    }
}

module.exports = Manufacturer;