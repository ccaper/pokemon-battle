const axios = require('axios');
const { random } = require('lodash');
const { uniq } = require('lodash');

/*
* Controller for pokemon Battle
*/

/*
* Extract id embedded in URL.
*
* url: fully qualified url
*
* returns: id as number.
*/
function getIdFromUrl(url) {
  const urlComponents = url.split('/');
  const id = parseInt(urlComponents[urlComponents.length - 2], 10);
  return id;
}

/*
* Strips pokemon API pokemon info to bare essentials required for battle.
*
* pokemonResponse: full pokemon info JSON response from pokemon api
*
* returns: stripped pokemon data JSON containing id, name, hp, array of attacks
*    where each object in attacks array contains attack id and attack name
*/
function stripPokemonResponse(pokemonResponse) {
  const strippedPokemonResponse = {
    id: pokemonResponse.id,
    name: pokemonResponse.name,
    hp: pokemonResponse.stats.find(stat => stat.stat.name === 'hp').base_stat,
    attacks: pokemonResponse.moves.map(move => ({
      id: getIdFromUrl(move.move.url),
      name: move.move.name
    }))
  };
  return strippedPokemonResponse;
}

/*
* Create pre battle data to show pokemons and there base hp
*
* pokemon1: player1 pokemon in battle
* pokemon2: player2 pokemon in battle
*
* returns: pre battle pokemon JSON
*/
function createPreBattleData(pokemon1, pokemon2) {
  const preBattleData = {
    pokemon1: {
      id: pokemon1.id,
      name: pokemon1.name,
      hp: pokemon1.hp
    },
    pokemon2: {
      id: pokemon2.id,
      name: pokemon2.name,
      hp: pokemon2.hp
    },
  };
  return preBattleData;
}

/*
* Gets damage an attack can do to an opponent.
*
* attackPower: the pokemon's attack power to compute damage it can do
*
* returns: a float representing damage the attack power can do to an opponent,
*    10% of the power
*/
function percentAttackPower(attackPower) {
  return attackPower * 0.1;
}

/*
* Creates the JSON data for battle history for a particular battle round.
*
* rountCount: number represnting the battle round
* pokemon1: player1 pokemon in battle
* attack1: player1's random attack
* attack1Power: damage player1's random attack can do
* pokemon2: player2 pokemon in battle
* attack2: player2's random attack
* attack2Power: damage player2's random attack can do
*
* returns: JSON for battle history for a particular battle round
*/
function createBattleData(roundCount, pokemon1, attack1, attack1Power, pokemon2, attack2, attack2Power) {
  const round = {
    round: roundCount,
    pokemon1: {
      id: pokemon1.id,
      name: pokemon1.name,
      hp: pokemon1.hp,
      attack: {
        id: attack1.id,
        name: attack1.name,
        power: attack1Power,
        tenPercentPower: percentAttackPower(attack1Power)
      }
    },
    pokemon2: {
      id: pokemon2.id,
      name: pokemon2.name,
      hp: pokemon2.hp,
      attack: {
        id: attack2.id,
        name: attack2.name,
        power: attack2Power,
        tenPercentPower: percentAttackPower(attack2Power)
      }
    },
  };
  return round;
}

/*
* Determins the winner after a complete battle.
*
* pokemon1: player1 pokemon in battle
* pokemon2: player2 pokemon in battle
*
* returns: the pokemon with the highest HP after a complete battle
*/
function determineWinner(pokemon1, pokemon2) {
  if (pokemon1.hp > pokemon2.hp) {
    return pokemon1;
  }
  return pokemon2;
}

/*
* Creates winner JSON after a complete battle for battle history.
*
* pokemon1: player1 pokemon in battle
* pokemon2: player2 pokemon in battle
* totalRounds: total rounds in battle
*
* returns winner JSON after a complete battle for battle history
*/
function createWinnerData(pokemon1, pokemon2, totalRounds) {
  const winner = determineWinner(pokemon1, pokemon2);
  const winnerData = {
    id: winner.id,
    name: winner.name,
    totalRounds
  };
  return winnerData;
}

/*
* Attack a pokemon and compute damage to HP
*
* attackPower: damage power can do to a pokemon
* pokemonHP: a pokemon's HP to subtract the damage from
*
* returns: pokemon's HP with attack damage done
*/
function attackPokemon(attackPower, pokemonHp) {
  return pokemonHp - percentAttackPower(attackPower);
}

/*
* Pokemon attack round.  Player1 attacks first, and player2 only attacks if HP
*    above 0 after attack.
*
* pokemon1Hp: player1's HP
* pokemon1AttackPower: damage player1's random attack can do to opponent
* pokemon2Hp: player2's HP
* pokemon2AttackPower: damage player2's random attack can do to opponent
*
* returns: object containing player1 and players2 HP's after an attack
*/
function attackPokemons(pokemon1Hp, pokemon1AttackPower, pokemon2Hp, pokemon2AttackPower) {
  const newPokemon2Hp = attackPokemon(pokemon1AttackPower, pokemon2Hp);
  let newPokemon1Hp = pokemon1Hp;
  if (newPokemon2Hp > 0) {
    newPokemon1Hp = attackPokemon(pokemon2AttackPower, pokemon1Hp);
  }
  return { newPokemon1Hp, newPokemon2Hp };
}

/*
* Some pokemon attack info has null for it's power.  This sets it to 0 if null.
*
* power: pokemon attack api power
*
* returns: 0 if null, otherwise the power
*/
function fixNonDamagingAttack(power) {
  return (power === null) ? 0 : power;
}

/*
* Calls internal API to get pokemon's info from pokemon API.  Note, I do a performance
* enhancement here where if user passes in same pokemon for both players, only 1
* pokemon api fetch is made.
*
* pokemon1Identifier: a pokemon's id or name for player1
* pokemon2Identifier: a pokemon's id or name for player2
* baseUrl: local app's base URL
*
* returns: a promise that resolves to an object containing pokemon API info for
*    player1 and player2
*/
function getPokemons(pokemon1Identifier, pokemon2Identifier, baseUrl) {
  return new Promise(async (resolve, reject) => {
    const promises = [];
    const pokemon1Promise = axios.get(`http://${baseUrl}/api/v1/pokemon/${pokemon1Identifier}`);
    promises.push(pokemon1Promise);
    if (pokemon1Identifier !== pokemon2Identifier) {
      const pokemon2Promise = axios.get(`http://${baseUrl}/api/v1/pokemon/${pokemon2Identifier}`);
      promises.push(pokemon2Promise);
    }
    try {
      const responses = await Promise.all(promises);
      let pokemon1 = null;
      let pokemon2 = null;
      if (promises.length === 1) {
        pokemon1 = stripPokemonResponse(responses[0].data);
        pokemon2 = { ...pokemon1 };
      } else {
        pokemon1 = stripPokemonResponse(responses[0].data);
        pokemon2 = stripPokemonResponse(responses[1].data);
      }
      resolve({ pokemon1, pokemon2 });
    } catch (error) {
      reject(error);
    }
  });
}

/*
* Gets a random attack from a pokemon.
*
* pokemon: pokemon to get a random attack from
*
* returns: a pokemons random attack (object containing attack id and name)
*/
function getRandomAttack(pokemon) {
  return pokemon.attacks[random(0, pokemon.attacks.length - 1)];
}

/*
* Gets random attacks for player1 and player2's pokemons
*
* pokemon1: player1's pokemon to get random attack
* pokemon2: player2's pokemon to get random attack
*
* returns: and object containing the attacks (object containing attack id and name)
*    for player1 and player2 pokemons
*/
function getRandomAttacks(pokemon1, pokemon2) {
  const pokemon1Attack = getRandomAttack(pokemon1);
  const pokemon2Attack = getRandomAttack(pokemon2);
  return { pokemon1Attack, pokemon2Attack };
}

/*
* Logic if should get a future non cached attack.  We get attacks info in pairs (player1
*    and player2 attack) from internal API.  This api caches the results.  If one
*    of the two requests for attack info has been cached, might as well pick another
*    attack to fetch and cache for possible performance improvements should that
*    attack get picked later.
*
* pokemon1Attack: the attack object for player1's random attack
* pokemon2Attack: the attack object for player2's random attack
* cacheAttackKeyAttackIds: array of attack id's in cache
*
* returns: true if only one attack request has been cached, otherwise false
*/
function shouldGetFutureNonCachedAttack(pokemon1Attack, pokemon2Attack, cacheAttackKeyAttackIds) {
  if ((cacheAttackKeyAttackIds.includes(pokemon1Attack.id) && !cacheAttackKeyAttackIds.includes(pokemon2Attack.id))
    ||
    (cacheAttackKeyAttackIds.includes(pokemon2Attack.id) && !cacheAttackKeyAttackIds.includes(pokemon1Attack.id))) {
    return true;
  }
  return false;
}

/*
* Pick first non cached attack from either player1 or player2 pokemon's attacks
*
* cacheAttackKeyAttackIds: array of attack id's in cache
* pokemon1: player1's pokemon
* pokemon2: player2's pokemon
*
* returns: first non cached attack from either player1 or player2 pokemon's attacks
*    if any available, otherwise null
*/
function pickAFutureNonCachedAttack(cacheAttackKeyAttackIds, pokemon1, pokemon2) {
  const combinedPokemonAttacks = uniq([...pokemon1.attacks.map(attack => attack.id), ...pokemon2.attacks.map(attack => attack.id)]);
  for (let i = 0; i < combinedPokemonAttacks.length; i += 1) {
    if (!cacheAttackKeyAttackIds.includes(combinedPokemonAttacks[i])) {
      return combinedPokemonAttacks[i];
    }
  }
  return null;
}

/*
* If only 1 attack between player1 or player2's random attacks has been previously cached,
*    get first non cached attack from either player1 or player2 pokemon's attacks
*    to possibly increase performance.
*
* pokemon1Attack: player1's pokemon random attack
* pokemon2Attack: player2's pokemon random attack
* cache: complete cache (may contain non attacks in cache, such as pokemon info)
* pokemon1: player1's pokemon
* pokemon2: player2's pokemon
*
* returns: first non cached attack from either player1 or player2 pokemon's attacks
*    if any available AND only one of two attacks previously cached, otherwise null
*/
function getFutureNonCachedAttack(pokemon1Attack, pokemon2Attack, cache, pokemon1, pokemon2) {
  const cacheAttackKeyAttackIds = cache.keys().filter(key => key.startsWith('attack-')).map(key1 => parseInt(key1.split('-')[1], 10));
  if (shouldGetFutureNonCachedAttack(pokemon1Attack, pokemon2Attack, cacheAttackKeyAttackIds)) {
    // add current attack id's on cache so we don't get a future attack that is the same as a current
    cacheAttackKeyAttackIds.push(pokemon1Attack.id);
    cacheAttackKeyAttackIds.push(pokemon2Attack.id);
    return pickAFutureNonCachedAttack(cacheAttackKeyAttackIds, pokemon1, pokemon2);
  }
  return null;
}

/*
* Hits internal API to get attack info from pokemon API.  Internal API caches request.
*    If only one attack has previously been cached, get first non cached attack
*    from either player1 or player2's pokemon for possible performance improvement
*    in future.
*
* pokemon1Attack: player1's pokemon's random attack
* pokemon2Attack: player2's pokemon's random attack
* baseUrl: local app's base URL
* cache: complete cache (may contain non attacks in cache, such as pokemon info)
* pokemon1: player1's pokemon
* pokemon2: player2's pokemon
*
* returns: a promise that resolves to an object containing the full information
*    for player1 and player2's pokemon attack info
*/
function getAttacksInfo(pokemon1Attack, pokemon2Attack, baseUrl, cache, pokemon1, pokemon2) {
  return new Promise(async (resolve, reject) => {
    const pokemon1AttackPromise = axios.get(`http://${baseUrl}/api/v1/attack/${pokemon1Attack.id}`);
    const pokemon2AttackPromise = axios.get(`http://${baseUrl}/api/v1/attack/${pokemon2Attack.id}`);
    const promises = [pokemon1AttackPromise, pokemon2AttackPromise];
    const futureAttack = getFutureNonCachedAttack(pokemon1Attack, pokemon2Attack, cache, pokemon1, pokemon2);
    if (futureAttack !== null) {
      const futureAttackPromise = axios.get(`http://${baseUrl}/api/v1/attack/${futureAttack}`);
      promises.push(futureAttackPromise);
    }
    try {
      const [pokemon1AttackResponse, pokemon2AttackResponse] = await Promise.all(promises);
      const pokemon1AttackInfo = pokemon1AttackResponse.data;
      const pokemon2AttackInfo = pokemon2AttackResponse.data;
      resolve({ pokemon1AttackInfo, pokemon2AttackInfo });
    } catch (error) {
      reject(error);
    }
  });
}

/*
* Sets power to 0 for player1 and player2's attack power for non damaging attacks
*    since non damaging attacks have power as null in pokemon API attack info
*
* pokemon1AttackInfo: player1's pokemon attack info
* pokemon2AttackInfo: player2's pokemon attack info
*
* returns: an object containing fixed power for player1 and player2 attacks
*/
function fixNonNonDamaginAttacks(pokemon1AttackInfo, pokemon2AttackInfo) {
  const pokemon1AttackPower = fixNonDamagingAttack(pokemon1AttackInfo.power);
  const pokemon2AttackPower = fixNonDamagingAttack(pokemon2AttackInfo.power);
  return { pokemon1AttackPower, pokemon2AttackPower };
}

/*
* Performs the battle rounds between two players until 1 player's HP is less
*   than 0.
*
* pokemon1: player1's pokemon
* pokemon2: player2's pokemon
* baseUrl: local app's base URL
* cache: complete cache (may contain non attacks in cache, such as pokemon info)
*
* returns: a promise that resolves to an array containing the JSON for the history
*    of the rounds of the battle
*/
function performBattle(pokemon1, pokemon2, baseUrl, cache) {
  return new Promise(async (resolve, reject) => {
    const rounds = [];
    let roundCount = 1;
    try {
      while (pokemon1.hp > 0 && pokemon2.hp > 0) {
        const { pokemon1Attack, pokemon2Attack } = getRandomAttacks(pokemon1, pokemon2);
        const { pokemon1AttackInfo, pokemon2AttackInfo } = await getAttacksInfo(pokemon1Attack, pokemon2Attack, baseUrl, cache, pokemon1, pokemon2);
        const { pokemon1AttackPower, pokemon2AttackPower } = fixNonNonDamaginAttacks(pokemon1AttackInfo, pokemon2AttackInfo);
        const { newPokemon1Hp, newPokemon2Hp } = attackPokemons(pokemon1.hp, pokemon1AttackPower, pokemon2.hp, pokemon2AttackPower);
        pokemon1.hp = newPokemon1Hp;
        pokemon2.hp = newPokemon2Hp;
        rounds.push(createBattleData(
          roundCount, pokemon1, pokemon1Attack, pokemon1AttackPower, pokemon2,
          pokemon2Attack, pokemon2AttackPower
        ));
        console.log(`completed round #${roundCount} for ${pokemon1.name} (${pokemon1.id}) vs ${pokemon2.name} (${pokemon2.id})`);
        roundCount += 1;
      }
      resolve(rounds);
    } catch (error) {
      reject(error);
    }
  });
}

/*
* Controller function for pokemon battle.
*
* Route maps to /api/v1//battle/:pokemon1Identifier/:pokemon2Identifier where identifier is either pokemon id pokemon name
*
* Returns JSON of pokemon battle history
*/
exports.battle = async (req, res) => {
  const { pokemon1Identifier, pokemon2Identifier } = req.params;
  const { myCache } = res.locals;
  try {
    const { pokemon1, pokemon2 } = await getPokemons(pokemon1Identifier, pokemon2Identifier, req.headers.host);
    console.log(`Starting battle for ${pokemon1.name} (${pokemon1.id}) vs ${pokemon2.name} (${pokemon2.id})`);
    const battleData = {};
    battleData.preBattleData = createPreBattleData(pokemon1, pokemon2);
    try {
      battleData.rounds = await performBattle(pokemon1, pokemon2, req.headers.host, myCache);
    } catch (error) {
      console.log(`Unrecoverable error trying to fetch attack data from pokemon API.  Battle ubruptly ended. (${error})`);
      res.sendStatus(500);
      return;
    }
    battleData.winner = createWinnerData(pokemon1, pokemon2, battleData.rounds.length);
    console.log(`Ending battle for ${pokemon1.name} (${pokemon1.id}) vs ${pokemon2.name} (${pokemon2.id}), winner ${battleData.winner.name} (${battleData.winner.id})`);
    res.json(battleData);
  } catch (error) {
    console.log(`Unrecoverable error trying to fetch pokemon data from pokemon API.  Battle ubruptly ended. (${error})`);
    res.sendStatus(500);
  }
};

module.exports.getIdFromUrl = getIdFromUrl;
module.exports.percentAttackPower = percentAttackPower;
module.exports.determineWinner = determineWinner;
module.exports.attackPokemon = attackPokemon;
module.exports.attackPokemons = attackPokemons;
module.exports.fixNonDamagingAttack = fixNonDamagingAttack;
module.exports.shouldGetFutureNonCachedAttack = shouldGetFutureNonCachedAttack;
module.exports.pickAFutureNonCachedAttack = pickAFutureNonCachedAttack;
