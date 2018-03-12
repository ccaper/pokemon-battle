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
