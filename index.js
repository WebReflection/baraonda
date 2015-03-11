var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

var utils = require('./src/utils.js');

var PORT = process.env.PORT || 3000;
var DYNO = process.env.DYNO || 'unnamed.dyno';

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
app.get('/', function(request, response) {
  response.sendFile(__dirname + '/public/index.html');
});

utils.handleConnection(io);
