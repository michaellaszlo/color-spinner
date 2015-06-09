var BigColorPicker = {
  colors: ['red', 'blue', 'green'],
  layout: { canvas: { size: 240 } }
};

BigColorPicker.makeMouseHandler = function (mouseWhat, color) {
  return function (event) {
    var g = BigColorPicker,
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
      /*
      context.fillStyle = '#ff8';
      context.strokeStyle = '#888';
      context.lineWidth = 1.5;
      context.beginPath();
      context.moveTo(x + 8, y);
      context.arc(x, y, 8, 0, 2*Math.PI);
      context.closePath();
      context.fill();
      context.stroke();
      */
      // Calculate angle.
      var x0 = ring.width/2,
          y0 = ring.height/2,
          dx = x - x0,
          dy = y - y0,
          dd = Math.sqrt(dx*dx + dy*dy),
          radius = ring.width/2,
          xOut = x0 + radius/dd*dx,
          yOut = y0 + radius/dd*dy;
      context.fillStyle = '#000';
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(x0, y0);
      context.lineTo(xOut, yOut);
      context.stroke();
      console.log(dx, dy);
    }
    if (mouseWhat == 'out') {
      context.clearRect(0, 0, touch.width, touch.height);
    }
  };
};

BigColorPicker.load = function () {
  var g = BigColorPicker;
  M.make('div', { id: 'wrapper', into: document.body });
  var container = M.make('div', { id: 'controls', into: wrapper });
  g.colors.forEach(function (color, ix, array) {
    g[color] = {};
    // Position the component box.
    var component = g[color].component = M.make('div',
        { className: 'component', id: 'red', into: container });
    if (ix != array.length-1) {
      component.style.marginRight = 175 + 'px';
    }
    // Position the ring canvas.
    var ringCanvas = g[color].ring = M.make('canvas',
        { id: color+'Ring', into: container });
    ringCanvas.width = ringCanvas.height = g.layout.canvas.size;
    ringCanvas.style.left = component.offsetLeft + component.offsetWidth/2 -
        ringCanvas.offsetWidth/2 + 'px';
    ringCanvas.style.top = component.offsetTop + component.offsetHeight/2 -
        ringCanvas.offsetHeight/2 + 'px';
    // Calculate the offset of the canvas with respect to the page.
    var offset = g[color].offset = M.getOffset(ringCanvas, document.body);
    console.log(offset.left+' '+offset.top);
    // Draw the ring.
    var context = ringCanvas.getContext('2d'),
        x = ringCanvas.width/2;
        y = ringCanvas.height/2;
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
    // Position the touch canvas.
    var touchCanvas = g[color].touch = M.make('canvas',
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

window.onload = BigColorPicker.load;
