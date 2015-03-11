if (~location.pathname.indexOf('/game/')) {
  require('./game');
} else {
  require('./index');
}