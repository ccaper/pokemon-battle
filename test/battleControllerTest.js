const assert = require('assert');

const {
  getIdFromUrl,
  percentAttackPower,
  determineWinner,
  attackPokemon,
  attackPokemons,
  fixNonDamagingAttack,
  shouldGetFutureNonCachedAttack,
  pickAFutureNonCachedAttack
} = require('../controllers/battleController');

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

describe('battleController', () => {
  describe('#attackPokemon()', () => {
    it('should return player HP with attack power damage done', () => {
      const attackPower = 10;
      const playerHp = 10;
      const damagedPlayerHp = attackPokemon(attackPower, playerHp);
      const expected = playerHp - percentAttackPower(attackPower);
      assert.equal(expected, damagedPlayerHp);
    });
  });
});

describe('battleController', () => {
  describe('#attackPokemons()', () => {
    it('should return player HP unchanged due to attack on player 2 taking HP below 0', () => {
      const player1Hp = 10;
      const player1AttackPower = 100;
      const player2Hp = 5;
      const player2AttackPower = 100;
      const { newPokemon1Hp, newPokemon2Hp } = attackPokemons(player1Hp, player1AttackPower, player2Hp, player2AttackPower);
      assert.equal(player1Hp, newPokemon1Hp);
      const expected = player2Hp - percentAttackPower(player1AttackPower);
      assert.equal(expected, newPokemon2Hp);
    });
  });
});

describe('battleController', () => {
  describe('#attackPokemons()', () => {
    it('should return both player HP changed', () => {
      const player1Hp = 50;
      const player1AttackPower = 90;
      const player2Hp = 40;
      const player2AttackPower = 100;
      const expectedPlayer1 = player1Hp - percentAttackPower(player2AttackPower);
      const { newPokemon1Hp, newPokemon2Hp } = attackPokemons(player1Hp, player1AttackPower, player2Hp, player2AttackPower);
      assert.equal(expectedPlayer1, newPokemon1Hp);
      const expectedPlayer2 = player2Hp - percentAttackPower(player1AttackPower);
      assert.equal(expectedPlayer2, newPokemon2Hp);
    });
  });
});

describe('battleController', () => {
  describe('#fixNonDamagingAttack()', () => {
    it('should return power unchanged', () => {
      const power = 5;
      assert.equal(power, fixNonDamagingAttack(power));
    });
  });
});

describe('battleController', () => {
  describe('#fixNonDamagingAttack()', () => {
    it('should return 0', () => {
      const power = null;
      assert.equal(0, fixNonDamagingAttack(power));
    });
  });
});

describe('battleController', () => {
  describe('#shouldGetFutureNonCachedAttack()', () => {
    it('both attacks not previously cached, so return false', () => {
      const cache = [];
      const pokemon1Attack = { id: 1 };
      const pokemon2Attack = { id: 2 };
      assert.equal(false, shouldGetFutureNonCachedAttack(pokemon1Attack, pokemon2Attack, cache));
    });
  });
});

describe('battleController', () => {
  describe('#shouldGetFutureNonCachedAttack()', () => {
    it('only player 1 attack previously cached, so return true', () => {
      const cache = [1];
      const pokemon1Attack = { id: 1 };
      const pokemon2Attack = { id: 2 };
      assert.equal(true, shouldGetFutureNonCachedAttack(pokemon1Attack, pokemon2Attack, cache));
    });
  });
});

describe('battleController', () => {
  describe('#shouldGetFutureNonCachedAttack()', () => {
    it('only player 2 attack previously cached, so return true', () => {
      const cache = [2];
      const pokemon1Attack = { id: 1 };
      const pokemon2Attack = { id: 2 };
      assert.equal(true, shouldGetFutureNonCachedAttack(pokemon1Attack, pokemon2Attack, cache));
    });
  });
});

describe('battleController', () => {
  describe('#pickAFutureNonCachedAttack()', () => {
    it('future attack available for either player, so return it', () => {
      const cache = [1, 2];
      const player1 = {
        attacks: [
          {
            id: 1
          },
          {
            id: 3
          }
        ]
      };
      const player2 = {
        attacks: [
          {
            id: 2
          },
          {
            id: 3
          }
        ]
      };
      assert.equal(3, pickAFutureNonCachedAttack(cache, player1, player2));
    });
  });
});

describe('battleController', () => {
  describe('#pickAFutureNonCachedAttack()', () => {
    it('no future attack available for either player, so return null', () => {
      const cache = [1, 2, 3];
      const player1 = {
        attacks: [
          {
            id: 1
          },
          {
            id: 3
          }
        ]
      };
      const player2 = {
        attacks: [
          {
            id: 2
          },
          {
            id: 3
          }
        ]
      };
      assert.equal(null, pickAFutureNonCachedAttack(cache, player1, player2));
    });
  });
});
