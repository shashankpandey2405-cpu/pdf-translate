/** Webpack shim for react-signature-canvas → trim-canvas (avoids broken UMD default export). */
"use strict";

function trimCanvas(source) {
  var ctx = source.getContext("2d", { willReadFrequently: true });
  if (!ctx) return source;

  var width = source.width;
  var height = source.height;
  if (width < 1 || height < 1) return source;

  var data = ctx.getImageData(0, 0, width, height).data;

  function rowHasInk(fromTop) {
    var step = fromTop ? 1 : -1;
    var start = fromTop ? 0 : height - 1;
    var end = fromTop ? height : -1;
    for (var y = start; y !== end; y += step) {
      for (var x = 0; x < width; x++) {
        if (data[4 * (y * width + x) + 3] > 0) return y;
      }
    }
    return fromTop ? 0 : height - 1;
  }

  function colHasInk(fromLeft) {
    var step = fromLeft ? 1 : -1;
    var start = fromLeft ? 0 : width - 1;
    var end = fromLeft ? width : -1;
    for (var x = start; x !== end; x += step) {
      for (var y = 0; y < height; y++) {
        if (data[4 * (y * width + x) + 3] > 0) return x;
      }
    }
    return fromLeft ? 0 : width - 1;
  }

  var top = rowHasInk(true);
  var bottom = rowHasInk(false);
  var left = colHasInk(true);
  var right = colHasInk(false);
  var cropW = Math.max(1, right - left + 1);
  var cropH = Math.max(1, bottom - top + 1);

  if (cropW === width && cropH === height) return source;

  var out = document.createElement("canvas");
  out.width = cropW;
  out.height = cropH;
  var outCtx = out.getContext("2d");
  if (!outCtx) return source;
  outCtx.drawImage(source, left, top, cropW, cropH, 0, 0, cropW, cropH);
  return out;
}

module.exports = trimCanvas;
module.exports.default = trimCanvas;
