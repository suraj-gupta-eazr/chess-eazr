import assert from 'node:assert/strict'
import test from 'node:test'
import { registerSchema } from './auth.schema.js'

test('registration accepts only a first name', () => {
  const input = { name: 'Suraj', age: 24, gender: 'male', email: 'suraj@example.com', password: 'password' }
  assert.equal(registerSchema.parse(input).name, 'Suraj')
  assert.throws(() => registerSchema.parse({ ...input, name: 'Suraj Gupta' }))
})
