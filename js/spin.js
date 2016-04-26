var ColorPicker = (function () {
  var containers,
      colorInput,
      colorOutputs;

  function setColor(color) {
    console.log(JSON.stringify(color));
  }

  function Color(r, g, b) {
    // Each color component is stored as an 8-bit integer.
    this.r = r;
    this.g = g;
    this.b = b;
  }

  function parseColor(s) {
    var groups,
        i, x,
        rgb = [];
    s = s.replace(/\s+/g, '');
    // Hex value.
    groups = s.match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (groups !== null) {
      s = groups[1];
      if (s.length == 3) {
        for (i = 0; i < 3; ++i) {
          x = parseInt(s.charAt(i), 16);
          rgb.push(16 * x + x);
        }
      } else {
        for (i = 0; i < 3; ++i) {
          rgb.push(parseInt(s.substring(2 * i, 2 * i + 2), 16));
        }
      }
      return new Color(rgb[0], rgb[1], rgb[2]);
    }
    return null;
  }

  function handleColorInput() {
    var color = parseColor(colorInput.value);
    if (color === null) {
      return;
    }
    setColor(color);
  }

  function load(wrapper) {
    containers = {};
    containers.wrapper = wrapper;
    [ 'macroHex', 'microHex', 'vlBar', 'namePanel' ].forEach(function (name) {
      containers[name] = M.make('div', { parent: wrapper, id: name });
    });
    // macroHex
    // microHex
    // vlBar
    // namePanel
    colorInput = M.make('input', { parent: containers.namePanel });
    M.listen(colorInput, handleColorInput, 'keydown', 'keyup',
        'mousedown', 'mouseup');
    containers.colorOutputs = M.make('div', { parent: containers.namePanel });
    colorOutputs = {};
    colorOutputs.hex = M.make('div', { parent: containers.colorOutputs });
    colorOutputs.rgb256 = M.make('div', { parent: containers.colorOutputs });
  }
  
  return {
    load: load
  };
})();

onload = function () {
  ColorPicker.load(document.getElementById('wrapper'));
}
