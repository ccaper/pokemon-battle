const { orderBy } = require('lodash');

const { getIdFromUrl } = require('../utils/getIdFromUrl');
const { getApiDataWithRetries } = require('../utils/getApiData');

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
  try {
    const response = await getApiDataWithRetries(`http://pokeapi.co/api/v2/pokemon/${identifier}/`);
    myCache.set(`pokemon-${identifier}`, response);
    res.json(response);
    return;
  } catch (error) {
    res.sendStatus(error);
  }
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
  try {
    const response = await getApiDataWithRetries('https://pokeapi.co/api/v2/pokemon/?limit=2000');
    const pokemons = orderBy(response.results.map((pokemon) => {
      const { url, name } = pokemon;
      const id = getIdFromUrl(url);
      return { id, name };
    }), 'name');
    myCache.set('pokemons', pokemons);
    res.json(pokemons);
    return;
  } catch (error) {
    res.sendStatus(error);
  }
};
