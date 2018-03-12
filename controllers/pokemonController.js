const { getApiDataWithRetries } = require('../utils/getApiData');

/*
* Controller for Pokemon
*/

/*
* Controller function to get single pokemon information.
*
* Route maps to /api/v1/pokemon/:identifier where identifier is either pokemon id pokemon name
*
* Before pokemon api hit, first checks if results in cache.  If not, fetches data
*    from api, then caches results.
*
* Returns JSON of pokemon info
*/
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
