(function (factory) {
  if (typeof module === 'object' && typeof module.exports === 'object') {
    var v = factory(require, exports);
    if (v !== undefined) module.exports = v;
  } else if (typeof define === 'function' && define.amd) {
    define(['require', 'exports'], factory);
  }
})(function (require, exports) {
  'use strict';
  Object.defineProperty(exports, '__esModule', { value: true });
  exports.replaceCodePlugin = void 0;
  function execSrcReplacements(src, replacements) {
    replacements.forEach(function (replacement) {
      if (
        (typeof replacement.from === 'string' ||
          replacement.from instanceof RegExp) === false
      ) {
        throw new Error(
          "[vite-plugin-replace]: The replacement option 'from' is not of type 'string' or 'RegExp'."
        );
      } else if (
        (typeof replacement.to === 'string' ||
          replacement.to instanceof Function) === false
      ) {
        throw new Error(
          "[vite-plugin-replace]: The replacement option 'to' is not of type 'string' or 'Function'"
        );
      } else {
        src = src.replace(replacement.from, replacement.to);
      }
    });
    return src;
  }
  function replaceCodePlugin(config) {
    if (config === undefined) {
      config = {
        replacements: [],
      };
    } else if ((typeof config === 'object' || config !== null) === false) {
      throw new Error(
        "[vite-plugin-replace]: The configuration is not of type 'Object'."
      );
    } else if (Array.isArray(config.replacements) === false) {
      throw new Error(
        "[vite-plugin-replace]: The configuration option 'replacement' is not of type 'Array'."
      );
    }
    return {
      name: 'transform-file',
      transform: function (src) {
        return {
          code: execSrcReplacements(src, config.replacements),
          map: null,
        };
      },
    };
  }
  exports.replaceCodePlugin = replaceCodePlugin;
});
//# sourceMappingURL=index.js.map
