const mitt = require("./mitt.js");

const emitter = mitt();

function useMitt() {
  const arr = [];

  const addListener = (key, callback, immediate = false) => {
    arr.push([key, callback]);
    emitter.on(key, callback);
    if (immediate) callback();
  };

  const removeListener = (key, callback) => {
    emitter.off(key, callback);
  };

  const clear = () => {
    arr.forEach((v) => removeListener(v[0], v[1]));
    arr.length = 0;
    // console.info('clear', arr, emitter.all);
  };

  return { addListener, removeListener, clear };
}

const EventType = {
  Location: Symbol("Location"),
};

module.exports = { emitter, EventType, useMitt };
