var ColorSpinner = {
  colors: ['red', 'blue', 'green'],
  layout: { canvas: { size: 240 } }
};

ColorSpinner.makeMouseHandler = function (mouseWhat, color) {
  return function (event) {
    var g = ColorSpinner,
        cluster = g[color],
        component = cluster.component,
        ring = cluster.ring,
        touch = cluster.touch,
        offset = cluster.offset,
        context = touch.getContext('2d'),
        event = event || window.event,
        x = event.pageX - offset.left,
        y = event.pageY - offset.top;
    if (mouseWhat == 'over' || mouseWhat == 'move') {
      // Show cursor position.
      context.clearRect(0, 0, touch.width, touch.height);
      // Calculate angle.
      var x0 = ring.width/2,
          y0 = ring.height/2,
          dx = x - x0,
          dy = y - y0,
          dd = Math.sqrt(dx*dx + dy*dy),
          radius = ring.width/2,
          xOut = x0 + radius/dd*dx,
          yOut = y0 + radius/dd*dy,
          angle = Math.acos(dx/dd);
      if (dy > 0) {
        angle = 2*Math.PI - angle;
      }
      var value = 255 - (Math.floor(angle/2/Math.PI * 256) + 192) % 256,
          angleFrom = 3*Math.PI/2 + value*Math.PI/128,
          angleTo = angleFrom + Math.PI/128,
          rgb = [0, 0, 0];
      rgb[cluster.index] = value;
      var rgbString = 'rgb(' + rgb.join(', ') + ')';
      component.innerHTML = value;
      // Draw sector under cursor.
      context.strokeStyle = '#888';
      context.lineWidth = radius;
      context.beginPath();
      context.arc(x0, y0, radius/2, angleFrom, angleTo);
      context.stroke();
    }
    if (mouseWhat == 'out') {
      context.clearRect(0, 0, touch.width, touch.height);
    }
  };
};

ColorSpinner.load = function () {
  var g = ColorSpinner;
  M.make('div', { id: 'wrapper', into: document.body });
  var container = M.make('div', { id: 'controls', into: wrapper });
  g.colors.forEach(function (color, ix, array) {
    var cluster = g[color] = { index: ix };
    // Position the component box.
    var component = cluster.component = M.make('div',
        { className: 'component', id: 'red', into: container, innerHTML: '0' });
    if (ix != array.length-1) {
      component.style.marginRight = 175 + 'px';
    }
    // Position the ring canvas.
    var ringCanvas = cluster.ring = M.make('canvas',
        { id: color+'Ring', into: container });
    ringCanvas.width = ringCanvas.height = g.layout.canvas.size;
    ringCanvas.style.left = component.offsetLeft + component.offsetWidth/2 -
        ringCanvas.offsetWidth/2 + 'px';
    ringCanvas.style.top = component.offsetTop + component.offsetHeight/2 -
        ringCanvas.offsetHeight/2 + 'px';
    // Calculate the offset of the canvas with respect to the page.
    var offset = cluster.offset = M.getOffset(ringCanvas, document.body);
    // Draw the ring.
    var context = ringCanvas.getContext('2d'),
        x = ringCanvas.width/2;
        y = ringCanvas.height/2;
        numSegments = 256,
        increment = Math.PI*2/numSegments;
    context.lineWidth = 70;
    for (var i = 0; i < numSegments; ++i) {
      context.beginPath();
      var parts = ['#', '00', '00', '00'];
      var hex = i.toString(16);
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
    // Smooth the inner and outer edges of the ring.
    context.strokeStyle = '#fff';
    context.lineWidth = 2;
    context.beginPath();
    context.arc(x, y, 50, 0, 2*Math.PI);
    context.stroke();
    context.beginPath();
    context.arc(x, y, 120, 0, 2*Math.PI);
    context.stroke();
    // Position the touch canvas.
    var touchCanvas = cluster.touch = M.make('canvas',
        { id: color+'Touch', into: container });
    touchCanvas.width = touchCanvas.height = g.layout.canvas.size;
    touchCanvas.style.left = ringCanvas.style.left;
    touchCanvas.style.top = ringCanvas.style.top;
    touchCanvas.onmouseover = g.makeMouseHandler('over', color);
    touchCanvas.onmousemove = g.makeMouseHandler('move', color);
    touchCanvas.onmouseout = g.makeMouseHandler('out', color);
    touchCanvas.onmousedown = g.makeMouseHandler('down', color);
  });
};

window.onload = ColorSpinner.load;
