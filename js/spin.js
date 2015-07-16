var ColorSpinner = {
  colors: ['red', 'green', 'blue'],
  rgb: [0, 0, 0],
  layout: {
    container: { width: 1100, height: 650, left: 0, top: 0, number: 5 },
    mixer: { sample: 2, diameter: 280, gap: 5, handle: 12 },
    hexagon: { height: 260 },
    hole: { radius: { proportion: 0.4 } },
    smoother: 0.5,
    sector: { color: '#fff', band: { proportion: 0.65 } },
    grid: {
      left: 20, top: 15,
      sample: 2,  // 256 is divided into samples of this size
      scale: 1,  // the grid is magnified by this linear factor
      overlap: 1,  // to prevent white lines, overlap by this many pixels
      axis: { width: 8, gap: 4 }
    },
    select: { gap: 10 }
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

ColorSpinner.makeContrastRgb = function (rgb) {
  var contrastRgb = [255, 255, 255];
  return contrastRgb;
};

ColorSpinner.rgbToCss = function (rgb) {
  var css = 'rgb(' + rgb.join(', ') + ')';
  return css;
};

ColorSpinner.addMixerFunctions = function (mixer) {
  var g = ColorSpinner,
      layout = g.layout,
      index = mixer.index,
      diameter = mixer.diameter,
      handle = layout.mixer.handle,
      radius = diameter/2,
      x0 = radius,
      y0 = radius,
      sample = layout.mixer.sample,
      start = -Math.PI/2,
      increment = sample * Math.PI / 128,
      smoother = layout.smoother,
      holeRadius = layout.hole.radius.proportion * radius,
      bandWidth = radius - handle - holeRadius,
      sectorLength = layout.sector.band.proportion * bandWidth;
  mixer.paint = function () {
    // Copy the current RGB tuple. Make the hole color and a contrasting color.
    var rgb = g.rgb.slice();
    // Update the mixed color.
    var paletteCanvas = g.palette.canvas,
        paletteContext = g.palette.context;
    paletteContext.clearRect(0, 0, paletteCanvas.width, paletteCanvas.height);
    paletteContext.fillStyle = g.rgbToCss(rgb);
    paletteContext.beginPath();
    paletteContext.arc(100, 100, 75, 0, 2*Math.PI);
    paletteContext.fill();
    // Display the mixer's value.
    var currentValue = rgb[index],
        holeRgb = [0, 0, 0];
    holeRgb[index] = currentValue;
    var labelRgb = (index === g.holdIndex ?
                    holeRgb : g.makeContrastRgb(holeRgb));
    mixer.label.style.color = g.rgbToCss(labelRgb);
    mixer.label.innerHTML = currentValue + '<br />' + g.toHex2(currentValue);
    // Paint the ring with other values, sampling samplely through the range.
    var context = mixer.context.ring;
    context.lineWidth = radius - handle;
    for (var x = 0; x < 256; x += sample) {
      var angleFrom = start + x * Math.PI / 128,
          angleTo = start + Math.min(256, x + 2*sample) * Math.PI / 128;
      rgb[index] = x;
      context.strokeStyle = g.rgbToCss(rgb);
      context.beginPath();
      context.arc(x0, y0, context.lineWidth/2, angleFrom, angleTo);
      context.stroke();
    }
    // Paint a white smoothing ring.
    context.lineWidth = smoother;
    context.strokeStyle = '#fff';
    context.beginPath()
    context.arc(x0, y0, radius - handle + smoother/2, 0, 2*Math.PI);
    context.stroke();
    // Paint the hole.
    context = mixer.context.hole;
    context.clearRect(0, 0, diameter, diameter);
    context.fillStyle = g.rgbToCss(holeRgb);
    context.lineWidth = 2;
    context.strokeStyle = '#000';
    context.beginPath();
    context.arc(x0, y0, holeRadius, 0, 2*Math.PI);
    context.fill();
    // Paint the sector.
    context = mixer.context.sector;
    context.clearRect(0, 0, diameter, diameter);
    context.lineWidth = sectorLength;
    context.strokeStyle = '#fff';
    context.beginPath();
    var angleFrom = start + currentValue * Math.PI / 128,
        angleTo = angleFrom + Math.PI / 128;
    context.arc(x0, y0, radius - handle - sectorLength/2, angleFrom, angleTo);
    context.stroke();
    // Paint the handle.
    context.beginPath();
    context.strokeStyle = g.rgbToCss(holeRgb);
    context.lineWidth = handle;
    context.arc(x0, y0, radius - handle/2, angleFrom, angleTo);
    context.stroke();
  };
  var selectContext = mixer.context.select,
      selectRadius = holeRadius - layout.select.gap;
  mixer.select = function () {
    if (g.holdIndex !== undefined) {
      g.mixers[g.holdIndex].deselect();
    }
    g.holdIndex = index;
    var holeRgb = [0, 0, 0];
    holeRgb[index] = g.rgb[index];
    mixer.label.style.color = g.rgbToCss(holeRgb);
    selectContext.fillStyle = g.rgbToCss(g.makeContrastRgb(holeRgb));
    selectContext.beginPath();
    selectContext.arc(x0, y0, selectRadius, 0, 2*Math.PI);
    selectContext.fill();
    g.mixGrid.paint();
    g.mixGrid.mark();
  };
  mixer.deselect = function () {
    selectContext.clearRect(0, 0, diameter, diameter);
    var holeRgb = [0, 0, 0];
    holeRgb[index] = g.rgb[index];
    mixer.label.style.color = g.rgbToCss(g.makeContrastRgb(holeRgb));
  };
};

ColorSpinner.load = function () {
  var g = ColorSpinner,
      layout = g.layout,
      diameter = layout.mixer.diameter,
      handle = layout.mixer.handle,
      totalRadius = diameter/2,
      center = { x: totalRadius, y: totalRadius },
      holeRadius = layout.hole.radius.proportion * totalRadius;

  // Allocate the drawing area.
  var drawingArea = M.make('div', { id: 'drawingArea', into: document.body,
      unselectable: true }),
      canvases = g.canvases = [];
  drawingArea.style.width = layout.container.width + 'px';
  drawingArea.style.height = layout.container.height + 'px';

  function makeMixer() {
    var mixer = M.make('div', { className: 'mixer', into: drawingArea,
        unselectable: true });
    mixer.style.width = diameter + 'px';
    mixer.style.height = diameter + 'px';
    mixer.context = {};
    ['ring', 'hole', 'select', 'sector'].forEach(function (canvasName) {
      var canvas = M.make('canvas', { into: mixer });
      canvas.width = canvas.height = layout.mixer.diameter;
      mixer.context[canvasName] = canvas.getContext('2d');
    });
    function mouseMove (event) {
    }
    mixer.onmouseover = function () {
      //mixer.onmousemove = mouseMove;
    };
    mixer.onmouseout = function () {
      //mixer.onmousemove = undefined;
    };
    mixer.update = function (event) {
      var position = M.getMousePosition(event),
          x = position.x - mixer.offset.left - center.x,
          y = mixer.offset.top + center.y - position.y,
          distance = Math.hypot(x, y);
      var angle = Math.PI/2 - (y >= 0 ?
              Math.acos(x/distance) : 2*Math.PI - Math.acos(x/distance));
      if (angle < 0) {  // Normalize to the range [0, 2*pi).
        angle += 2*Math.PI;
      }
      var value = Math.floor(128 * angle / Math.PI);
      g.rgb[mixer.index] = value;
      g.mixers.forEach(function (mixer) {
        mixer.paint();
      });
      if (mixer.index == g.holdIndex) {
        g.mixGrid.paint();
        mixer.select();
      } else {
        g.mixGrid.mark();
      }
    };
    mixer.onmousedown = function (event) {
      var position = M.getMousePosition(event),
          x = position.x - mixer.offset.left - center.x,
          y = mixer.offset.top + center.y - position.y,
          distance = Math.hypot(x, y);
      if (distance > totalRadius) {
        return;
      }
      if (distance <= holeRadius) {
        mixer.select();
        return;
      }
      mixer.update(event);
      window.onmousemove = mixer.update;
      window.onmouseup = function () {
        window.onmousemove = undefined;
        window.onmouseup = undefined;
      };
    };
    return mixer;
  }

  // Layout calculations for the two-color mixing grid.
  var sample = layout.grid.sample,
      scale = layout.grid.scale,
      gridSize = 256*scale,
      mixGridContainerSize = layout.grid.axis.width + layout.grid.axis.gap +
          gridSize;

  // Make the three color discs.
  g.mixer = {};
  g.mixers = [];
  g.colors.forEach(function (color, ix, array) {
    var mixer = g.mixer[color] = makeMixer(),
        diameter = layout.mixer.diameter,
        width = diameter,
        height = diameter;
    g.mixers.push(mixer);
    mixer.style.left = layout.grid.left + mixGridContainerSize +
        layout.mixer.gap + ix * (layout.mixer.gap + diameter) + 'px';
    mixer.style.top = layout.mixer.gap + 'px';
    mixer.offset = M.getOffset(mixer, document.body);
    mixer.diameter = diameter;
    mixer.color = color;
    mixer.index = ix;
    var label = mixer.label = M.make('div', { className: 'label',
        into: mixer, unselectable: true });
    // Insert dummy content and calculate label dimensions.
    label.innerHTML = '256<br />xFF';
    var labelWidth = label.offsetWidth,
        labelHeight = label.offsetHeight;
    label.style.width = labelWidth + 'px';
    label.style.height = labelHeight + 'px';
    label.style.left = (width - labelWidth)/2 + 'px';
    label.style.top = (height - labelHeight)/2 + 'px';
    g.addMixerFunctions(mixer);
  });

  // Make the two-color mixing grid.
  var mixGrid = g.mixGrid = M.make('div', { id: 'mixGrid',
          into: drawingArea });
  mixGrid.style.left = layout.grid.left + 'px';
  mixGrid.style.top = layout.grid.top + 'px';
  mixGrid.offset = M.getOffset(mixGrid, document.body);
  mixGrid.style.width = mixGridContainerSize + 'px';
  mixGrid.style.height = mixGridContainerSize + 'px';
  mixGrid.canvas = {};
  mixGrid.context = {};
  ['pixels', 'prep', 'marks'].forEach(function (canvasName) {
    var canvas = mixGrid.canvas[canvasName] = M.make('canvas',
        { into: (canvasName == 'prep' ? undefined : mixGrid) });
    canvas.width = canvas.height = mixGridContainerSize;
    mixGrid.context[canvasName] = canvas.getContext('2d');
  });
  mixGrid.canvas.prep.style.visibility = 'hidden';

  function getIndices() {
    var rowIndex = 1,
        colIndex = 2;
    if (g.holdIndex == 1) {
      rowIndex = 0;
      colIndex = 2;
    } else if (g.holdIndex == 2) {
      rowIndex = 0;
      colIndex = 1;
    }
    return { row: rowIndex, col: colIndex };
  }

  var prepCanvas = mixGrid.canvas.prep,
      prepContext = mixGrid.context.prep,
      gridContext = mixGrid.context.pixels,
      axisWidth = layout.grid.axis.width,
      corner = { x: axisWidth + layout.grid.axis.gap },
      overlap = 0;//layout.grid.overlap;
  corner.y = corner.x;
  // Paint the pixels making up the background of the two-color grid.
  mixGrid.paint = function () {
    var rgb = g.rgb.slice(),
        indices = getIndices();
    // Paint the rows of the grid with linear gradients.
    for (var r = 0; r < 256; r += sample) {
      var gradient = prepContext.createLinearGradient(
              corner.x, corner.y + scale*r,
              corner.x + scale*256, corner.y + scale*r);
      rgb[indices.row] = r;
      rgb[indices.col] = 0;
      gradient.addColorStop(0, g.rgbToCss(rgb)); 
      rgb[indices.col] = 255;
      gradient.addColorStop(1, g.rgbToCss(rgb)); 
      prepContext.fillStyle = gradient;
      prepContext.fillRect(
          corner.x, corner.y + scale*r,
          corner.x + scale*256, corner.y + scale*(r+1) + overlap);
    }
    
    // Paint the vertical axis.
    var axisRgb = [0, 0, 0];
    for (var r = 0; r < 256; r += sample) {
      axisRgb[indices.row] = r;
      prepContext.fillStyle = g.rgbToCss(axisRgb);
      prepContext.fillRect(0, corner.y + scale*r,
          axisWidth, scale*Math.min(256-r, sample+overlap));
    }

    // Paint the horizontal axis.
    var axisRgb = [0, 0, 0];
    for (var c = 0; c < 256; c += sample) {
      axisRgb[indices.col] = c;
      prepContext.fillStyle = g.rgbToCss(axisRgb);
      prepContext.fillRect(corner.x + scale*c, 0,
          scale*Math.min(256-c, sample+overlap), axisWidth);
    }

    gridContext.drawImage(prepCanvas, 0, 0);
  };
  var markContext = mixGrid.context.marks;
  // Draw markings for current color.
  mixGrid.mark = function () {
    var indices = getIndices();
    markContext.clearRect(0, 0, mixGridContainerSize, mixGridContainerSize);
    var rowValue = g.rgb[indices.row],
        colValue = g.rgb[indices.col];
    markContext.beginPath();
    markContext.moveTo(corner.x + colValue, 0);
    markContext.lineTo(corner.x + colValue, mixGridContainerSize);
    markContext.moveTo(0, corner.y + rowValue);
    markContext.lineTo(mixGridContainerSize, corner.y + rowValue);
    markContext.stroke();
  }

  mixGrid.update = function (event) {
    var indices = getIndices(),
        position = M.getMousePosition(event),
        x = Math.max(0, Math.min(255 * scale,
              position.x - mixGrid.offset.left - corner.x)),
        y = Math.max(0, Math.min(255 * scale,
              position.y - mixGrid.offset.top - corner.y)),
        colValue = Math.floor(256 * x / gridSize),
        rowValue = Math.floor(256 * y / gridSize);
    g.rgb[indices.row] = rowValue;
    g.rgb[indices.col] = colValue;
    mixGrid.mark();
    g.mixers.forEach(function (mixer) {
      mixer.paint();
    });
  };
  mixGrid.onmousedown = function (event) {
    mixGrid.update(event);
    window.onmousemove = mixGrid.update;
    window.onmouseup = function () {
      window.onmousemove = undefined;
      window.onmouseup = undefined;
    };
  };

  // Make the HSL and HSV hexagons;
  var hexagonHeight = layout.hexagon.height;
  function makeHexagon() {
  };

  g.hexagon = {};
  ['hsl', 'hsv'].forEach(function (modelName) {
    var hexagon = g.hexagon[modelName] = makeHexagon();
  });

  var paletteCanvas = M.make('canvas', { id: 'paletteCanvas',
        into: drawingArea }),
      paletteContext = paletteCanvas.getContext('2d');
  paletteCanvas.width = layout.container.width;
  paletteCanvas.height = layout.container.height - layout.grid.top -
      hexagonHeight - mixGridContainerSize;
  paletteCanvas.style.left = '0';
  paletteCanvas.style.top = layout.container.height - paletteCanvas.height +
      'px';
  g.palette = { canvas: paletteCanvas, context: paletteContext };

  // Choose a color at random.
  g.colors.forEach(function (color, ix, array) {
    g.rgb[ix] = Math.floor(Math.random() * 256);
  });

  // Paint the discs.
  g.colors.forEach(function (color, ix, array) {
    g.mixer[color].paint();
  });

  // Select the pivot at random.
  g.mixers[Math.floor(3 * Math.random())].select();
};

window.onload = ColorSpinner.load;
