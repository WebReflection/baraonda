module.exports = (function (g) {'use strict';
  return (
    g.requestAnimationFrame    ||
    g.webkitRequestAnimationFrame   ||
    g.mozRequestAnimationFrame      ||
    g.msRequestAnimationFrame       ||
    g.oRequestAnimationFrame        ||
    (function () {
      var
        speed = 1000 / 20,
        callbacks = [],
        invoke = function (callback) {
          callbacks.splice(callbacks.indexOf(callback), 1);
          callback();
        },
        rAF = function (callback) {
          if (callbacks.indexOf(callback) < 0) {
            callbacks.push(callback);
            setTimeout(invoke, speed, callback);
          }
        }
      ;
      rAF.isFallback = true;
      return rAF;
    }())
  );
}(window));