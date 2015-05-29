var M = {};

M.make = function (tag, options) {
  var element = document.createElement(tag);
  if (options !== undefined) {
    if (options.into !== undefined) {
      options.into.appendChild(element);
    }
    var keys = ['id', 'className', 'innerHTML'];
    for (var i = 0; i < keys.length; ++i) {
      var key = keys[i];
      if (options[key] !== undefined) {
        element[key] = options[key];
      }
    }
  }
  return element;
};
