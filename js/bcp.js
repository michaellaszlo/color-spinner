var BigColorPicker = {
  scale: 2
};

BigColorPicker.makeInputHandler = function (input) {
  var pattern = /^[0-9]{0,3}$/i;
  return function () {
    var value = input.previousValue;
    if (value === undefined) {
      value = input.previousValue = '';
    }
    if (!pattern.test(input.value) || input.value > 255) {
      input.value = input.previousValue;
    } else {
      input.previousValue = input.value;
    }
  };
};

BigColorPicker.load = function () {
  var g = BigColorPicker;
  M.make('div', { id: 'wrapper', into: document.body });
  g.input = {
    container: M.make('div', { id: 'controls', into: wrapper }),
    red: M.make('input', { id: 'red', into: controls }),
    blue: M.make('input', { id: 'blue', into: controls }),
    green: M.make('input', { id: 'green', into: controls })
  };
  g.ring = {
    red: M.make('canvas', { id: 'redRing', into: controls }),
    blue: M.make('canvas', { id: 'blueRing', into: controls }),
    green: M.make('canvas', { id: 'greenRing', into: controls })
  };
  ['red', 'blue', 'green'].forEach(function (color, ix, array) {
    // Position the input box.
    var input = g.input[color];
    input.oninput = g.makeInputHandler(input);
    if (ix != array.length-1) {
      input.style.marginRight = 150 + 'px';
    }
    // Position the canvas.
    var canvas = g.ring[color];
    canvas.width = canvas.height = 240;
    canvas.style.left = input.offsetLeft + input.offsetWidth/2 -
        canvas.offsetWidth/2 + 'px';
    canvas.style.top = input.offsetTop + input.offsetHeight/2 -
        canvas.offsetHeight/2 + 'px';
    // Draw the ring.
    var context = canvas.getContext('2d'),
        x = canvas.width/2,
        y = canvas.height/2,
        numSegments = 256,
        increment = Math.PI*2/numSegments;
    context.lineWidth = 30;
    for (var i = 0; i < numSegments; ++i) {
      context.beginPath();
      var parts = ['#', '00', '00', '00'];
      var hex = (numSegments-1-i).toString(16);
      if (hex.length == 1) {
        hex = '0'+hex;
      }
      parts[ix+1] = hex;
      context.strokeStyle = parts.join('');
      var startAngle = -Math.PI/2 + i*increment,
          endAngle = startAngle + (i == numSegments-1 ? 1 : 2) * increment;
      context.arc(x, y, 85, startAngle, endAngle);
      context.stroke();
    }
  });
};

window.onload = BigColorPicker.load;
