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

interactive(async (say, ask) => {

  say('Creating invitees table')

  await pgQuery(
    `CREATE TABLE invitees (
      id                    SERIAL        PRIMARY KEY,
      firstname             text          NOT NULL,
      lastname              text,
      partyname             text,
      emoji                 text          NOT NULL,
      email                 text,
      -- Full mailing address
      addressProvidedTime   timestamptz,
      address               json
    );`
  )

  say('Populating rows')

  // Edit this query to contain all invitees, likely from an Excel CSV.
  await pgQuery(
    `INSERT INTO invitees (firstname, lastname, partyname, emoji, email) VALUES
      ('Ash','Huang',null,'🌵💍🌵💍','lee@leebyron.com'),
      ('Lee','Byron',null,'🌵💍🌵💍','ash@ashsmash.com');`
  )

  say('done!')
})
