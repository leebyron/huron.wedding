/**
 * Copyright (c) 2016, Lee Byron
 * All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const bodyParser = require('body-parser')
const compression = require('compression')

const express = require('./asyncExpress')
const pgQuery = require('./pgQuery')
const renderView = require('./renderView')
const { sendMail } = require('./sendMail')

const app = express()

app.use(compression())
app.use(express.static(__dirname + '/../static', { maxAge: 3600 }))
app.use(bodyParser.urlencoded({ extended: true }))

app.get('/', (request, response) => {
  response.render('index.html.ejs')
})

app.get('/full', (request, response) => {
  return response.redirect(303, '/')
})

app.get('/emoji', (request, response) => {
  response.render('emoji.html.ejs', { emoji: require('./emoji') })
})

app.get('/:emoji', async (request, response) => {
  const emoji = request.params.emoji

  // Enable the below to collect addresses
  // const { rows } = await pgQuery(
  //   'SELECT firstname, partyname, addressprovidedtime FROM invitees WHERE emoji = $1::text',
  //   [ emoji ]
  // )
  // if (rows.length === 0) {
  //   return response.redirect(303, '/')
  // }
  // const { firstname, partyname, addressprovidedtime } = rows[0]
  // if (addressprovidedtime) {
  //   response.render('thanks.html.ejs', { firstname, partyname })
  // } else {
  //   response.render('form.html.ejs', { firstname, partyname, emoji })
  // }

  // Enable the below to collect RSVPs
  const { rows } = await pgQuery(
    'SELECT firstname, partyname, rsvptime FROM invitees WHERE emoji = $1::text',
    [ emoji ]
  )
  const inviteeCount = rows.length
  if (inviteeCount === 0) {
    return response.redirect(303, '/')
  }
  const { firstname, partyname, rsvptime } = rows[0]
  response.render('rsvp.html.ejs', { firstname, partyname, emoji, inviteeCount, rsvptime })
})

app.post('/:emoji/rsvp', async (request, response) => {
  const emoji = request.params.emoji

  const rsvp = request.body.attending === 'no' ? {
    attending: false,
    message: trim(request.body.noMessage),
  } : {
    attending: true,
    earlyBird: Boolean(request.body.earlyBird),
    formalFeast: Boolean(request.body.formalFeast),
    poolParty: Boolean(request.body.poolParty),
    ceremony: Boolean(request.body.ceremony),
    kids: trim(request.body.kids),
    diet: trim(request.body.diet),
    message: trim(request.body.yesMessage),
  }

  await pgQuery(
    'UPDATE invitees SET rsvp = $2::json, rsvptime = now() WHERE emoji = $1::text',
    [ emoji, rsvp ]
  )

  response.redirect(303, '/')
})

app.post('/:emoji/updateaddress', async (request, response) => {
  const emoji = request.params.emoji

  const address = {
    address: trim(request.body.address),
    suite: trim(request.body.suite),
    city: trim(request.body.city),
    state: trim(request.body.state),
    zip: trim(request.body.zip),
  }

  if (!validateForm(address)) {
    return response.redirect(303, '/' + emoji)
  }

  const { rows } = await pgQuery(
    'SELECT firstname, lastname, partyname, email FROM invitees WHERE emoji = $1::text',
    [ emoji ]
  )
  if (rows.length === 0) {
    return response.redirect(303, '/')
  }
  const { firstname, lastname, partyname, email } = rows[0]

  await pgQuery(
    'UPDATE invitees SET address = $2::json, addressprovidedtime = now() WHERE emoji = $1::text',
    [ emoji, address ]
  )

  // Redirect right away, before sending email.
  response.redirect(303, '/' + emoji)

  const [ htmlBody, txtBody, ics ] = await Promise.all([
    renderView('email/address-thanks.html.ejs', { firstname, partyname, emoji }),
    renderView('email/address-thanks.txt.ejs', { firstname, partyname, emoji }),
    renderView('email/save-the-date.ics.ejs', { rows }),
  ])

  const to = rows.filter(row => row.email).map(row =>
    `"${row.firstname} ${row.lastname}" <${row.email}>`
  ).join(', ')

  await sendMail({
    From: '"Lee + Ash" <leeandash@huron.wedding>',
    To: to,
    Subject: 'Thanks for your address!',
    TextBody: txtBody,
    HtmlBody: htmlBody,
    Attachments: [ {
      Name: 'lee-and-ash-save-the-date.ics',
      ContentType: 'text/calendar',
      Content: Buffer(ics).toString('base64')
    } ],
    Tag: 'save-the-date-thanks',
    TrackOpens: true
  })
})

function trim(str) {
  return str && str.trim() || null
}

function value(str) {
  return str || ''
}

function validateForm(form) {
  return (
    value(form.address).length >= 3 &&
    value(form.city).length >= 2 &&
    value(form.state).length >= 2 &&
    /^\s*[0-9-]{3,}\s*$/.test(value(form.zip))
  )
}

// 404
app.use((request, response, next) => {
  response.status(404)
  response.render('index.html.ejs', {
    message: 'Whoa! Check your browser address bar'
  })
})

// 500
app.use((error, request, response, next) => {
  console.error(error.stack)
  response.status(500)
  response.render('index.html.ejs', {
    message: 'Whoa! Something went wrong, could you let us know?'
  })
})

const port = process.env.PORT || 5000
app.listen(port, () => {
  console.log('Running: http://localhost:' + port)
})
