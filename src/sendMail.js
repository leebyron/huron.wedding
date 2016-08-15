/**
 * Copyright (c) 2016, Lee Byron
 * All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const postmark = require('postmark');

let _mailer

function mailer() {
  if (!_mailer) {
    _mailer = postmark(process.env.POSTMARK_API_TOKEN)
  }
  return _mailer
}

function sendMail(data) {
  return new Promise((resolve, reject) => mailer().send(
    data,
    (error, result) => error ? reject(error) : resolve(result)
  ))
}

exports.sendMail = sendMail

function sendMailBatch(dataBatch) {
  return new Promise((resolve, reject) => mailer().batch(
    dataBatch,
    (error, result) => error ? reject(error) : resolve(result)
  ))
}

exports.sendMailBatch = sendMailBatch
