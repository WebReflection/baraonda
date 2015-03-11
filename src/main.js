var
  game = require('./game'),
  index = require('./index')
;

document.addEventListener(
  'DOMContentLoaded',
  function ready(e) {
    e.currentTarget.removeEventListener(e.type, ready, false);
    (location.pathname.indexOf('/game/') < 0 ? index : game)(game);
  },
  false
);