const express = require('express');
const pokemonController = require('../controllers/pokemonController');
const attackController = require('../controllers/attackController');
const battleController = require('../controllers/battleController');

const router = express.Router();

/*
  APIs
*/
router.get('/pokemon/:identifier', pokemonController.single);
router.get('/attack/:attackId', attackController.single);
router.get('/battle/:pokemon1Identifier/:pokemon2Identifier', battleController.battle);

// **
// No routes matched
// **
router.use((req, res) => {
  res.status(404).end();
});

module.exports = router;
