# Tempus Code Challenge (Pokemon Battle)

## Description

Build​ an​ ​API​ ​to​ ​battle​ ​Pokemon.​ ​Your​ ​API​ ​will​ ​call​ ​the​ ​public​ Pokemon​ ​API​ to​ get​ ​info (https://pokeapi.co/)

The​ ​API​ ​should​ ​have​ ​3 ​routes:

-Get​ ​single​ ​pokemon​ ​overview

  This​ ​will​ be​ ​a ​straight​ ​pass​ ​through​ ​to​ ​the​ ​pokemon​ ​API

-Get​ ​single​ ​attack

  This​ ​will​ ​be​ ​a ​straight​ ​pass​ ​through​ ​to​ ​the​ ​pokemon​ ​API

-Battle​ ​two​ ​Pokemon

  Take​ ​2 ​pokemon​ ​id's​ ​or​ ​names

  Find​ ​the​ ​HP​ ​for​ ​each​ ​of​ ​those​ ​characters.

  Find​ ​the​ ​Attacks​ ​and​ ​the​ ​power​ ​of​ ​those​ ​for​ ​each​ ​of​ ​those​ ​characters

  Start​ ​a ​random​ fight,​ where​ ​player​ ​1 ​starts​ ​and​ ​does​ ​a ​random​ ​attack,​ ​and​ ​it
    does​ ​HP​ ​damage​ ​of​ ​10%​ ​of​ ​the​ ​power​ of​ the​ ​attack​ ​to​ ​the​ ​other​ ​player

  Stop​ ​when​ ​one​ ​player​ ​is​ ​defeated

  Return​ ​the​ ​winner,​ and​ ​the​ ​history​ of​ ​the​ ​fight

## Tech Stack

1. Node 7 or above for promises with async await
2. Express server
3. webpack for simple sass and HTML to handle non API 404's
4. PUG template engine for non API 404's
5. Axios for handling API calls
6. node-cache for caching pokemon API responses (reddis would be better for production)
7. Mocha framework for unit tests

## Instructions

To run the application, please make sure you're running at least Node 7.

1. `npm install`
2. `npm run dev`

To run tests:

1. `npm run test`

## Endpoints

1. ​single​ ​pokemon​ ​overview: `http://localhost:7777/api/v1/pokemon/<identifier>`

   identifier is either a pokemon numeric id or a pokemon name

   example: http://localhost:7777/api/v1/pokemon/1

   http://localhost:7777/api/v1/pokemon/bulbasaur

2. single​ ​attack: `http://localhost:7777/api/v1/attack/<id>`

   id is an attack numeric id

   example: http://localhost:7777/api/v1/attack/72

3. battle: `http://localhost:7777/api/v1/battle/<identifier1>/<identifier2>`

   identifier1 is either a pokemon numeric id or a pokemon name for player 1

   identifier2 is either a pokemon numeric id or a pokemon name for player 2

   example: http://localhost:7777/api/v1/battle/1/2

   http://localhost:7777/api/v1/battle/bulbasaur/ivysaur

   **NOTE**: due to the slowness of the pokemon API AND aggressive pokemon API
   throttling API requests (429 errors), I recommend battling two pokemons
   with limited attacks, so attacks cache and complete battle finishes quicker.
   For example, http://localhost:7777/api/v1/battle/10/13

## Notes

1. I have been difficulty with the pokemon api Server.  I'm often getting gateway
timeouts (502 errors) or too many requests(429 errors; appears they are recently
aggressively throttling requests).  And the api is at times EXTREMELY slow to respond,
causing my Postman client to timeout.  As a result to the 502 errors, I wrapped pokemon
API calls in 3 tryouts before failing.  As a result of the 429 errors, and to increase
performance, I implemented a cache that saves API responses, and uses the cache over
a second fetch if the same pokemon or attack is later fetched.
2. I noticed that some attacks when fetched from the pokemon API for moves have an explicit null set for power.  Effectively a non damaging attack.  I clean this up as a 0 power.
3. When in battle, I fetch the attacks for player1 and player2 as a pair, using promise all, for performance, through my own local app API, which is caching the pokemon API response.  To further increase performance, should ONLY one of those attack info requests already be cached, I put in a third attack from either player 1 or player 2 pokemon attacks that is the first non cached attack, if any available.  The thought is since I am using promise all, 2 attack requests take the same time as 1, so might as well request a future possible attack so it's now cached.
4. I include log statements to show cache hits and misses.
5. I included log statements to show start of battle, when each round of a battle is completed, and when a complete battle is finished, along with the winner, so you can see things are moving on a request as the pokemon API is EXTREMELY slow in response.

## Other

1. I have a simple HTML front end simply for showing 404.  Any non api route no match shows a 404 page.  For example http://localhost:7777/
2. Any api route no match returns a 404.  For example http://localhost:7777/api/v1/blah/72
3. I versioned my api to v1, as api's should always be versioned.

## Testing

I am using the Mocha framework for unit tests.  All unit tests live in test directory.
