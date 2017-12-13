class Developer {
    constructor(id, name, founded, games){
        this.id = id;
        this.name = name;
        this.founded = founded;
        this.games = [];

        //Convert Neo4J Integer objects to regular JS numbers
        this.id = this.id.toNumber();

        if(typeof this.founded !== 'number') {
            this.founded = this.founded.toNumber();
        }

        if(games){
            for(let game of games) {
                //Filter out null values
                if(!game.id) {
                    continue;
                }

                game.id = game.id.toNumber();
                this.games.push(game);
            }
        }
    }
}

module.exports = Developer;