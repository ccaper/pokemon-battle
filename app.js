const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const NodeCache = require('node-cache');

const routes = require('./routes/index');
const apiRoutes = require('./routes/indexApi');
const errorHandlers = require('./handlers/errorHandlers');

const myCache = new NodeCache({ stdTTL: 0, checkperiod: 0 });

// create our Express app
const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views')); // this is the folder where we keep our pug files
app.set('view engine', 'pug'); // we use the engine pug, mustache or EJS work great too

// serves up static files from the public folder. Anything in public/ will just be served up as the file it is
app.use(express.static(path.join(__dirname, 'public')));

// Takes the raw requests and turns them into usable properties on req.body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// pass variables to our templates + all requests
app.use((req, res, next) => {
  res.locals.myCache = myCache;
  next();
});

// After allllll that above middleware, we finally handle our own routes!
app.use('/', routes);
app.use('/api/v1', apiRoutes);

// If that above routes didnt work, we 404 them and forward to error handler
app.use(errorHandlers.notFound);

// Otherwise this was a really bad error we didn't expect! Shoot eh
if (app.get('env') === 'development') {
  /* Development Error Handler - Prints stack trace */
  app.use(errorHandlers.developmentErrors);
}

// production error handler
app.use(errorHandlers.productionErrors);

// done! we export it so we can start the site in start.js
module.exports = app;
