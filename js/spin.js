var ColorSpinner = {
  colors: ['red', 'green', 'blue'],
  mix: { rgb: [0, 0, 0] },
  layout: {
    canvas: { width: 1100, height: 650, left: 0, top: 0, number: 5 },
    mixer: { coarse: 1, diameter: 240, gap: 10 },
    hole: { radius: { proportion: 0.4 } },
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
  var drawingArea = M.make('div', { id: 'drawingArea', into: document.body }),
      canvases = g.canvases = [];
  drawingArea.style.width = layout.canvas.width + 'px';
  drawingArea.style.height = layout.canvas.height + 'px';

  function makeMixer() {
    var mixer = M.make('div', { className: 'mixer', into: drawingArea });
    var canvases = mixer.canvases = [];
    mixer.canvas = {};
    mixer.context = {};
    ['ring', 'hole', 'sector'].forEach(function (canvasName) {
      var canvas = M.make('canvas', { into: mixer });
      canvas.width = canvas.height = layout.mixer.diameter;
      canvases.push(canvas);
      mixer.canvas[canvasName] = canvas;
      mixer.context[canvasName] = canvas.getContext('2d');
    });
    function mouseMove (event) {
      var event = event || window.event;
    }
    mixer.onmouseover = function () {
      mixer.onmousemove = mouseMove;
    };
    mixer.onmouseout = function () {
      mixer.onmousemove = undefined;
    };
    mixer.onmousedown = function () {
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
    mixer.style.left = (ix+1)*layout.mixer.gap + ix*diameter + 'px';
    mixer.style.top = layout.mixer.gap + 'px';
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
    mixer.setValue = g.makeMixerSetValue(mixer);
    mixer.paint = g.makeMixerPaint(mixer);
  });
  g.colors.forEach(function (color, ix, array) {
    g.mixer[color].setValue(Math.floor(Math.random() * 256));
  });
  g.colors.forEach(function (color, ix, array) {
    g.mixer[color].paint();
  });

  // Make the two-color mixing grid.
  var left = layout.grid.left,
      top = layout.grid.top,
      coarse = layout.grid.coarse,
      cell = layout.grid.cell,
      width = 256*cell,
      height = 256*cell,
      mixGrid = M.make('div', { into: drawingArea });

};

ColorSpinner.makeMixerSetValue = function (mixer) {
  var g = ColorSpinner;
  return function (value) {
    g.mix.rgb[mixer.index] = value;
    // Display the mixer's own value.
    mixer.label.innerHTML = value + '<br />' + g.toHex2(value);
  };
};

ColorSpinner.makeMixerPaint = function (mixer) {
  var g = ColorSpinner,
      layout = g.layout,
      index = mixer.index;
  return function () {
    // Copy the current RGB tuple.
    var rgb = g.mix.rgb.slice(),
        currentValue = rgb[index];
    // Paint the ring with other values, sampling coarsely through the range.
    var context = mixer.context.ring,
        coarse = layout.mixer.coarse,
        radius = mixer.diameter/2,
        x0 = radius;
        y0 = radius,
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
    context = mixer.context.hole;
    context.clearRect(mixer.left, mixer.top, mixer.width, mixer.height);
    radius *= layout.hole.radius.proportion;
    rgb = [0, 0, 0];
    rgb[index] = currentValue;
    context.fillStyle = 'rgb(' + rgb.join(', ') + ')';
    context.beginPath();
    context.arc(x0, y0, radius, 0, 2*Math.PI);
    context.lineWidth = 2;
    context.strokeStyle = '#000';
    context.fill();
    // Paint the sector.
  };
};

window.onload = ColorSpinner.load;
