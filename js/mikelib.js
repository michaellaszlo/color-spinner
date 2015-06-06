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

M.getOffset = function (element, ancestor) {
  var left = 0,
      top = 0;
  while (element != ancestor) {
    left += element.offsetLeft;
    top += element.offsetTop;
    element = element.parentNode;
  }
  return { left: left, top: top };
};
