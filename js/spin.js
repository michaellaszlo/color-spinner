var ColorSpinner = {
  colors: ['red', 'green', 'blue'],
  mix: { rgb: [0, 0, 0] },
  layout: {
    canvas: { width: 1100, height: 650, left: 0, top: 0, number: 5 },
    mixer: { coarse: 1, diameter: 240, gap: 10 },
    hole: { overlap: 2 },
    smoother: 0.5,
    display: { color: '#fff', width: 100, height: 32 },
    sector: { color: '#fff' },
    grid: { coarse: 3, cell: 1, left: 0, top: 40 }
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

ColorSpinner.load = function () {
  var g = ColorSpinner,
      layout = g.layout;

  // Allocate the drawing area.
  var canvasContainer = M.make('div', { into: document.body, id: 'canvases' }),
      canvases = g.canvases = [];
  canvasContainer.style.width = layout.canvas.width + 'px';
  canvasContainer.style.height = layout.canvas.height + 'px';
  for (var i = 0; i < 5; ++i) {
    var canvas = M.make('canvas', { into: canvasContainer });
    canvas.width = layout.canvas.width;
    canvas.height = layout.canvas.height;
    canvas.context = canvas.getContext('2d');
    canvases.push(canvas);
  }

  // Make the three color discs.
  g.mixer = {};
  g.mixers = [];
  g.colors.forEach(function (color, ix, array) {
    var width = layout.mixer.diameter,
        height = width,
        left = (ix+1)*layout.mixer.gap + ix*width,
        top = layout.mixer.gap,
        mixer = g.mixer[color] = g.makeWidget(left, top, width, height),
        canvasNames = ['ring', 'hole', 'sector'];
    g.mixers.push(mixer);
    mixer.diameter = width;
    mixer.index = ix;
    mixer.canvas = {};
    mixer.context = {};
    canvasNames.forEach(function (canvasName, canvasIx) {
      mixer.canvas[canvasName] = canvases[canvasIx];
      mixer.context[canvasName] = canvases[canvasIx].context;
    });
    var label = mixer.label = M.make('div', { className: 'label',
        into: canvasContainer });
    label.innerHTML = '256<br />xFF';
    var labelWidth = label.offsetWidth,
        labelHeight = label.offsetHeight;
    label.style.width = labelWidth + 'px';
    label.style.height = labelHeight + 'px';
    label.style.left = left + (width - labelWidth)/2 + 'px';
    label.style.top = top + (height - labelHeight)/2 + 'px';
    mixer.setValue = g.makeMixerSetValue(mixer);
    mixer.paint = g.makeMixerPaint(mixer);
  });
  g.colors.forEach(function (color, ix, array) {
    g.mixer[color].setValue(0);
  });

  // Make the two-color mixing grid.
  var left = layout.grid.left,
      top = layout.grid.top,
      coarse = layout.grid.coarse,
      cell = layout.grid.cell,
      width = 256*cell,
      height = 256*cell,
      mixGrid = g.mixGrid = g.makeWidget(left, top, width, height);

};

ColorSpinner.makeMixerSetValue = function (mixer) {
  var g = ColorSpinner;
  return function (value) {
    g.mix.rgb[mixer.index] = value;
    // Display the mixer's own value.
    mixer.label.innerHTML = value + '<br />x' + g.toHex2(value);
    // Paint the other two mixers.
    for (var index = 0; index < 3; ++index) {
      if (index != mixer.index) {
        g.mixers[index].paint();
      }
    }
  };
};

ColorSpinner.makeMixerPaint = function (mixer) {
  var g = ColorSpinner,
      layout = g.layout,
      index = mixer.index;
  return function () {
    // Copy the current color value.
    var rgb = g.mix.rgb,
        currentValue = rgb[index];
    // Paint the ring with other values, sampling coarsely through the range.
    var context = mixer.context.ring,
        coarse = layout.mixer.coarse,
        radius = mixer.diameter/2,
        x0 = mixer.left + radius,
        y0 = mixer.top + radius,
        start = -Math.PI/2,
        increment = coarse * Math.PI / 128;
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
    var smoother = layout.smoother;
    context.lineWidth = smoother;
    context.strokeStyle = '#fff';
    context.beginPath()
    context.arc(x0, y0, radius + smoother/2, 0, 2*Math.PI);
    context.stroke();
    // Paint the hole.
    // Paint the sector.
    // Restore the color value.
    rgb[index] = currentValue;
  };
};

ColorSpinner.makeWidget = function (left, top, width, height) {
  var widget = {
    left: left, top: top, width: width, height: height
  };
  return widget;
};

window.onload = ColorSpinner.load;
