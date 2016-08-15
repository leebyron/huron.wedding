/**
 * Copyright (c) 2016, Lee Byron
 * All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const { Pool } = require('pg')
const { parse: urlParse } = require('url')

let _pool

function pool() {
  if (!_pool) {
    const params = urlParse(process.env.DATABASE_URL)
    const auth = params.auth.split(':')
    _pool = new Pool({
      user: auth[0],
      password: auth[1],
      host: params.hostname,
      port: params.port,
      database: params.pathname.split('/')[1],
      ssl: true
    })
  }
  return _pool
}

function pgQuery(str, args) {
  return pool().connect().then(client =>
    client.query(str, args).then(
      result => {
        client.release()
        return result
      },
      error => {
        client.release()
        throw error
      }
    )
  )
}

module.exports = pgQuery
