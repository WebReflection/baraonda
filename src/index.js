var
  rAF = require('./raf'),
  nominatim = require('./nominatim'),
  L = require('leaflet')
;

function rowToTableRow(row) {
  var when = new Date(row.happened);
  return {
    id: row.id,
    score: row.score,
    when: when.toDateString().replace(when.getFullYear(), '') + ' ' + when.getHours() + ':' + when.getMinutes(),
    where: row.latitude.toFixed(3) + ', ' + row.longitude.toFixed(3)
  };
}

function showTable(which, map) {
  var
    showOnMap = function (e) {
      e.preventDefault();
      e.stopPropagation();
      for (var
        row,
        id = e.currentTarget.getAttribute('data-id'),
        i = 0; i < rows.length; i++
      ) {
        row = rows[i];
        if (row.id == id) {
          return map.panTo(new L.LatLng(row.latitude, row.longitude));
        }
      }
    },
    scoreboard = document.getElementById('scoreboard'),
    xhr = new XMLHttpRequest(),
    rows
  ;
  xhr.open('GET', '/live/top-ten-' + which + '.json', true);
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4 && /^(?:2|3)/.test(xhr.status)) {
      rows = JSON.parse(xhr.responseText);
      for (var
        key, keys, row,
        table = document.createElement('table'),
        tbody = table.appendChild(document.createElement('tbody')),
        i = 0; i < rows.length; i++
      ) {
        row = rowToTableRow(rows[i]);
        if (!keys) {
          keys = true;
          tbody.appendChild(document.createElement('tr'));
          for (key in row) {
            if (key !== 'id') {
              tbody.lastChild.appendChild(document.createElement('th')).textContent = key;
            }
          }
        }
        tbody.appendChild(document.createElement('tr'));
        for (key in row) {
          if (key === 'id') {
            tbody.lastChild.setAttribute('data-id', row[key]);
            tbody.lastChild.addEventListener('click', showOnMap, false);
          } else {
            tbody.lastChild.appendChild(document.createElement('td')).textContent = row[key];
            if (key === 'where') {
              loadCityAndShowIt(rows[i], tbody.lastChild.lastChild);
            }
          }
        }
      }
      scoreboard.appendChild(table);
      document.dispatchEvent(new CustomEvent('scoreboard:update', {detail: rows}));
    }
  };
  xhr.send(null);
}

function loadCityAndShowIt(info, where) {
  nominatim([info.latitude, info.longitude], function (data) {
    where.textContent = data.address.city;
  });
}

function ready(game) {'use strict';
  var
    layer = L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png',{
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
    }),
    map = L.map('map', {
      zoomControl: false,
      scrollWheelZoom: false,
      center: [51.505, -0.09],
      zoom: 13,
      maxZoom: 18,
      minZoom: 3
    }),
    markers = L.layerGroup()
  ;
  layer.addTo(map);
  markers.addTo(map);
  L.control.zoom({position: 'bottomleft'}).addTo(map);

  showTable('score', map);

  document.addEventListener('scoreboard:update', function (e) {
    map.removeLayer(markers);
    markers = L.layerGroup();
    for (var
      row, marker,
      rows = e.detail,
      i = 0; i < rows.length; i++
    ) {
      row = rows[i];
      marker = L.marker(
        [row.latitude, row.longitude],
        {
          icon: L.icon({
            iconUrl: '/img/baraonda-32.png',
            iconSize: [32, 32],
            iconAnchor: [18, 36]
          })
        }
      );
      markers.addLayer(marker);
    }
    markers.addTo(map);
  });

  if (navigator.standalone || rAF.isFallback) {
      document.querySelector('#game').addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        navigator.geolocation.getCurrentPosition(
          function () {
            document.body.innerHTML = ''.concat(
              '<canvas id="canvas"></canvas>',
              '<div id="hi-score"></div>',
              '<div id="score"></div>',
              '<div id="details"></div>',
              '<div id="accuracy"></div>'
            );
            game();
          },
          function (e) {
            alert('unable to retrieve your position: ' + e.message);
          }
        );
      },
      false
    );
  }

}

module.exports = ready;
