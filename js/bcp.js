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
  [g.input.red, g.input.blue, g.input.green].forEach(function (input) {
    input.oninput = g.makeInputHandler(input);
  });
};

window.onload = BigColorPicker.load;
