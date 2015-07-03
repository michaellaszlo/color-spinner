var ColorSpinner = {
  colors: ['red', 'green', 'blue'],
  rgb: [0, 0, 0],
  layout: {
    canvas: { width: 1100, height: 650, left: 0, top: 0, number: 5 },
    controls: { width: 300, height: 250 },
    mixer: { coarse: 1, diameter: 200, gap: 10 },
    hole: { radius: { proportion: 0.42 } },
    smoother: 0.5,
    sector: { color: '#fff', band: { proportion: 0.75 } },
    grid: { left: 10, coarse: 3, cell: 1, edge: 5 },
    select: { width: 4 }
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

ColorSpinner.addMixerFunctions = function (mixer) {
  var g = ColorSpinner,
      layout = g.layout,
      index = mixer.index,
      diameter = mixer.diameter,
      radius = diameter/2,
      x0 = radius,
      y0 = radius,
      coarse = layout.mixer.coarse,
      start = -Math.PI/2,
      increment = coarse * Math.PI / 128,
      smoother = layout.smoother,
      holeRadius = layout.hole.radius.proportion * radius,
      bandWidth = radius - holeRadius,
      sectorLength = layout.sector.band.proportion * bandWidth;
  mixer.paint = function () {
    // Copy the current RGB tuple.
    var rgb = g.rgb.slice(),
        currentValue = rgb[index],
        //contrastValue = 255 - Math.floor(Math.pow(currentValue / 40.21, 3)),
        contrastValue = 255 - Math.floor(Math.pow(currentValue / 15.96, 2)),
        //contrastValue = 192 - Math.floor(128 * currentValue / 255),
        //contrastValue = (currentValue < 128 ? 223 : 191),
        contrastRgb = [contrastValue, contrastValue, contrastValue],
        context = mixer.context.ring;
    var contrastColor = mixer.contrastColor = 'rgb(' + contrastRgb + ')';
    // Display the mixer's value.
    mixer.label.innerHTML = currentValue + '<br />' + g.toHex2(currentValue);
    mixer.label.style.color = contrastColor;
    // Paint the ring with other values, sampling coarsely through the range.
    context.lineWidth = radius;
    for (var x = 0; x < 256; x += coarse) {
      var angleFrom = start + x * Math.PI / 128,
          angleTo = start + Math.min(256, x + 2*coarse) * Math.PI / 128;
      rgb[index] = x;
      context.strokeStyle = 'rgb(' + rgb.join(', ') + ')';
      context.beginPath();
      context.arc(x0, y0, radius/2, angleFrom, angleTo);
      context.stroke();
    }
    // Paint a white smoothing ring.
    context.lineWidth = smoother;
    context.strokeStyle = '#fff';
    context.beginPath()
    context.arc(x0, y0, radius + smoother/2, 0, 2*Math.PI);
    context.stroke();
    // Paint the hole.
    context = mixer.context.hole;
    context.clearRect(0, 0, diameter, diameter);
    rgb = [0, 0, 0];
    rgb[index] = currentValue;
    context.fillStyle = 'rgb(' + rgb.join(', ') + ')';
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
    context.arc(x0, y0, radius - sectorLength/2, angleFrom, angleTo);
    //context.arc(x0, y0, holeRadius + bandWidth/2, angleFrom, angleTo);
    context.stroke();
  };
  var selectContext = mixer.context.select;
  selectContext.lineWidth = layout.select.width;
  mixer.select = function () {
    if (g.holdIndex !== undefined) {
      g.mixers[g.holdIndex].deselect();
    }
    g.holdIndex = index;
    selectContext.strokeStyle = mixer.contrastColor;
    selectContext.beginPath();
    selectContext.arc(x0, y0, holeRadius, 0, 2*Math.PI);
    selectContext.stroke();
    g.mixGrid.paint();
  };
  mixer.deselect = function () {
    selectContext.clearRect(0, 0, diameter, diameter);
  };
};

ColorSpinner.load = function () {
  var g = ColorSpinner,
      layout = g.layout,
      diameter = layout.mixer.diameter,
      totalRadius = diameter/2,
      center = { x: totalRadius, y: totalRadius },
      holeRadius = layout.hole.radius.proportion * totalRadius;

  // Allocate the drawing area.
  var drawingArea = M.make('div', { id: 'drawingArea', into: document.body }),
      canvases = g.canvases = [];
  drawingArea.style.width = layout.canvas.width + 'px';
  drawingArea.style.height = layout.canvas.height + 'px';

  function makeMixer() {
    var mixer = M.make('div', { className: 'mixer', into: drawingArea });
    mixer.style.width = diameter + 'px';
    mixer.style.height = diameter + 'px';
    mixer.context = {};
    ['ring', 'hole', 'select', 'sector'].forEach(function (canvasName) {
      var canvas = M.make('canvas', { into: mixer });
      canvas.width = canvas.height = layout.mixer.diameter;
      mixer.context[canvasName] = canvas.getContext('2d');
    });
    function mouseMove (event) {
      event = event || window.event;
    }
    mixer.onmouseover = function () {
      mixer.onmousemove = mouseMove;
    };
    mixer.onmouseout = function () {
      mixer.onmousemove = undefined;
    };
    mixer.onmousedown = function (event) {
      var position = M.getMousePosition(event),
          x = position.x - mixer.offset.left - center.x,
          y = mixer.offset.top + center.y - position.y,
          distance = Math.hypot(x, y);
      if (distance <= holeRadius) {
        mixer.select();
      } else if (distance <= totalRadius) {
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
        }
      }
    };
    return mixer;
  }

  // Make the three color discs.
  g.mixer = {};
  g.mixers = [];
  g.colors.forEach(function (color, ix, array) {
    var mixer = g.mixer[color] = makeMixer(),
        diameter = layout.mixer.diameter,
        width = diameter,
        height = diameter;
    g.mixers.push(mixer);
    mixer.style.left = layout.controls.width +
        ix * (layout.mixer.gap + diameter) + 'px';
    mixer.style.top = layout.mixer.gap + 'px';
    mixer.offset = M.getOffset(mixer, document.body);
    mixer.diameter = diameter;
    mixer.color = color;
    mixer.index = ix;
    var label = mixer.label = M.make('div', { className: 'label',
        into: mixer });
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
  var coarse = layout.grid.coarse,
      cell = layout.grid.cell,
      gridSize = 256*cell,
      edge = layout.grid.edge,
      containerSize = 2*edge + gridSize,
      mixGrid = g.mixGrid = M.make('div', { id: 'mixGrid',
          into: drawingArea });
  mixGrid.style.left = layout.grid.left + 'px';
  mixGrid.style.top = layout.controls.height + 'px';
  mixGrid.style.width = containerSize + 'px';
  mixGrid.style.height = containerSize + 'px';
  mixGrid.context = {};
  ['pixels'].forEach(function (canvasName) {
    var canvas = M.make('canvas', { into: mixGrid });
    canvas.width = canvas.height = containerSize;
    mixGrid.context[canvasName] = canvas.getContext('2d');
  });

  context = mixGrid.context.pixels;
  mixGrid.paint = function () {
    var rgb = g.rgb.slice(),
        rowIndex = 1,
        colIndex = 2;
    if (g.holdIndex == 1) {
      rowIndex = 0;
      colIndex = 2;
    } else if (g.holdIndex == 2) {
      rowIndex = 0;
      colIndex = 1;
    }
    for (r = 0; r < 256; r += coarse) {
      rgb[rowIndex] = r;
      for (c = 0; c < 256; c += coarse) {
        rgb[colIndex] = c;
        context.fillStyle = 'rgb(' + rgb.join(', ') + ')';
        context.fillRect(c, r,
            Math.min(256-c, coarse), Math.min(256-r, coarse));
      }
    }
  }

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
