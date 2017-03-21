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
  const { rows } = await pgQuery(`
    WITH c as (
      SELECT emoji, MAX(id) as id
      FROM invitees
      WHERE rsvp is not null
      GROUP BY emoji)
    SELECT invitees.emoji, firstname, lastname, partyname, rsvp
    FROM invitees, c
    WHERE c.id = invitees.id;
  `);

  const table = rows.map(formatLine);
  await say(table.map(row => row.join(',')).join('\n'))
})

function formatLine({ emoji, firstname, lastname, partyname, rsvp }) {
  return [
    emoji,
    rsvpName(firstname, lastname, partyname),
    ...parseRSVP(rsvp)
  ];
}

function rsvpName(first, last, party) {
  return titleCase(party || `${first} ${last}`)
}

function parseRSVP(rsvp) {
  const party = rsvp.party ? rsvp.party.concat(rsvp.plusOne, rsvp.kids).filter(x=>x) : [];
  return [
    rsvp.attending ? 'Attending' : 'Not Attending',
    party.length,
    JSON.stringify(party.join(' + ')),
    rsvp.earlyBird ? 'Early Bird' : 'X',
    rsvp.formalFeast ? 'Formal Feast' : 'X',
    rsvp.poolParty ? 'Pool Party' : 'X',
    rsvp.ceremony ? 'Ceremony' : 'X',
    JSON.stringify(rsvp.diet) || 'N/A',
    JSON.stringify(rsvp.message) || ''
  ];
}

function titleCase(str) {
  return (str || '').split(' ').map(
    word => word && (word[0].toUpperCase() + word.slice(1).toLowerCase())
  ).join(' ')
}
