var ColorPicker = (function () {
  var containers,
      colorInput,
      colorOutputs;

  function setColor(color) {
  }

  function Color(r, g, b) {
    this.r = r;
    this.g = g;
    this.b = b;
  }
  Color.prototype.toString = function(kind) {
  };

  function parseColor(s) {
    var groups;
    s = s.replace(/\s+/g, '');
    // Hex value.
    groups = s.match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (groups !== null) {
      console.log('hex color "' + groups[1] + '"');
    }
  }

  function handleColorInput() {
    var color = parseColor(colorInput.value);
    if (color !== null) {
      setColor(color);
    } else {
      console.log('invalid color "' + s + '"');
    }
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
