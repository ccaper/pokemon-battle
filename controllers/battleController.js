const axios = require('axios');
const { random } = require('lodash');
const { uniq } = require('lodash');

/*
* Controller for pokemon Battle
*/

/*
* Extract id embedded in URL as last path component before ending /.
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
* pokemon1: the stripped pokemon JSON player1 pokemon in battle
* pokemon2: the stripped pokemon JSON player2 pokemon in battle
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
* Computes damage an attack can do to an opponent.
*
* attackPower: a number for the pokemon's attack power
*
* returns: a float representing damage the attack power can do to an opponent,
*    10% of the power
*/
function computeAttackDamage(attackPower) {
  return attackPower * 0.1;
}

/*
* Creates the JSON data for battle history for a particular battle round.
*
* rountCount: number represnting the battle round
* pokemon1: stripped pokemon JSON player1 pokemon in battle
* attack1: stripped pokemon JSON player1's random attack
* attack1Power: number for damage player1's random attack can do
* pokemon2: stripped pokemon JSON player2 pokemon in battle
* attack2: stripped pokemon JSON player2's random attack
* attack2Power: number damage player2's random attack can do
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
        tenPercentPower: computeAttackDamage(attack1Power)
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
        tenPercentPower: computeAttackDamage(attack2Power)
      }
    },
  };
  return round;
}

/*
* Determines the winner after a complete battle.  Winner is player with highest
* HP, tie goes to player 2
*
* pokemon1: stripped pokemon JSON for player1 pokemon in battle
* pokemon2: stripped pokemon JSON player2 pokemon in battle
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
* pokemon1: stripped pokemon JSON player1 pokemon in battle
* pokemon2: stripped pokemon JSON player2 pokemon in battle
* totalRounds: number of total rounds in battle
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
* attackPower: number for an attack's power
* pokemonHP: number for a pokemon's HP
*
* returns: pokemon's HP with attack damage done
*/
function attackPokemon(attackPower, pokemonHp) {
  return pokemonHp - computeAttackDamage(attackPower);
}

/*
* Pokemon attack round.  Player1 attacks first, and player2 only attacks if HP
*    above 0 after attack.
*
* pokemon1Hp: a number for player1's HP
* pokemon1AttackPower: a number for player1's random attack power
* pokemon2Hp: a number for player2's HP
* pokemon2AttackPower: a number for player2's random attack power
*
* returns: object containing player1 and players2 HP's after an attack with damage done
*/
function attackPokemons(pokemon1Hp, pokemon1AttackPower, pokemon2Hp, pokemon2AttackPower) {
  // player1 attacks player2
  const damagedPokemon2Hp = attackPokemon(pokemon1AttackPower, pokemon2Hp);
  // player2 only attacks if player2 sustained HP > 0 from player1's attack
  let damagedPokemon1Hp = pokemon1Hp;
  if (damagedPokemon2Hp > 0) {
    // player2 attacks player1
    damagedPokemon1Hp = attackPokemon(pokemon2AttackPower, pokemon1Hp);
  }
  return { damagedPokemon1Hp, damagedPokemon2Hp };
}

/*
* Some pokemon attack info has null for it's power (non damaging attack).  This sets it to 0 if null.
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
* pokemon1Identifier: a pokemon's numeric id or string name for player1
* pokemon2Identifier: a pokemon's numeric id or string name for player2
* baseUrl: string local app's base URL
*
* returns: a promise that resolves to an object containing pokemon API info for
*    player1 and player2
*/
function getPokemons(pokemon1Identifier, pokemon2Identifier, baseUrl) {
  return new Promise(async (resolve, reject) => {
    const promises = [];
    const pokemon1Promise = axios.get(`http://${baseUrl}/api/v1/pokemon/${pokemon1Identifier}`);
    promises.push(pokemon1Promise);
    // check if player1 and player2 are the same pokemon based on identifier and
    // only create two fetches if different (yes, this can be tricked by passing in id for one,
    // and name for the other that are actually same pokemon)
    if (pokemon1Identifier !== pokemon2Identifier) {
      const pokemon2Promise = axios.get(`http://${baseUrl}/api/v1/pokemon/${pokemon2Identifier}`);
      promises.push(pokemon2Promise);
    }
    try {
      const responses = await Promise.all(promises);
      let pokemon1 = null;
      let pokemon2 = null;
      // if same pokemon for both players, copy player1 response into player 2
      if (promises.length === 1) {
        pokemon1 = stripPokemonResponse(responses[0].data);
        pokemon2 = { ...pokemon1 };
      } else { // two unique pokemons
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
* pokemon: stripped pokemon JSON pokemon to get a random attack from
*
* returns: a pokemons random attack (object containing attack id and name)
*/
function getRandomAttack(pokemon) {
  return pokemon.attacks[random(0, pokemon.attacks.length - 1)];
}

/*
* Gets random attacks for player1 and player2's pokemons
*
* pokemon1: stripped pokemon JSON for player1's pokemon to get random attack
* pokemon2:stripped pokemon JSON for player2's pokemon to get random attack
*
* returns: an object containing the attacks (object containing attack id and name)
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
* NOTE: There is room for performance improvement here as includes lookups are
* expensive.  hash lookup is probably better.
*
* pokemon1Attack: the stripped JSON attack object for player1's random attack
* pokemon2Attack: the stripped JSON attack object for player2's random attack
* cacheAttackKeyAttackIds: array of attack id's in cache
*
* returns: true if only one attack request has been cached, otherwise false
*/
function shouldGetFutureNonCachedAttack(pokemon1Attack, pokemon2Attack, cacheAttackKeyAttackIds) {
  // player1 attack cached, player2 attack not cached
  if ((cacheAttackKeyAttackIds.includes(pokemon1Attack.id) && !cacheAttackKeyAttackIds.includes(pokemon2Attack.id))
    ||
    // player2 attack cached, player1 attack not cached
    (cacheAttackKeyAttackIds.includes(pokemon2Attack.id) && !cacheAttackKeyAttackIds.includes(pokemon1Attack.id))) {
    return true;
  }
  return false;
}

/*
* Pick first non cached attack from either player1 or player2 pokemon's attacks
*
* cacheAttackKeyAttackIds: array of attack id's in cache
* pokemon1: stripped JSON pokemon for player1's pokemon
* pokemon2: stripped JSON pokemon for player2's pokemon
*
* NOTE: There is room for performance improvement here as includes lookups are
* expensive.  hash lookup is probably better.  Also room for performance improvement
* the way the combined list of player1 and player2 attack id's with no duplicated
* is being created.

* returns: first non cached attack id from either player1 or player2 pokemon's attacks
*    if any available, otherwise null
*/
function pickAFutureNonCachedAttack(cacheAttackKeyAttackIds, pokemon1, pokemon2) {
  // combine attack id's of player1 and player2, and remove duplicates
  const combinedPokemonAttacks = uniq([...pokemon1.attacks.map(attack => attack.id), ...pokemon2.attacks.map(attack => attack.id)]);
  for (let i = 0; i < combinedPokemonAttacks.length; i += 1) {
    // return first player1 or player2 attack id that hasn't been cached
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
* pokemon1Attack: stripped JSON attack for player1's pokemon random attack
* pokemon2Attack: stripped JSON attack for player2's pokemon random attack
* cache: complete cache (may contain non attacks in cache, such as pokemon info)
* pokemon1: stripped JSON pokemon for player1's pokemon
* pokemon2: stripped JSON pokemon for player2's pokemon
*
* returns: first non cached attack from either player1 or player2 pokemon's attacks
*    if any available AND only one of two attacks previously cached, otherwise null
*/
function getFutureNonCachedAttack(pokemon1Attack, pokemon2Attack, cache, pokemon1, pokemon2) {
  // convert cache keys into array of only attack id's
  const cacheAttackKeyAttackIds = cache.keys().filter(key => key.startsWith('attack-')).map(attackKey => parseInt(attackKey.split('-')[1], 10));
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
* NOTE: there is room for performance improvement here.  There is a chance the two
* player's pokemons could have overlapping attacks, and when each player's attack
* is randomly chosen, could both be the same, thus generating two fetches for the same
* attack info.  When this happens, if the duplicate attack is cached, I should not attempt
* to sneak in a future attack for fetch, but uf the duplicate attack is not cached,
* I should sneak in a future attack for fetch as a spot in the fetch pipeline is
* available (always try to fetch 2 attacks at same time).
*
* pokemon1Attack: stripped JSON attack for player1's pokemon's random attack
* pokemon2Attack: stripped JSON attack for player2's pokemon's random attack
* baseUrl: string for local app's base URL
* cache: complete cache (may contain non attacks in cache, such as pokemon info)
* pokemon1: stripped JSON pokemon for player1's pokemon
* pokemon2: stripped JSON pokemon for player2's pokemon
*
* returns: a promise that resolves to an object containing the full information
*    for player1 and player2's pokemon attack info
*/
function getAttacksInfo(pokemon1Attack, pokemon2Attack, baseUrl, cache, pokemon1, pokemon2) {
  return new Promise(async (resolve, reject) => {
    const pokemon1AttackPromise = axios.get(`http://${baseUrl}/api/v1/attack/${pokemon1Attack.id}`);
    const pokemon2AttackPromise = axios.get(`http://${baseUrl}/api/v1/attack/${pokemon2Attack.id}`);
    const promises = [pokemon1AttackPromise, pokemon2AttackPromise];
    // check if we can sneak in a future attack to keep fetch pipeline maxmimized at 2 fetches
    // to pokemon api
    const futureAttack = getFutureNonCachedAttack(pokemon1Attack, pokemon2Attack, cache, pokemon1, pokemon2);
    if (futureAttack !== null) {
      const futureAttackPromise = axios.get(`http://${baseUrl}/api/v1/attack/${futureAttack}`);
      promises.push(futureAttackPromise);
    }
    try {
      const [pokemon1AttackResponse, pokemon2AttackResponse] = await Promise.all(promises);
      // note that if a future attack was added to promise all, we could have 3
      // responses coming back, but 3 response data isn't used, it's only sent
      // for caching purposes
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
* pokemon1AttackInfo: full pokemon API attack JSON for player1's pokemon attack info
* pokemon2AttackInfo: full pokemon API attack JSON for player2's pokemon attack info
*
* returns: an object containing fixed powers for player1 and player2 attacks
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
* pokemon1: stripped JSON pokemon for player1's pokemon
* pokemon2: stripped JSON pokemon for player2's pokemon
* baseUrl: string for local app's base URL
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
      // repeat until a player's HP 0 or less
      while (pokemon1.hp > 0 && pokemon2.hp > 0) {
        const { pokemon1Attack, pokemon2Attack } = getRandomAttacks(pokemon1, pokemon2);
        const { pokemon1AttackInfo, pokemon2AttackInfo } = await getAttacksInfo(pokemon1Attack, pokemon2Attack, baseUrl, cache, pokemon1, pokemon2);
        const { pokemon1AttackPower, pokemon2AttackPower } = fixNonNonDamaginAttacks(pokemon1AttackInfo, pokemon2AttackInfo);
        const { damagedPokemon1Hp, damagedPokemon2Hp } = attackPokemons(pokemon1.hp, pokemon1AttackPower, pokemon2.hp, pokemon2AttackPower);
        pokemon1.hp = damagedPokemon1Hp;
        pokemon2.hp = damagedPokemon2Hp;
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
module.exports.computeAttackDamage = computeAttackDamage;
module.exports.determineWinner = determineWinner;
module.exports.attackPokemon = attackPokemon;
module.exports.attackPokemons = attackPokemons;
module.exports.fixNonDamagingAttack = fixNonDamagingAttack;
module.exports.shouldGetFutureNonCachedAttack = shouldGetFutureNonCachedAttack;
module.exports.pickAFutureNonCachedAttack = pickAFutureNonCachedAttack;
