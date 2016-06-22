// color.spinner.js
'use strict';
var Color,
    HexagonPicker,
    NameConverter,
    SwatchManager,
    ColorSpinner;


//==== constructor: Color

Color = function () {
  var argument;

  if (arguments.length == 0) {
    this.r = Math.floor(256 * Math.random());
    this.g = Math.floor(256 * Math.random());
    this.b = Math.floor(256 * Math.random());
    return;
  }

  if (arguments.length == 1) {
    argument = arguments[0];
    if (typeof argument == 'string' || argument instanceof String) {
      if (!this.parse(argument)) {
        this.error = 'Unable to parse "' + argument + '"';
      }
      return;
    }
    if (argument instanceof Object) {
      this.r = argument.r;
      this.g = argument.g;
      this.b = argument.b;
      return;
    }
    this.error = 'Invalid argument';
    return;
  }

  if (arguments.length == 3) {
    this.r = arguments[0];
    this.g = arguments[1];
    this.b = arguments[2];
    return;
  }

  this.error = 'Incorrect number of arguments';
};

Color.prototype.equals = function (color) {
  if (!(color instanceof Object)) {
    return false;
  }
  return this.r === color.r && this.g === color.g && this.b === color.b;
};

Color.prototype.parse = function (s) {
  // Color string formats: https://www.w3.org/wiki/CSS/Properties/color
  var groups,
      i, x,
      keys = [ 'r', 'g', 'b' ];
  s = s.replace(/\s+/g, '');
  // Hexagon value.
  groups = s.match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (groups !== null) {
    s = groups[1];
    if (s.length == 3) {
      for (i = 0; i < 3; ++i) {
        x = parseInt(s.charAt(i), 16);
        this[keys[i]] = 16 * x + x;
      }
    } else {
      for (i = 0; i < 3; ++i) {
        this[keys[i]] = parseInt(s.substring(2 * i, 2 * i + 2), 16);
      }
    }
    return true;
  }
  return false;
};

Color.prototype.componentString = function (x, format) {
  // Render RGB component to a string with up to three significant digits.
  var value = this[x],
      s;
  if (format == 1 || format == 'decimal' || format == 'fractional') {
    if (value == 255) {
      return '1';
    }
    if (value == 0) {
      return '0';
    }
    return ('' + value / 255).substring(0, 5);
  }
  if (format == 100 || format == '%' || format == 'percent' ||
      format == 'percentage') {
    if (value == 255) {
      return '100%';
    }
    if (value == 0) {
      return '0%';
    }
    s = '' + value / 2.55;
    if (value < 3) {  // 0.nnn
      return s.substring(0, 5) + '%';
    }
    return s.substring(0, 4) + '%';
  }
  return value;
};

Color.prototype.toString = function () {
  return this.rgbString(255);
};

Color.prototype.rgbString = function (format) {
  return 'rgb(' + this.componentString('r', format) + ', ' +
      this.componentString('g', format) + ', ' +
      this.componentString('b', format) + ')';
};

Color.prototype.hexString = function () {
  var parts = [],
      i, s;
  for (i = 0; i < 3; ++i) {
    s = (new Number(this['rgb'.charAt(i)])).toString(16);
    parts.push(s.length == 1 ? '0' + s : s);
  }
  return '#' + parts.join('');
};

Color.prototype.hslString = function (format) {
};

Color.prototype.hsvString = function (format) {
};


//==== module: HexagonPicker
// uses M, Color

HexagonPicker = (function () {
  var pi = Math.PI,
      circle = 2 * pi,
      sixth = pi / 3,
      sqrt3 = Math.sqrt(3),
      dx = [ 0, 1, 0, -1 ],
      dy = [ -1, 0, 1, 0 ],
      state = {
        macro: { dragging: false },
        micro: {}
      },
      picked = {
        color: null,
        point: null
      },
      zoomPoint = {},  // slider's center (physical) in macro view
      pickPoint = {},  // active point (physical) in macro view
      refinePoint = {},  // slider's center (physical) in micro (zoomed) view
      dimensions = {
        hexagon: { scale: 4 }
      },
      masks = {},
      canvases = {};

  function paintHexagon(canvas, x0, y0, radius, thickness, color) {
    var context = canvas.getContext('2d'),
        i, angle, x, y;
    context.moveTo(canvas.width, y0);
    context.beginPath();
    for (i = 1; i <= 6; ++i) {
      angle = i * sixth,
      x = x0 + Math.cos(angle) * radius,
      y = y0 + Math.sin(angle) * radius;
      context.lineTo(x, y);
    }
    context.closePath();
    context.lineWidth = thickness;
    context.strokeStyle = color;
    context.stroke();
  }

  function paintHexagonFrame(canvas) {
    var hex = dimensions.hexagon,
        x0 = hex.x0,
        y0 = hex.y0,
        r = hex.macroRadius,
        b = hex.macroBorder,
        B = 2.5 * hex.microPointRadius;
    console.log(B);
    paintHexagon(canvas, x0, y0, r + (b + B) / 2, B, '#fff');
    paintHexagon(canvas, x0, y0, r + b / 2, b, '#999');
  }

  function sectorAngleAtPoint(x, y) {
    var fatAngle = Math.atan2(y, x) + circle,
        angle = (fatAngle < circle ? fatAngle : fatAngle - circle),
        sectorReal = angle / sixth,
        sectorIndex = Math.floor(sectorReal);
    return (sectorReal - sectorIndex) * sixth;
  }

  function microGrab(event) {
    state.micro.dragging = true;
    state.micro.justGrabbed = true;
    microDrag.call(this, event);
    document.body.style.cursor = 'crosshair';
  }

  function microRelease(event) {
    state.micro.dragging = false;
    document.body.style.cursor = 'default';
  }

  function microDrag(event) {
    if (!state.micro.dragging) {
      return;
    }
    var position = M.getMousePosition(event),
        offset = this.offset,
        hex = dimensions.hexagon,
        macroRadius = hex.macroRadius,
        microRadius = hex.microRadius,
        scale = hex.scale,
        macroBorder = hex.macroBorder,
        x = position.x - offset.left,  // (x, y) is in the canvas
        y = position.y - offset.top,
        angle,
        pickX, pickY, pickColor,
        x0 = hex.x0,
        y0 = hex.y0,
        x1 = x - x0,  // (x1, y1) is in the sector's coordinate space
        y1 = y0 - y,
        d1 = Math.hypot(x1, y1),
        slope = Math.tan(sectorAngleAtPoint(x1, y1)),
        factor = 1 / (1 + slope / sqrt3),
        r2 = macroRadius + macroBorder,
        x2 = factor * r2,
        y2 = slope * x2,
        d2 = Math.hypot(x2, y2);  // fence for the initial click
    if (state.micro.justGrabbed) {
      state.micro.justGrabbed = false;
      if (d1 > d2) {
        state.micro.dragging = false;
        return;
      }
    }
    r2 = macroRadius;
    x2 = factor * r2;
    y2 = slope * x2;
    d2 = Math.hypot(x2, y2);  // fence for zoom pixels
    if (d1 > d2) {
      angle = Math.atan2(y1, x1);
      x1 = d2 * Math.cos(angle);
      y1 = d2 * Math.sin(angle);
    }
    refinePoint.x = x0 + x1;
    refinePoint.y = y0 - y1;
    pickX = zoomPoint.x + x1 / scale;
    pickY = zoomPoint.y - y1 / scale;
    pickColor = xyToRgb(pickX - x0, y0 - pickY);
    setColor(pickColor);
  }

  function setColor(color) {
    var point = rgbToXy(color);
    picked.color = color;
    picked.point = point;
    showPoint(point.x, point.y);
  }

  function showPoint(x, y) {
    var canvas = canvases.macro.pick,
        context = canvas.getContext('2d'),
        hex = dimensions.hexagon,
        macroRadius = hex.macroRadius,
        microRadius = hex.microRadius,
        macroBorder = hex.macroBorder,
        scale = hex.scale,
        macroPointRadius = hex.macroPointRadius,
        microPointRadius = hex.microPointRadius,
        x0 = hex.x0,
        y0 = hex.y0,
        x1 = x + x0 - zoomPoint.x,  // displacement from the slider's center
        y1 = y - y0 + zoomPoint.y,
        d1 = Math.hypot(x1, y1),
        angle,
        slope = Math.tan(sectorAngleAtPoint(x1, y1)),
        factor = 1 / (1 + slope / sqrt3),
        r2 = microRadius,
        x2 = factor * r2,
        y2 = slope * x2,
        d2 = Math.hypot(x2, y2),  // fence for point within slider
        x3 = x0 + x1 * scale,
        y3 = y0 - y1 * scale,
        d, r4, x4, y4, d4;
    // Draw point in macro area (overall color hexagon).
    clearCanvas(canvas);
    context.beginPath();
    context.arc(hex.x0 + x, hex.y0 - y, 2, 0, circle);
    context.closePath();
    context.fill();
    // Snap slider to point
    if (d1 > d2 + macroPointRadius) {
      d = Math.hypot(x, y);  // distance from center of main view
      slope = Math.tan(sectorAngleAtPoint(x, y));
      factor = 1 / (1 + slope / sqrt3);
      r4 = macroRadius;
      x4 = factor * r4;
      y4 = slope * x4;
      d4 = Math.hypot(x4, y4);  // fence for main view
      console.log(d, d4);
    }
    // Draw point in micro area (zoomed view).
    canvas = canvases.micro.pick;
    clearCanvas(canvas);
    context = canvas.getContext('2d');
    context.strokeStyle = '#000';
    context.lineWidth = 1;
    context.beginPath();
    context.arc(x3, y3, microPointRadius, 0, circle);
    context.closePath();
    context.stroke();
    context.strokeStyle = '#fff';
    context.lineWidth = 1;
    context.beginPath();
    context.arc(x3, y3, microPointRadius - 1, 0, circle);
    context.closePath();
    context.stroke();
  }

  function macroGrab(event) {
    state.macro.dragging = true;
    state.macro.justGrabbed = true;
    macroDrag.call(this, event);
    document.body.style.cursor = 'crosshair';
  }

  function macroRelease(event) {
    state.macro.dragging = false;
    document.body.style.cursor = 'default';
  }

  function macroDrag(event) {
    if (!state.macro.dragging) {
      return;
    }
    var position = M.getMousePosition(event),
        offset = this.offset,
        canvas = canvases.macro.slider,
        hex = dimensions.hexagon,
        microRadius = hex.microRadius,
        microBorder = hex.microBorder,
        macroRadius = hex.macroRadius,
        macroBorder = hex.macroBorder,
        x = position.x - offset.left,  // (x, y) is in the canvas
        y = position.y - offset.top,
        angle,
        x0 = hex.x0,
        y0 = hex.y0,
        x1 = x - x0,  // (x1, y1) is in the sector's coordinate space
        y1 = y0 - y,
        d1 = Math.hypot(x1, y1),
        slope = Math.tan(sectorAngleAtPoint(x1, y1)),
        factor = 1 / (1 + slope / sqrt3),
        r2 = macroRadius + macroBorder,
        x2 = factor * r2,
        y2 = slope * x2,
        d2 = Math.hypot(x2, y2);  // fence for the initial click
    if (state.macro.justGrabbed) {
      state.macro.justGrabbed = false;
      if (d1 > d2) {
        state.macro.dragging = false;
        return;
      }
    }
    r2 = macroRadius + macroBorder - microRadius - microBorder;
    x2 = factor * r2;
    y2 = slope * x2;
    d2 = Math.hypot(x2, y2);  // fence for the microhexagon's center
    if (d1 > d2) {
      angle = Math.atan2(y1, x1);
      x1 = d2 * Math.cos(angle);
      y1 = d2 * Math.sin(angle);
    }
    clearCanvas(canvas);
    paintHexagon(canvas, zoomPoint.x = x0 + x1, zoomPoint.y = y0 - y1,
        microRadius + microBorder / 2, microBorder, '#444');
    fillMacro(masks.colors, canvases.macro.colors);
    fillZoom(masks.colors, canvases.micro.colors);
    showPoint(picked.point.x, picked.point.y);
  }

  function clearCanvas(canvas) {
    var context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
  }

  function getMask(canvas, x0, y0) {
    var context = canvas.getContext('2d'),
        width = canvas.width,
        height = canvas.height,
        data = context.getImageData(0, 0, width, height).data,
        mask = new Array(width),
        queue = [],
        tail = 0,
        count = 1,
        i, x, y, X, Y, pos;
    for (x = 0; x < width; ++x) {
      mask[x] = new Array(height);
    }
    mask[x0][y0] = true;
    queue.push([ x0, y0 ]);
    while (tail < queue.length) {
      x = queue[tail][0];
      y = queue[tail][1];
      ++tail;
      pos = 4 * (y * width + x);
      if (data[pos + 3] > 0) {
        continue;
      }
      for (i = 0; i < 4; ++i) {
        X = x + dx[i];
        if (X < 0 || X >= width) {
          continue;
        }
        Y = y + dy[i];
        if (Y < 0 || Y >= height || mask[X][Y]) {
          continue;
        }
        mask[X][Y] = true;
        ++count;
        queue.push([ X, Y ]);
      }
    }
    return mask;
  }

  function radiusAtHue(H) {
    var slope = Math.tan((H % 60) * pi / 180),
        x = 1 / (1 + slope / sqrt3);
    return Math.hypot(x, x * slope);
  }

  function rgbToXy(rgb) {
    var R = rgb.r, G = rgb.g, B = rgb.b,
        max = Math.max(R, G, B),
        min = Math.min(R, G, B),
        C = max - min,
        h, H, angle, value, saturation, r;
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
    H = Math.floor(60 * h);
    angle = h * pi / 3;
    value = max;
    saturation = (value == 0 ? 0 : C / value);
    r = saturation * radiusAtHue(H) * dimensions.hexagon.x0;
    return {
      x: r * Math.cos(angle),
      y: r * Math.sin(angle)
    };
  }

  function xyToRgb(x, y) {  // hexagon center is 0, 0
    var value = 1,
        radius = Math.hypot(x, y),
        angle = (radius == 0 ? 0 : (y >= 0 ? Math.acos(x / radius) :
                                    circle - Math.acos(x / radius))),
        H = Math.floor(angle * 180 / pi),
        R = radiusAtHue(H) * dimensions.hexagon.x0,
        saturation = Math.min(1, radius / R),
        C = saturation * value,
        h = H / 60,
        X = C * (1 - Math.abs(h % 2 - 1)),
        m = value - C,
        rgb, i;
    if (h < 1) {
      rgb = [ C, X, 0 ];
    } else if (h < 2) {
      rgb = [ X, C, 0 ];
    } else if (h < 3) {
      rgb = [ 0, C, X ];
    } else if (h < 4) {
      rgb = [ 0, X, C ];
    } else if (h < 5) {
      rgb = [ X, 0, C ];
    } else {
      rgb = [ C, 0, X ];
    }
    for (i = 0; i < 3; ++i) {
      rgb[i] = Math.round(255 * (rgb[i] + m));
    }
    rgb.r = rgb[0];
    rgb.g = rgb[1];
    rgb.b = rgb[2];
    return rgb;
  }

  function fillZoom(mask, canvas) {
    var hex = dimensions.hexagon,
        microRadius = hex.microRadius,
        macroRadius = hex.macroRadius,
        zoomFactor = microRadius / macroRadius,
        x0 = hex.x0,
        y0 = hex.y0,
        x1 = zoomPoint.x - x0 * zoomFactor,
        y1 = zoomPoint.y - y0 * zoomFactor,
        context = canvas.getContext('2d'),
        width = canvas.width,
        height = canvas.height,
        imageData = context.createImageData(width, height),
        data = imageData.data,
        count = 0,
        pos = 0,
        hex = dimensions.hexagon,
        x0 = hex.x0,
        y0 = hex.y0,
        x, y, x2, y2, rgb;
    for (y = 0; y < height; ++y) {
      for (x = 0; x < width; ++x) {
        if (mask[x][y]) {
          x2 = x1 + x * zoomFactor;
          y2 = y1 + y * zoomFactor;
          rgb = xyToRgb(x2 - x0, y0 - y2);
          data[pos] = rgb.r;
          data[pos + 1] = rgb.g;
          data[pos + 2] = rgb.b;
          data[pos + 3] = 255;
          ++count;
        }
        pos += 4;
      }
    }
    context.putImageData(imageData, 0, 0);
  }

  function fillMacro(mask, canvas) {
    var context = canvas.getContext('2d'),
        width = canvas.width,
        height = canvas.height,
        imageData = context.createImageData(width, height),
        data = imageData.data,
        count = 0,
        pos = 0,
        hex = dimensions.hexagon,
        x0 = hex.x0,
        y0 = hex.y0,
        x, y, rgb;
    for (y = 0; y < height; ++y) {
      for (x = 0; x < width; ++x) {
        if (mask[x][y]) {
          rgb = xyToRgb(x - x0, y0 - y);
          data[pos] = rgb.r;
          data[pos + 1] = rgb.g;
          data[pos + 2] = rgb.b;
          data[pos + 3] = 255;
          ++count;
        }
        pos += 4;
      }
    }
    context.putImageData(imageData, 0, 0);
  }

  function load(wrapper) {
    var canvas,
        width = wrapper.offsetWidth,
        height = wrapper.offsetHeight,
        hex = dimensions.hexagon,
        startTime;
    dimensions.wrapper = { width: width, height: height };
    hex.canvasSize = Math.min(height, Math.floor(width / 2));
    hex.x0 = hex.y0 = hex.canvasSize / 2;
    hex.microBorder = Math.max(2, hex.canvasSize / 120);
    hex.macroBorder = Math.max(hex.microBorder + 2, hex.canvasSize / 60);
    hex.macroRadius = hex.x0 - hex.macroBorder;
    console.log(hex.scale);
    hex.microRadius = hex.macroRadius / hex.scale;
    hex.macroPointRadius = hex.microBorder;
    hex.microPointRadius = hex.scale * hex.macroPointRadius;
    canvases.macro = {
      colors: M.make('canvas', { className: 'hex', parent: wrapper,
        width: hex.canvasSize, height: hex.canvasSize }),
      pick: M.make('canvas', { className: 'hex', parent: wrapper,
        width: hex.canvasSize, height: hex.canvasSize }),
      frame: M.make('canvas', { className: 'hex', parent: wrapper,
        width: hex.canvasSize, height: hex.canvasSize }),
      slider: M.make('canvas', { className: 'hex', parent: wrapper,
        width: hex.canvasSize, height: hex.canvasSize })
    };
    // Frame and mask.
    paintHexagonFrame(canvases.macro.frame);
    masks.colors = getMask(canvases.macro.frame, hex.x0, hex.y0);
    // Slider.
    canvas = canvases.macro.slider;
    M.makeUnselectable(canvas);
    canvas.offset = M.getOffset(canvas, document.body);
    startTime = Date.now();
    fillMacro(masks.colors, canvases.macro.colors);
    console.log((Date.now() - startTime) / 1000 + ' s');
    paintHexagon(canvas, hex.x0, hex.y0,
        hex.microRadius + hex.microBorder / 2, hex.microBorder, '#444');
    M.listen(canvas, macroGrab, 'mousedown');
    M.listen(window, macroRelease, 'mouseup');
    M.listen(window, macroDrag.bind(canvas), 'mousemove');
    canvases.micro = {
      colors: M.make('canvas', { className: 'hex', parent: wrapper,
        width: hex.canvasSize, height: hex.canvasSize }),
      pick: M.make('canvas', { className: 'hex', parent: wrapper,
        width: hex.canvasSize, height: hex.canvasSize }),
      frame: M.make('canvas', { className: 'hex', parent: wrapper,
        width: hex.canvasSize, height: hex.canvasSize }),
      slider: M.make('canvas', { className: 'hex', parent: wrapper,
        width: hex.canvasSize, height: hex.canvasSize })
    };
    Object.keys(canvases.micro).forEach(function (name) {
      var canvas = canvases.micro[name];
      canvas.style.right = '0';
    });
    paintHexagonFrame(canvases.micro.frame);
    zoomPoint.x = hex.x0;
    zoomPoint.y = hex.y0;
    startTime = Date.now();
    fillZoom(masks.colors, canvases.micro.colors);
    console.log((Date.now() - startTime) / 1000 + ' s');
    canvas = canvases.micro.slider;
    canvas.style.opacity = 0.650;
    M.makeUnselectable(canvas);
    canvas.offset = M.getOffset(canvas, document.body);
    M.listen(canvas, microGrab, 'mousedown');
    M.listen(window, microRelease, 'mouseup');
    M.listen(window, microDrag.bind(canvas), 'mousemove');
  }

  return {
    setColor: setColor,
    load: load
  };
})();


//==== module: NameConverter
// uses M, Color

NameConverter = (function () {
  var colorInput,
      alertOption,
      doAlert,
      colorOutputs,
      containers,
      lastText,
      owner = null;

  function handleColorInput() {
    var color,
        text = colorInput.value.replace(/\s+/, '').toLowerCase();
    if (text === lastText) {
      return;
    }
    lastText = text;
    color = new Color(text);
    if ('error' in color) {
      M.classRemove(containers.wrapper, 'parsed');
      return;
    }
    M.classAdd(containers.wrapper, 'parsed');
    setColor(color, true);
  }

  function setColor(color, forceCallback) {
    if (color === null) {
    } else {
      colorOutputs.hex.innerHTML = color.hexString();
      colorOutputs.rgb.innerHTML = color.rgbString();
    }
    if (doAlert === true && forceCallback === true) {
      owner.activatedColor(NameConverter, color);
    }
  }

  function load(wrapper, options) {
    containers = { wrapper: wrapper };
    doAlert = true;
    alertOption = M.make('span', { className: 'option active',
        innerHTML: 'to swatch', parent: wrapper });
    M.listen(alertOption, function () {
      doAlert = !doAlert;
      if (doAlert) {
        lastText = '';
        handleColorInput();
        M.classAdd(alertOption, 'active');
      } else {
        M.classRemove(alertOption, 'active');
      }
    }, 'mousedown');
    colorInput = M.make('input', { parent: wrapper });
    M.listen(colorInput, handleColorInput, 'keydown', 'keyup',
        'mousedown', 'mouseup');
    containers.colorOutputs = M.make('div', { className: 'outputs',
        parent: wrapper });
    colorOutputs = {};
    colorOutputs.hex = M.make('div', { className: 'output',
        parent: containers.colorOutputs });
    colorOutputs.rgb = M.make('div', { className: 'output',
        parent: containers.colorOutputs });
    if (!options) {
      return;
    }
    if ('owner' in options) {
      owner = options.owner;
    }
  }

  return {
    setColor: setColor,
    load: load
  };
})();


//==== module: SwatchManager
// uses M, Color

SwatchManager = (function () {
  var containers,
      liveTile,
      firstClone,
      owner = null;

  function ControlPanel(tile) {
    var panel,
        parent = tile.container;
    panel = M.make('div', { className: 'controlPanel', parent: parent });
    M.listen(M.make('div', { className: 'button delete', parent: panel,
        tile: tile }),
        function (event) {
          event = event || window.event;
          tile.delete();
          event.stopPropagation();
          event.cancelBubble = true;
        }, 'mousedown');
    M.listen(M.make('span', { className: 'marker', parent: panel,
        tile: tile, innerHTML: '&#x25bc;' }),
        function (event) {
          event = event || window.event;
          deactivate(true);
          event.stopPropagation();
          event.cancelBubble = true;
        }, 'mousedown');
    M.listen(M.make('div', { className: 'button clone', parent: panel,
        tile: tile }),
        function (event) {
          event = event || window.event;
          tile.clone({ animate: true });
          event.stopPropagation();
          event.cancelBubble = true;
        }, 'mousedown');
  }

  function Swatch(parent) {
    this.container = M.make('div', { className: 'swatch', parent: parent });
    this.fill = M.make('div', { className: 'fill', parent: this.container });
    this.color = new Color();
    this.setColor(this.color);
  };
  Swatch.prototype.getColor = function (color) {
    return this.color;
  };
  Swatch.prototype.setColor = function (color) {
    this.color = color;
    this.fill.style.background = this.color.rgbString();
  };

  function Tile(options) {
    var tile = this,
        parent;
    options = options || {};
    parent = options.parent || containers.wrapper;
    this.container = M.make('div', { className: 'tile', parent: parent });
    this.container.tile = this;
    this.swatch = new Swatch(this.container);
    if (options.color) {
      this.swatch.setColor(options.color);
    }
    new ControlPanel(this);
    M.listen(this.container, function () {
      setLive(tile);
    }, 'mousedown');
    if (options.animate) {
      M.classAdd(this.container, 'entering');
    }
  }
  Tile.prototype.getColor = function (color) {
    return this.swatch.getColor();
  };
  Tile.prototype.setColor = function (color) {
    this.swatch.setColor(color);
  };
  Tile.prototype.delete = function () {
    var container = this.container;
    if (liveTile === this) {
      deactivate(true);
    }
    M.classAdd(container, 'leaving');
    setTimeout(function () {
      container.parentNode.removeChild(container);
    }, 166);
  };
  Tile.prototype.clone = function (options) {
    var newTile = new Tile(options);
    newTile.setColor(this.swatch.color);
    containers.wrapper.insertBefore(newTile.container,
        this.container.nextSibling);
  }

  function setLive(tile) {
    if (liveTile) {
      liveTile.container.id = '';
    }
    liveTile = tile;
    if (tile === null) {
      return;
    }
    tile.container.id = 'liveTile';
    if (owner !== null) {
      owner.activatedColor(SwatchManager, tile.getColor());
    }
  };

  function insertColor(color, position) {
    var tile = new Tile({ color: color }),
        wrapper = containers.wrapper,
        tileContainers = wrapper.getElementsByClassName('tile'),
        beforeContainer = null;
    position = position || 0;
    position = Math.max(0, position);
    if (position < tileContainers.length) {
      beforeContainer = tileContainers[position];
    }
    wrapper.insertBefore(tile.container, beforeContainer);
  }

  function countSwatches() {
    return containers.wrapper.getElementsByClassName('tile').length;
  }

  function activateSwatchAt(position, forceCallback) {
    var color,
        tileContainers = containers.wrapper.getElementsByClassName('tile');
    if (position < 0 || position >= tileContainers.length) {
      return null;
    }
    setLive(tileContainers[position].tile);
    color = liveTile.getColor();
    if (forceCallback === true) {
      owner.activatedColor(SwatchManager, color);
    }
    return color;
  }

  function setColorOfActiveSwatch(color, forceCallback) {
    if (!liveTile) {
      return false;
    }
    liveTile.setColor(color);
    if (forceCallback === true) {
      owner.activatedColor(SwatchManager, color);
    }
    return true;
  }
  
  function getActiveColor() {
    if (!liveTile) {
      return null;
    }
    return liveTile.getColor();
  }

  function isActive() {
    return liveTile !== null;
  }

  function deactivate(forceCallback) {
    setLive(null);
    if (forceCallback === true) {
      owner.deactivated(SwatchManager);
    }
  }

  function load(wrapper, options) {
    containers = { wrapper: wrapper };
    if (options !== undefined && 'owner' in options) {
      owner = options.owner;
    }
  }

  return {
    insertColor: insertColor,
    countSwatches: countSwatches,
    activateSwatchAt: activateSwatchAt,
    setColorOfActiveSwatch: setColorOfActiveSwatch,
    getActiveColor: getActiveColor,
    isActive: isActive,
    deactivate: deactivate,
    load: load
  };
})();


//==== module: ColorSpinner
// uses M, Color, NameConverter, SwatchManager

ColorSpinner = (function () {
  var containers,
      currentColor = null,
      i;

  function activatedColor(caller, color) {
    if (caller !== HexagonPicker) {
      HexagonPicker.setColor(color);
    }
    if (caller === SwatchManager) {
      NameConverter.setColor(color);
    }
    if (caller === NameConverter) {
      if (SwatchManager.isActive()) {
        SwatchManager.setColorOfActiveSwatch(color);
      } else {
        SwatchManager.insertColor(color, 0);
      }
    }
  }

  function deactivated(caller) {
    if (caller === SwatchManager) {
    } else if (caller === NameConverter) {
    }
  }

  function load(wrapper) {
    var names = [ 'hexagonPicker', 'nameConverter', 'swatchManager' ];
    containers = { wrapper: wrapper };
    names.forEach(function (name) {
      containers[name] = M.make('div', { parent: wrapper, id: name });
    });
    HexagonPicker.load(containers.hexagonPicker, { owner: this });
    NameConverter.load(containers.nameConverter, { owner: this });
    SwatchManager.load(containers.swatchManager, { owner: this });
    for (i = 0; i < 4; ++i) { 
      SwatchManager.insertColor(new Color());
    }
    SwatchManager.insertColor(new Color('#aa0202'));
    SwatchManager.activateSwatchAt(0);
  }
  
  return {
    activatedColor: activatedColor,
    deactivated: deactivated,
    load: load
  };
})();

onload = function () {
  ColorSpinner.load(document.getElementById('colorSpinner'));
};
