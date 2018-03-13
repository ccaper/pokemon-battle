const assert = require('assert');

const { getIdFromUrl } = require('../controllers/battleController');

describe('battleController', () => {
  describe('#getIdFromUrl()', () => {
    it('should return numeric id in url', () => {
      const id = 1;
      const url = `http://pokeapi.co/api/v2/move/${id}/`;
      const urlId = getIdFromUrl(url);
      assert.equal(id, urlId);
    });
  });
});

describe('battleController', () => {
  describe('#getIdFromUrl()', () => {
    it('should return NaN since id is not a number in url', () => {
      const id = 'string';
      const url = `http://pokeapi.co/api/v2/move/${id}/`;
      const urlId = getIdFromUrl(url);
      assert.notEqual(Number.NaN, urlId);
    });
  });
});

describe('battleController', () => {
  describe('#getIdFromUrl()', () => {
    it('should return NaN since id is not a number in url due to missing trailing /', () => {
      const id = 1;
      const url = `http://pokeapi.co/api/v2/move/${id}`;
      const urlId = getIdFromUrl(url);
      assert.notEqual(Number.NaN, urlId);
    });
  });
});
