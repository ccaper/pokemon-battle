const axios = require('axios');

/*
* The pokemon API is flakey (getting 502 gateway timeout errors) so I wrapped
*    the calls in retries that tries 3 times before failing.
*
* url: the fully qualified URL to fetch API data
*
* returns: a promise that resolves to the data or rejects with the failure status
*    code.
*/
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
