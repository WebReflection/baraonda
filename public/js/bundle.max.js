(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*jslint forin: true, plusplus: true, indent: 2, browser: true, unparam: true */
/*!
Copyright (C) 2014 by Andrea Giammarchi - @WebReflection

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

*/
module.exports = (function (O) {
  'use strict';

  var
    toString = O.toString,
    has = O.hasOwnProperty,
    camelFind = /([a-z])([A-Z])/g,
    ignoreSpecial = /^@(?:page|font-face)/,
    isMedia = /^@(?:media)/,
    isArray = Array.isArray || function (arr) {
      return toString.call(arr) === '[object Array]';
    },
    empty = [],
    restyle;

  function ReStyle(component, node, css, prefixes, doc) {
    this.component = component;
    this.node = node;
    this.css = css;
    this.prefixes = prefixes;
    this.doc = doc;
  }

  ReStyle.prototype = {
    replace: function (substitute) {
      if (!(substitute instanceof ReStyle)) {
        substitute = restyle(
          this.component, substitute, this.prefixes, this.doc
        );
      }
      this.remove();
      ReStyle.call(
        this,
        substitute.component,
        substitute.node,
        substitute.css,
        substitute.prefixes,
        substitute.doc
      );
    },
    remove: function () {
      var node = this.node,
        parentNode = node.parentNode;
      if (parentNode) {
        parentNode.removeChild(node);
      }
    },
    valueOf: function () {
      return this.css;
    }
  };

  function camelReplace(m, $1, $2) {
    return $1 + '-' + $2.toLowerCase();
  }

  function create(key, value, prefixes) {
    var
      css = [],
      pixels = typeof value === 'number' ? 'px' : '',
      k = key.replace(camelFind, camelReplace),
      i;
    for (i = 0; i < prefixes.length; i++) {
      css.push('-', prefixes[i], '-', k, ':', value, pixels, ';');
    }
    css.push(k, ':', value, pixels, ';');
    return css.join('');
  }

  function property(previous, key) {
    return previous.length ? previous + '-' + key : key;
  }

  function generate(css, previous, obj, prefixes) {
    var key, value, i;
    for (key in obj) {
      if (has.call(obj, key)) {
        if (typeof obj[key] === 'object') {
          if (isArray(obj[key])) {
            value = obj[key];
            for (i = 0; i < value.length; i++) {
              css.push(
                create(property(previous, key), value[i], prefixes)
              );
            }
          } else {
            generate(
              css,
              property(previous, key),
              obj[key],
              prefixes
            );
          }
        } else {
          css.push(
            create(property(previous, key), obj[key], prefixes)
          );
        }
      }
    }
    return css.join('');
  }

  function parse(component, obj, prefixes) {
    var
      css = [],
      at, cmp, special, k, v,
      same, key, value, i, j;
    for (key in obj) {
      if (has.call(obj, key)) {
        at = key.charAt(0) === '@';
        same = at || !component.indexOf(key + ' ');
        cmp = at && isMedia.test(key) ? component : '';
        special = at && !ignoreSpecial.test(key);
        k = special ? key.slice(1) : key;
        value = empty.concat(obj[key]);
        for (i = 0; i < value.length; i++) {
          v = value[i];
          if (special) {
            j = prefixes.length;
            while (j--) {
              css.push('@-', prefixes[j], '-', k, '{',
                parse(cmp, v, [prefixes[j]]),
                '}');
            }
            css.push(key, '{', parse(cmp, v, prefixes), '}');
          } else {
            css.push(
              same ? key : component + key,
              '{', generate([], '', v, prefixes), '}'
            );
          }
        }
      }
    }
    return css.join('');
  }

  // hack to avoid JSLint shenanigans
  if ({undefined: true}[typeof document]) {
    // in node, by default, no prefixes are used
    restyle = function (component, obj, prefixes) {
      if (typeof component === 'object') {
        prefixes = obj;
        obj = component;
        component = '';
      } else {
        component += ' ';
      }
      return parse(component, obj, prefixes || empty);
    };
    // useful for different style of require
    restyle.restyle = restyle;
  } else {
    restyle = function (component, obj, prefixes, doc) {
      if (typeof component === 'object') {
        doc = prefixes;
        prefixes = obj;
        obj = component;
        c = (component = '');
      } else {
        c = component + ' ';
      }
      var c, d = doc || (doc = document),
        css = parse(c, obj, prefixes || (prefixes = restyle.prefixes)),
        head = d.head ||
          d.getElementsByTagName('head')[0] ||
          d.documentElement,
        node = head.insertBefore(
          d.createElement('style'),
          head.lastChild
        );
      node.type = 'text/css';
      // it should have been
      // if ('styleSheet' in node) {}
      // but JSLint bothers in that way
      if (node.styleSheet) {
        node.styleSheet.cssText = css;
      } else {
        node.appendChild(d.createTextNode(css));
      }
      return new ReStyle(component, node, css, prefixes, doc);
    };
  }

  restyle.customElement = function (name, constructor, proto) {
    var key, prototype = Object.create(constructor.prototype);
    if (proto && proto.css) {
      proto.css = restyle(name, proto.css);
    }
    for (key in proto) {
      prototype[key] = proto[key];
    }
    return document.registerElement(name, {prototype: prototype});
  };

  restyle.prefixes = [
    'webkit',
    'moz',
    'ms',
    'o'
  ];

  return restyle;

/**
 * not sure if TODO since this might be prependend regardless the parser
 *  @namespace url(http://www.w3.org/1999/xhtml);
 *  @charset "UTF-8";
 */

}({}));
},{}],2:[function(require,module,exports){
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
},{}],3:[function(require,module,exports){
var restyle = require('restyle');

module.exports = function () {
  return {
    all: restyle({
      '*': {
        cursor: 'default',
        touchAction: 'none',
        userSelect: 'none'
      }
    }),
    accuracy: restyle({
      '#accuracy': {
        width: 0,
        marginLeft: 0,
        transition: 'all 3s'
      }
    }),
    glow: restyle({
      '@keyframes glow': {
        '0%':   { boxShadow: '0px 0px 0px 0px rgba(255,255,255,1)' },
        '100%': { boxShadow: '0px 0px 32px 16px rgba(255,255,255,1)' }
      },
      '.glow': {
        animation: {
          name: 'glow',
          duration: '1s',
          iterationCount: 'infinite',
          direction: 'alternate'
        }
      }
    }),
    score: restyle({
      '#score': {
        lineHeight: score.offsetHeight,
        fontSize: Math.floor(score.offsetHeight / 1.5)
      }
    }),
    circle: restyle({
      '.circle': {
        position: 'fixed',
        border: '2px solid #DDD',
        margin: { top: 0, left: 0 },
        width: 0,
        height: 0,
        borderRadius: '50%'
      },
      '.circle-showed': {
        width: 100,
        height: 100,
        margin: {
          top: -51,
          left: -51
        }
      },
      '@keyframes circle-showing': {
        '0%':   {   width: 0, height: 0, margin: { top: 0, left: 0 } },
        '100%': { width: 100, height: 100, margin: { top: -51, left: -51 } }
      },
      '.circle-showing': {
        animation: {
          name: 'circle-showing',
          duration: '250ms',
          iterationCount: '1',
          direction: 'normal'
        }
      },
      '@keyframes circle-disappearing': {
        '0%':   { opacity: '1', width: 100, height: 100, margin: { top: -51, left: -51 } },
        '100%': { opacity: '0', width: 0, height: 0, margin: { top: 0, left: 0 } }
      },
      '.circle-disappearing': {
        animation: {
          name: 'circle-disappearing',
          duration: '250ms',
          iterationCount: '1',
          direction: 'normal'
        }
      },
      '@keyframes circle-growing': {
        '0%':   { borderWidth: 2, margin: { top: -51, left: -51 }, boxShadow: '0px 0px 0px 0px rgba(255,255,255,1)' },
        '100%': { borderWidth: 32, margin: { top: -80, left: -80 }, boxShadow: '0px 0px 32px 16px rgba(255,255,255,1)' }
      },
      '.circle-growing': {
        animation: {
          name: 'circle-growing',
          duration: '500ms',
          iterationCount: '2',
          direction: 'alternate'
        }
      },
      '@keyframes blue': {
        '0%':   { backgroundColor: '#00A' },
        '100%': { backgroundColor: '#333' }
      },
      'body.blue': {
        animation: {
          name: 'blue',
          duration: '350ms',
          iterationCount: '1',
          direction: 'normal'
        }
      },
      '@keyframes red': {
        '0%':   { backgroundColor: '#A00' },
        '100%': { backgroundColor: '#333' }
      },
      'body.red': {
        animation: {
          name: 'red',
          duration: '350ms',
          iterationCount: '1',
          direction: 'normal'
        }
      },
      '@keyframes blue-highlight': {
        '0%':   { color: '#00F', opacity: '1' },
        '100%': { color: '#000', opacity: '.3' }
      },
      '.blue-highlight': {
        animation: {
          name: 'blue-highlight',
          duration: '350ms',
          iterationCount: '1',
          direction: 'normal'
        }
      },
      '@keyframes red-highlight': {
        '0%':   { color: '#F00', opacity: '1' },
        '100%': { color: '#000', opacity: '.3' }
      },
      '.red-highlight': {
        animation: {
          name: 'red-highlight',
          duration: '350ms',
          iterationCount: '1',
          direction: 'normal'
        }
      },
      '@keyframes highlight': {
        '0%':   { color: '#FFF', opacity: '1' },
        '100%': { color: '#000', opacity: '.3' }
      },
      '.highlight': {
        animation: {
          name: 'highlight',
          duration: '900ms',
          iterationCount: '1',
          direction: 'normal'
        }
      }
    })
  };
};
},{"restyle":1}],4:[function(require,module,exports){
function lightning(
  context,
  startX, startY,
  endX, endY,
  delta, ratio, rays
) { // (C) Andrea Giammarchi - Mit Style License
  var
    greaterX = startX < endX,
    greaterY = startY < endY,
    destX = endX + (greaterX ? -ratio : ratio),
    destY = endY + (greaterY ? -ratio : ratio),
    random = Math.random,
    cos = Math.cos,
    sin = Math.sin,
    PI = Math.PI,
    distX, distY, midX, midY,
    rangle, rdelta,
    progressX,
    progressY
  ;
  while (rays--) {
    context.moveTo(progressX = startX, progressY = startY);
    do {
      distX = endX - progressX;
      distY = endY - progressY;
      midX = progressX + (distX / ratio);
      midY = progressY + (distY / ratio);
      rangle = random() * 2 * PI;
      rdelta = random() * delta;
      progressX = midX + rdelta * cos(rangle);
      progressY = midY + rdelta * sin(rangle);
      context.lineTo(progressX, progressY);
    } while (
      (greaterX ? progressX < destX : destX < progressX) ||
      (greaterY ? progressY < destY : destY < progressY)
    );
    context.lineTo(endX, endY);
  }
}
},{}],5:[function(require,module,exports){
var
  animation = require('./animation'),
  jsStyle = require('./js-style'),
  lightning = require('./lightning')
;

function ready(e) {'use strict';
  e.currentTarget.removeEventListener(e.type, ready, false);
  var
    circle,
    coords,
    engaged = false,
    vibrate = "vibrate" in navigator ?
      function (howMuch) {
        navigator.vibrate(howMuch);
      } :
      Object,
    hiScore = document.querySelector('#hi-score'),
    canvas = document.querySelector('#canvas'),
    context = canvas.getContext('2d'),
    details = document.querySelector('#details'),
    score = document.querySelector('#score'),
    style = jsStyle(),
    circleDisappearingAnimationEnd = function (e) {
      e.currentTarget.parentNode.removeChild(this);
      animation.off(e.currentTarget, 'end', circleDisappearingAnimationEnd);
    },
    circleGrowedAnimationEnd = function (e) {
      e.currentTarget.className = 'circle circle-showed glow';
      animation.off(e.currentTarget, 'end', circleGrowedAnimationEnd);
    },
    circleShowingAnimationEnd = function (e) {
      e.currentTarget.className = 'circle circle-showed glow';
      animation.off(e.currentTarget, 'end', circleShowingAnimationEnd);
    },
    documentElement = document.documentElement,
    pointerEnabled = navigator.pointerEnabled,
    rAF = window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame ||
          window.msRequestAnimationFrame ||
          window.oRequestAnimationFrame    ||
          function (callback) {
            window.setTimeout(callback, 1000 / 25);
          },
    dropCircle = function (circle) {
      if (!circle) return;
      animation.on(circle, 'end', circleDisappearingAnimationEnd, 250);
      circle.className = 'circle circle-disappearing';
    },
    watchPosition = function (position) {
      if (!coords) {
        details.textContent = 'ready';
        socket.emit('geolocation:coords', {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      }
      coords = position.coords;
      var
        accuracy = Math.min(coords.accuracy, 150),
        width = ((document.body.offsetWidth - 16) * accuracy) / 150
      ;
      style.accuracy.replace({
        '#accuracy': {
          width: width,
          marginLeft: -Math.round(width / 2),
          transition: 'all 3s'
        }
      });
    },
    geoOptions = {
      enableHighAccuracy: true,
      timeout: Infinity,
      maximumAge: 0
    },
    geoWatch = navigator.geolocation.watchPosition(
      watchPosition,
      function (error) {
        navigator.geolocation.clearWatch(geoWatch);
        geoOptions.enableHighAccuracy = false;
        geoOptions.maximumAge = Infinity;
        geoWatch = navigator.geolocation.watchPosition(
          watchPosition,
          function (e) {
            // socket.emit('error:geolocation', error);
            // what should I do here ?
          },
          geoOptions
        );
      },
      geoOptions
    ),
    socket = io(),
    stop = function (e) {
      e.preventDefault();
      e.stopPropagation();
      return e;
    },
    drawCircle = function (clientY, clientX) {
      dropCircle(circle);
      circle = document.body.appendChild(document.createElement('circle'));
      circle.className = 'circle';
      circle.style.cssText = ''.concat(
        'top:', clientY, 'px;',
        'left:', clientX, 'px;'
      );
      animation.on(circle, 'end', circleShowingAnimationEnd, 250);
      circle.className = 'circle circle-showing';
    },
    touchstart = function (e) {
      // requestFullScreen();
      if (coords) {
        switch (stop(e).type) {
          case 'mousedown':
            drawCircle(lastY = e.clientY, lastX = e.clientX);
            break;
          case 'touchstart':
            if (e.touches.length > 1) return;
            drawCircle(lastY = e.touches[0].clientY, lastX = e.touches[0].clientX);
            break;
          case 'pointerdown':
            drawCircle(lastY = e.clientY, lastX = e.clientX);
            documentElement.setPointerCapture(e.pointerId);
            break;
          case 'MSPointerDown':
            drawCircle(lastY = e.clientY, lastX = e.clientX);
            documentElement.msSetPointerCapture(e.pointerId);
            break;
        }
        engaged = true;
        socket.emit('geolocation:start', {
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy
        });
      }
    },
    touchmove = function (e) {
      var point;
      switch (stop(e).type) {
        case 'touchmove':
          point = e.touches[0];
          break;
        default:
          point = e;
          break;
      }
      if (circle) {
        circle.style.top = (lastY = point.clientY) + 'px';
        circle.style.left = (lastX = point.clientX) + 'px';
      }
    },
    touchend = function (e) {
      if (engaged) {
        switch (stop(e).type) {
          case 'touchend':
            if (e.touches.length) return;
            break;
          case 'pointerdown':
            documentElement.releasePointerCapture(e.pointerId);
            break;
          case 'MSPointerDown':
            documentElement.msReleasePointerCapture(e.pointerId);
            break;
        }
        dropCircle(circle);
        circle = null;
        socket.emit('geolocation:end', {
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy
        });
      }
    },
    devicePixelRatio = window.devicePixelRatio || 1,
    previously = 0,
    strikeTheSphere = 0,
    blueI = 0,
    creator = false,
    lastScore,
    lastX, lastY
  ;
  resetCanvas(document.body.offsetWidth, document.body.offsetHeight);
  function resetCanvas(width, height) {
    canvas.width = width;
    canvas.height = height;
  }
  function resize() {
    resetCanvas(document.body.offsetWidth, document.body.offsetHeight);
    style.score.replace({
      '#score': {
        lineHeight: score.offsetHeight,
        fontSize: Math.floor(score.offsetHeight / 1.5)
      }
    });
  }
  function resetClass(e) {
    e.currentTarget.className = '';
    animation.off(e.currentTarget, 'end', resetClass);
  }
  function saetta() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (strikeTheSphere) {
      context.beginPath();
      if (0 < strikeTheSphere) {
        lightning(
          context,
          canvas.width / 2, 0,
          lastX, lastY - 50,
          context.lineWidth = 2 * strikeTheSphere,
          10,
          3
        );
      } else {
        lightning(
          context,
          lastX, lastY - 50,
          canvas.width / 2, -10,
          context.lineWidth = 10,
          20,
          5
        );
      }
      // context.fillStyle = 'rgb(' + (blueI % 255) + ',' + (blueI % 255) + ',' + (100 + (blueI % 150)) + ')';
      // if (++blueI < 0) blueI = 0;
      context.fillStyle = context.strokeStyle = 'rgb(221,221,221)';
      context.fill();
      context.stroke();
      context.closePath();
      rAF(saetta);
    }
  }
  function deviceorientation(e) {
    var acc = e.acceleration;
    document.body.style.backgroundPosition = (-e.gamma) + 'px ' + (-e.beta) + 'px';
  }
  window.addEventListener('resize', resize, false);
  window.addEventListener('orientationchange', resize, false);
  window.addEventListener('deviceorientation', deviceorientation, false);
  documentElement.addEventListener('contextmenu', stop, true);
  documentElement.addEventListener('selectstart', stop, true);
  if (pointerEnabled || navigator.msPointerEnabled) {
    documentElement.addEventListener(pointerEnabled ? 'pointerdown' : 'MSPointerDown', touchstart, true);
    documentElement.addEventListener(pointerEnabled ? 'pointermove' : 'MSPointerMove', touchmove, true);
    documentElement.addEventListener(pointerEnabled ? 'pointerup' : 'MSPointerUp', touchend, true);
  } else {
    documentElement.addEventListener('touchstart', touchstart, true);
    documentElement.addEventListener('touchmove', touchmove, true);
    documentElement.addEventListener('touchend', touchend, true);
    documentElement.addEventListener('mousedown', touchstart, true);
    documentElement.addEventListener('mousemove', touchmove, true);
    documentElement.addEventListener('mouseup', touchend, true);
  }
  details.textContent = 'collecting geolocation data';
  socket.on('baraonda:created', function (many) {
    creator = true;
    details.textContent = many ?
      'collecting energy' :
      'waiting';
    score.textContent = many || '';
    if (many !== previously) {
      vibrate(100);
      animation.on(document.body, 'end', resetClass, 350);
      if (many > previously) {
        document.body.className = 'blue';
      } else {
        document.body.className = 'red';
      }
      previously = many;
      strikeTheSphere = many;
      if (strikeTheSphere) {
        rAF(saetta);
      }
    }
  });
  socket.on('baraonda:joined', function (many) {
    details.textContent = 'engaged';
    score.textContent = many;
    if (many !== previously) {
      if (many > previously) {
        if (!previously) {
          animation.on(details, 'end', resetClass, 350);
          details.className = 'blue-highlight';
        }
        animation.on(circle, 'end', circleGrowedAnimationEnd, 500);
        circle.className = 'circle circle-showed circle-growing';
      } else {
        animation.on(document.body, 'end', resetClass, 350);
        document.body.className = 'red';
      }
      previously = many;
    }
    if (!strikeTheSphere) {
      vibrate(100);
    }
    strikeTheSphere = -1;
    rAF(saetta);
  });
  socket.on('baraonda:finished', function (many) {
    details.textContent = 'mission completed';
    score.textContent = many;
    previously = 0;
    dropCircle(circle);
    circle = null;
    strikeTheSphere = 0;
    animation.on(details, 'end', resetClass, 350);
    details.className = 'blue-highlight';
    animation.on(document.body, 'end', resetClass, 350);
    document.body.className = 'blue';
    animation.on(score, 'end', resetClass, 900);
    score.className = 'highlight';
    vibrate(250);
  });
  socket.on('baraonda:terminated', function (many) {
    creator = false;
    details.textContent = many ? 'scored' : 'failed';
    score.textContent = many;
    previously = 0;
    strikeTheSphere = 0;
    animation.on(score, 'end', resetClass, 600);
    score.className = 'highlight';
    if (many) {
      lastScore = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
        score: many,
        date: Date.now()
      };
      if (parseInt(localStorage.getItem('hi-score') || '0', 10) < many) {
        localStorage.setItem('hi-score', many);
        localStorage.setItem('hi-score-details', JSON.stringify(lastScore));
        vibrate(500);
        hiScore.textContent = many;
        animation.on(hiScore, 'end', resetClass, 900);
        hiScore.className = 'highlight';
      } else {
        vibrate(100);
      }
    }
  });
  socket.on('baraonda:left', function (many) {
    details.textContent = 'revoked';
    score.textContent = many;
    previously = 0;
    strikeTheSphere = 0;
    animation.on(details, 'end', resetClass, 350);
    details.className = 'red-highlight';
    vibrate(100);
  });
  socket.on('baraonda:somebody', function (waiting) {
    if (!previously && creator) {
      details.textContent = 'watch out';
      animation.on(details, 'end', resetClass, 350);
      details.className = 'blue-highlight';
    }
  });
  socket.on('baraonda:join', function (waiting) {
    if (waiting && !strikeTheSphere) {
      details.textContent = 'somebody is waiting';
      animation.on(details, 'end', resetClass, 350);
      details.className = 'blue-highlight';
    }
  });
  socket.on('connect', function(socket){
    details.textContent = coords ? 'ready' : 'locating';
    animation.on(details, 'end', resetClass, 350);
    details.className = 'blue-highlight';
    previously = 0;
  });
  socket.on('disconnect', function(socket){
    details.textContent = 'limbo';
    score.textContent = '?';
    previously = 0;
    strikeTheSphere = 0;
    animation.on(details, 'end', resetClass, 350);
    details.className = 'red-highlight';
  });
  hiScore.textContent = localStorage.getItem('hi-score') || '';
}

document.addEventListener(
  'DOMContentLoaded',
  ready,
  false
);
},{"./animation":2,"./js-style":3,"./lightning":4}]},{},[5])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvcmVzdHlsZS9idWlsZC9yZXN0eWxlLm5vZGUuanMiLCJzcmMvYW5pbWF0aW9uLmpzIiwic3JjL2pzLXN0eWxlLmpzIiwic3JjL2xpZ2h0bmluZy5qcyIsInNyYy9tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMU9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qanNsaW50IGZvcmluOiB0cnVlLCBwbHVzcGx1czogdHJ1ZSwgaW5kZW50OiAyLCBicm93c2VyOiB0cnVlLCB1bnBhcmFtOiB0cnVlICovXG4vKiFcbkNvcHlyaWdodCAoQykgMjAxNCBieSBBbmRyZWEgR2lhbW1hcmNoaSAtIEBXZWJSZWZsZWN0aW9uXG5cblBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbm9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbmluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbnRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbmNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcblxuVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbmFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuXG5USEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG5JTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbkZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbk9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cblRIRSBTT0ZUV0FSRS5cblxuKi9cbm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uIChPKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICB2YXJcbiAgICB0b1N0cmluZyA9IE8udG9TdHJpbmcsXG4gICAgaGFzID0gTy5oYXNPd25Qcm9wZXJ0eSxcbiAgICBjYW1lbEZpbmQgPSAvKFthLXpdKShbQS1aXSkvZyxcbiAgICBpZ25vcmVTcGVjaWFsID0gL15AKD86cGFnZXxmb250LWZhY2UpLyxcbiAgICBpc01lZGlhID0gL15AKD86bWVkaWEpLyxcbiAgICBpc0FycmF5ID0gQXJyYXkuaXNBcnJheSB8fCBmdW5jdGlvbiAoYXJyKSB7XG4gICAgICByZXR1cm4gdG9TdHJpbmcuY2FsbChhcnIpID09PSAnW29iamVjdCBBcnJheV0nO1xuICAgIH0sXG4gICAgZW1wdHkgPSBbXSxcbiAgICByZXN0eWxlO1xuXG4gIGZ1bmN0aW9uIFJlU3R5bGUoY29tcG9uZW50LCBub2RlLCBjc3MsIHByZWZpeGVzLCBkb2MpIHtcbiAgICB0aGlzLmNvbXBvbmVudCA9IGNvbXBvbmVudDtcbiAgICB0aGlzLm5vZGUgPSBub2RlO1xuICAgIHRoaXMuY3NzID0gY3NzO1xuICAgIHRoaXMucHJlZml4ZXMgPSBwcmVmaXhlcztcbiAgICB0aGlzLmRvYyA9IGRvYztcbiAgfVxuXG4gIFJlU3R5bGUucHJvdG90eXBlID0ge1xuICAgIHJlcGxhY2U6IGZ1bmN0aW9uIChzdWJzdGl0dXRlKSB7XG4gICAgICBpZiAoIShzdWJzdGl0dXRlIGluc3RhbmNlb2YgUmVTdHlsZSkpIHtcbiAgICAgICAgc3Vic3RpdHV0ZSA9IHJlc3R5bGUoXG4gICAgICAgICAgdGhpcy5jb21wb25lbnQsIHN1YnN0aXR1dGUsIHRoaXMucHJlZml4ZXMsIHRoaXMuZG9jXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICB0aGlzLnJlbW92ZSgpO1xuICAgICAgUmVTdHlsZS5jYWxsKFxuICAgICAgICB0aGlzLFxuICAgICAgICBzdWJzdGl0dXRlLmNvbXBvbmVudCxcbiAgICAgICAgc3Vic3RpdHV0ZS5ub2RlLFxuICAgICAgICBzdWJzdGl0dXRlLmNzcyxcbiAgICAgICAgc3Vic3RpdHV0ZS5wcmVmaXhlcyxcbiAgICAgICAgc3Vic3RpdHV0ZS5kb2NcbiAgICAgICk7XG4gICAgfSxcbiAgICByZW1vdmU6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBub2RlID0gdGhpcy5ub2RlLFxuICAgICAgICBwYXJlbnROb2RlID0gbm9kZS5wYXJlbnROb2RlO1xuICAgICAgaWYgKHBhcmVudE5vZGUpIHtcbiAgICAgICAgcGFyZW50Tm9kZS5yZW1vdmVDaGlsZChub2RlKTtcbiAgICAgIH1cbiAgICB9LFxuICAgIHZhbHVlT2Y6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiB0aGlzLmNzcztcbiAgICB9XG4gIH07XG5cbiAgZnVuY3Rpb24gY2FtZWxSZXBsYWNlKG0sICQxLCAkMikge1xuICAgIHJldHVybiAkMSArICctJyArICQyLnRvTG93ZXJDYXNlKCk7XG4gIH1cblxuICBmdW5jdGlvbiBjcmVhdGUoa2V5LCB2YWx1ZSwgcHJlZml4ZXMpIHtcbiAgICB2YXJcbiAgICAgIGNzcyA9IFtdLFxuICAgICAgcGl4ZWxzID0gdHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJyA/ICdweCcgOiAnJyxcbiAgICAgIGsgPSBrZXkucmVwbGFjZShjYW1lbEZpbmQsIGNhbWVsUmVwbGFjZSksXG4gICAgICBpO1xuICAgIGZvciAoaSA9IDA7IGkgPCBwcmVmaXhlcy5sZW5ndGg7IGkrKykge1xuICAgICAgY3NzLnB1c2goJy0nLCBwcmVmaXhlc1tpXSwgJy0nLCBrLCAnOicsIHZhbHVlLCBwaXhlbHMsICc7Jyk7XG4gICAgfVxuICAgIGNzcy5wdXNoKGssICc6JywgdmFsdWUsIHBpeGVscywgJzsnKTtcbiAgICByZXR1cm4gY3NzLmpvaW4oJycpO1xuICB9XG5cbiAgZnVuY3Rpb24gcHJvcGVydHkocHJldmlvdXMsIGtleSkge1xuICAgIHJldHVybiBwcmV2aW91cy5sZW5ndGggPyBwcmV2aW91cyArICctJyArIGtleSA6IGtleTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdlbmVyYXRlKGNzcywgcHJldmlvdXMsIG9iaiwgcHJlZml4ZXMpIHtcbiAgICB2YXIga2V5LCB2YWx1ZSwgaTtcbiAgICBmb3IgKGtleSBpbiBvYmopIHtcbiAgICAgIGlmIChoYXMuY2FsbChvYmosIGtleSkpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBvYmpba2V5XSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICBpZiAoaXNBcnJheShvYmpba2V5XSkpIHtcbiAgICAgICAgICAgIHZhbHVlID0gb2JqW2tleV07XG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdmFsdWUubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgY3NzLnB1c2goXG4gICAgICAgICAgICAgICAgY3JlYXRlKHByb3BlcnR5KHByZXZpb3VzLCBrZXkpLCB2YWx1ZVtpXSwgcHJlZml4ZXMpXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGdlbmVyYXRlKFxuICAgICAgICAgICAgICBjc3MsXG4gICAgICAgICAgICAgIHByb3BlcnR5KHByZXZpb3VzLCBrZXkpLFxuICAgICAgICAgICAgICBvYmpba2V5XSxcbiAgICAgICAgICAgICAgcHJlZml4ZXNcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNzcy5wdXNoKFxuICAgICAgICAgICAgY3JlYXRlKHByb3BlcnR5KHByZXZpb3VzLCBrZXkpLCBvYmpba2V5XSwgcHJlZml4ZXMpXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gY3NzLmpvaW4oJycpO1xuICB9XG5cbiAgZnVuY3Rpb24gcGFyc2UoY29tcG9uZW50LCBvYmosIHByZWZpeGVzKSB7XG4gICAgdmFyXG4gICAgICBjc3MgPSBbXSxcbiAgICAgIGF0LCBjbXAsIHNwZWNpYWwsIGssIHYsXG4gICAgICBzYW1lLCBrZXksIHZhbHVlLCBpLCBqO1xuICAgIGZvciAoa2V5IGluIG9iaikge1xuICAgICAgaWYgKGhhcy5jYWxsKG9iaiwga2V5KSkge1xuICAgICAgICBhdCA9IGtleS5jaGFyQXQoMCkgPT09ICdAJztcbiAgICAgICAgc2FtZSA9IGF0IHx8ICFjb21wb25lbnQuaW5kZXhPZihrZXkgKyAnICcpO1xuICAgICAgICBjbXAgPSBhdCAmJiBpc01lZGlhLnRlc3Qoa2V5KSA/IGNvbXBvbmVudCA6ICcnO1xuICAgICAgICBzcGVjaWFsID0gYXQgJiYgIWlnbm9yZVNwZWNpYWwudGVzdChrZXkpO1xuICAgICAgICBrID0gc3BlY2lhbCA/IGtleS5zbGljZSgxKSA6IGtleTtcbiAgICAgICAgdmFsdWUgPSBlbXB0eS5jb25jYXQob2JqW2tleV0pO1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdmFsdWUubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICB2ID0gdmFsdWVbaV07XG4gICAgICAgICAgaWYgKHNwZWNpYWwpIHtcbiAgICAgICAgICAgIGogPSBwcmVmaXhlcy5sZW5ndGg7XG4gICAgICAgICAgICB3aGlsZSAoai0tKSB7XG4gICAgICAgICAgICAgIGNzcy5wdXNoKCdALScsIHByZWZpeGVzW2pdLCAnLScsIGssICd7JyxcbiAgICAgICAgICAgICAgICBwYXJzZShjbXAsIHYsIFtwcmVmaXhlc1tqXV0pLFxuICAgICAgICAgICAgICAgICd9Jyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjc3MucHVzaChrZXksICd7JywgcGFyc2UoY21wLCB2LCBwcmVmaXhlcyksICd9Jyk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNzcy5wdXNoKFxuICAgICAgICAgICAgICBzYW1lID8ga2V5IDogY29tcG9uZW50ICsga2V5LFxuICAgICAgICAgICAgICAneycsIGdlbmVyYXRlKFtdLCAnJywgdiwgcHJlZml4ZXMpLCAnfSdcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBjc3Muam9pbignJyk7XG4gIH1cblxuICAvLyBoYWNrIHRvIGF2b2lkIEpTTGludCBzaGVuYW5pZ2Fuc1xuICBpZiAoe3VuZGVmaW5lZDogdHJ1ZX1bdHlwZW9mIGRvY3VtZW50XSkge1xuICAgIC8vIGluIG5vZGUsIGJ5IGRlZmF1bHQsIG5vIHByZWZpeGVzIGFyZSB1c2VkXG4gICAgcmVzdHlsZSA9IGZ1bmN0aW9uIChjb21wb25lbnQsIG9iaiwgcHJlZml4ZXMpIHtcbiAgICAgIGlmICh0eXBlb2YgY29tcG9uZW50ID09PSAnb2JqZWN0Jykge1xuICAgICAgICBwcmVmaXhlcyA9IG9iajtcbiAgICAgICAgb2JqID0gY29tcG9uZW50O1xuICAgICAgICBjb21wb25lbnQgPSAnJztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbXBvbmVudCArPSAnICc7XG4gICAgICB9XG4gICAgICByZXR1cm4gcGFyc2UoY29tcG9uZW50LCBvYmosIHByZWZpeGVzIHx8IGVtcHR5KTtcbiAgICB9O1xuICAgIC8vIHVzZWZ1bCBmb3IgZGlmZmVyZW50IHN0eWxlIG9mIHJlcXVpcmVcbiAgICByZXN0eWxlLnJlc3R5bGUgPSByZXN0eWxlO1xuICB9IGVsc2Uge1xuICAgIHJlc3R5bGUgPSBmdW5jdGlvbiAoY29tcG9uZW50LCBvYmosIHByZWZpeGVzLCBkb2MpIHtcbiAgICAgIGlmICh0eXBlb2YgY29tcG9uZW50ID09PSAnb2JqZWN0Jykge1xuICAgICAgICBkb2MgPSBwcmVmaXhlcztcbiAgICAgICAgcHJlZml4ZXMgPSBvYmo7XG4gICAgICAgIG9iaiA9IGNvbXBvbmVudDtcbiAgICAgICAgYyA9IChjb21wb25lbnQgPSAnJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjID0gY29tcG9uZW50ICsgJyAnO1xuICAgICAgfVxuICAgICAgdmFyIGMsIGQgPSBkb2MgfHwgKGRvYyA9IGRvY3VtZW50KSxcbiAgICAgICAgY3NzID0gcGFyc2UoYywgb2JqLCBwcmVmaXhlcyB8fCAocHJlZml4ZXMgPSByZXN0eWxlLnByZWZpeGVzKSksXG4gICAgICAgIGhlYWQgPSBkLmhlYWQgfHxcbiAgICAgICAgICBkLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoZWFkJylbMF0gfHxcbiAgICAgICAgICBkLmRvY3VtZW50RWxlbWVudCxcbiAgICAgICAgbm9kZSA9IGhlYWQuaW5zZXJ0QmVmb3JlKFxuICAgICAgICAgIGQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKSxcbiAgICAgICAgICBoZWFkLmxhc3RDaGlsZFxuICAgICAgICApO1xuICAgICAgbm9kZS50eXBlID0gJ3RleHQvY3NzJztcbiAgICAgIC8vIGl0IHNob3VsZCBoYXZlIGJlZW5cbiAgICAgIC8vIGlmICgnc3R5bGVTaGVldCcgaW4gbm9kZSkge31cbiAgICAgIC8vIGJ1dCBKU0xpbnQgYm90aGVycyBpbiB0aGF0IHdheVxuICAgICAgaWYgKG5vZGUuc3R5bGVTaGVldCkge1xuICAgICAgICBub2RlLnN0eWxlU2hlZXQuY3NzVGV4dCA9IGNzcztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5vZGUuYXBwZW5kQ2hpbGQoZC5jcmVhdGVUZXh0Tm9kZShjc3MpKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBuZXcgUmVTdHlsZShjb21wb25lbnQsIG5vZGUsIGNzcywgcHJlZml4ZXMsIGRvYyk7XG4gICAgfTtcbiAgfVxuXG4gIHJlc3R5bGUuY3VzdG9tRWxlbWVudCA9IGZ1bmN0aW9uIChuYW1lLCBjb25zdHJ1Y3RvciwgcHJvdG8pIHtcbiAgICB2YXIga2V5LCBwcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKGNvbnN0cnVjdG9yLnByb3RvdHlwZSk7XG4gICAgaWYgKHByb3RvICYmIHByb3RvLmNzcykge1xuICAgICAgcHJvdG8uY3NzID0gcmVzdHlsZShuYW1lLCBwcm90by5jc3MpO1xuICAgIH1cbiAgICBmb3IgKGtleSBpbiBwcm90bykge1xuICAgICAgcHJvdG90eXBlW2tleV0gPSBwcm90b1trZXldO1xuICAgIH1cbiAgICByZXR1cm4gZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50KG5hbWUsIHtwcm90b3R5cGU6IHByb3RvdHlwZX0pO1xuICB9O1xuXG4gIHJlc3R5bGUucHJlZml4ZXMgPSBbXG4gICAgJ3dlYmtpdCcsXG4gICAgJ21veicsXG4gICAgJ21zJyxcbiAgICAnbydcbiAgXTtcblxuICByZXR1cm4gcmVzdHlsZTtcblxuLyoqXG4gKiBub3Qgc3VyZSBpZiBUT0RPIHNpbmNlIHRoaXMgbWlnaHQgYmUgcHJlcGVuZGVuZCByZWdhcmRsZXNzIHRoZSBwYXJzZXJcbiAqICBAbmFtZXNwYWNlIHVybChodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hodG1sKTtcbiAqICBAY2hhcnNldCBcIlVURi04XCI7XG4gKi9cblxufSh7fSkpOyIsIm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uIChnKSB7XG4gIHZhciBtYXAsIHR5cGUsIHN0YXJ0LCBpdGVyYXRpb24sIGVuZDtcbiAgc3dpdGNoICh0cnVlKSB7XG4gICAgY2FzZSAhIWcuQW5pbWF0aW9uRXZlbnQ6XG4gICAgICB0eXBlID0gJ2FuaW1hdGlvbic7XG4gICAgICBzdGFydCA9ICdzdGFydCc7XG4gICAgICBpdGVyYXRpb24gPSAnaXRlcmF0aW9uJztcbiAgICAgIGVuZCA9ICdlbmQnO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAhIWcuV2ViS2l0QW5pbWF0aW9uRXZlbnQ6XG4gICAgICB0eXBlID0gJ3dlYmtpdEFuaW1hdGlvbic7XG4gICAgICBzdGFydCA9ICdTdGFydCc7XG4gICAgICBpdGVyYXRpb24gPSAnSXRlcmF0aW9uJztcbiAgICAgIGVuZCA9ICdFbmQnO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAhIWcuTVNBbmltYXRpb25FdmVudDpcbiAgICAgIHR5cGUgPSAnTVNBbmltYXRpb24nO1xuICAgICAgc3RhcnQgPSAnU3RhcnQnO1xuICAgICAgaXRlcmF0aW9uID0gJ0l0ZXJhdGlvbic7XG4gICAgICBlbmQgPSAnRW5kJztcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgISFnLk9BbmltYXRpb25FdmVudDpcbiAgICAgIHR5cGUgPSAnb2FuaW1hdGlvbic7XG4gICAgICBzdGFydCA9ICdzdGFydCc7XG4gICAgICBpdGVyYXRpb24gPSAnaXRlcmF0aW9uJztcbiAgICAgIGVuZCA9ICdlbmQnO1xuICAgICAgYnJlYWs7XG4gICAgZGVmYXVsdDpcbiAgICAgIHR5cGUgPSBbXTtcbiAgICAgIGVuZCA9IGZ1bmN0aW9uIChlbCwgY2IpIHtcbiAgICAgICAgbWFwKGVsLCBjYik7XG4gICAgICAgIGNiKHt0eXBlOiAnZW5kJywgY3VycmVudFRhcmdldDogZWx9KTtcbiAgICAgIH07XG4gICAgICBtYXAgPSBmdW5jdGlvbiAoZWwsIGNiLCBkZWxheSkge1xuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMykge1xuICAgICAgICAgIHR5cGUucHVzaChlbCwgY2IsIHNldFRpbWVvdXQoZW5kLCBkZWxheSwgZWwsIGNiKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0eXBlLmxlbmd0aDsgaSArPSAzKSB7XG4gICAgICAgICAgICBpZiAodHlwZVtpXSA9PT0gZWwgJiYgdHlwZVtpICsgMV0gPT09IGNiKSB7XG4gICAgICAgICAgICAgIGNsZWFyVGltZW91dCh0eXBlLnNwbGljZShpLCAzKVsyXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9O1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgb246IGZ1bmN0aW9uIChlbCwgdHlwZSwgY2IsIGRlbGF5KSB7XG4gICAgICAgICAgaWYgKHR5cGUgPT09ICdlbmQnKSB7XG4gICAgICAgICAgICBtYXAoZWwsIGNiLCBkZWxheSk7XG4gICAgICAgICAgfSBlbHNlIGlmIChnLmNvbnNvbGUpIHtcbiAgICAgICAgICAgIGcuY29uc29sZS53YXJuKCd1bnN1cHBvcnRlZCBsaXN0ZW5lciAnICsgdHlwZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuICAgICAgICBvZmY6IGZ1bmN0aW9uIChlbCwgdHlwZSwgY2IpIHtcbiAgICAgICAgICBpZiAodHlwZSA9PT0gJ2VuZCcpIHtcbiAgICAgICAgICAgIG1hcChlbCwgY2IpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgICAgfTtcbiAgfVxuICBtYXAgPSB7XG4gICAgc3RhcnQ6IHR5cGUgKyBzdGFydCxcbiAgICBpdGVyYXRpb246IHR5cGUgKyBpdGVyYXRpb24sXG4gICAgZW5kOiB0eXBlICsgZW5kXG4gIH07XG4gIHJldHVybiB7XG4gICAgb246IGZ1bmN0aW9uIChlbCwgdHlwZSwgY2IsIGRlbGF5KSB7XG4gICAgICBlbC5hZGRFdmVudExpc3RlbmVyKG1hcFt0eXBlXSwgY2IsIGZhbHNlKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgb2ZmOiBmdW5jdGlvbiAoZWwsIHR5cGUsIGNiKSB7XG4gICAgICBlbC5yZW1vdmVFdmVudExpc3RlbmVyKG1hcFt0eXBlXSwgY2IsIGZhbHNlKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgfTtcbn0od2luZG93KSk7IiwidmFyIHJlc3R5bGUgPSByZXF1aXJlKCdyZXN0eWxlJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4ge1xuICAgIGFsbDogcmVzdHlsZSh7XG4gICAgICAnKic6IHtcbiAgICAgICAgY3Vyc29yOiAnZGVmYXVsdCcsXG4gICAgICAgIHRvdWNoQWN0aW9uOiAnbm9uZScsXG4gICAgICAgIHVzZXJTZWxlY3Q6ICdub25lJ1xuICAgICAgfVxuICAgIH0pLFxuICAgIGFjY3VyYWN5OiByZXN0eWxlKHtcbiAgICAgICcjYWNjdXJhY3knOiB7XG4gICAgICAgIHdpZHRoOiAwLFxuICAgICAgICBtYXJnaW5MZWZ0OiAwLFxuICAgICAgICB0cmFuc2l0aW9uOiAnYWxsIDNzJ1xuICAgICAgfVxuICAgIH0pLFxuICAgIGdsb3c6IHJlc3R5bGUoe1xuICAgICAgJ0BrZXlmcmFtZXMgZ2xvdyc6IHtcbiAgICAgICAgJzAlJzogICB7IGJveFNoYWRvdzogJzBweCAwcHggMHB4IDBweCByZ2JhKDI1NSwyNTUsMjU1LDEpJyB9LFxuICAgICAgICAnMTAwJSc6IHsgYm94U2hhZG93OiAnMHB4IDBweCAzMnB4IDE2cHggcmdiYSgyNTUsMjU1LDI1NSwxKScgfVxuICAgICAgfSxcbiAgICAgICcuZ2xvdyc6IHtcbiAgICAgICAgYW5pbWF0aW9uOiB7XG4gICAgICAgICAgbmFtZTogJ2dsb3cnLFxuICAgICAgICAgIGR1cmF0aW9uOiAnMXMnLFxuICAgICAgICAgIGl0ZXJhdGlvbkNvdW50OiAnaW5maW5pdGUnLFxuICAgICAgICAgIGRpcmVjdGlvbjogJ2FsdGVybmF0ZSdcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pLFxuICAgIHNjb3JlOiByZXN0eWxlKHtcbiAgICAgICcjc2NvcmUnOiB7XG4gICAgICAgIGxpbmVIZWlnaHQ6IHNjb3JlLm9mZnNldEhlaWdodCxcbiAgICAgICAgZm9udFNpemU6IE1hdGguZmxvb3Ioc2NvcmUub2Zmc2V0SGVpZ2h0IC8gMS41KVxuICAgICAgfVxuICAgIH0pLFxuICAgIGNpcmNsZTogcmVzdHlsZSh7XG4gICAgICAnLmNpcmNsZSc6IHtcbiAgICAgICAgcG9zaXRpb246ICdmaXhlZCcsXG4gICAgICAgIGJvcmRlcjogJzJweCBzb2xpZCAjREREJyxcbiAgICAgICAgbWFyZ2luOiB7IHRvcDogMCwgbGVmdDogMCB9LFxuICAgICAgICB3aWR0aDogMCxcbiAgICAgICAgaGVpZ2h0OiAwLFxuICAgICAgICBib3JkZXJSYWRpdXM6ICc1MCUnXG4gICAgICB9LFxuICAgICAgJy5jaXJjbGUtc2hvd2VkJzoge1xuICAgICAgICB3aWR0aDogMTAwLFxuICAgICAgICBoZWlnaHQ6IDEwMCxcbiAgICAgICAgbWFyZ2luOiB7XG4gICAgICAgICAgdG9wOiAtNTEsXG4gICAgICAgICAgbGVmdDogLTUxXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICAnQGtleWZyYW1lcyBjaXJjbGUtc2hvd2luZyc6IHtcbiAgICAgICAgJzAlJzogICB7ICAgd2lkdGg6IDAsIGhlaWdodDogMCwgbWFyZ2luOiB7IHRvcDogMCwgbGVmdDogMCB9IH0sXG4gICAgICAgICcxMDAlJzogeyB3aWR0aDogMTAwLCBoZWlnaHQ6IDEwMCwgbWFyZ2luOiB7IHRvcDogLTUxLCBsZWZ0OiAtNTEgfSB9XG4gICAgICB9LFxuICAgICAgJy5jaXJjbGUtc2hvd2luZyc6IHtcbiAgICAgICAgYW5pbWF0aW9uOiB7XG4gICAgICAgICAgbmFtZTogJ2NpcmNsZS1zaG93aW5nJyxcbiAgICAgICAgICBkdXJhdGlvbjogJzI1MG1zJyxcbiAgICAgICAgICBpdGVyYXRpb25Db3VudDogJzEnLFxuICAgICAgICAgIGRpcmVjdGlvbjogJ25vcm1hbCdcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgICdAa2V5ZnJhbWVzIGNpcmNsZS1kaXNhcHBlYXJpbmcnOiB7XG4gICAgICAgICcwJSc6ICAgeyBvcGFjaXR5OiAnMScsIHdpZHRoOiAxMDAsIGhlaWdodDogMTAwLCBtYXJnaW46IHsgdG9wOiAtNTEsIGxlZnQ6IC01MSB9IH0sXG4gICAgICAgICcxMDAlJzogeyBvcGFjaXR5OiAnMCcsIHdpZHRoOiAwLCBoZWlnaHQ6IDAsIG1hcmdpbjogeyB0b3A6IDAsIGxlZnQ6IDAgfSB9XG4gICAgICB9LFxuICAgICAgJy5jaXJjbGUtZGlzYXBwZWFyaW5nJzoge1xuICAgICAgICBhbmltYXRpb246IHtcbiAgICAgICAgICBuYW1lOiAnY2lyY2xlLWRpc2FwcGVhcmluZycsXG4gICAgICAgICAgZHVyYXRpb246ICcyNTBtcycsXG4gICAgICAgICAgaXRlcmF0aW9uQ291bnQ6ICcxJyxcbiAgICAgICAgICBkaXJlY3Rpb246ICdub3JtYWwnXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICAnQGtleWZyYW1lcyBjaXJjbGUtZ3Jvd2luZyc6IHtcbiAgICAgICAgJzAlJzogICB7IGJvcmRlcldpZHRoOiAyLCBtYXJnaW46IHsgdG9wOiAtNTEsIGxlZnQ6IC01MSB9LCBib3hTaGFkb3c6ICcwcHggMHB4IDBweCAwcHggcmdiYSgyNTUsMjU1LDI1NSwxKScgfSxcbiAgICAgICAgJzEwMCUnOiB7IGJvcmRlcldpZHRoOiAzMiwgbWFyZ2luOiB7IHRvcDogLTgwLCBsZWZ0OiAtODAgfSwgYm94U2hhZG93OiAnMHB4IDBweCAzMnB4IDE2cHggcmdiYSgyNTUsMjU1LDI1NSwxKScgfVxuICAgICAgfSxcbiAgICAgICcuY2lyY2xlLWdyb3dpbmcnOiB7XG4gICAgICAgIGFuaW1hdGlvbjoge1xuICAgICAgICAgIG5hbWU6ICdjaXJjbGUtZ3Jvd2luZycsXG4gICAgICAgICAgZHVyYXRpb246ICc1MDBtcycsXG4gICAgICAgICAgaXRlcmF0aW9uQ291bnQ6ICcyJyxcbiAgICAgICAgICBkaXJlY3Rpb246ICdhbHRlcm5hdGUnXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICAnQGtleWZyYW1lcyBibHVlJzoge1xuICAgICAgICAnMCUnOiAgIHsgYmFja2dyb3VuZENvbG9yOiAnIzAwQScgfSxcbiAgICAgICAgJzEwMCUnOiB7IGJhY2tncm91bmRDb2xvcjogJyMzMzMnIH1cbiAgICAgIH0sXG4gICAgICAnYm9keS5ibHVlJzoge1xuICAgICAgICBhbmltYXRpb246IHtcbiAgICAgICAgICBuYW1lOiAnYmx1ZScsXG4gICAgICAgICAgZHVyYXRpb246ICczNTBtcycsXG4gICAgICAgICAgaXRlcmF0aW9uQ291bnQ6ICcxJyxcbiAgICAgICAgICBkaXJlY3Rpb246ICdub3JtYWwnXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICAnQGtleWZyYW1lcyByZWQnOiB7XG4gICAgICAgICcwJSc6ICAgeyBiYWNrZ3JvdW5kQ29sb3I6ICcjQTAwJyB9LFxuICAgICAgICAnMTAwJSc6IHsgYmFja2dyb3VuZENvbG9yOiAnIzMzMycgfVxuICAgICAgfSxcbiAgICAgICdib2R5LnJlZCc6IHtcbiAgICAgICAgYW5pbWF0aW9uOiB7XG4gICAgICAgICAgbmFtZTogJ3JlZCcsXG4gICAgICAgICAgZHVyYXRpb246ICczNTBtcycsXG4gICAgICAgICAgaXRlcmF0aW9uQ291bnQ6ICcxJyxcbiAgICAgICAgICBkaXJlY3Rpb246ICdub3JtYWwnXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICAnQGtleWZyYW1lcyBibHVlLWhpZ2hsaWdodCc6IHtcbiAgICAgICAgJzAlJzogICB7IGNvbG9yOiAnIzAwRicsIG9wYWNpdHk6ICcxJyB9LFxuICAgICAgICAnMTAwJSc6IHsgY29sb3I6ICcjMDAwJywgb3BhY2l0eTogJy4zJyB9XG4gICAgICB9LFxuICAgICAgJy5ibHVlLWhpZ2hsaWdodCc6IHtcbiAgICAgICAgYW5pbWF0aW9uOiB7XG4gICAgICAgICAgbmFtZTogJ2JsdWUtaGlnaGxpZ2h0JyxcbiAgICAgICAgICBkdXJhdGlvbjogJzM1MG1zJyxcbiAgICAgICAgICBpdGVyYXRpb25Db3VudDogJzEnLFxuICAgICAgICAgIGRpcmVjdGlvbjogJ25vcm1hbCdcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgICdAa2V5ZnJhbWVzIHJlZC1oaWdobGlnaHQnOiB7XG4gICAgICAgICcwJSc6ICAgeyBjb2xvcjogJyNGMDAnLCBvcGFjaXR5OiAnMScgfSxcbiAgICAgICAgJzEwMCUnOiB7IGNvbG9yOiAnIzAwMCcsIG9wYWNpdHk6ICcuMycgfVxuICAgICAgfSxcbiAgICAgICcucmVkLWhpZ2hsaWdodCc6IHtcbiAgICAgICAgYW5pbWF0aW9uOiB7XG4gICAgICAgICAgbmFtZTogJ3JlZC1oaWdobGlnaHQnLFxuICAgICAgICAgIGR1cmF0aW9uOiAnMzUwbXMnLFxuICAgICAgICAgIGl0ZXJhdGlvbkNvdW50OiAnMScsXG4gICAgICAgICAgZGlyZWN0aW9uOiAnbm9ybWFsJ1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgJ0BrZXlmcmFtZXMgaGlnaGxpZ2h0Jzoge1xuICAgICAgICAnMCUnOiAgIHsgY29sb3I6ICcjRkZGJywgb3BhY2l0eTogJzEnIH0sXG4gICAgICAgICcxMDAlJzogeyBjb2xvcjogJyMwMDAnLCBvcGFjaXR5OiAnLjMnIH1cbiAgICAgIH0sXG4gICAgICAnLmhpZ2hsaWdodCc6IHtcbiAgICAgICAgYW5pbWF0aW9uOiB7XG4gICAgICAgICAgbmFtZTogJ2hpZ2hsaWdodCcsXG4gICAgICAgICAgZHVyYXRpb246ICc5MDBtcycsXG4gICAgICAgICAgaXRlcmF0aW9uQ291bnQ6ICcxJyxcbiAgICAgICAgICBkaXJlY3Rpb246ICdub3JtYWwnXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KVxuICB9O1xufTsiLCJmdW5jdGlvbiBsaWdodG5pbmcoXG4gIGNvbnRleHQsXG4gIHN0YXJ0WCwgc3RhcnRZLFxuICBlbmRYLCBlbmRZLFxuICBkZWx0YSwgcmF0aW8sIHJheXNcbikgeyAvLyAoQykgQW5kcmVhIEdpYW1tYXJjaGkgLSBNaXQgU3R5bGUgTGljZW5zZVxuICB2YXJcbiAgICBncmVhdGVyWCA9IHN0YXJ0WCA8IGVuZFgsXG4gICAgZ3JlYXRlclkgPSBzdGFydFkgPCBlbmRZLFxuICAgIGRlc3RYID0gZW5kWCArIChncmVhdGVyWCA/IC1yYXRpbyA6IHJhdGlvKSxcbiAgICBkZXN0WSA9IGVuZFkgKyAoZ3JlYXRlclkgPyAtcmF0aW8gOiByYXRpbyksXG4gICAgcmFuZG9tID0gTWF0aC5yYW5kb20sXG4gICAgY29zID0gTWF0aC5jb3MsXG4gICAgc2luID0gTWF0aC5zaW4sXG4gICAgUEkgPSBNYXRoLlBJLFxuICAgIGRpc3RYLCBkaXN0WSwgbWlkWCwgbWlkWSxcbiAgICByYW5nbGUsIHJkZWx0YSxcbiAgICBwcm9ncmVzc1gsXG4gICAgcHJvZ3Jlc3NZXG4gIDtcbiAgd2hpbGUgKHJheXMtLSkge1xuICAgIGNvbnRleHQubW92ZVRvKHByb2dyZXNzWCA9IHN0YXJ0WCwgcHJvZ3Jlc3NZID0gc3RhcnRZKTtcbiAgICBkbyB7XG4gICAgICBkaXN0WCA9IGVuZFggLSBwcm9ncmVzc1g7XG4gICAgICBkaXN0WSA9IGVuZFkgLSBwcm9ncmVzc1k7XG4gICAgICBtaWRYID0gcHJvZ3Jlc3NYICsgKGRpc3RYIC8gcmF0aW8pO1xuICAgICAgbWlkWSA9IHByb2dyZXNzWSArIChkaXN0WSAvIHJhdGlvKTtcbiAgICAgIHJhbmdsZSA9IHJhbmRvbSgpICogMiAqIFBJO1xuICAgICAgcmRlbHRhID0gcmFuZG9tKCkgKiBkZWx0YTtcbiAgICAgIHByb2dyZXNzWCA9IG1pZFggKyByZGVsdGEgKiBjb3MocmFuZ2xlKTtcbiAgICAgIHByb2dyZXNzWSA9IG1pZFkgKyByZGVsdGEgKiBzaW4ocmFuZ2xlKTtcbiAgICAgIGNvbnRleHQubGluZVRvKHByb2dyZXNzWCwgcHJvZ3Jlc3NZKTtcbiAgICB9IHdoaWxlIChcbiAgICAgIChncmVhdGVyWCA/IHByb2dyZXNzWCA8IGRlc3RYIDogZGVzdFggPCBwcm9ncmVzc1gpIHx8XG4gICAgICAoZ3JlYXRlclkgPyBwcm9ncmVzc1kgPCBkZXN0WSA6IGRlc3RZIDwgcHJvZ3Jlc3NZKVxuICAgICk7XG4gICAgY29udGV4dC5saW5lVG8oZW5kWCwgZW5kWSk7XG4gIH1cbn0iLCJ2YXJcbiAgYW5pbWF0aW9uID0gcmVxdWlyZSgnLi9hbmltYXRpb24nKSxcbiAganNTdHlsZSA9IHJlcXVpcmUoJy4vanMtc3R5bGUnKSxcbiAgbGlnaHRuaW5nID0gcmVxdWlyZSgnLi9saWdodG5pbmcnKVxuO1xuXG5mdW5jdGlvbiByZWFkeShlKSB7J3VzZSBzdHJpY3QnO1xuICBlLmN1cnJlbnRUYXJnZXQucmVtb3ZlRXZlbnRMaXN0ZW5lcihlLnR5cGUsIHJlYWR5LCBmYWxzZSk7XG4gIHZhclxuICAgIGNpcmNsZSxcbiAgICBjb29yZHMsXG4gICAgZW5nYWdlZCA9IGZhbHNlLFxuICAgIHZpYnJhdGUgPSBcInZpYnJhdGVcIiBpbiBuYXZpZ2F0b3IgP1xuICAgICAgZnVuY3Rpb24gKGhvd011Y2gpIHtcbiAgICAgICAgbmF2aWdhdG9yLnZpYnJhdGUoaG93TXVjaCk7XG4gICAgICB9IDpcbiAgICAgIE9iamVjdCxcbiAgICBoaVNjb3JlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2hpLXNjb3JlJyksXG4gICAgY2FudmFzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2NhbnZhcycpLFxuICAgIGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKSxcbiAgICBkZXRhaWxzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2RldGFpbHMnKSxcbiAgICBzY29yZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNzY29yZScpLFxuICAgIHN0eWxlID0ganNTdHlsZSgpLFxuICAgIGNpcmNsZURpc2FwcGVhcmluZ0FuaW1hdGlvbkVuZCA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICBlLmN1cnJlbnRUYXJnZXQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzKTtcbiAgICAgIGFuaW1hdGlvbi5vZmYoZS5jdXJyZW50VGFyZ2V0LCAnZW5kJywgY2lyY2xlRGlzYXBwZWFyaW5nQW5pbWF0aW9uRW5kKTtcbiAgICB9LFxuICAgIGNpcmNsZUdyb3dlZEFuaW1hdGlvbkVuZCA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICBlLmN1cnJlbnRUYXJnZXQuY2xhc3NOYW1lID0gJ2NpcmNsZSBjaXJjbGUtc2hvd2VkIGdsb3cnO1xuICAgICAgYW5pbWF0aW9uLm9mZihlLmN1cnJlbnRUYXJnZXQsICdlbmQnLCBjaXJjbGVHcm93ZWRBbmltYXRpb25FbmQpO1xuICAgIH0sXG4gICAgY2lyY2xlU2hvd2luZ0FuaW1hdGlvbkVuZCA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICBlLmN1cnJlbnRUYXJnZXQuY2xhc3NOYW1lID0gJ2NpcmNsZSBjaXJjbGUtc2hvd2VkIGdsb3cnO1xuICAgICAgYW5pbWF0aW9uLm9mZihlLmN1cnJlbnRUYXJnZXQsICdlbmQnLCBjaXJjbGVTaG93aW5nQW5pbWF0aW9uRW5kKTtcbiAgICB9LFxuICAgIGRvY3VtZW50RWxlbWVudCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCxcbiAgICBwb2ludGVyRW5hYmxlZCA9IG5hdmlnYXRvci5wb2ludGVyRW5hYmxlZCxcbiAgICByQUYgPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lICAgICAgIHx8XG4gICAgICAgICAgd2luZG93LndlYmtpdFJlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxuICAgICAgICAgIHdpbmRvdy5tb3pSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcbiAgICAgICAgICB3aW5kb3cubXNSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcbiAgICAgICAgICB3aW5kb3cub1JlcXVlc3RBbmltYXRpb25GcmFtZSAgICB8fFxuICAgICAgICAgIGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgICAgICAgd2luZG93LnNldFRpbWVvdXQoY2FsbGJhY2ssIDEwMDAgLyAyNSk7XG4gICAgICAgICAgfSxcbiAgICBkcm9wQ2lyY2xlID0gZnVuY3Rpb24gKGNpcmNsZSkge1xuICAgICAgaWYgKCFjaXJjbGUpIHJldHVybjtcbiAgICAgIGFuaW1hdGlvbi5vbihjaXJjbGUsICdlbmQnLCBjaXJjbGVEaXNhcHBlYXJpbmdBbmltYXRpb25FbmQsIDI1MCk7XG4gICAgICBjaXJjbGUuY2xhc3NOYW1lID0gJ2NpcmNsZSBjaXJjbGUtZGlzYXBwZWFyaW5nJztcbiAgICB9LFxuICAgIHdhdGNoUG9zaXRpb24gPSBmdW5jdGlvbiAocG9zaXRpb24pIHtcbiAgICAgIGlmICghY29vcmRzKSB7XG4gICAgICAgIGRldGFpbHMudGV4dENvbnRlbnQgPSAncmVhZHknO1xuICAgICAgICBzb2NrZXQuZW1pdCgnZ2VvbG9jYXRpb246Y29vcmRzJywge1xuICAgICAgICAgIGxhdGl0dWRlOiBwb3NpdGlvbi5jb29yZHMubGF0aXR1ZGUsXG4gICAgICAgICAgbG9uZ2l0dWRlOiBwb3NpdGlvbi5jb29yZHMubG9uZ2l0dWRlLFxuICAgICAgICAgIGFjY3VyYWN5OiBwb3NpdGlvbi5jb29yZHMuYWNjdXJhY3lcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBjb29yZHMgPSBwb3NpdGlvbi5jb29yZHM7XG4gICAgICB2YXJcbiAgICAgICAgYWNjdXJhY3kgPSBNYXRoLm1pbihjb29yZHMuYWNjdXJhY3ksIDE1MCksXG4gICAgICAgIHdpZHRoID0gKChkb2N1bWVudC5ib2R5Lm9mZnNldFdpZHRoIC0gMTYpICogYWNjdXJhY3kpIC8gMTUwXG4gICAgICA7XG4gICAgICBzdHlsZS5hY2N1cmFjeS5yZXBsYWNlKHtcbiAgICAgICAgJyNhY2N1cmFjeSc6IHtcbiAgICAgICAgICB3aWR0aDogd2lkdGgsXG4gICAgICAgICAgbWFyZ2luTGVmdDogLU1hdGgucm91bmQod2lkdGggLyAyKSxcbiAgICAgICAgICB0cmFuc2l0aW9uOiAnYWxsIDNzJ1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9LFxuICAgIGdlb09wdGlvbnMgPSB7XG4gICAgICBlbmFibGVIaWdoQWNjdXJhY3k6IHRydWUsXG4gICAgICB0aW1lb3V0OiBJbmZpbml0eSxcbiAgICAgIG1heGltdW1BZ2U6IDBcbiAgICB9LFxuICAgIGdlb1dhdGNoID0gbmF2aWdhdG9yLmdlb2xvY2F0aW9uLndhdGNoUG9zaXRpb24oXG4gICAgICB3YXRjaFBvc2l0aW9uLFxuICAgICAgZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICAgIG5hdmlnYXRvci5nZW9sb2NhdGlvbi5jbGVhcldhdGNoKGdlb1dhdGNoKTtcbiAgICAgICAgZ2VvT3B0aW9ucy5lbmFibGVIaWdoQWNjdXJhY3kgPSBmYWxzZTtcbiAgICAgICAgZ2VvT3B0aW9ucy5tYXhpbXVtQWdlID0gSW5maW5pdHk7XG4gICAgICAgIGdlb1dhdGNoID0gbmF2aWdhdG9yLmdlb2xvY2F0aW9uLndhdGNoUG9zaXRpb24oXG4gICAgICAgICAgd2F0Y2hQb3NpdGlvbixcbiAgICAgICAgICBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgLy8gc29ja2V0LmVtaXQoJ2Vycm9yOmdlb2xvY2F0aW9uJywgZXJyb3IpO1xuICAgICAgICAgICAgLy8gd2hhdCBzaG91bGQgSSBkbyBoZXJlID9cbiAgICAgICAgICB9LFxuICAgICAgICAgIGdlb09wdGlvbnNcbiAgICAgICAgKTtcbiAgICAgIH0sXG4gICAgICBnZW9PcHRpb25zXG4gICAgKSxcbiAgICBzb2NrZXQgPSBpbygpLFxuICAgIHN0b3AgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgIHJldHVybiBlO1xuICAgIH0sXG4gICAgZHJhd0NpcmNsZSA9IGZ1bmN0aW9uIChjbGllbnRZLCBjbGllbnRYKSB7XG4gICAgICBkcm9wQ2lyY2xlKGNpcmNsZSk7XG4gICAgICBjaXJjbGUgPSBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NpcmNsZScpKTtcbiAgICAgIGNpcmNsZS5jbGFzc05hbWUgPSAnY2lyY2xlJztcbiAgICAgIGNpcmNsZS5zdHlsZS5jc3NUZXh0ID0gJycuY29uY2F0KFxuICAgICAgICAndG9wOicsIGNsaWVudFksICdweDsnLFxuICAgICAgICAnbGVmdDonLCBjbGllbnRYLCAncHg7J1xuICAgICAgKTtcbiAgICAgIGFuaW1hdGlvbi5vbihjaXJjbGUsICdlbmQnLCBjaXJjbGVTaG93aW5nQW5pbWF0aW9uRW5kLCAyNTApO1xuICAgICAgY2lyY2xlLmNsYXNzTmFtZSA9ICdjaXJjbGUgY2lyY2xlLXNob3dpbmcnO1xuICAgIH0sXG4gICAgdG91Y2hzdGFydCA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAvLyByZXF1ZXN0RnVsbFNjcmVlbigpO1xuICAgICAgaWYgKGNvb3Jkcykge1xuICAgICAgICBzd2l0Y2ggKHN0b3AoZSkudHlwZSkge1xuICAgICAgICAgIGNhc2UgJ21vdXNlZG93bic6XG4gICAgICAgICAgICBkcmF3Q2lyY2xlKGxhc3RZID0gZS5jbGllbnRZLCBsYXN0WCA9IGUuY2xpZW50WCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlICd0b3VjaHN0YXJ0JzpcbiAgICAgICAgICAgIGlmIChlLnRvdWNoZXMubGVuZ3RoID4gMSkgcmV0dXJuO1xuICAgICAgICAgICAgZHJhd0NpcmNsZShsYXN0WSA9IGUudG91Y2hlc1swXS5jbGllbnRZLCBsYXN0WCA9IGUudG91Y2hlc1swXS5jbGllbnRYKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgJ3BvaW50ZXJkb3duJzpcbiAgICAgICAgICAgIGRyYXdDaXJjbGUobGFzdFkgPSBlLmNsaWVudFksIGxhc3RYID0gZS5jbGllbnRYKTtcbiAgICAgICAgICAgIGRvY3VtZW50RWxlbWVudC5zZXRQb2ludGVyQ2FwdHVyZShlLnBvaW50ZXJJZCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlICdNU1BvaW50ZXJEb3duJzpcbiAgICAgICAgICAgIGRyYXdDaXJjbGUobGFzdFkgPSBlLmNsaWVudFksIGxhc3RYID0gZS5jbGllbnRYKTtcbiAgICAgICAgICAgIGRvY3VtZW50RWxlbWVudC5tc1NldFBvaW50ZXJDYXB0dXJlKGUucG9pbnRlcklkKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGVuZ2FnZWQgPSB0cnVlO1xuICAgICAgICBzb2NrZXQuZW1pdCgnZ2VvbG9jYXRpb246c3RhcnQnLCB7XG4gICAgICAgICAgbGF0aXR1ZGU6IGNvb3Jkcy5sYXRpdHVkZSxcbiAgICAgICAgICBsb25naXR1ZGU6IGNvb3Jkcy5sb25naXR1ZGUsXG4gICAgICAgICAgYWNjdXJhY3k6IGNvb3Jkcy5hY2N1cmFjeVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9LFxuICAgIHRvdWNobW92ZSA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICB2YXIgcG9pbnQ7XG4gICAgICBzd2l0Y2ggKHN0b3AoZSkudHlwZSkge1xuICAgICAgICBjYXNlICd0b3VjaG1vdmUnOlxuICAgICAgICAgIHBvaW50ID0gZS50b3VjaGVzWzBdO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHBvaW50ID0gZTtcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGlmIChjaXJjbGUpIHtcbiAgICAgICAgY2lyY2xlLnN0eWxlLnRvcCA9IChsYXN0WSA9IHBvaW50LmNsaWVudFkpICsgJ3B4JztcbiAgICAgICAgY2lyY2xlLnN0eWxlLmxlZnQgPSAobGFzdFggPSBwb2ludC5jbGllbnRYKSArICdweCc7XG4gICAgICB9XG4gICAgfSxcbiAgICB0b3VjaGVuZCA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICBpZiAoZW5nYWdlZCkge1xuICAgICAgICBzd2l0Y2ggKHN0b3AoZSkudHlwZSkge1xuICAgICAgICAgIGNhc2UgJ3RvdWNoZW5kJzpcbiAgICAgICAgICAgIGlmIChlLnRvdWNoZXMubGVuZ3RoKSByZXR1cm47XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlICdwb2ludGVyZG93bic6XG4gICAgICAgICAgICBkb2N1bWVudEVsZW1lbnQucmVsZWFzZVBvaW50ZXJDYXB0dXJlKGUucG9pbnRlcklkKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgJ01TUG9pbnRlckRvd24nOlxuICAgICAgICAgICAgZG9jdW1lbnRFbGVtZW50Lm1zUmVsZWFzZVBvaW50ZXJDYXB0dXJlKGUucG9pbnRlcklkKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGRyb3BDaXJjbGUoY2lyY2xlKTtcbiAgICAgICAgY2lyY2xlID0gbnVsbDtcbiAgICAgICAgc29ja2V0LmVtaXQoJ2dlb2xvY2F0aW9uOmVuZCcsIHtcbiAgICAgICAgICBsYXRpdHVkZTogY29vcmRzLmxhdGl0dWRlLFxuICAgICAgICAgIGxvbmdpdHVkZTogY29vcmRzLmxvbmdpdHVkZSxcbiAgICAgICAgICBhY2N1cmFjeTogY29vcmRzLmFjY3VyYWN5XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0sXG4gICAgZGV2aWNlUGl4ZWxSYXRpbyA9IHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvIHx8IDEsXG4gICAgcHJldmlvdXNseSA9IDAsXG4gICAgc3RyaWtlVGhlU3BoZXJlID0gMCxcbiAgICBibHVlSSA9IDAsXG4gICAgY3JlYXRvciA9IGZhbHNlLFxuICAgIGxhc3RTY29yZSxcbiAgICBsYXN0WCwgbGFzdFlcbiAgO1xuICByZXNldENhbnZhcyhkb2N1bWVudC5ib2R5Lm9mZnNldFdpZHRoLCBkb2N1bWVudC5ib2R5Lm9mZnNldEhlaWdodCk7XG4gIGZ1bmN0aW9uIHJlc2V0Q2FudmFzKHdpZHRoLCBoZWlnaHQpIHtcbiAgICBjYW52YXMud2lkdGggPSB3aWR0aDtcbiAgICBjYW52YXMuaGVpZ2h0ID0gaGVpZ2h0O1xuICB9XG4gIGZ1bmN0aW9uIHJlc2l6ZSgpIHtcbiAgICByZXNldENhbnZhcyhkb2N1bWVudC5ib2R5Lm9mZnNldFdpZHRoLCBkb2N1bWVudC5ib2R5Lm9mZnNldEhlaWdodCk7XG4gICAgc3R5bGUuc2NvcmUucmVwbGFjZSh7XG4gICAgICAnI3Njb3JlJzoge1xuICAgICAgICBsaW5lSGVpZ2h0OiBzY29yZS5vZmZzZXRIZWlnaHQsXG4gICAgICAgIGZvbnRTaXplOiBNYXRoLmZsb29yKHNjb3JlLm9mZnNldEhlaWdodCAvIDEuNSlcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuICBmdW5jdGlvbiByZXNldENsYXNzKGUpIHtcbiAgICBlLmN1cnJlbnRUYXJnZXQuY2xhc3NOYW1lID0gJyc7XG4gICAgYW5pbWF0aW9uLm9mZihlLmN1cnJlbnRUYXJnZXQsICdlbmQnLCByZXNldENsYXNzKTtcbiAgfVxuICBmdW5jdGlvbiBzYWV0dGEoKSB7XG4gICAgY29udGV4dC5jbGVhclJlY3QoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcbiAgICBpZiAoc3RyaWtlVGhlU3BoZXJlKSB7XG4gICAgICBjb250ZXh0LmJlZ2luUGF0aCgpO1xuICAgICAgaWYgKDAgPCBzdHJpa2VUaGVTcGhlcmUpIHtcbiAgICAgICAgbGlnaHRuaW5nKFxuICAgICAgICAgIGNvbnRleHQsXG4gICAgICAgICAgY2FudmFzLndpZHRoIC8gMiwgMCxcbiAgICAgICAgICBsYXN0WCwgbGFzdFkgLSA1MCxcbiAgICAgICAgICBjb250ZXh0LmxpbmVXaWR0aCA9IDIgKiBzdHJpa2VUaGVTcGhlcmUsXG4gICAgICAgICAgMTAsXG4gICAgICAgICAgM1xuICAgICAgICApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbGlnaHRuaW5nKFxuICAgICAgICAgIGNvbnRleHQsXG4gICAgICAgICAgbGFzdFgsIGxhc3RZIC0gNTAsXG4gICAgICAgICAgY2FudmFzLndpZHRoIC8gMiwgLTEwLFxuICAgICAgICAgIGNvbnRleHQubGluZVdpZHRoID0gMTAsXG4gICAgICAgICAgMjAsXG4gICAgICAgICAgNVxuICAgICAgICApO1xuICAgICAgfVxuICAgICAgLy8gY29udGV4dC5maWxsU3R5bGUgPSAncmdiKCcgKyAoYmx1ZUkgJSAyNTUpICsgJywnICsgKGJsdWVJICUgMjU1KSArICcsJyArICgxMDAgKyAoYmx1ZUkgJSAxNTApKSArICcpJztcbiAgICAgIC8vIGlmICgrK2JsdWVJIDwgMCkgYmx1ZUkgPSAwO1xuICAgICAgY29udGV4dC5maWxsU3R5bGUgPSBjb250ZXh0LnN0cm9rZVN0eWxlID0gJ3JnYigyMjEsMjIxLDIyMSknO1xuICAgICAgY29udGV4dC5maWxsKCk7XG4gICAgICBjb250ZXh0LnN0cm9rZSgpO1xuICAgICAgY29udGV4dC5jbG9zZVBhdGgoKTtcbiAgICAgIHJBRihzYWV0dGEpO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBkZXZpY2VvcmllbnRhdGlvbihlKSB7XG4gICAgdmFyIGFjYyA9IGUuYWNjZWxlcmF0aW9uO1xuICAgIGRvY3VtZW50LmJvZHkuc3R5bGUuYmFja2dyb3VuZFBvc2l0aW9uID0gKC1lLmdhbW1hKSArICdweCAnICsgKC1lLmJldGEpICsgJ3B4JztcbiAgfVxuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgcmVzaXplLCBmYWxzZSk7XG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdvcmllbnRhdGlvbmNoYW5nZScsIHJlc2l6ZSwgZmFsc2UpO1xuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignZGV2aWNlb3JpZW50YXRpb24nLCBkZXZpY2VvcmllbnRhdGlvbiwgZmFsc2UpO1xuICBkb2N1bWVudEVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignY29udGV4dG1lbnUnLCBzdG9wLCB0cnVlKTtcbiAgZG9jdW1lbnRFbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3NlbGVjdHN0YXJ0Jywgc3RvcCwgdHJ1ZSk7XG4gIGlmIChwb2ludGVyRW5hYmxlZCB8fCBuYXZpZ2F0b3IubXNQb2ludGVyRW5hYmxlZCkge1xuICAgIGRvY3VtZW50RWxlbWVudC5hZGRFdmVudExpc3RlbmVyKHBvaW50ZXJFbmFibGVkID8gJ3BvaW50ZXJkb3duJyA6ICdNU1BvaW50ZXJEb3duJywgdG91Y2hzdGFydCwgdHJ1ZSk7XG4gICAgZG9jdW1lbnRFbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIocG9pbnRlckVuYWJsZWQgPyAncG9pbnRlcm1vdmUnIDogJ01TUG9pbnRlck1vdmUnLCB0b3VjaG1vdmUsIHRydWUpO1xuICAgIGRvY3VtZW50RWxlbWVudC5hZGRFdmVudExpc3RlbmVyKHBvaW50ZXJFbmFibGVkID8gJ3BvaW50ZXJ1cCcgOiAnTVNQb2ludGVyVXAnLCB0b3VjaGVuZCwgdHJ1ZSk7XG4gIH0gZWxzZSB7XG4gICAgZG9jdW1lbnRFbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0b3VjaHN0YXJ0LCB0cnVlKTtcbiAgICBkb2N1bWVudEVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgdG91Y2htb3ZlLCB0cnVlKTtcbiAgICBkb2N1bWVudEVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCB0b3VjaGVuZCwgdHJ1ZSk7XG4gICAgZG9jdW1lbnRFbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRvdWNoc3RhcnQsIHRydWUpO1xuICAgIGRvY3VtZW50RWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCB0b3VjaG1vdmUsIHRydWUpO1xuICAgIGRvY3VtZW50RWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgdG91Y2hlbmQsIHRydWUpO1xuICB9XG4gIGRldGFpbHMudGV4dENvbnRlbnQgPSAnY29sbGVjdGluZyBnZW9sb2NhdGlvbiBkYXRhJztcbiAgc29ja2V0Lm9uKCdiYXJhb25kYTpjcmVhdGVkJywgZnVuY3Rpb24gKG1hbnkpIHtcbiAgICBjcmVhdG9yID0gdHJ1ZTtcbiAgICBkZXRhaWxzLnRleHRDb250ZW50ID0gbWFueSA/XG4gICAgICAnY29sbGVjdGluZyBlbmVyZ3knIDpcbiAgICAgICd3YWl0aW5nJztcbiAgICBzY29yZS50ZXh0Q29udGVudCA9IG1hbnkgfHwgJyc7XG4gICAgaWYgKG1hbnkgIT09IHByZXZpb3VzbHkpIHtcbiAgICAgIHZpYnJhdGUoMTAwKTtcbiAgICAgIGFuaW1hdGlvbi5vbihkb2N1bWVudC5ib2R5LCAnZW5kJywgcmVzZXRDbGFzcywgMzUwKTtcbiAgICAgIGlmIChtYW55ID4gcHJldmlvdXNseSkge1xuICAgICAgICBkb2N1bWVudC5ib2R5LmNsYXNzTmFtZSA9ICdibHVlJztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGRvY3VtZW50LmJvZHkuY2xhc3NOYW1lID0gJ3JlZCc7XG4gICAgICB9XG4gICAgICBwcmV2aW91c2x5ID0gbWFueTtcbiAgICAgIHN0cmlrZVRoZVNwaGVyZSA9IG1hbnk7XG4gICAgICBpZiAoc3RyaWtlVGhlU3BoZXJlKSB7XG4gICAgICAgIHJBRihzYWV0dGEpO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG4gIHNvY2tldC5vbignYmFyYW9uZGE6am9pbmVkJywgZnVuY3Rpb24gKG1hbnkpIHtcbiAgICBkZXRhaWxzLnRleHRDb250ZW50ID0gJ2VuZ2FnZWQnO1xuICAgIHNjb3JlLnRleHRDb250ZW50ID0gbWFueTtcbiAgICBpZiAobWFueSAhPT0gcHJldmlvdXNseSkge1xuICAgICAgaWYgKG1hbnkgPiBwcmV2aW91c2x5KSB7XG4gICAgICAgIGlmICghcHJldmlvdXNseSkge1xuICAgICAgICAgIGFuaW1hdGlvbi5vbihkZXRhaWxzLCAnZW5kJywgcmVzZXRDbGFzcywgMzUwKTtcbiAgICAgICAgICBkZXRhaWxzLmNsYXNzTmFtZSA9ICdibHVlLWhpZ2hsaWdodCc7XG4gICAgICAgIH1cbiAgICAgICAgYW5pbWF0aW9uLm9uKGNpcmNsZSwgJ2VuZCcsIGNpcmNsZUdyb3dlZEFuaW1hdGlvbkVuZCwgNTAwKTtcbiAgICAgICAgY2lyY2xlLmNsYXNzTmFtZSA9ICdjaXJjbGUgY2lyY2xlLXNob3dlZCBjaXJjbGUtZ3Jvd2luZyc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhbmltYXRpb24ub24oZG9jdW1lbnQuYm9keSwgJ2VuZCcsIHJlc2V0Q2xhc3MsIDM1MCk7XG4gICAgICAgIGRvY3VtZW50LmJvZHkuY2xhc3NOYW1lID0gJ3JlZCc7XG4gICAgICB9XG4gICAgICBwcmV2aW91c2x5ID0gbWFueTtcbiAgICB9XG4gICAgaWYgKCFzdHJpa2VUaGVTcGhlcmUpIHtcbiAgICAgIHZpYnJhdGUoMTAwKTtcbiAgICB9XG4gICAgc3RyaWtlVGhlU3BoZXJlID0gLTE7XG4gICAgckFGKHNhZXR0YSk7XG4gIH0pO1xuICBzb2NrZXQub24oJ2JhcmFvbmRhOmZpbmlzaGVkJywgZnVuY3Rpb24gKG1hbnkpIHtcbiAgICBkZXRhaWxzLnRleHRDb250ZW50ID0gJ21pc3Npb24gY29tcGxldGVkJztcbiAgICBzY29yZS50ZXh0Q29udGVudCA9IG1hbnk7XG4gICAgcHJldmlvdXNseSA9IDA7XG4gICAgZHJvcENpcmNsZShjaXJjbGUpO1xuICAgIGNpcmNsZSA9IG51bGw7XG4gICAgc3RyaWtlVGhlU3BoZXJlID0gMDtcbiAgICBhbmltYXRpb24ub24oZGV0YWlscywgJ2VuZCcsIHJlc2V0Q2xhc3MsIDM1MCk7XG4gICAgZGV0YWlscy5jbGFzc05hbWUgPSAnYmx1ZS1oaWdobGlnaHQnO1xuICAgIGFuaW1hdGlvbi5vbihkb2N1bWVudC5ib2R5LCAnZW5kJywgcmVzZXRDbGFzcywgMzUwKTtcbiAgICBkb2N1bWVudC5ib2R5LmNsYXNzTmFtZSA9ICdibHVlJztcbiAgICBhbmltYXRpb24ub24oc2NvcmUsICdlbmQnLCByZXNldENsYXNzLCA5MDApO1xuICAgIHNjb3JlLmNsYXNzTmFtZSA9ICdoaWdobGlnaHQnO1xuICAgIHZpYnJhdGUoMjUwKTtcbiAgfSk7XG4gIHNvY2tldC5vbignYmFyYW9uZGE6dGVybWluYXRlZCcsIGZ1bmN0aW9uIChtYW55KSB7XG4gICAgY3JlYXRvciA9IGZhbHNlO1xuICAgIGRldGFpbHMudGV4dENvbnRlbnQgPSBtYW55ID8gJ3Njb3JlZCcgOiAnZmFpbGVkJztcbiAgICBzY29yZS50ZXh0Q29udGVudCA9IG1hbnk7XG4gICAgcHJldmlvdXNseSA9IDA7XG4gICAgc3RyaWtlVGhlU3BoZXJlID0gMDtcbiAgICBhbmltYXRpb24ub24oc2NvcmUsICdlbmQnLCByZXNldENsYXNzLCA2MDApO1xuICAgIHNjb3JlLmNsYXNzTmFtZSA9ICdoaWdobGlnaHQnO1xuICAgIGlmIChtYW55KSB7XG4gICAgICBsYXN0U2NvcmUgPSB7XG4gICAgICAgIGxhdGl0dWRlOiBjb29yZHMubGF0aXR1ZGUsXG4gICAgICAgIGxvbmdpdHVkZTogY29vcmRzLmxvbmdpdHVkZSxcbiAgICAgICAgYWNjdXJhY3k6IGNvb3Jkcy5hY2N1cmFjeSxcbiAgICAgICAgc2NvcmU6IG1hbnksXG4gICAgICAgIGRhdGU6IERhdGUubm93KClcbiAgICAgIH07XG4gICAgICBpZiAocGFyc2VJbnQobG9jYWxTdG9yYWdlLmdldEl0ZW0oJ2hpLXNjb3JlJykgfHwgJzAnLCAxMCkgPCBtYW55KSB7XG4gICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdoaS1zY29yZScsIG1hbnkpO1xuICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnaGktc2NvcmUtZGV0YWlscycsIEpTT04uc3RyaW5naWZ5KGxhc3RTY29yZSkpO1xuICAgICAgICB2aWJyYXRlKDUwMCk7XG4gICAgICAgIGhpU2NvcmUudGV4dENvbnRlbnQgPSBtYW55O1xuICAgICAgICBhbmltYXRpb24ub24oaGlTY29yZSwgJ2VuZCcsIHJlc2V0Q2xhc3MsIDkwMCk7XG4gICAgICAgIGhpU2NvcmUuY2xhc3NOYW1lID0gJ2hpZ2hsaWdodCc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2aWJyYXRlKDEwMCk7XG4gICAgICB9XG4gICAgfVxuICB9KTtcbiAgc29ja2V0Lm9uKCdiYXJhb25kYTpsZWZ0JywgZnVuY3Rpb24gKG1hbnkpIHtcbiAgICBkZXRhaWxzLnRleHRDb250ZW50ID0gJ3Jldm9rZWQnO1xuICAgIHNjb3JlLnRleHRDb250ZW50ID0gbWFueTtcbiAgICBwcmV2aW91c2x5ID0gMDtcbiAgICBzdHJpa2VUaGVTcGhlcmUgPSAwO1xuICAgIGFuaW1hdGlvbi5vbihkZXRhaWxzLCAnZW5kJywgcmVzZXRDbGFzcywgMzUwKTtcbiAgICBkZXRhaWxzLmNsYXNzTmFtZSA9ICdyZWQtaGlnaGxpZ2h0JztcbiAgICB2aWJyYXRlKDEwMCk7XG4gIH0pO1xuICBzb2NrZXQub24oJ2JhcmFvbmRhOnNvbWVib2R5JywgZnVuY3Rpb24gKHdhaXRpbmcpIHtcbiAgICBpZiAoIXByZXZpb3VzbHkgJiYgY3JlYXRvcikge1xuICAgICAgZGV0YWlscy50ZXh0Q29udGVudCA9ICd3YXRjaCBvdXQnO1xuICAgICAgYW5pbWF0aW9uLm9uKGRldGFpbHMsICdlbmQnLCByZXNldENsYXNzLCAzNTApO1xuICAgICAgZGV0YWlscy5jbGFzc05hbWUgPSAnYmx1ZS1oaWdobGlnaHQnO1xuICAgIH1cbiAgfSk7XG4gIHNvY2tldC5vbignYmFyYW9uZGE6am9pbicsIGZ1bmN0aW9uICh3YWl0aW5nKSB7XG4gICAgaWYgKHdhaXRpbmcgJiYgIXN0cmlrZVRoZVNwaGVyZSkge1xuICAgICAgZGV0YWlscy50ZXh0Q29udGVudCA9ICdzb21lYm9keSBpcyB3YWl0aW5nJztcbiAgICAgIGFuaW1hdGlvbi5vbihkZXRhaWxzLCAnZW5kJywgcmVzZXRDbGFzcywgMzUwKTtcbiAgICAgIGRldGFpbHMuY2xhc3NOYW1lID0gJ2JsdWUtaGlnaGxpZ2h0JztcbiAgICB9XG4gIH0pO1xuICBzb2NrZXQub24oJ2Nvbm5lY3QnLCBmdW5jdGlvbihzb2NrZXQpe1xuICAgIGRldGFpbHMudGV4dENvbnRlbnQgPSBjb29yZHMgPyAncmVhZHknIDogJ2xvY2F0aW5nJztcbiAgICBhbmltYXRpb24ub24oZGV0YWlscywgJ2VuZCcsIHJlc2V0Q2xhc3MsIDM1MCk7XG4gICAgZGV0YWlscy5jbGFzc05hbWUgPSAnYmx1ZS1oaWdobGlnaHQnO1xuICAgIHByZXZpb3VzbHkgPSAwO1xuICB9KTtcbiAgc29ja2V0Lm9uKCdkaXNjb25uZWN0JywgZnVuY3Rpb24oc29ja2V0KXtcbiAgICBkZXRhaWxzLnRleHRDb250ZW50ID0gJ2xpbWJvJztcbiAgICBzY29yZS50ZXh0Q29udGVudCA9ICc/JztcbiAgICBwcmV2aW91c2x5ID0gMDtcbiAgICBzdHJpa2VUaGVTcGhlcmUgPSAwO1xuICAgIGFuaW1hdGlvbi5vbihkZXRhaWxzLCAnZW5kJywgcmVzZXRDbGFzcywgMzUwKTtcbiAgICBkZXRhaWxzLmNsYXNzTmFtZSA9ICdyZWQtaGlnaGxpZ2h0JztcbiAgfSk7XG4gIGhpU2NvcmUudGV4dENvbnRlbnQgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnaGktc2NvcmUnKSB8fCAnJztcbn1cblxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcbiAgJ0RPTUNvbnRlbnRMb2FkZWQnLFxuICByZWFkeSxcbiAgZmFsc2Vcbik7Il19
