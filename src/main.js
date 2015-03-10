var
  animation = require('./animation'),
  jsStyle = require('./js-style'),
  lightning = require('./lightning'),
  io = require('socket.io-client')
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
    socket = io('http://localhost:5000'),
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