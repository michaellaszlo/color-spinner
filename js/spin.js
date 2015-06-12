var ColorSpinner = {
  colors: ['red', 'blue', 'green'],
  layout: {
    canvas: { size: 240, gap: 10 },
    ring: { width: 70, smoother: 2 },
    hole: { overlap: 2 },
    display: { color: '#fff', width: 100, height: 32 },
    sector: { color: '#fff' }
  }
};

ColorSpinner.setValue = function (color, value) {
  var g = ColorSpinner,
      cluster = g[color],
      ring = cluster.ring,
      layout = g.layout,
      x0 = layout.canvas.size/2,
      y0 = layout.canvas.size/2,
      holeRadius = layout.hole.radius,
      overlap = layout.hole.overlap,
      ringWidth = layout.ring.width,
      touch = cluster.touch,
      context = touch.getContext('2d'),
      display = cluster.display,
      canvasSize = g.layout.canvas.size,
      angleFrom = 3*Math.PI/2 + value*Math.PI/128,
      angleTo = angleFrom + Math.PI/128;
  display.innerHTML = value;
  // Fill ring with color.
  holeContext = cluster.hole.getContext('2d');
  holeContext.fillStyle = cluster.colorStrings[value];
  holeContext.clearRect(0, 0, canvasSize, canvasSize);
  holeContext.beginPath();
  holeContext.arc(x0, y0, holeRadius, 0, 2*Math.PI);
  holeContext.fill();
  // Draw sector under cursor.
  context.strokeStyle = g.layout.sector.color;
  context.lineWidth = ringWidth;
  context.clearRect(0, 0, canvasSize, canvasSize);
  context.beginPath();
  context.arc(x0, y0, holeRadius + ringWidth/2, angleFrom, angleTo);
  /*
  context.moveTo(x0 + Math.cos(angleFrom)*holeRadius,
                 y0 + Math.sin(angleFrom)*holeRadius);
  context.lineTo(x0 + Math.cos(angleFrom)*(holeRadius+ringWidth),
                 y0 + Math.sin(angleFrom)*(holeRadius+ringWidth));
  context.moveTo(x0 + Math.cos(angleTo)*holeRadius,
                 y0 + Math.sin(angleTo)*holeRadius);
  context.lineTo(x0 + Math.cos(angleTo)*(holeRadius+ringWidth),
                 y0 + Math.sin(angleTo)*(holeRadius+ringWidth));
  */
  context.stroke();
};

ColorSpinner.makeMouseHandler = function (mouseWhat, color) {
  return function (event) {
    var g = ColorSpinner,
        event = event || window.event,
        cluster = g[color],
        ring = cluster.ring,
        radius = g.layout.hole.radius + g.layout.ring.width,
        offset = cluster.offset,
        x = event.pageX - offset.left,
        y = event.pageY - offset.top;
    if (mouseWhat == 'over' || mouseWhat == 'move') {
      // Calculate distance of cursor from center.
      var x0 = ring.width/2,
          y0 = ring.height/2,
          dx = x - x0,
          dy = y - y0,
          dd = Math.sqrt(dx*dx + dy*dy);
      if (dd <= radius) {
        // Calculate angle and 256 value.
        var angle = Math.acos(dx/dd);
        if (dy > 0) {
          angle = 2*Math.PI - angle;
        }
        var value = 255 - (Math.floor(angle/2/Math.PI * 256) + 192) % 256;
        g.setValue(color, value);
      }
    }
  };
};

ColorSpinner.load = function () {
  var g = ColorSpinner,
      layout = g.layout;
  M.make('div', { id: 'wrapper', into: document.body });
  var container = M.make('div', { id: 'controls', into: wrapper }),
      canvasSize = layout.canvas.size,
      canvasGap = layout.canvas.gap,
      displayWidth = layout.display.width,
      displayHeight = layout.display.height;
  container.style.width = g.colors.length*(canvasSize + canvasGap) -
      canvasGap + 'px';
  container.style.height = canvasSize + 'px';
  // Compute ring dimensions.
  var half = canvasSize/2,
      ringWidth = layout.ring.width,
      smoother = layout.ring.smoother,
      overlap = layout.hole.overlap,
      holeRadius = half - ringWidth - smoother;
  layout.hole.radius = holeRadius;
  console.log(holeRadius);
  // Prepare graphics for each color.
  g.colors.forEach(function (color, ix, array) {
    var cluster = g[color] = { index: ix };
    // Precompute color strings.
    var colorStrings = cluster.colorStrings = [],
        rgb = [0, 0, 0];
    for (var i = 0; i < 256; ++i) {
      rgb[ix] = i;
      colorStrings.push('rgb(' + rgb.join(', ') + ')');
    }
    // Position the ring canvas.
    var ringCanvas = cluster.ring = M.make('canvas',
        { id: color+'Ring', into: container }),
        styleLeft = ix*(canvasSize + canvasGap) + 'px',
        styleTop = '0';
    ringCanvas.width = ringCanvas.height = layout.canvas.size;
    ringCanvas.style.left = styleLeft;
    ringCanvas.style.top = styleTop;
    // Calculate the offset of the canvas with respect to the page.
    var offset = cluster.offset = M.getOffset(ringCanvas, document.body);
    // Draw the ring.
    var context = ringCanvas.getContext('2d'),
        x0 = ringCanvas.width/2;
        y0 = ringCanvas.height/2;
        numSegments = 256,
        increment = Math.PI*2/numSegments;
    // Add the inside overlap and half the outside smoothing width.
    var renderWidth = overlap + ringWidth + smoother/2,
        renderCenter = holeRadius - overlap + renderWidth/2;
    context.lineWidth = renderWidth;
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
      context.arc(x0, y0, renderCenter, startAngle, endAngle);
      context.stroke();
    }
    // Smooth the outer edge of the ring.
    context.strokeStyle = '#fff';
    context.lineWidth = smoother;
    context.beginPath();
    context.arc(x0, y0, holeRadius + ringWidth + smoother/2, 0, 2*Math.PI);
    context.stroke();
    // Position the touch canvas.
    var holeCanvas = cluster.hole = M.make('canvas',
        { id: color+'Hole', into: container });
    holeCanvas.width = holeCanvas.height = layout.canvas.size;
    holeCanvas.style.left = styleLeft;
    holeCanvas.style.top = styleTop;
    // Position the display box.
    var display = cluster.display = M.make('div',
          { className: 'display', id: 'red', into: container,
            innerHTML: '0' });
    display.style.width = displayWidth + 'px';
    display.style.height = displayHeight + 'px';
    display.style.left = ringCanvas.offsetLeft +
        (canvasSize - displayWidth)/2 + 'px';
    display.style.top = (canvasSize - displayHeight)/2 + 'px';
    display.style.color = layout.display.color;
    // Position the touch canvas.
    var touchCanvas = cluster.touch = M.make('canvas',
        { id: color+'Touch', into: container });
    touchCanvas.width = touchCanvas.height = layout.canvas.size;
    touchCanvas.style.left = styleLeft;
    touchCanvas.style.top = styleTop;
    touchCanvas.onmouseover = g.makeMouseHandler('over', color);
    touchCanvas.onmousemove = g.makeMouseHandler('move', color);
    touchCanvas.onmouseout = g.makeMouseHandler('out', color);
    touchCanvas.onmousedown = g.makeMouseHandler('down', color);
    g.setValue(color, 0);
  });
};

window.onload = ColorSpinner.load;
