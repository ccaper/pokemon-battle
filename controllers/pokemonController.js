const axios = require('axios');
const { orderBy } = require('lodash');

const { getIdFromUrl } = require('../utils/getIdFromUrl');

exports.single = async (req, res) => {
  const { identifier } = req.params;
  const { myCache } = res.locals;
  const cached = myCache.get(`pokemon-${identifier}`);
  if (cached !== undefined) {
    console.log(`cache hit for pokemon ${identifier}`);
    res.json(cached);
    return;
  }
  console.log(`cache miss for pokemon ${identifier}`);
  let apiAttempt = 0;
  let responseErrorStatus = null;
  while (apiAttempt < 3) {
    try {
      const response = await (axios.get(`http://pokeapi.co/api/v2/pokemon/${identifier}/`));
      myCache.set(`pokemon-${identifier}`, response.data);
      res.json(response.data);
      return;
    } catch (error) {
      apiAttempt += 1;
      responseErrorStatus = error.response.status;
    }
  }
  res.sendStatus(responseErrorStatus);
};

exports.pokemons = async (req, res) => {
  const { myCache } = res.locals;
  const cached = myCache.get('pokemons');
  if (cached !== undefined) {
    console.log('cache hit for pokemons');
    res.json(cached);
    return;
  }
  console.log('cache miss for pokemons');
  let apiAttempt = 0;
  let responseErrorStatus = null;
  while (apiAttempt < 3) {
    try {
      const response = await (axios.get('https://pokeapi.co/api/v2/pokemon/?limit=2000'));
      const pokemons = orderBy(response.data.results.map((pokemon) => {
        const { url, name } = pokemon;
        const id = getIdFromUrl(url);
        return { id, name };
      }), 'name');
      myCache.set('pokemons', pokemons);
      res.json(pokemons);
      return;
    } catch (error) {
      apiAttempt += 1;
      responseErrorStatus = error.response.status;
    }
  }
  res.sendStatus(responseErrorStatus);
};
