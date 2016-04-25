var ColorPicker = (function () {
  var containers,
      colorInput,
      colorOutputs;

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
