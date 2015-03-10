var
  LOG = false,
  clients = Object.create(null),
  distance = (function () {'use strict';
    var
      PI180 = Math.PI / 180,
      radians = Math.radians || function (degrees) {
        return degrees * PI180;
      },
      degrees = Math.degrees || function (radians) {
        return radians / PI180;
      },
      acos = Math.acos,
      cos = Math.cos,
      max = Math.max,
      sin = Math.sin
    ;
    return function (lat1, lon1, lat2, lon2) {
      var
        distance = (
          111045 * degrees(
            acos(
              cos(
                radians(lat1)
              ) *
              cos(
                radians(lat2)
              ) *
              cos(
                radians(lon1) -
                radians(lon2)
              ) +
              sin(
                radians(lat1)
              ) *
              sin(
                radians(lat2)
              )
            )
          )
        )
      ;
      if (LOG) {
        console.log('distance in meters: ' + distance);
      }
      return distance;
    };
  }())
;

function broadcastUpdate(client) {'use strict';
  /*jshint validthis:true */
  client.socket.emit('baraonda:joined', this);
}

function closeEnough(coordsA, coordsB) {
  var
    meters = distance(
      coordsA.latitude,
      coordsA.longitude,
      coordsB.latitude,
      coordsB.longitude
    ),
    accuracy = (
      coordsA.accuracy + coordsB.accuracy
    )
  ;
  if (LOG) {
    console.log(meters, accuracy);
  }
  return (meters - 15) < accuracy;
}

function commonUpdate(client) {'use strict';
  var followers = client.followers;
  client.socket.emit('baraonda:created', followers.length);
  followers.forEach(broadcastUpdate, followers.length + 1);
}

function loopAndVerify(socket, coords) {'use strict';
  /*jshint eqnull:true */
  var
    result = {
      socket: socket,
      coords: coords,
      parent: null,
      followers: Array.prototype
    },
    client,
    id
  ;
  for (id in clients) {
    client = clients[id];
    if (client.parent == null && (
      closeEnough(client.coords, coords) ||
      client.followers.some(someCloseEnough, coords)
    )) {
      result.parent = client;
      client.followers.push(result);
      break;
    }
  }
  if (result.parent == null) {
    result.followers = [];
  }
  clients[socket.id] = result;
  return result;
}

function someCloseEnough(client) {'use strict';
  /*jshint validthis:true */
  return closeEnough(client.coords, this);
}

function terminateContribution(client) {'use strict';
  /*jshint validthis:true */
  delete clients[client.socket.id];
  client.socket.emit('baraonda:finished', this);
}


module.exports = {
  handleConnection: function (io) {'use strict';
    /*jshint eqnull:true */
    io.on('connect', function (socket) {
      function geolocationStart(coords) {
        var client = clients[socket.id] || loopAndVerify(socket, coords);
        client.coords = coords;
        if (LOG) {
          if (client.parent == null) {
            console.log('[NEW]   ' + socket.id);
            console.log(coords);
          } else {
            console.log('[ADDED] ' + socket.id + ' to ' + client.parent.socket.id);
            console.log('        ' + client.parent.followers.length + ' followers');
          }
        }
        if (client.parent == null) {
          socket.emit('baraonda:created', 0);
        } else {
          commonUpdate(client.parent);
        }
      }
      function geolocationEnd(data) {
        var
          client = clients[socket.id],
          followers
        ;
        if (client == null) return;
        delete clients[socket.id];
        followers = (client.parent || client).followers;
        if (LOG) {
          if (client.parent == null) {
            console.log('[TERMINATED] ' + client.socket.id);
          } else {
            console.log('[LEFT]       ' + client.parent.socket.id);
          }
        }
        if (client.parent == null) {
          socket.emit('baraonda:terminated', followers.length);
          followers.forEach(terminateContribution, followers.length + 1);
        } else {
          followers.splice(followers.indexOf(client), 1);
          client.socket.emit('baraonda:left', followers.length + 1);
          commonUpdate(client.parent);
        }
      }
      function geolocationCoords(coords) {
        var id, client;
        for (id in clients) {
          client = clients[id];
          if (closeEnough(client.coords, coords)) {
            client.socket.emit('baraonda:somebody');
            return socket.emit('baraonda:join', true);
          }
        }
        socket.emit('baraonda:join', false);
      }
      socket.on('geolocation:coords', geolocationCoords);
      socket.on('geolocation:start', geolocationStart);
      socket.on('geolocation:end', geolocationEnd);
      socket.on('disconnect', function () {
        if (socket.id in clients) {
          geolocationEnd();
        }
      });
    });
  }
};