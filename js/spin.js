var ColorPicker = (function () {
  var containers,
      colorInput,
      colorOutputs;

  function setColor(color) {
  }

  function parseColorInput() {
    var s = colorInput.value.replace(/\s+/g, '');
    console.log('s = "' + s + '"');
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
    M.listen(colorInput, parseColorInput, 'keydown', 'keyup',
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
