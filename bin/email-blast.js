#!/usr/bin/env async-node
/**
 * Copyright (c) 2016, Lee Byron
 * All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const interactive = require('interactive-script')

const pgQuery = require('../src/pgQuery')
const renderView = require('../src/renderView')
const { sendMailBatch } = require('../src/sendMail')

// To only send email to specific ids:
// Optionally add --id 25 or --ids 12,34,56
let ids
let i = 2
while (i < process.argv.length) {
  var arg = process.argv[i++]
  if (arg === '-id' || arg === '--ids') {
    ids = process.argv[i++].split(',').map(id => parseInt(id, 10))
    ids.forEach(id => {
      if (isNaN(id) {
        throw new Error('Unknown id ' + id)
      })
    })
  }
}

interactive(async (say, ask) => {
  const { rows } = await pgQuery(
    'SELECT firstname, lastname, partyname, email, emoji FROM invitees' +
    (ids ? ' WHERE id IN (' + ids.join(', ') + ')' : '')
  )

  const groupMap = Object.create(null)
  rows.forEach(row => {
    if (row.email) {
      (groupMap[row.emoji] || (groupMap[row.emoji] = [])).push(row)
    }
  })
  const groups = Object.keys(groupMap).map(k => groupMap[k])

  const content = await Promise.all(groups.map(async rows => {
    const [ html, text ] = await Promise.all([
      renderView('email/rsvp.html.ejs', rows[0]),
      renderView('email/rsvp.txt.ejs', rows[0])
    ])
    return { rows, html, text }
  }))

  const subject = 'Lee + Ash: RSVP!'
  say('SUBJECT: ' + subject)

  if (await ask('do you want to see the html template? ', 'Yn')) {
    say(content[0].html)
    if (!(await ask('does that look good? ', 'Yn'))) {
      return say('cancelling')
    }
  }

  if (await ask('do you want to see the text template? ', 'Yn')) {
    say(content[0].text)
    if (!(await ask('does that look good? ', 'Yn'))) {
      return say('cancelling')
    }
  }

  const emails = content.map(({ rows, html, text }) => ({
    From: '"Lee + Ash" <leeandash@huron.wedding>',
    To: rows.map(row => `"${row.firstname} ${row.lastname}" <${row.email}>`).join(', '),
    Subject: subject,
    TextBody: text,
    HtmlBody: html,
    Tag: 'rsvp',
    TrackOpens: true
  }))

  say(emails)

  if (!(await ask('last chance, type yes to confirm... ', 'yN'))) {
    return say('cancelling')
  }

  console.log(await sendMailBatch(emails))
  say('all mail has been sent')
})
