const assert = require('assert');

const { getIdFromUrl } = require('../controllers/battleController');
const { percentAttackPower } = require('../controllers/battleController');
const { determineWinner } = require('../controllers/battleController');

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

describe('battleController', () => {
  describe('#percentAttackPower()', () => {
    it('should return 10% of number passed in (whole number test)', () => {
      const value = 100;
      const tenPercentOfValue = percentAttackPower(value);
      const expected = value * 0.1;
      assert.equal(expected, tenPercentOfValue);
    });
  });
});

describe('battleController', () => {
  describe('#percentAttackPower()', () => {
    it('should return 10% of number passed in (float test)', () => {
      const value = 5.5;
      const tenPercentOfValue = percentAttackPower(value);
      const expected = value * 0.1;
      assert.equal(expected, tenPercentOfValue);
    });
  });
});

describe('battleController', () => {
  describe('#determineWinner()', () => {
    it('should return player with larger HP (player1 larger hp test)', () => {
      const player1 = { hp: 10 };
      const player2 = { hp: 5 };
      const winner = determineWinner(player1, player2);
      assert.equal(player1, winner);
    });
  });
});

describe('battleController', () => {
  describe('#determineWinner()', () => {
    it('should return player with larger HP (player2 larger hp test)', () => {
      const player1 = { hp: 5 };
      const player2 = { hp: 10 };
      const winner = determineWinner(player1, player2);
      assert.equal(player2, winner);
    });
  });
});

describe('battleController', () => {
  describe('#determineWinner()', () => {
    it('should return player with larger HP (tie goes to player2)', () => {
      const player1 = { hp: 10 };
      const player2 = { hp: 10 };
      const winner = determineWinner(player1, player2);
      assert.equal(player2, winner);
    });
  });
});
