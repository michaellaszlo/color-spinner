var ColorSpinner = {
  colors: ['red', 'blue', 'green'],
  mix: { rgb: [0, 0, 0] },
  layout: {
    canvas: { width: 1100, height: 650, left: 0, top: 0, number: 5 },
    mixer: { size: 240, gap: 10 },
    canvas: { size: 256, gap: 10 },
    hole: { overlap: 2 },
    smoother: 1,
    ring: { width: 80 },
    display: { color: '#fff', width: 100, height: 32 },
    sector: { color: '#fff' },
    grid: { scale: 3, cell: 1, left: 0, top: 40 },
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

ColorSpinner.load = function () {
  var g = ColorSpinner,
      layout = g.layout;

  // Allocate the drawing surface.
  var canvasContainer = M.make('div', { into: document.body, id: 'canvases' }),
      canvases = g.canvases = [];
  canvasContainer.style.width = layout.canvas.width + 'px';
  canvasContainer.style.height = layout.canvas.height + 'px';
  for (var i = 0; i < 5; ++i) {
    var canvas = M.make('canvas', { into: canvasContainer });
    canvas.width = layout.canvas.width;
    canvas.height = layout.canvas.height;
    canvases.push(canvas);
  }

  // Make the three color discs.
  g.mixer = {};
  g.colors.forEach(function (color, ix, array) {
    var width = layout.mixer.size,
        height = width,
        left = (ix+1)*layout.mixer.gap + ix*width,
        top = layout.mixer.gap,
        mixer = g.mixer[color] = g.makeWidget(left, top, width, height),
        canvasNames = ['ring', 'hole', 'sector'];
    mixer.index = ix;
    mixer.canvas = {};
    mixer.context = {};
    canvasNames.forEach(function (canvasName, canvasIx) {
      mixer.canvas[canvasName] = canvases[canvasIx];
      mixer.context[canvasName] = canvases[canvasIx].getContext('2d');
    });
    mixer.context.ring.fillStyle = '#eee';
    mixer.context.ring.fillRect(mixer.left, mixer.top, mixer.width,mixer.height);
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
  });
  g.colors.forEach(function (color, ix, array) {
    g.mixer[color].setValue(0);
  });

  // Make the two-color mixing grid.
  var left = layout.grid.left,
      top = layout.grid.top,
      scale = layout.grid.scale,
      cell = layout.grid.cell,
      width = 256*cell,
      height = 256*cell,
      mixGrid = g.mixGrid = g.makeWidget(left, top, width, height);

};

ColorSpinner.makeMixerSetValue = function (mixer) {
  var g = ColorSpinner,
      index = mixer.index,
      layout = g.layout,
      label = mixer.label;
  return function (value) {
    var rgb = g.mix.rgb;
    rgb[index] = value;
    label.innerHTML = value + '<br />x' + g.toHex2(value);
  };
};

ColorSpinner.makeWidget = function (left, top, width, height) {
  var widget = {
    left: left, top: top, width: width, height: height
  };
  return widget;
};

window.onload = ColorSpinner.load;
