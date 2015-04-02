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

try {
  lightning.sound = new Audio();
  switch (true) {
    case /probably/.test(lightning.sound.canPlayType('audio/ogg; codecs="vorbis"')):
      lightning.sound.load('lightning.ogg');
      break;
    case /probably|maybe/.test(lightning.sound.canPlayType('audio/mp3')):
      lightning.sound.load('lightning.mp3');
      break;
    default:
      lightning.sound.load('lightning.wav');
      break;
  }
} catch(e) {
  lightning.sound = {load: Object, pause: Object, play: Object};
}

module.exports = lightning;