var ColorSpinner = {
  colors: ['red', 'blue', 'green'],
  mix: {},
  layout: {
    canvas: { size: 256, gap: 10 },
    hole: { overlap: 2 },
    smoother: 1,
    ring: { width: 80 },
    display: { color: '#fff', width: 100, height: 32 },
    sector: { color: '#fff' },
    grid: { pixel: 1, left: 0, top: 40 },
    mix: { top: 40 }
  },
	show: { ring: { solid: false, mix: true } }
};

ColorSpinner.toHex2 = function (i) {
  var hex = i.toString(16);
  if (hex.length == 1) {
    hex = '0'+hex;
  }
  return hex;
}

ColorSpinner.setValue = function (color, value) {
  var g = ColorSpinner,
      cluster = g[color],
      ring = cluster.ring,
      layout = g.layout,
      x0 = layout.canvas.size/2,
      y0 = layout.canvas.size/2,
      holeRadius = layout.hole.radius,
      smoother = layout.smoother,
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
  var holeContext = cluster.hole.getContext('2d');
  holeContext.clearRect(0, 0, canvasSize, canvasSize);
  holeContext.fillStyle = cluster.colorStrings[value];
  holeContext.beginPath();
  holeContext.arc(x0, y0, holeRadius, 0, 2*Math.PI);
  holeContext.fill();
  // Draw sector under cursor.
  context.clearRect(0, 0, canvasSize, canvasSize);
  context.strokeStyle = g.layout.sector.color;
  context.lineWidth = ringWidth*2/3;
  context.beginPath();
  context.arc(x0, y0, holeRadius + ringWidth/2, angleFrom, angleTo);
  context.stroke();
  // Mix the colors into the final product.
  g.mix.rgb[cluster.index] = value;
  var colorString = 'rgb(' + g.mix.rgb.join(', ') + ')',
      mixCanvas = g.mix.canvas,
      mixContext = mixCanvas.getContext('2d');
  mixContext.clearRect(0, 0, mixCanvas.width, mixCanvas.height);
  mixContext.fillStyle = colorString;
  mixContext.beginPath();
  mixContext.arc(
      layout.canvas.size + layout.canvas.gap + holeRadius + ringWidth,
      layout.mix.top + holeRadius + ringWidth,
      holeRadius + ringWidth, 0, 2*Math.PI);
  mixContext.fill();
  // Update the other two rings.
  for (var ci = 0; ci < 3; ++ci) {
    if (ci == cluster.index) {
      continue;
    }
    var numSectors = 256,
        increment = Math.PI*2/numSectors,
        ringContext = g[g.colors[ci]].ring.getContext('2d'),
        ringWidth = layout.ring.width,
        ringCenter = holeRadius + ringWidth/2;
    ringContext.lineWidth = ringWidth;
    var parts = ['#'];
    for (var i = 0; i < g.colors.length; ++i) {
      parts.push(g.toHex2(g.mix.rgb[i]));
    }
    for (var i = 0; i < numSectors; ++i) {
      ringContext.beginPath();
      parts[1+ci] = g.toHex2(i);
      ringContext.strokeStyle = parts.join('');
      var startAngle = -Math.PI/2 + i*increment,
          endAngle = startAngle + (i == numSectors-1 ? 1 : 2) * increment;
      ringContext.arc(x0, y0, ringCenter, startAngle, endAngle);
      ringContext.stroke();
    }
    ringContext.beginPath();
    ringContext.strokeStyle = '#fff';
    ringContext.lineWidth = smoother;
    ringContext.arc(x0, y0, holeRadius + ringWidth + smoother/2, 0, 2*Math.PI);
    ringContext.stroke();
  }
  // Draw the two-color grid onto the mixing canvas.
  var scale = 3,
      pixelSize = scale*layout.grid.pixel,
      gridSize = numSectors * pixelSize,
      gridTop = layout.grid.top,
      gridLeft = layout.grid.left;
      rgb = [0, 0, 0],
      mix = { x: 1, y: 2 };
  if (cluster.index == 1) {
    mix = { x: 0, y: 2 };
  } else if (cluster.index == 2) {
    mix = { x: 0, y: 1 };
  }
  rgb[cluster.index] = value;
  for (var i = 0; i < numSectors/scale; ++i) {
    rgb[mix.x] = i*scale;
    for (var j = 0; j < numSectors/scale; ++j) {
      rgb[mix.y] = j*scale;
      mixContext.fillStyle = 'rgb(' + rgb.join(', ') + ')';
      mixContext.fillRect(gridLeft+i*pixelSize, gridTop+j*pixelSize,
          pixelSize, pixelSize);
    }
  }
  // Show where we are in the mixing canvas.
  mixContext.fillStyle = '#000';
  var x = g.mix.rgb[mix.x],
      y = g.mix.rgb[mix.y],
      i = Math.floor(x/scale),
      j = Math.floor(y/scale);
  mixContext.fillRect(gridLeft+i*pixelSize, gridTop+j*pixelSize,
      pixelSize, pixelSize);
};

ColorSpinner.makeMouseHandler = function (mouseWhat, color) {
  return function (event) {
    var g = ColorSpinner,
        event = event || window.event,
        cluster = g[color],
        ring = cluster.ring,
        layout = g.layout,
        radius = layout.hole.radius + layout.ring.width,
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
  var container = M.make('div', { id: 'discs', into: wrapper }),
      canvasSize = layout.canvas.size,
      canvasGap = layout.canvas.gap,
      displayWidth = layout.display.width,
      displayHeight = layout.display.height;
  container.style.width = g.colors.length*(canvasSize + canvasGap) -
      canvasGap + 'px';
  container.style.height = canvasSize + 'px';
  // Calculate ring dimensions.
  var half = canvasSize/2,
      ringWidth = layout.ring.width,
      smoother = layout.smoother,
      overlap = layout.hole.overlap,
      holeRadius = half - ringWidth,
      x0 = layout.canvas.size/2,
      y0 = layout.canvas.size/2,
      numSectors = 256,
      increment = Math.PI*2/numSectors;
  layout.hole.radius = holeRadius;
  // Initialize the mixed color value.
  g.mix.rgb = [0, 0, 0];
  // Make a canvas for the mixed color.
  var mixCanvas = g.mix.canvas = M.make('canvas',
      { id: 'mix', into: wrapper });
  mixCanvas.width = container.offsetWidth;
  mixCanvas.height = container.offsetWidth/2;
  mixCanvas.style.left = container.offsetLeft + 'px';
  mixCanvas.style.top = container.offsetTop + container.offsetHeight + 'px';
  // Make a control disc for each color.
  g.colors.forEach(function (color, ix, array) {
    var cluster = g[color] = { index: ix };
    // Precompute color strings.
    var colorStrings = cluster.colorStrings = [],
        rgb = [0, 0, 0];
    for (var i = 0; i < 256; ++i) {
      rgb[ix] = i;
      colorStrings.push('rgb(' + rgb.join(', ') + ')');
    }
    // Compute canvas layout.
    var canvasLeft = ix*(canvasSize + canvasGap) + 'px',
        canvasTop = '0';
    // Prepare the ring canvas.
    var ringCanvas = cluster.ring = M.make('canvas',
        { id: color+'Ring', into: container });
    ringCanvas.width = ringCanvas.height = layout.canvas.size;
    ringCanvas.style.left = canvasLeft;
    ringCanvas.style.top = canvasTop;
    // Add the inside overlap and half the outside smoothing width.
    var renderWidth = overlap + ringWidth + smoother/2,
        renderCenter = holeRadius - overlap + renderWidth/2;
    // Position the touch canvas.
    var holeCanvas = cluster.hole = M.make('canvas',
        { id: color+'Hole', into: container });
    holeCanvas.width = holeCanvas.height = layout.canvas.size;
    holeCanvas.style.left = canvasLeft;
    holeCanvas.style.top = canvasTop;
    // Position the display box.
    var display = cluster.display = M.make('div',
          { className: 'display', into: container, innerHTML: '0' });
    display.style.width = displayWidth + 'px';
    display.style.height = displayHeight + 'px';
    display.style.left = ringCanvas.offsetLeft +
        (canvasSize - displayWidth)/2 + 'px';
    display.style.top = (canvasSize - displayHeight)/2 + 'px';
    display.style.color = layout.display.color;
    // Calculate the offset of the canvas with respect to the page.
    var offset = cluster.offset = M.getOffset(ringCanvas, document.body);
    // Position the touch canvas.
    var touchCanvas = cluster.touch = M.make('canvas',
        { id: color+'Touch', into: container });
    touchCanvas.width = touchCanvas.height = layout.canvas.size;
    touchCanvas.style.left = canvasLeft;
    touchCanvas.style.top = canvasTop;
    touchCanvas.onmouseover = g.makeMouseHandler('over', color);
    touchCanvas.onmousemove = g.makeMouseHandler('move', color);
    touchCanvas.onmouseout = g.makeMouseHandler('out', color);
    touchCanvas.onmousedown = g.makeMouseHandler('down', color);
  });
  g.colors.forEach(function (color, ix, array) {
    g.setValue(color, 0);
  });
};

window.onload = ColorSpinner.load;
