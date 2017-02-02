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
      WHERE address is not null
      GROUP BY emoji)
    SELECT invitees.emoji, firstname, lastname, partyname, address
    FROM invitees, c
    WHERE c.id = invitees.id;
  `);

  const table = rows.map(formatLine);
  await say(table.map(row => row.join('\t')).join('\n'))
})

function formatLine({ emoji, firstname, lastname, partyname, address }) {
  return [
    emoji,
    addressName(firstname, lastname, partyname),
    ...parseAddress(address)
  ];
}

function addressName(first, last, party) {
  return titleCase(party || `${first} ${last}`)
}

function parseAddress(address) {
  return [
    titleCase(address.address),
    titleCase(address.suite),
    titleCase(address.city),
    address.state && address.state.length === 2 ?
      address.state.toUpperCase() :
      titleCase(address.state),
    address.zip
  ];
}

function titleCase(str) {
  return (str || '').split(' ').map(
    word => word && (word[0].toUpperCase() + word.slice(1).toLowerCase())
  ).join(' ')
}
