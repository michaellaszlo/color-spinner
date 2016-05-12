// color.spinner.js
'use strict';
var Color,
    NameConverter,
    SwatchManager,
    ColorSpinner;


//==== constructor: Color

Color = function () {
  this.set.apply(this, arguments);
};

Color.prototype.set = function () {
  var argument;

  if (arguments.length == 0) {
    this.r = this.g = this.b = 0;
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

Color.prototype.setRandom = function () {
  this.set(Math.floor(256 * Math.random()),
           Math.floor(256 * Math.random()),
           Math.floor(256 * Math.random()));
};

Color.prototype.rgbEquals = function (color) {
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
  // Hex value.
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


//==== module: NameConverter
// uses M, Color

NameConverter = (function () {
  var colorInput,
      colorOutputs,
      containers,
      owner,
      lastValue;

  function handleColorInput() {
    var color;
    if (colorInput.value === lastValue) {
      return;
    }
    lastValue = colorInput.value;
    color = new Color(colorInput.value);
    if ('error' in color) {
      return;
    }
    setColor(color);
  }

  function setColor(color) {
    if (color === null) {
      M.classAdd(containers.wrapper, 'dormant');
    } else {
      M.classRemove(containers.wrapper, 'dormant');
      colorOutputs.hex.innerHTML = color.hexString();
      colorOutputs.rgb.innerHTML = color.rgbString();
    }
    if (owner) {
      owner.activatedColor(NameConverter, color);
    }
  }

  function load(wrapper, options) {
    colorInput = M.make('input', { parent: wrapper });
    M.listen(colorInput, handleColorInput, 'keydown', 'keyup',
        'mousedown', 'mouseup');
    lastValue = colorInput.value = '';
    containers = { wrapper: wrapper };
    containers.colorOutputs = M.make('div', {
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
      owner;

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
    this.color.set(color);
    this.fill.style.background = this.color.rgbString();
  };

  function Tile(options) {
    var tile = this,
        parent;
    options = options || {};
    parent = options.parent || containers.wrapper;
    this.container = M.make('div', { className: 'tile', parent: parent });
    this.container.tile = this;
    M.make('div', { className: 'marker', parent: this.container,
        innerHTML: '&#x25bc;' });
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
    if (tile) {
      tile.container.id = 'liveTile';
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

  function load(theOwner, wrapper) {
    containers = { wrapper: wrapper };
    owner = theOwner;
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
    var color,
        names = [ 'visualSpinner', 'nameWriter', 'swatchManager' ];
    containers = { wrapper: wrapper };
    names.forEach(function (name) {
      containers[name] = M.make('div', { parent: wrapper, id: name });
    });
    NameConverter.load(containers.nameWriter, { owner: this });
    SwatchManager.load(this, containers.swatchManager, { owner: this });
    color = new Color();
    for (i = 0; i < 4; ++i) { 
      color.setRandom();
      SwatchManager.insertColor(color);
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
