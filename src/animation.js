module.exports = (function (g) {
  var map, type, start, iteration, end;
  switch (true) {
    case !!g.AnimationEvent:
      type = 'animation';
      start = 'start';
      iteration = 'iteration';
      end = 'end';
      break;
    case !!g.WebKitAnimationEvent:
      type = 'webkitAnimation';
      start = 'Start';
      iteration = 'Iteration';
      end = 'End';
      break;
    case !!g.MSAnimationEvent:
      type = 'MSAnimation';
      start = 'Start';
      iteration = 'Iteration';
      end = 'End';
      break;
    case !!g.OAnimationEvent:
      type = 'oanimation';
      start = 'start';
      iteration = 'iteration';
      end = 'end';
      break;
    default:
      type = [];
      end = function (el, cb) {
        map(el, cb);
        cb({type: 'end', currentTarget: el});
      };
      map = function (el, cb, delay) {
        if (arguments.length === 3) {
          type.push(el, cb, setTimeout(end, delay, el, cb));
        } else {
          for (var i = 0; i < type.length; i += 3) {
            if (type[i] === el && type[i + 1] === cb) {
              clearTimeout(type.splice(i, 3)[2]);
            }
          }
        }
      };
      return {
        on: function (el, type, cb, delay) {
          if (type === 'end') {
            map(el, cb, delay);
          } else if (g.console) {
            g.console.warn('unsupported listener ' + type);
          }
          return this;
        },
        off: function (el, type, cb) {
          if (type === 'end') {
            map(el, cb);
          }
          return this;
        }
      };
  }
  map = {
    start: type + start,
    iteration: type + iteration,
    end: type + end
  };
  return {
    on: function (el, type, cb, delay) {
      el.addEventListener(map[type], cb, false);
      return this;
    },
    off: function (el, type, cb) {
      el.removeEventListener(map[type], cb, false);
      return this;
    }
  };
}(window));