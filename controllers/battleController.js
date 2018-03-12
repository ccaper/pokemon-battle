const axios = require('axios');
const { random } = require('lodash');
const { uniq } = require('lodash');

function getIdFromUrl(url) {
  const urlComponents = url.split('/');
  const id = parseInt(urlComponents[urlComponents.length - 2], 10);
  return id;
}

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

function percentAttackPower(attackPower) {
  return attackPower * 0.1;
}

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

function determineWinner(pokemon1, pokemon2) {
  if (pokemon1.hp > pokemon2.hp) {
    return pokemon1;
  }
  return pokemon2;
}

function createWinnerData(pokemon1, pokemon2, totalRounds) {
  const winner = determineWinner(pokemon1, pokemon2);
  const winnerData = {
    id: winner.id,
    name: winner.name,
    totalRounds
  };
  return winnerData;
}

function attackPokemon(attackPower, pokemonHp) {
  return pokemonHp - percentAttackPower(attackPower);
}

function attackPokemons(pokemon1Hp, pokemon1AttackPower, pokemon2Hp, pokemon2AttackPower) {
  const newPokemon2Hp = attackPokemon(pokemon1AttackPower, pokemon2Hp);
  let newPokemon1Hp = pokemon1Hp;
  if (newPokemon2Hp > 0) {
    newPokemon1Hp = attackPokemon(pokemon2AttackPower, pokemon1Hp);
  }
  return { newPokemon1Hp, newPokemon2Hp };
}

function fixNonDamagingAttack(power) {
  return (power === null) ? 0 : power;
}

function getPokemons(pokemon1Identifier, pokemon2Identifier, baseUrl) {
  return new Promise(async (resolve) => {
    const pokemon1Promise = axios.get(`http://${baseUrl}/api/v1/pokemon/${pokemon1Identifier}`);
    const pokemon2Promise = axios.get(`http://${baseUrl}/api/v1/pokemon/${pokemon2Identifier}`);
    const [pokemon1Response, pokemon2Response] = await Promise.all([pokemon1Promise, pokemon2Promise]);
    const pokemon1 = stripPokemonResponse(pokemon1Response.data);
    const pokemon2 = stripPokemonResponse(pokemon2Response.data);
    resolve({ pokemon1, pokemon2 });
  });
}

function getRandomAttack(pokemon) {
  return pokemon.attacks[random(0, pokemon.attacks.length - 1)];
}

function getRandomAttacks(pokemon1, pokemon2) {
  const pokemon1Attack = getRandomAttack(pokemon1);
  const pokemon2Attack = getRandomAttack(pokemon2);
  return { pokemon1Attack, pokemon2Attack };
}

function shouldGetFutureNonCachedAttack(pokemon1Attack, pokemon2Attack, cacheAttackKeyAttackIds) {
  if ((cacheAttackKeyAttackIds.includes(pokemon1Attack.id) && !cacheAttackKeyAttackIds.includes(pokemon2Attack.id))
    ||
    (cacheAttackKeyAttackIds.includes(pokemon2Attack.id) && !cacheAttackKeyAttackIds.includes(pokemon1Attack.id))) {
    return true;
  }
  return false;
}

function pickAFutureNonCachedAttack(cacheAttackKeyAttackIds, pokemon1, pokemon2) {
  const combinedPokemonAttacks = uniq([...pokemon1.attacks.map(attack => attack.id), ...pokemon2.attacks.map(attack => attack.id)]);
  for (let i = 0; i < combinedPokemonAttacks.length; i += 1) {
    if (!cacheAttackKeyAttackIds.includes(combinedPokemonAttacks[i])) {
      return combinedPokemonAttacks[i];
    }
  }
  return null;
}

function getFutureNonCachedAttack(pokemon1Attack, pokemon2Attack, cache, pokemon1, pokemon2) {
  const cacheAttackKeyAttackIds = cache.keys().filter(key => key.startsWith('attack-')).map(key1 => parseInt(key1.split('-')[1], 10));
  if (shouldGetFutureNonCachedAttack(pokemon1Attack, pokemon2Attack, cacheAttackKeyAttackIds)) {
    return pickAFutureNonCachedAttack(cacheAttackKeyAttackIds, pokemon1, pokemon2);
  }
  return null;
}

function getAttacksInfo(pokemon1Attack, pokemon2Attack, baseUrl, cache, pokemon1, pokemon2) {
  return new Promise(async (resolve) => {
    const pokemon1AttackPromise = axios.get(`http://${baseUrl}/api/v1/attack/${pokemon1Attack.id}`);
    const pokemon2AttackPromise = axios.get(`http://${baseUrl}/api/v1/attack/${pokemon2Attack.id}`);
    const promises = [pokemon1AttackPromise, pokemon2AttackPromise];
    const futureAttack = getFutureNonCachedAttack(pokemon1Attack, pokemon2Attack, cache, pokemon1, pokemon2);
    if (futureAttack !== null) {
      const futureAttackPromise = axios.get(`http://${baseUrl}/api/v1/attack/${futureAttack}`);
      promises.push(futureAttackPromise);
    }
    const [pokemon1AttackResponse, pokemon2AttackResponse] = await Promise.all(promises);
    const pokemon1AttackInfo = pokemon1AttackResponse.data;
    const pokemon2AttackInfo = pokemon2AttackResponse.data;
    resolve({ pokemon1AttackInfo, pokemon2AttackInfo });
  });
}

function fixNonNonDamaginAttacks(pokemon1AttackInfo, pokemon2AttackInfo) {
  const pokemon1AttackPower = fixNonDamagingAttack(pokemon1AttackInfo.power);
  const pokemon2AttackPower = fixNonDamagingAttack(pokemon2AttackInfo.power);
  return { pokemon1AttackPower, pokemon2AttackPower };
}

function performBattle(pokemon1, pokemon2, baseUrl, cache) {
  return new Promise(async (resolve) => {
    const rounds = [];
    let roundCount = 1;
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
  });
}

exports.battle = async (req, res) => {
  const { pokemon1Identifier, pokemon2Identifier } = req.params;
  const { myCache } = res.locals;
  const { pokemon1, pokemon2 } = await getPokemons(pokemon1Identifier, pokemon2Identifier, req.headers.host);
  console.log(`Starting battle for ${pokemon1.name} (${pokemon1.id}) vs ${pokemon2.name} (${pokemon2.id})`);
  const battleData = {};
  battleData.preBattleData = createPreBattleData(pokemon1, pokemon2);
  battleData.rounds = await performBattle(pokemon1, pokemon2, req.headers.host, myCache);
  battleData.winner = createWinnerData(pokemon1, pokemon2, battleData.rounds.length);
  console.log(`Ending battle for ${pokemon1.name} (${pokemon1.id}) vs ${pokemon2.name} (${pokemon2.id}), winner ${battleData.winner.name} (${battleData.winner.id})`);
  res.json(battleData);
};
