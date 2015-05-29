var BigColorPicker = {
  scale: 2
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
};

window.onload = BigColorPicker.load;
