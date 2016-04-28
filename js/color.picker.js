// color.picker.js
'use strict';
var Color,
    NameWriter,
    SwatchManager,
    ColorPicker;


//==== constructor: Color

Color = function () {
  var argument,
      i,
      keys = [ 'r', 'g', 'b' ];

  if (arguments.length == 1) {
    argument = arguments[0];
    if (typeof argument == 'string' || argument instanceof String) {
      if (!this.parseColor(argument)) {
        this.error = 'Unable to parse "' + argument + '"';
      }
      return;
    }
    if (argument instanceof Object) {
      for (i = 0; i < 3; ++i) {
        this[keys[i]] = argument[keys[i]];
      }
      return;
    }
    this.error = 'Invalid argument';
    return;
  }

  if (arguments.length == 3) {
    for (i = 0; i < 3; ++i) {
      this[keys[i]] = arguments[i];
    }
    return;
  }

  this.error = 'Incorrect number of arguments';
};

Color.prototype.rgbEquals = function (color) {
  if (!(color instanceof Object)) {
    return false;
  }
  return this.r === color.r && this.g === color.g && this.b === color.b;
};

Color.prototype.parseColor = function (s) {
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


//==== module: NameWriter
// uses M, Color

NameWriter = (function () {
  var colorInput,
      colorOutputs,
      containers,
      parentSetColor;

  function handleColorInput() {
    var color = new Color(colorInput.value);
    if ('error' in color) {
      return;
    }
    setColor(color);
  }

  function setColor(color) {
    colorOutputs.hex.innerHTML = color.hexString();
    colorOutputs.rgb.innerHTML = color.rgbString();
    if (parentSetColor) {
      parentSetColor(color);
    }
  }

  function load(wrapper, options) {
    colorInput = M.make('input', { parent: wrapper });
    M.listen(colorInput, handleColorInput, 'keydown', 'keyup',
        'mousedown', 'mouseup');
    containers = {};
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
    if ('parentSetColor' in options) {
      parentSetColor = options.parentSetColor;
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
      liveSwatch,
      firstClone,
      parentSetColor;
  
  function setColor(color) {
    liveSwatch.color = color;
    liveSwatch.fill.style.backgroundColor = color.rgbString();
    if (parentSetColor) {
      parentSetColor(color);
    }
  }

  function makeSwatch(options) {
    var swatch;
    options = options || {};
    options.parent = containers.wrapper;
    swatch = M.make('div', options);
    M.classAdd(swatch, 'swatch');
    swatch.fill = M.make('div', { className: 'fill', parent: swatch });
    return swatch;
  }

  function cloneLiveSwatch() {
    var swatch;
    if (!('color' in liveSwatch)) {
      return;
    }
    swatch = makeSwatch();
    swatch.color = new Color(liveSwatch.color);
    swatch.fill.style.backgroundColor = swatch.color.rgbString();
    if (firstClone) {
      containers.wrapper.insertBefore(swatch, firstClone);
    }
    firstClone = swatch;
  }

  function load(wrapper, options) {
    containers = { wrapper: wrapper };
    liveSwatch = makeSwatch({ id: 'liveSwatch' });
    M.listen(liveSwatch, cloneLiveSwatch, 'click');
    if (!options) {
      return;
    }
    if ('parentSetColor' in options) {
      parentSetColor = options.parentSetColor;
    }
  }

  return {
    load: load,
    setColor: setColor,
    cloneLiveSwatch: cloneLiveSwatch
  };
})();


//==== module: ColorPicker
// uses M, Color, NameWriter, SwatchManager

ColorPicker = (function () {
  var containers,
      currentColor,
      i;

  function setColor(color) {
    if (color.rgbEquals(currentColor)) {
      return;
    }
    console.log('setting new color ' + color);
    currentColor = color;
    NameWriter.setColor(color);
    SwatchManager.setColor(color);
  }

  function load(wrapper) {
    var names = [ 'visualPicker', 'nameWriter', 'swatchManager' ];
    containers = { wrapper: wrapper };
    names.forEach(function (name) {
      containers[name] = M.make('div', { parent: wrapper, id: name });
    });
    NameWriter.load(containers.nameWriter, { parentSetColor: setColor });
    SwatchManager.load(containers.swatchManager, { parentSetColor: setColor });
    for (i = 0; i < 4; ++i) { 
      SwatchManager.cloneLiveSwatch();
      setColor(new Color(Math.floor(256 * Math.random()),
          Math.floor(256 * Math.random()), Math.floor(256 * Math.random())));
    }
  }
  
  return {
    load: load
  };
})();

onload = function () {
  ColorPicker.load(document.getElementById('colorPicker'));
};
