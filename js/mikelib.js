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

M.getMousePosition = function (event) {
  event = event || window.event;
  if (event.pageX) {
    return { x: event.pageX, y: event.pageY };
  }
  return {
    x: event.clientX + document.body.scrollLeft +
        document.documentElement.scrollLeft,
    y: event.clientY + document.body.scrollTop +
        document.documentElement.scrollTop
  };
}

M.classContains = function (element, item) {
  var className = element.className;
  if (className === '' || className === null || className === undefined) {
    return false;
  }
  var items = className.split(/\s+/);
  for (var i = items.length-1; i >= 0; --i) {
    if (items[i] === item) {
      return true;
    }
  }
  return false;
};

M.classAdd = function (element, item) {
  if (M.classContains(element, item)) {
    return;
  }
  var className = element.className;
  if (className === '' || className === null || className === undefined) {
    element.className = item;
  } else {
    element.className = className + ' ' + item;
  }
};

M.classRemove = function (element, item) {
  if (!M.classContains(element, item)) {
    return;
  }
  var items = element.className.split(/\s+/),
      newItems = [];
  for (var i = items.length-1; i >= 0; --i) {
    if (items[i] !== item) {
      newItems.push(items[i]);
    }
  }
  element.className = newItems.join(' ');
};
