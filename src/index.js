var
  animation = require('./animation'),
  rAF = require('./raf'),
  L = require('leaflet')
;
function ready(e) {'use strict';
  e.currentTarget.removeEventListener(e.type, ready, false);
  var
    layer = L.tileLayer('http://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',{
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
    }),
    map = L.map('map', {
      zoomControl: false,
      scrollWheelZoom: false,
      center: [51.505, -0.09],
      zoom: 13
    })
  ;
  layer.addTo(map);
  L.control.zoom({position: 'bottomleft'}).addTo(map);
}

document.addEventListener(
  'DOMContentLoaded',
  ready,
  false
);