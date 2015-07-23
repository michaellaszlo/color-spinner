var ColorSpinner = {
  colors: ['red', 'green', 'blue'],
  rgb: [0, 0, 0],
  layout: {
    container: { width: 1100, height: 700, left: 0, top: 0, number: 5 },
    mixer: { sample: 2, diameter: 280, gap: 5, handle: 12 },
    hexagon: { height: 280 },
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
  ['pixels', 'prep', 'marking'].forEach(function (canvasName) {
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
  var markingContext = mixGrid.context.marking;
  // Draw markings for current color.
  mixGrid.mark = function () {
    var indices = getIndices();
    markingContext.clearRect(0, 0, mixGridContainerSize, mixGridContainerSize);
    var rowValue = g.rgb[indices.row],
        colValue = g.rgb[indices.col];
    markingContext.beginPath();
    markingContext.moveTo(corner.x + colValue, 0);
    markingContext.lineTo(corner.x + colValue, mixGridContainerSize);
    markingContext.moveTo(0, corner.y + rowValue);
    markingContext.lineTo(mixGridContainerSize, corner.y + rowValue);
    markingContext.stroke();
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


  // HSL and HSV calculations.
  function alphaBeta(rgb) {
    var alpha = rgb.r - (rgb.g + rgb.b) / 2,
        beta = Math.sqrt(3) * (rgb.g - rgb.b) / 2;
    return { alpha: alpha, beta: beta };
  }

  // Make a container and canvases for a hexagon.
  var hexagonHeight = layout.hexagon.height,
      hexagonRadius = hexagonHeight * Math.tan(Math.PI / 6),
      hexagonCanvasWidth = Math.ceil(2 * hexagonRadius);
  function makeHexagon() {
    var hexagon = M.make('div', { className: 'hexagon', into: drawingArea,
          unselectable: true }),
        width = hexagonCanvasWidth,
        height = hexagonHeight;
    hexagon.style.width = width + 'px';
    hexagon.style.height = height + 'px';
    hexagon.canvas = {};
    hexagon.context = {};
    ['mask', 'color', 'touch'].forEach(function (canvasName) {
      var canvas = hexagon.canvas[canvasName] = M.make('canvas',
          { into: hexagon });
      canvas.width = width;
      canvas.height = height;
      hexagon.context[canvasName] = canvas.getContext('2d');
    });
    // Paint a hexagon onto the mask canvas.
    var context = hexagon.context.mask,
        x0 = width / 2,
        y0 = height / 2;
    context.fillStyle = '#fff';
    context.fillRect(0, 0, width, height);
    context.beginPath();
    context.moveTo(width, y0);
    for (var i = 1; i <= 6; ++i) {
      var angle = i * Math.PI / 3,
          x = x0 + Math.cos(angle) * hexagonRadius,
          y = y0 + Math.sin(angle) * hexagonRadius;
      context.lineTo(x, y);
    }
    context.fillStyle = '#000';
    context.fill();
    hexagon.canvas.mask.style.visibility = 'hidden';
    // Fill the interior of the hexagon.
    context = hexagon.context.color;
    context.fillStyle = '#ccc';
    var maskData = hexagon.context.mask.getImageData(0, 0,
            width, height).data,
        queue = [ { x: Math.floor(x0), y: Math.floor(y0) } ],
        head = 1, tail = 0,
        dy = [-1, 0, 1, 0],
        dx = [0, 1, 0, -1],
        mask = new Array(width);
    for (var x = 0; x < width; ++x) {
      mask[x] = new Array(height);
    }
    mask[x0][y0] = true;
    context.fillRect(x0, y0, 1, 1);
    while (tail != head) {
      x = queue[tail].x;
      y = queue[tail].y;
      ++tail;
      for (var i = 0; i < 4; ++i) {
        var X = x + dx[i], Y = y + dy[i];
        if (X < 0 || X == width || Y < 0 || Y == height || mask[X][Y]) {
          continue;
        }
        var pos = 4 * (Y * width + X);
        if (maskData[pos] + maskData[pos+1] + maskData[pos+2] == 765) {
          continue;
        }
        mask[X][Y] = true;
        context.fillRect(X, Y, 1, 1);
        queue.push({ x: X, y: Y });
        ++head;
      }
    }
    var touchCanvas = hexagon.canvas.touch;
    touchCanvas.update = function (event) {
      var position = M.getMousePosition(event),
          x = position.x - touchCanvas.offset.left,
          y = position.y - touchCanvas.offset.top;
      if (!mask[x][y]) {
        return;
      }
      x -= x0;
      y = y0 - y;
      var r = Math.hypot(x, y),
          angle = (y >= 0 ? Math.acos(x / r) : 2*Math.PI - Math.acos(x / r));
      g.message(x+' '+y+' '+Math.round(r)+' '+Math.round(180*angle/Math.PI));
    };
    touchCanvas.onmouseover = function (event) {
      touchCanvas.update(event);
      touchCanvas.onmousemove = touchCanvas.update;
      touchCanvas.onmouseout = function () {
        touchCanvas.onmousemove = undefined;
        touchCanvas.onmouseout = undefined;
        g.message();
      };
    };
    return hexagon;
  }

  // Make hexagons for the HSL and HSV color models.
  var left = 15,
      top = mixGridContainerSize + 30;
  g.hexagon = {};
  ['hsl'].forEach(function (modelName, ix) {
    var hexagon = g.hexagon[modelName] = makeHexagon();
    // Position the container.
    hexagon.style.left = left + ix * (hexagonCanvasWidth + 15) + 'px';
    hexagon.style.top = top + 'px';
    var touchCanvas = hexagon.canvas.touch;
    touchCanvas.offset = M.getOffset(touchCanvas, document.body);
  });

  var paletteCanvas = M.make('canvas', { id: 'paletteCanvas',
        into: drawingArea }),
      paletteContext = paletteCanvas.getContext('2d');
  paletteCanvas.width = layout.container.width;
  paletteCanvas.height = layout.container.height - layout.grid.top - 30 -
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

ColorSpinner.message = function (s) {
  var container = document.getElementById('debug');
  if (s === undefined) {
    container.innerHTML = '';
    container.style.visibility = 'hidden';
    return;
  }
  container.style.visibility = 'visible';
  container.innerHTML = s;
};

window.onload = ColorSpinner.load;
