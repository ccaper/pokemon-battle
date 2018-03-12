const { orderBy } = require('lodash');

const { getIdFromUrl } = require('../utils/getIdFromUrl');
const { getApiDataWithRetries } = require('../utils/getApiData');

exports.single = async (req, res) => {
  const { attackId } = req.params;
  const { myCache } = res.locals;
  const cached = myCache.get(`attack-${attackId}`);
  if (cached !== undefined) {
    console.log(`cache hit for attack ${attackId}`);
    res.json(cached);
    return;
  }
  console.log(`cache miss for attack ${attackId}`);
  try {
    const response = await getApiDataWithRetries(`http://pokeapi.co/api/v2/move/${attackId}/`);
    myCache.set(`attack-${attackId}`, response);
    res.json(response);
    return;
  } catch (error) {
    res.sendStatus(error);
  }
};

exports.attacks = async (req, res) => {
  const { myCache } = res.locals;
  const cached = myCache.get('attacks');
  if (cached !== undefined) {
    console.log('cache hit for attacks');
    res.json(cached);
    return;
  }
  console.log('cache miss for attacks');
  try {
    const response = await getApiDataWithRetries('https://pokeapi.co/api/v2/move/?limit=2000');
    const attacks = orderBy(response.results.map((attack) => {
      const { url, name } = attack;
      const id = getIdFromUrl(url);
      return { id, name };
    }), 'name');
    myCache.set('attacks', attacks);
    res.json(attacks);
    return;
  } catch (error) {
    res.sendStatus(error);
  }
};
