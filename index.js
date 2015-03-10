var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var utils = require('./src/utils.js');

app.set('port', (process.env.PORT || 5000));

app.use('/js', express.static(__dirname + '/public/js'));
app.use('/css', express.static(__dirname + '/public/css'));
app.use('/img', express.static(__dirname + '/public/img'));

app.get('/', function(request, response) {
  response.sendFile('public/index.html');
});

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'));
});

utils.handleConnection(io);
