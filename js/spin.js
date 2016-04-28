
//==== Color

var Color = function (r, g, b) {
  if (!(this instanceof Color)) {
    return new Color(r, g, b);
  }
  // Each color component is stored as an 8-bit integer.
  this.r = r;
  this.g = g;
  this.b = b;
}

Color.prototype.equal = function (color) {
  if (!(color instanceof Color)) {
    return false;
  }
  return this.r === color.r && this.g === color.g && this.b === color.b;
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


//==== ColorPicker

var ColorPicker = (function () {
  'use strict';
  var containers,
      colorInput,
      colorOutputs,
      currentColor,
      liveSwatch;

  function setColor() {
    var color;
    // You can pass an argument with rgb properties, such as a color object,
    // or you can pass three arguments that are the rgb values.
    if (arguments.length == 1) {
      color = Color(arguments[0].r, arguments[0].g, arguments[0].b);
    } else {
      color = Color(arguments[0], arguments[1], arguments[2]);
    }
    if (color.equal(currentColor)) {
      return;
    }
    currentColor = color;
    updateGraphicalPicker(color);
    updateNameConverter(color);
    updateSwatchManager(color);
  }

  function updateNameConverter(color) {
    colorOutputs.hex.innerHTML = color.hexString();
    colorOutputs.rgb.innerHTML = color.rgbString();
  }

  function updateGraphicalPicker(color) {
  }

  function updateSwatchManager(color) {
    var fill = liveSwatch.getElementsByClassName('fill')[0];
    fill.style.backgroundColor = color.rgbString();
  }

  function parseColor(s) {
    // Color string formats: https://www.w3.org/wiki/CSS/Properties/color
    var groups,
        i, x,
        rgb = [];
    s = s.replace(/\s+/g, '');
    // Hex value.
    groups = s.match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (groups !== null) {
      s = groups[1];
      if (s.length == 3) {
        for (i = 0; i < 3; ++i) {
          x = parseInt(s.charAt(i), 16);
          rgb.push(16 * x + x);
        }
      } else {
        for (i = 0; i < 3; ++i) {
          rgb.push(parseInt(s.substring(2 * i, 2 * i + 2), 16));
        }
      }
      return Color(rgb[0], rgb[1], rgb[2]);
    }
    return null;
  }

  function handleColorInput() {
    var color = parseColor(colorInput.value);
    if (color === null) {
      return;
    }
    setColor(color);
  }

  function load(wrapper) {
    var names;
    containers = {};
    containers.wrapper = wrapper;
    names = [ 'graphicalPicker', 'nameConverter', 'swatchManager' ];
    names.forEach(function (name) {
      containers[name] = M.make('div', { parent: wrapper, id: name });
    });

    // nameConverter
    colorInput = M.make('input', { parent: containers.nameConverter });
    M.listen(colorInput, handleColorInput, 'keydown', 'keyup',
        'mousedown', 'mouseup');
    containers.colorOutputs = M.make('div', {
        parent: containers.nameConverter });
    colorOutputs = {};
    colorOutputs.hex = M.make('div', { className: 'output',
        parent: containers.colorOutputs });
    colorOutputs.rgb = M.make('div', { className: 'output',
        parent: containers.colorOutputs });

    // swatchManager
    liveSwatch = M.make('div', { className: 'swatch', id: 'liveSwatch',
        parent: containers.swatchManager });
    M.make('div', { className: 'fill', parent: liveSwatch });

    setColor(Math.floor(256 * Math.random()),
             Math.floor(256 * Math.random()),
             Math.floor(256 * Math.random()));
  }
  
  return {
    load: load
  };
})();

onload = function () {
  ColorPicker.load(document.getElementById('wrapper'));
}
