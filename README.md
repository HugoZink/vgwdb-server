# Node Mongodb server
Deze Nodejs server biedt API op een Mongodb database met eenvoudige userinformatie.
De server heeft geen frontend; hiervoor is een externe frontend applicatie nodig, zoals bijvoorbeeld deze [angular-starterpack](https://github.com/avansinformatica/angular-starterpack).

## Vooraf
- nodejs installeren
- Mongodb installeren
- Mongodb starten

## Gebruik
Vanaf command line:
```
npm install
npm start
```
De server runt op [localhost:3000](http://localhost:3000) en op [Heroku](https://node-mongodb-server.herokuapp.com/api/v1/users).

## API Endpoints
Aanroepen van de endpoints kan met [Postman](https://www.getpostman.com/docs/introduction). 

Voorbeelden van endpoints: 
- GET [localhost:3000/api/v1/users](http://localhost:3000/api/v1/users)
- GET, PUT, DELETE [localhost:3000/api/v1/users/2](http://localhost:3000/api/v1/users/2) (niet geimplementeerd)

## Heroku handleiding
Je kunt de server gemakkelijk op Heroku of een andere cloudprovider deployen. Je moet dan wel zorgen dat je ook een Mongo database-in-the-cloud hebt. 

### mLab Mongodb database-as-a-service
Een Mongodb database aanmaken in de cloud kan onder andere gratis bij [mLab](https://mlab.com). 

Stappen:
1. Maak een account op [mLab](https://mlab.com).
2. Check je email en klik op de verificatielink in de mail van mLab.
3. Maak een database aan via de `create new` knop in het dashboard. Kies Amazon als Cloud Provider, kies Sandbox, en klik rechtsonder op `continue`. Kies een Region. Kies zelf een database naam (kleine letters, zonder spaties).
4. Ga naar het dashboard (de homepage) en klik op je database.
> Bovenaan de page zie je de MongoDB URI. Dat is de connectionstring voor verbinding met de database. Deze string gaan we in de Nodejs server opbouwen op basis van **environment variables**. Je wilt je username en password namelijk niet hardcode in je applicatie opslaan.
>
> De connectionstring is als volgt opgebouwd:
> ```
> mongodb://<DB_USER>:<DB_PASSWORD>@<DB_HOST>:<DB_PORT>/<DB_DATABASE>
> ```
> Een voorbeeld van een connectionstring:
> ```
> mongodb://<DB_USER>:<DB_PASSWORD>@ds115166.mlab.com:15166/node-mongodb-users
> ```
Om toegang te krijgen tot de database moeten we een user in de database aanmaken. `DB_USER` en `DB_PASSWORD` komen van deze user.

5. Klik op de mLab site bij jouw database op de tab 'User' en klik rechts op 'Add database user'. Geef een naam en password. 

Je hebt nu een database met user. De connectionstring bouwen we in Nodejs op aan de hand van omgevingsvariabelen. Dat gebeurt in het bestand [./config/env/env.js](https://github.com/avansinformatica/node-mongodb-server/blob/master/config/env/env.js). 
De omgevingsvariabelen moeten we bij op Heroku instellen bij de app waarin jouw server draait.

### Een app op Heroku
Om een app in de Heroku cloud te draaien doe je het volgende.
1. Maak een [Heroku account](http://www.heroku.com) als je die nog niet hebt, en log in. 
2. Maak een nieuwe app. Klik op 'New' en kies 'New app'. Geef een naam. Dit wordt de subdomeinnaam van jouw installatie.
3. Ga in je app naar 'Settings' en klik bij 'Config vars' op 'Reveal config vars'. Maak de variabelen aan zoals hieronder genoemd.
4. Ga in je app naar 'Deploy' en koppel je app aan je GitHub account. Selecteer de repository waarin je je Nodejs Mongodb server beheert.
5. Klik bij 'Deploy' onderin het venster op 'Deploy'. Je app wordt nu opgehaald en geinstalleerd.
6. Klik rechtsboven op 'Open app'. Als alles goed is gegaan is je app beschikbaar. Navigeer naar `/api/v1/users` om te zien of je app correct met je database verbonden is. Als dat niet zo is, check je omgevingsvariabelen. Niets verkeerd ingetypt?

### Omgevingsvariabelen
Omgevingsvariabelen zijn variabelen waarin je configuratiewaarden kunt opslaan. Alleen degene met toegang tot de app op Heroku kent die waarden en kan ze instellen. Behoorlijk veilig dus. Je wilt die settings (bv username, password) namelijk niet hardcoded in je programmabestanden opslaan.

![config vars](https://github.com/avansinformatica/node-mongodb-server/blob/master/configvars.png)

De variabelen die je moet instellen:
- DB_DATABASE: de naam van je database
- DB_HOST: de host waar je database draait
- DB_PASSWORD: password van de database user
- DB_PORT: de port waarop je database bereikbaar is
- DB_USER: username waarmee je in je database inlogt
- ALLOW_ORIGIN: de URL van je Angular frontend. Hiermee geef je je frontend toegang tot de server. Zie de informatie hieronder.

### Allow Origin
Het HTTP protocol verbiedt het aanroepen van een URL van de ene server naar de andere. Dat klinkt misschien raar, maar het zou ervoor kunnen zorgen dat een server stiekem jouw services via je API aanroept. Om dat te voorkomen moet je aangeven vanaf welke oorsprong (of *origin*) jij requests toelaat. Dit heet [Cross-origin resource sharing](https://en.wikipedia.org/wiki/Cross-origin_resource_sharing).

Onze Nodejs server gaat bijvoorbeeld gebruikt worden door een Angular frontend zoals de [Angular Starterpack](https://github.com/avansinformatica/angular-starterpack). Als je die starterpack gebruikt en ook op Heroku hebt gedeployd (zie daarvoor de handleiding bij de Angular Starterpack) dan heb je een domeinnaam van jouw Angular frontend op Heroku. Dat wordt de waarde die je de omgevingsvariabele bij `ALLOW_ORIGIN` invult. 

Jij hebt jouw eigen URL, maar een voorbeeld zou kunnen zijn: 

```
https://angular-avans-starter.herokuapp.com
```
Dit is dus de *root* domeinnaam van jouw instantie op Heroku, zonder de '/dashboard' route.
