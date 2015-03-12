var
  PORT = process.env.PORT || 3000,
  DYNO = process.env.DYNO || 'unnamed.dyno',
  DATABASE_URL = process.env.DATABASE_URL || 'postgres://localhost:5432/baraonda',
  pg = require('pg').native,
  db = new pg.Client(DATABASE_URL),
  express = require('express'),
  app = express(),
  server = require('http').Server(app),
  io = require('socket.io')(server),
  utils = require('./src/utils.js'),
  queries = require('./src/queries.js'),
  lastTopTenByScore,
  lastTopTenByDate
;

function updateTopTen(done) {
  db.query(queries.getTopTepByScore, function (err, result) {
    if(err) return console.error('error running query', err);
    lastTopTenByScore = JSON.stringify(result.rows);
    db.query(queries.getTopTepByDate, function (err, result) {
      if(err) return console.error('error running query', err);
      lastTopTenByDate = JSON.stringify(result.rows);
      if (typeof done === 'function') done();
    });
  });
}

function setupDatabase(done) {
  db.query(queries.createTopTen, function (err, result) {
    if(err) return console.error('error running query', err);
    updateTopTen(done);
  });
}

db.connect(function(err) {
  if(err) {
    return console.error('could not connect to postgres', err);
  }
  db.query('SELECT NOW() AS "theTime"', function(err, result) {
    if(err) return console.error('error running query', err);
    console.log(result.rows[0].theTime);
    setupDatabase(function () {

      app.use('/js', express.static(__dirname + '/public/js'));
      app.use('/css', express.static(__dirname + '/public/css'));
      app.use('/img', express.static(__dirname + '/public/img'));
      app.get('/favicon.ico', function(request, response) {
        response.sendFile(__dirname + '/public/img/favicon.ico');
      });
      app.get('/browserconfig.xml', function(request, response) {
        response.sendFile(__dirname + '/browserconfig.xml');
      });
      app.get('/manifest.json', function(request, response) {
        response.sendFile(__dirname + '/public/manifest.json');
      });
      app.get('/game/*', function(request, response) {
        response.sendFile(__dirname + '/public/game.html');
      });
      app.get('/live/*', function (request, response) {
        switch(request.url) {
          case '/live/top-ten-score.json':
            updateTopTen(function () {
              response.set('Content-Type', 'application/json');
              response.send(lastTopTenByScore);
            });
            break;
          case '/live/top-ten-date.json':
            updateTopTen(function () {
              response.set('Content-Type', 'application/json');
              response.send(lastTopTenByDate);
            });
            break;
          default:
            response.status(404).send('Not found');
            break;
        }
      });
      app.get('/', function(request, response) {
        response.sendFile(__dirname + '/public/index.html');
      });

      server.listen(PORT, function(err) {
        if (err) return console.error('could not start the server', err);
        console.log("Node app is running at port:" + PORT);
        utils.handleConnection(io, db);
      });

    });

  });
});
