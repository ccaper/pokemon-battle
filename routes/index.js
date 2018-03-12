const express = require('express');
const helloWorldController = require('../controllers/helloWorldController');

const router = express.Router();

/*
  Non APIs
*/
router.get('/', helloWorldController.helloWorld);

module.exports = router;
