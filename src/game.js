var
  animation = require('./animation'),
  gameStyle = require('./game-style'),
  lightning = require('./lightning'),
  rAF = require('./raf'),
  io = require('socket.io-client')
;
function ready() {'use strict';
  var
    circle,
    coords,
    engaged = false,
    M = Math,
    min = M.min,
    round = M.round,
    floor = M.floor,
    sqrt = M.sqrt,
    pow = M.pow,
    vibrate = "vibrate" in navigator ?
      function (howMuch) {
        navigator.vibrate(howMuch);
      } :
      Number,
    body = document.body,
    hiScore = document.querySelector('#hi-score'),
    canvas = document.querySelector('#canvas'),
    context = canvas.getContext('2d'),
    details = document.querySelector('#details'),
    score = document.querySelector('#score'),
    style = gameStyle(),
    documentElement = document.documentElement,
    pointerEnabled = navigator.pointerEnabled,
    hasRAF = !rAF.isFallback,
    commonCircleAnimationEndClass = 'circle circle-showed' + (hasRAF ? ' glow' : ''),
    circleDisappearingAnimationEnd = function (e) {
      var circle = e.currentTarget;
      circle.parentNode.removeChild(circle);
      animation.off(circle, 'end', circleDisappearingAnimationEnd);
    },
    circleGrowedAnimationEnd = function (e) {
      var circle = e.currentTarget;
      circle.className = commonCircleAnimationEndClass;
      animation.off(circle, 'end', circleGrowedAnimationEnd);
    },
    circleShowingAnimationEnd = function (e) {
      var circle = e.currentTarget;
      circle.className = commonCircleAnimationEndClass;
      animation.off(circle, 'end', circleShowingAnimationEnd);
    },
    dropCircle = function (circle) {
      if (!circle) return;
      if (hasRAF) {
        animation.on(circle, 'end', circleDisappearingAnimationEnd, 250);
        circle.className = 'circle circle-disappearing';
      } else {
        circle.parentNode.removeChild(circle);
      }
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
        accuracy = min(coords.accuracy, 150),
        width = ((body.offsetWidth - 16) * accuracy) / 150
      ;
      style.accuracy.replace({
        '#accuracy': {
          width: width,
          marginLeft: -round(width / 2),
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
      circle = body.appendChild(document.createElement('circle'));
      circle.className = 'circle';
      circle.style.cssText = ''.concat(
        'top:', clientY, 'px;',
        'left:', clientX, 'px;'
      );
      if (hasRAF) {
        animation.on(circle, 'end', circleShowingAnimationEnd, 250);
        circle.className = 'circle circle-showing';
      } else {
        circle.className = commonCircleAnimationEndClass;
      }
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
    batchedMove = function () {
      if (circle) {
        circle.style.left = lastX + 'px';
        circle.style.top = lastY + 'px';
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
        lastX = point.clientX;
        lastY = point.clientY;
        rAF(batchedMove);
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
    backgroundPosition = 0,
    creator = false,
    lastScore,
    lastX, lastY,
    lastGamma, lastBeta
  ;
  resetCanvas(body.offsetWidth, body.offsetHeight);
  function resetCanvas(width, height) {
    canvas.width = width;
    canvas.height = height;
  }
  function resize() {
    resetCanvas(body.offsetWidth, body.offsetHeight);
    style.score.replace({
      '#score': {
        lineHeight: score.offsetHeight,
        fontSize: floor(score.offsetHeight / 1.5)
      }
    });
  }
  function resetClass(e) {
    e.currentTarget.className = '';
    animation.off(e.currentTarget, 'end', resetClass);
  }
  function saetta() {
    var
      half = canvas.width / 2,
      hypo = sqrt(
        pow(lastX - half, 2) +
        (lastY * lastY)
      ),
      k2 = 50,
      k1 = hypo - k2,
      newX = (k1 * lastX + k2 * half) / (k1 + k2),
      newY = (k1 * lastY) / (k1 + k2)
    ;
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (strikeTheSphere) {
      context.beginPath();
      if (0 < strikeTheSphere) {
        lightning(
          context,
          half, 0,
          newX, newY,
          context.lineWidth = min(1000, 2 * strikeTheSphere),
          10,
          3
        );
      } else {
        lightning(
          context,
          newX, newY,
          half, -10,
          context.lineWidth = 10,
          20,
          5
        );
      }
      context.fillStyle = context.strokeStyle = 'rgb(221,221,221)';
      context.fill();
      context.stroke();
      context.closePath();
      rAF(saetta);
    }
  }
  function repositionBodyBackground() {
    body.style.backgroundPosition =
        (backgroundPosition - lastGamma) + 'px ' + (backgroundPosition - lastBeta) + 'px';
  }
  function verifyDeviceOrientation(e) {
    var target = e.currentTarget;
    target.removeEventListener(e.type, verifyDeviceOrientation, false);
    if (e.gamma && e.beta) {
      body.style.backgroundImage = 'url(/img/dark-sky.png)';
      target.addEventListener(e.type, deviceorientation, false);
    }
  }
  function deviceorientation(e) {
    lastGamma = e.gamma;
    lastBeta = e.beta;
    rAF(repositionBodyBackground);
  }
  /*
  function updateBackgroundPosition() {
    backgroundPosition++;
    body.style.backgroundPosition =
      (backgroundPosition) + 'px ' + (backgroundPosition) + 'px';
  }
  */
  window.addEventListener('resize', resize, false);
  window.addEventListener('orientationchange', resize, false);
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
  details.textContent = 'collecting geo data';
  socket.on('baraonda:created', function (many) {
    creator = true;
    details.textContent = many ?
      'collecting energy' :
      'waiting';
    score.textContent = many || '';
    if (many !== previously) {
      vibrate(100);
      animation.on(body, 'end', resetClass, 350);
      if (many > previously) {
        body.className = 'blue';
      } else {
        body.className = 'red';
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
        animation.on(body, 'end', resetClass, 350);
        body.className = 'red';
      }
      previously = many;
    }
    strikeTheSphere = -1;
    vibrate(100);
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
    animation.on(body, 'end', resetClass, 350);
    body.className = 'blue';
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

  if (hasRAF || /\biP(?:ad|od|hone)\b/.test(navigator.userAgent)) {
    window.addEventListener('deviceorientation', verifyDeviceOrientation, false);
  } else {
    // try to optimize for older browsers
    style.circle.replace({
      '.circle': {
        position: 'fixed',
        margin: { top: 0, left: 0 },
        width: 0,
        height: 0,
        backgroundColor: '#DDD'
      },
      '.circle-showed': {
        width: 100,
        height: 100,
        margin: {
          top: -51,
          left: -51
        }
      }
    });
  }
}

module.exports = ready;
