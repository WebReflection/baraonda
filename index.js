var
  PORT = process.env.PORT || 3000,
  DYNO = process.env.DYNO || 'unnamed.dyno',
  connectionString = process.env.DATABASE_URL || 'postgres://localhost:5432/baraonda'
  pg = require('pg').native,
  client = new pg.Client(connectionString),
  express = require('express'),
  app = express(),
  server = require('http').Server(app),
  io = require('socket.io')(server),
  utils = require('./src/utils.js')
;

client.connect(function(err) {
  if(err) {
    return console.error('could not connect to postgres', err);
  }
  client.query('SELECT NOW() AS "theTime"', function(err, result) {
    if(err) {
      return console.error('error running query', err);
    }
    console.log(result.rows[0].theTime);
    //output: Tue Jan 15 2013 19:12:47 GMT-600 (CST)
    client.end();
  });
});

server.listen(PORT, function(err) {
  if (err) throw err;
  console.log("Node app is running at localhost:" + PORT);
});

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
app.get('/', function(request, response) {
  response.sendFile(__dirname + '/public/index.html');
});

utils.handleConnection(io);
