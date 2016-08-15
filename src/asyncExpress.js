/**
 * Copyright (c) 2016, Lee Byron
 * All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const express = require('express');

const methods = [ 'all', 'get', 'post' ];

// Cheap hack to allow express apps to provide async functions
function asyncExpress() {
  const app = express();

  methods.forEach(method => {
    const existing = app[method]
    app[method] = function (route, action) {
      if (!action) {
        return existing.call(app, route);
      }
      existing.call(app, route, function (request, response, next) {
        var ret = action.apply(this, arguments)
        if (ret && typeof ret.catch === 'function') {
          ret.catch(next)
        }
      })
    }
  })

  return app;
}

Object.assign(asyncExpress, express)

module.exports = asyncExpress
