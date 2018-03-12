function getIdFromUrl(url) {
  const urlComponents = url.split('/');
  const id = parseInt(urlComponents[urlComponents.length - 2], 10);
  return id;
}

module.exports.getIdFromUrl = getIdFromUrl;
