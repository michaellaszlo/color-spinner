var BigColorPicker = {
  scale: 2
};

BigColorPicker.makeInputHandler = function (input) {
  var pattern = /^[0-9a-f]{0,6}$/i;
  return function () {
    var value = input.previousValue;
    if (value === undefined) {
      value = input.previousValue = '';
    }
    if (!pattern.test(input.value)) {
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
  ['red', 'blue', 'green'].forEach(function (color) {
    var input = g.input[color];
    input.oninput = g.makeInputHandler(input);
    var canvas = g.ring[color];
    canvas.width = canvas.height = 100;
    canvas.style.left = canvas.offsetLeft + canvas.offsetWidth/2 -
        input.offsetWidth/2 + 'px';
    canvas.style.top = canvas.offsetTop + canvas.offsetTop/2 -
        input.offsetTop/2 + 'px';
  });
};

window.onload = BigColorPicker.load;
