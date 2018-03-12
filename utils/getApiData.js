const axios = require('axios');

function getApiDataWithRetries(url) {
  return new Promise(async (resolve, reject) => {
    let apiAttempt = 0;
    let responseErrorStatus = null;
    while (apiAttempt < 3) {
      try {
        const response = await (axios.get(url));
        resolve(response.data);
      } catch (error) {
        apiAttempt += 1;
        responseErrorStatus = error.response.status;
      }
    }
    reject(responseErrorStatus);
  });
}

module.exports.getApiDataWithRetries = getApiDataWithRetries;
