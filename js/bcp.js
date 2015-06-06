var BigColorPicker = {
  scale: 2
};

BigColorPicker.makeInputHandler = function (component) {
  var pattern = /^[0-9]{0,3}$/i;
  return function () {
    var value = component.previousValue;
    if (value === undefined) {
      value = component.previousValue = '';
    }
    if (!pattern.test(component.value) || component.value > 255) {
      component.value = component.previousValue;
    } else {
      component.previousValue = component.value;
    }
  };
};

BigColorPicker.load = function () {
  var g = BigColorPicker;
  M.make('div', { id: 'wrapper', into: document.body });
  var container = M.make('div', { id: 'controls', into: wrapper });
  g.component = {};
  g.ring = {};
  ['red', 'blue', 'green'].forEach(function (color, ix, array) {
    // Position the component box.
    var component = g.component[color] = M.make('div',
        { className: 'component', id: 'red', into: container });
    component.oncomponent = g.makeInputHandler(component);
    if (ix != array.length-1) {
      component.style.marginRight = 175 + 'px';
    }
    // Position the canvas.
    var ringCanvas = g.ring[color] = M.make('canvas',
        { id: color+'Ring', into: container });
    ringCanvas.width = ringCanvas.height = 240;
    ringCanvas.style.left = component.offsetLeft + component.offsetWidth/2 -
        ringCanvas.offsetWidth/2 + 'px';
    ringCanvas.style.top = component.offsetTop + component.offsetHeight/2 -
        ringCanvas.offsetHeight/2 + 'px';
    // Draw the ring.
    var context = ringCanvas.getContext('2d'),
        x = ringCanvas.width/2,
        y = ringCanvas.height/2,
        numSegments = 256,
        increment = Math.PI*2/numSegments;
    context.lineWidth = 65;
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
