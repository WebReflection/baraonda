var
  remove = function () {
    this.parentNode.removeChild(this);
  },
  counter = 0
;

module.exports = function nominatim(info, callback) {

  var
    de = document.documentElement,
    cb = '_nominatim' + Math.abs(counter++),
    qs = '//nominatim.openstreetmap.org/reverse?' +
         'addressdetails=1&format=json&json_callback=' + cb,
    script = document.createElement('script')
  ;

  qs += '&lat=' + info[0] +
        '&lon=' + info[1] +
        '&zoom=' + (info[2] || '10');

  window[cb] = callback;

  script.onerror = script.onload = remove;
  script.type = 'application/javascript';
  script.src = qs;

  de.insertBefore(script, de.lastChild);

};