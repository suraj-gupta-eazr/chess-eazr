import assert from 'node:assert/strict'
import test from 'node:test'
import { usernameBase } from './profile.utils.js'

test('username uses a short normalized first name', () => {
  assert.equal(usernameBase('Súraj Kumar'), 'suraj')
  assert.equal(usernameBase('♟'), 'player')
})
