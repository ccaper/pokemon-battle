const axios = require('axios');
const { orderBy } = require('lodash');

const { getIdFromUrl } = require('../utils/getIdFromUrl');

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
  let apiAttempt = 0;
  let responseErrorStatus = null;
  while (apiAttempt < 3) {
    try {
      const response = await (axios.get(`http://pokeapi.co/api/v2/move/${attackId}/`));
      myCache.set(`attack-${attackId}`, response.data);
      res.json(response.data);
      return;
    } catch (error) {
      apiAttempt += 1;
      responseErrorStatus = error.response.status;
    }
  }
  res.sendStatus(responseErrorStatus);
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
  let apiAttempt = 0;
  let responseErrorStatus = null;
  while (apiAttempt < 3) {
    try {
      const response = await (axios.get('https://pokeapi.co/api/v2/move/?limit=2000'));
      const attacks = orderBy(response.data.results.map((attack) => {
        const { url, name } = attack;
        const id = getIdFromUrl(url);
        return { id, name };
      }), 'name');
      myCache.set('attacks', attacks);
      res.json(attacks);
      return;
    } catch (error) {
      apiAttempt += 1;
      responseErrorStatus = error.response.status;
    }
  }
  res.sendStatus(responseErrorStatus);
};
