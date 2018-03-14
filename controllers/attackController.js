const { getApiDataWithRetries } = require('../utils/getApiData');

/*
* Controller for Attack
*/

/*
* Controller function to get single attack information.
*
* Route maps to /api/v1/attack/:attackId where identifier is attackId
*
* Before attack api hit, first checks if results in cache.  If not, fetches data
*    from api, then caches results.
*
* Returns JSON of attack info
*/
exports.single = async (req, res) => {
  const { attackId } = req.params;
  const { myCache } = res.locals;
  const cached = myCache.get(`attack-${attackId}`);
  // returned cache if cached
  if (cached !== undefined) {
    console.log(`cache hit for attack ${attackId}`);
    res.json(cached);
    return;
  }
  console.log(`cache miss for attack ${attackId}`);
  try {
    // get api data and cache
    const response = await getApiDataWithRetries(`http://pokeapi.co/api/v2/move/${attackId}/`);
    myCache.set(`attack-${attackId}`, response);
    res.json(response);
    return;
  } catch (error) {
    res.sendStatus(error);
  }
};
