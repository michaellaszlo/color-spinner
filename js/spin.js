var ColorPicker = (function () {
  var containers,
      colorInput,
      colorOutputs;

  function setColor(color) {
    console.log([ color, color.hexString() ].join('  '));
  }

  function Color(r, g, b) {
    if (!(this instanceof Color)) {
      return new Color(r, g, b);
    }
    // Each color component is stored as an 8-bit integer.
    this.r = r;
    this.g = g;
    this.b = b;
  }
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

  function parseColor(s) {
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
    containers = {};
    containers.wrapper = wrapper;
    [ 'macroHex', 'microHex', 'vlBar', 'namePanel' ].forEach(function (name) {
      containers[name] = M.make('div', { parent: wrapper, id: name });
    });
    // macroHex
    // microHex
    // vlBar
    // namePanel
    colorInput = M.make('input', { parent: containers.namePanel });
    M.listen(colorInput, handleColorInput, 'keydown', 'keyup',
        'mousedown', 'mouseup');
    containers.colorOutputs = M.make('div', { parent: containers.namePanel });
    colorOutputs = {};
    colorOutputs.hex = M.make('div', { parent: containers.colorOutputs });
    colorOutputs.rgb256 = M.make('div', { parent: containers.colorOutputs });
  }
  
  return {
    load: load
  };
})();

onload = function () {
  ColorPicker.load(document.getElementById('wrapper'));
}
