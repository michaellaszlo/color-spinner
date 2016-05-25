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
      dimensions = {},
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
    var hex = dimensions.hexagon;
    console.log(hex.x0, hex.y0, hex.macroRadius + hex.border / 2, hex.border);
    paintHexagon(canvas, hex.x0, hex.y0,
        hex.macroRadius + hex.border / 2, hex.border, '#888');
  }

  function macroMouse(event) {
    var position = M.getMousePosition(event),
        offset = this.offset,
        canvas = canvases.macroHexagon.slider,
        context = canvas.getContext('2d'),
        x = position.x - offset.left,
        y = position.y - offset.top,
        hex = dimensions.hexagon,
        x0 = hex.x0,
        y0 = hex.y0,
        fatAngle = Math.atan2(y0 - y, x - x0) + circle,
        angle = (fatAngle < circle ? fatAngle : fatAngle - circle),
        sectorReal = angle / sixth,
        sectorIndex = Math.floor(sectorReal),
        sectorAngle = (sectorReal - sectorIndex) * sixth,
        s = hex.macroRadius - hex.microRadius,
        c0 = s * Math.tan(sixth),
        m1 = Math.tan(sectorAngle),
        x1 = c0 / (m1 + Math.tan(sixth)),
        y1 = m1 * x1,  // (x1, y1) is in the sector's coordinate space
        d1 = Math.hypot(x1, y1),  // distance from hexagon center
        x2 = x0 + d1 * Math.cos(angle),  // (x2, y2) is on the canvas
        y2 = y0 - d1 * Math.sin(angle),
        d = Math.hypot(x - x0, y - y0);
    if (d > d1 + hex.microRadius + 2 * hex.border) {
      return;
    }
    if (d > d1) {
      x = x2;
      y = y2;
    }
    clearCanvas(canvas);
    paintHexagon(canvas, x, y, hex.microRadius - 1, 2, '#444');
  }

  function clearCanvas(canvas) {
    var context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
  }

  function load(wrapper) {
    var canvas,
        width = wrapper.offsetWidth,
        height = wrapper.offsetHeight,
        hex = dimensions.hexagon = {};
    dimensions.wrapper = { width: width, height: height };
    hex.canvasSize = Math.min(height, Math.floor(width / 2));
    hex.x0 = hex.y0 = hex.canvasSize / 2;
    hex.border = Math.ceil(hex.canvasSize / 80);
    hex.macroRadius = hex.x0 - 2 * hex.border;
    hex.microRadius = hex.macroRadius / 10;
    canvases.macroHexagon = {
      slider: M.make('canvas', { className: 'hex', parent: wrapper,
        width: hex.canvasSize, height: hex.canvasSize }),
      frame: M.make('canvas', { className: 'hex', parent: wrapper,
        width: hex.canvasSize, height: hex.canvasSize })
    };
    canvas = canvases.macroHexagon.frame;
    canvas.offset = M.getOffset(canvas, document.body);
    paintHexagonFrame(canvas);
    M.listen(canvas, macroMouse, 'mouseover', 'mousemove');
  }

  return {
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
    load: load,
    setColor: setColor
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
    if (caller === SwatchManager) {
      NameConverter.setColor(color);
    } else if (caller === NameConverter) {
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
    SwatchManager.activateSwatchAt(0);
  }
  
  return {
    load: load,
    activatedColor: activatedColor,
    deactivated: deactivated
  };
})();

onload = function () {
  ColorSpinner.load(document.getElementById('colorSpinner'));
};
