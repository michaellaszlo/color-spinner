var ColorSpinner = {
  colors: ['red', 'green', 'blue'],
  rgb: [0, 0, 0],
  layout: {
    container: { width: 1100, height: 700, left: 0, top: 0, number: 5 },
    mixer: { sample: 2, diameter: 280, gap: 5, handle: 12 },
    hexagon: { height: 280 },
    slider: { height: 280, width: 50, bar: { width: 8, overhang: 2 } },
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
	show: { ring: { solid: false, mix: true } },
  hsv: {},
  cache: {
    hexagonRadiusAtHue: {}
  }
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
  return 'rgb(' + rgb[0] + ', ' + rgb[1] + ', ' + rgb[2] + ')';
};

ColorSpinner.decimal = function (x, numDigits) {
  var whole = Math.floor(x),
      fraction = x - whole,
      digits = '' + Math.round(Math.pow(10, numDigits) * fraction);
  while (digits.length < numDigits) {
    digits = '0' + digits;
  }
  return whole + '.' + digits;
};

ColorSpinner.hexagonRadiusAtHue = function(H) {
  var cache = ColorSpinner.cache.hexagonRadiusAtHue,
      lookup = cache[H];
  if (lookup !== undefined) {
    return lookup;
  }
  var h = H % 60,
      slope = Math.tan(h / 180 * Math.PI),
      x = 1 / (slope / Math.sqrt(3) + 1),
      y = x * slope,
      R = Math.hypot(x, y);  // Outer radius, i.e., hexagon radius.
  cache[H] = R;
  return R;
};
ColorSpinner.hexagonXYtoRGB = function(x1, y1, value) {
  var g = ColorSpinner;
  if (value === undefined) {
    value = g.value;
  }
  var r = Math.hypot(x1, y1),  // Inner radius.
      angle = 0;
  if (r != 0) {
      angle = (y1 >= 0 ? Math.acos(x1 / r) :
                         2*Math.PI - Math.acos(x1 / r));
  }
  var H = Math.floor(180 * angle / Math.PI),
      R = g.hexagonRadiusAtHue(H) * g.hexagonRadius,
      saturation = Math.min(1, r / R),  // ratio of inner to outer radius.
      C = saturation * value,
      h = H / 60,
      X = C * (1 - Math.abs(h % 2 - 1)),
      m = value - C,
      rgb;
  if (h < 1) {
    rgb = [C, X, 0];
  } else if (h < 2) {
    rgb = [X, C, 0];
  } else if (h < 3) {
    rgb = [0, C, X];
  } else if (h < 4) {
    rgb = [0, X, C];
  } else if (h < 5) {
    rgb = [X, 0, C];
  } else {
    rgb = [C, 0, X];
  }
  rgb[0] = Math.round(255 * (rgb[0] + m));
  rgb[1] = Math.round(255 * (rgb[1] + m));
  rgb[2] = Math.round(255 * (rgb[2] + m));
  return rgb;
};

ColorSpinner.hsv.mark = function (x, y, value) {
  // Update hexagon cursor.
  var g = ColorSpinner,
      hexagon = g.hexagon.hsv,
      canvas = hexagon.canvas.touch,
      width = canvas.width,
      height = canvas.height,
      context = hexagon.context.touch;
  context.clearRect(0, 0, width, height);
  context.beginPath();
  context.arc(x, y, 7.5, 0, 2 * Math.PI);
  context.stroke();
  // Update hexagon background.
  var step = Math.max(1, Math.round(value * hexagon.cached.steps));
  hexagon.context.color.drawImage(hexagon.cached.canvas[step], 0, 0);
  // Update slider.
  var slider = g.hexagon.hsv.slider,
      barCanvas = slider.canvas.bar,
      barContext = slider.context.bar,
      sliderLayout = g.layout.slider,
      sliderHeight = sliderLayout.height,
      sliderWidth = sliderLayout.width,
      barWidth = sliderLayout.bar.width,
      barTop = Math.round((1 - value) * (sliderHeight - barWidth));
  barContext.clearRect(0, 0, sliderWidth, sliderHeight);
  barContext.fillRect(0, barTop, sliderWidth, barWidth);
};

ColorSpinner.hsv.update = function () {
  var g = ColorSpinner,
      rgb = g.rgb,
      R = rgb[0] / 255, G = rgb[1] / 255, B = rgb[2] / 255,
      /* Calculation for a circle.
      alpha = R - (G + B) / 2,
      beta = Math.sqrt(3) * (G - B) / 2,
      H = Math.atan2(beta, alpha),
      C = Math.hypot(alpha, beta);
      if (H < 0) {
        H += 2 * Math.PI;
      }
      H = H / Math.PI * 180;
      */
      max = Math.max(R, G, B),
      min = Math.min(R, G, B),
      C = max - min,
      h;
  // Convert RGB to HSV.
  if (max == min) {
    h = 0;
  } else if (max == R) {
    h = ((G - B) / C) % 6;
  } else if (max == G) {
    h = (B - R) / C + 2;
  } else {
    h = (R - G) / C + 4;
  }
  if (h < 0) {
    h += 6;
  }
  var H = Math.floor(60 * h),
      angle = h * Math.PI / 3,
      value = g.value = max,
      saturation = (value == 0 ? 0 : C / value);
  // Convert HSV to coordinates in hexagon.
  var hexagon = g.hexagon.hsv,
      canvas = hexagon.canvas.touch,
      context = hexagon.context.touch,
      width = canvas.width,
      height = canvas.height,
      hexagonRadius = width / 2,
      x0 = hexagonRadius,
      y0 = height / 2,
      r = saturation * g.hexagonRadiusAtHue(H) * hexagonRadius,
      x = Math.round(x0 + r * Math.cos(angle)),
      y = Math.round(y0 - r * Math.sin(angle));
  x = Math.max(0, Math.min(x, width));
  y = Math.max(0, Math.min(y, height));

  g.message('HSV('+g.decimal(H, 2)+', '+g.decimal(saturation, 2)+', '+
      g.decimal(value, 2)+')'+'<br />angle = '+g.decimal(angle, 3)+
      ', r = '+ g.decimal(r, 2)+', x = '+x+', y = '+y, 'HSV');
  g.hsv.mark(x, y, value);
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
  var startTime = performance.now();
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
      g.hsv.update();
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
    g.hsv.update();
  };
  mixGrid.onmousedown = function (event) {
    mixGrid.update(event);
    window.onmousemove = mixGrid.update;
    window.onmouseup = function () {
      window.onmousemove = undefined;
      window.onmouseup = undefined;
    };
  };

  // Make a container and canvases for a hexagon.
  var hexagonHeight = layout.hexagon.height,
      hexagonRadius = g.hexagonRadius = hexagonHeight * Math.tan(Math.PI / 6),
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
    ['mask', 'color', 'highlight', 'touch'].forEach(function (canvasName) {
      var canvas = hexagon.canvas[canvasName] = M.make('canvas',
          { into: hexagon });
      canvas.width = width;
      canvas.height = height;
      hexagon.context[canvasName] = canvas.getContext('2d');
    });

    // Use geometric operations to paint a hexagon onto the mask layer.
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

    // Scan the pixels to make a boolean mask of the hexagon.
    var maskData = hexagon.context.mask.getImageData(0, 0, width, height).data,
        mask = hexagon.mask = new Array(width);
    for (var x = 0; x < width; ++x) {
      var maskRow = mask[x] = new Array(height);
      for (var y = 0; y < height; ++y) {
        var pos = 4 * (y * width + x),
            sum = maskData[pos] + maskData[pos + 1] + maskData[pos + 2];
        maskRow[y] = (sum != 765);
      }
    }

    // Follow the mask to paint hexagons for several V/L settings in advance.
    var startTime = performance.now();
    hexagon.cached = {
      steps: 25, canvas: [], context: []
    };
    var steps = hexagon.cached.steps;
    for (var i = 1; i <= steps; ++i) {
      var value = i / steps,
          canvas = hexagon.cached.canvas[i] = M.make('canvas');
      console.log('Painting hexagon '+i+', value '+value);
      canvas.width = width;
      canvas.height = height;
      var context = hexagon.cached.context[i] = canvas.getContext('2d');
      for (var x = 0; x < width; ++x) {
        for (var y = 0; y < height; ++y) {
          if (!mask[x][y]) {
            continue;
          }
          // Calculate the chroma at this point.
          var x1 = x - x0,
              y1 = y0 - y;
          var rgb = g.hexagonXYtoRGB(x1, y1, value);
          var css = g.rgbToCss(rgb);
          context.fillStyle = css;
          context.fillRect(x, y, 1, 1);
        }
      }
    }
    var elapsed = (performance.now() - startTime) / 1000;
    console.log('prepared '+steps+' hexagons in '+g.decimal(elapsed, 3)+' s');
    hexagon.context.color.drawImage(hexagon.cached.canvas[steps], 0, 0);

    var touchCanvas = hexagon.canvas.touch,
        touchContext = hexagon.context.touch,
        width = touchCanvas.width,
        height = touchCanvas.height,
        highlightContext = hexagon.context.highlight;
    touchContext.lineWidth = 2;
    touchContext.strokeStyle = '#333';
    highlightContext.lineWidth = 2;
    highlightContext.strokeStyle = '#fff';
    touchCanvas.hover = function (event) {
      var position = M.getMousePosition(event),
          x = position.x - touchCanvas.offset.left,
          y = position.y - touchCanvas.offset.top;
      highlightContext.clearRect(0, 0, width, height);
      if (!mask[x][y]) {
        return;
      }
      var x1 = x - width / 2, y1 = height / 2 - y,
          rgb = g.hexagonXYtoRGB(x1, y1),
          r = Math.hypot(x1, y1),  // Inner radius.
          angle = 0;
      if (r != 0) {
        angle = (y1 >= 0 ? Math.acos(x1 / r) : 2*Math.PI - Math.acos(x1 / r));
      }
      // Highlight the area under the mouse.
      highlightContext.beginPath();
      highlightContext.arc(x, y, 5.5, 0, 2 * Math.PI);
      highlightContext.stroke();
      g.message('RGB(' + rgb[0] + ', ' + rgb[1] + ', ' + rgb[2] + ')<br />' +
          'value = ' + g.decimal(g.value, 2) + '<br />' +
          'angle = ' + g.decimal(angle, 3) + ', r = ' + g.decimal(r, 2) +
          ', x = ' + x + ', y = ' + y);
    };
    touchCanvas.startHover = function (event) {
      touchCanvas.hover(event);
      touchCanvas.onmousemove = touchCanvas.hover;
      touchCanvas.onmouseout = function () {
        touchCanvas.onmouseout = undefined;
        touchCanvas.onmousemove = undefined;
        highlightContext.clearRect(0, 0, width, height);
      };
    };
    touchCanvas.onmouseover = touchCanvas.startHover;
    touchCanvas.press = function (event) {
      var position = M.getMousePosition(event),
          x = position.x - touchCanvas.offset.left,
          y = position.y - touchCanvas.offset.top;
      if (!mask[x][y]) {
        return;
      }
      highlightContext.clearRect(0, 0, width, height);
      var x1 = x - width / 2, y1 = height / 2 - y;
      g.rgb = g.hexagonXYtoRGB(x1, y1);
      g.mixers.forEach(function (mixer) {
        mixer.paint();
      });
      g.mixGrid.paint();
      g.mixGrid.mark();
      g.hsv.mark(x, y, g.value);
    };
    touchCanvas.onmousedown = function (event) {
      touchCanvas.onmouseover = undefined;
      touchCanvas.press(event);
      touchCanvas.onmousemove = touchCanvas.press;
      touchCanvas.onmouseover = function (event) {
        touchCanvas.onmousemove = touchCanvas.onmousedown;
      };
      window.onmouseup = function () {
        window.onmouseup = undefined;
        touchCanvas.onmousemove = touchCanvas.startHover;
        touchCanvas.onmouseover = touchCanvas.startHover;
      }
    };
    return hexagon;
  }

  var sliderCanvasWidth = g.layout.slider.width,
      sliderHeight = g.layout.slider.height,
      sliderWidth = sliderCanvasWidth,
      barOverhang = g.layout.slider.bar.overhang,
      barLength = sliderCanvasWidth - 2 * barOverhang,
      barWidth = g.layout.slider.bar.width;
  function makeSlider() {
    var slider = M.make('div', { className: 'slider', into: drawingArea,
        unselectable: true }),
        width = sliderCanvasWidth,
        height = sliderHeight;
    slider.style.width = width + 'px';
    slider.style.height = height + 'px';
    slider.canvas = {};
    slider.context = {};
    ['gradient', 'bar', 'touch'].forEach(function (canvasName) {
      var canvas = slider.canvas[canvasName] = M.make('canvas',
          { into: slider });
      canvas.width = width;
      canvas.height = height;
      slider.context[canvasName] = canvas.getContext('2d');
    });
    // Paint the slider with a gradient to indicate value/lightness.
    var context = slider.context.gradient,
        gradient = context.createLinearGradient(
            sliderWidth / 2, 0,
            sliderWidth / 2, sliderHeight);
    gradient.addColorStop(0, '#fff');
    gradient.addColorStop(1, '#000');
    context.fillStyle = gradient;
    context.fillRect(barOverhang, 0, barLength, sliderHeight);
    return slider;
  }

  // Make hexagons for the HSL and HSV color models.
  var left = 15,
      top = mixGridContainerSize + 30;
  g.hexagon = {};
  ['hsv'].forEach(function (modelName, ix) {
    // Make the hexagon and the value/lightness slider.
    var hexagon = g.hexagon[modelName] = makeHexagon(),
        slider = hexagon.slider = makeSlider();
    // Position the hexagon and slider. Precalculate document offsets.
    hexagon.style.left = left + 'px';
    hexagon.style.top = top + 'px';
    left += hexagonCanvasWidth + 15;
    var touchCanvas = hexagon.canvas.touch;
    touchCanvas.offset = M.getOffset(touchCanvas, document.body);
    slider.style.left = left + 'px';
    slider.style.top = top + 'px';
    left += sliderCanvasWidth;
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

  g.hsv.update();
  var elapsed = (performance.now() - startTime) / 1000;
  console.log('loaded in '+g.decimal(elapsed, 3)+' s');
};

ColorSpinner.message = function (s, prefix) {
  if (prefix === undefined) {
    prefix = '';
  }
  var container = document.getElementById('debug' + prefix);
  if (s === undefined) {
    container.innerHTML = '';
    container.style.visibility = 'hidden';
    return;
  }
  container.style.visibility = 'visible';
  container.innerHTML = s;
};

window.onload = ColorSpinner.load;
