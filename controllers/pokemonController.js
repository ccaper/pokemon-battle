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
