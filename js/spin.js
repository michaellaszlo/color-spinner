var ColorPicker = (function () {
  var containers = {};

  function load(wrapper) {
    containers.wrapper = wrapper;
    containers.macroHex = M.make('div', { 'parent': wrapper });
  }
  
  return {
    load: load
  };
})();

onload = ColorPicker.load(document.getElementById('wrapper'));
