var M = {};

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

M.makeUnselectable = function (element) {
  // Based on Evan Hahn's advice:
  //   http://evanhahn.com/how-to-disable-copy-paste-on-your-website/
  // Assumes that this CSS definition exists:
  //  .unselectable {
  //    -webkit-user-select: none;
  //    -khtml-user-drag: none;
  //    -khtml-user-select: none;
  //    -moz-user-select: none;
  //    -moz-user-select: -moz-none;
  //    -ms-user-select: none;
  //    user-select: none;
  // }
  M.classAdd(element, 'unselectable');
  element.ondragstart = element.onselectstart = function (event) {
    event.preventDefault();
  };
};

M.make = function (tag, options) {
  var element = document.createElement(tag),
      keys,
      i;
  if ('parent' in options) {
    options.parent.appendChild(element);
    delete options.parent;
  }
  keys = Object.keys(options);
  for (i = 0; i < keys.length; ++i) {
    element[keys[i]] = options[keys[i]];
  }
  return element;
};

M.getOffset = function (element, ancestor) {
  var left = 0,
      top = 0;
  ancestor = ancestor || document.body;
  while (element != ancestor && element != document.body) {
    left += element.offsetLeft;
    top += element.offsetTop;
    element = element.offsetParent;
  }
  if (element != ancestor) {
    return null;
  }
  return { left: left, top: top };
};

M.getRelativeOffset = function (elementA, elementB) {
  var offsetA = M.getOffset(elementA, document.body),
      offsetB = M.getOffset(elementB, document.body);
  return {
    left: offsetA.left - offsetB.left,
    top: offsetA.top - offsetB.top
  };
};

M.getMousePosition = function (event) {
  event = event || window.event;
  if ('pageX' in event) {
    return { x: event.pageX, y: event.pageY };
  }
  return {
    x: event.clientX + document.body.scrollLeft +
        document.documentElement.scrollLeft,
    y: event.clientY + document.body.scrollTop +
        document.documentElement.scrollTop
  };
}

M.listen = function (element, handler) {
  var i;
  for (i = 2; i < arguments.length; ++i) {
    element.addEventListener(arguments[i], handler);
  }
};

