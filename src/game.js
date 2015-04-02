var
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
    goodEnough = hasRAF || /\biP(?:ad|od|hone)\b/.test(navigator.userAgent),
    commonCircleAnimationEndClass = 'circle circle-showed' + (goodEnough ? ' glow' : ''),
    circleDisappearingAnimationEnd = function (e) {
      var circle = stop(e).currentTarget;
      circle.parentNode.removeChild(circle);
    },
    circleCommonAnimationEnd = function (e) {
      var circle = stop(e).currentTarget;
      circle.className = commonCircleAnimationEndClass;
      if (glowAfterDraw) {
        glowAfterDraw = false;
        circleNextAnimation();
      }
    },
    circleNextAnimation = function () {
      if (circle && circle.className === commonCircleAnimationEndClass) {
        circle.className = 'circle circle-showed circle-growing';
        style.circle.animate(circle, 'circle-growing', circleCommonAnimationEnd);
      } else {
        glowAfterDraw = true;
      }
    },
    dropCircle = function (circle) {
      function remove() {
        if (circle.parentNode) {
          circle.parentNode.removeChild(circle);
        }
      }
      if (!circle) return;
      if (goodEnough) {
        circle.className = 'circle circle-disappearing';
        style.circle.animate(circle, 'circle-disappearing', circleDisappearingAnimationEnd);
        setTimeout(remove, style.circle.getAnimationDuration(circle, 'circle-disappearing'));
      } else {
        remove();
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
      if (goodEnough) {
        circle.className = 'circle circle-showing';
        style.circle.animate(circle, 'circle-showing', circleCommonAnimationEnd);
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
        lightning.sound.pause();
      }
    },
    devicePixelRatio = window.devicePixelRatio || 1,
    previously = 0,
    strikeTheSphere = 0,
    blueI = 0,
    backgroundPosition = 0,
    creator = false,
    glowAfterDraw = false,
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
      if (!glowAfterDraw) {
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
      }
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
      if (many > previously) {
        body.className = 'blue';
      } else {
        body.className = 'red';
      }
      style.animations.animate(body, body.className, resetClass);
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
          details.className = 'blue-highlight';
          style.animations.animate(details, details.className, resetClass);
        }
        circleNextAnimation();
      } else {
        body.className = 'red';
        style.animations.animate(body, 'red', resetClass);
      }
      previously = many;
    }
    strikeTheSphere = -1;
    vibrate(100);
    rAF(saetta);
    lightning.sound.play();
  });
  socket.on('baraonda:finished', function (many) {
    details.textContent = 'mission completed';
    score.textContent = many;
    previously = 0;
    dropCircle(circle);
    circle = null;
    strikeTheSphere = 0;
    body.className = 'blue';
    score.className = 'highlight';
    details.className = 'blue-highlight';
    style.animations.animate(body, 'blue', resetClass);
    style.animations.animate(score, 'highlight', resetClass);
    style.animations.animate(details, 'blue-highlight', resetClass);
    vibrate(250);
    lightning.sound.pause();
  });
  socket.on('baraonda:terminated', function (many) {
    creator = false;
    details.textContent = many ? 'scored' : 'failed';
    score.textContent = many;
    previously = 0;
    strikeTheSphere = 0;
    score.className = 'highlight';
    style.animations.animate(score, 'highlight', resetClass);
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
        hiScore.className = 'highlight';
        style.animations.animate(hiScore, 'highlight', resetClass);
      } else {
        vibrate(100);
      }
    }
    lightning.sound.pause();
  });
  socket.on('baraonda:left', function (many) {
    details.textContent = 'revoked';
    score.textContent = many;
    previously = 0;
    strikeTheSphere = 0;
    details.className = 'red-highlight';
    style.animations.animate(details, 'red-highlight', resetClass);
    vibrate(100);
  });
  socket.on('baraonda:somebody', function (waiting) {
    if (!previously && creator) {
      details.textContent = 'watch out';
      details.className = 'blue-highlight';
      style.animations.animate(details, 'blue-highlight', resetClass);
    }
  });
  socket.on('baraonda:join', function (waiting) {
    if (waiting && !strikeTheSphere) {
      details.textContent = 'somebody is waiting';
      details.className = 'blue-highlight';
      style.animations.animate(details, 'blue-highlight', resetClass);
    }
  });
  socket.on('connect', function(socket){
    details.textContent = coords ? 'ready' : 'locating';
    details.className = 'blue-highlight';
    style.animations.animate(details, 'blue-highlight', resetClass);
    previously = 0;
  });
  socket.on('disconnect', function(socket){
    details.textContent = 'limbo';
    score.textContent = '?';
    previously = 0;
    strikeTheSphere = 0;
    details.className = 'red-highlight';
    style.animations.animate(details, 'red-highlight', resetClass);
  });
  hiScore.textContent = localStorage.getItem('hi-score') || '';

  if (hasRAF) {
    window.addEventListener('deviceorientation', verifyDeviceOrientation, false);
  } else if (!goodEnough) {
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
