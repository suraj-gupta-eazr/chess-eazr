import assert from 'node:assert/strict'
import test from 'node:test'
import { forgotPasswordSchema, registerSchema } from './auth.schema.js'

test('registration accepts only a first name', () => {
  const input = { name: 'Suraj', age: 24, gender: 'male', email: 'suraj@example.com', password: 'password' }
  assert.equal(registerSchema.parse(input).name, 'Suraj')
  assert.throws(() => registerSchema.parse({ ...input, name: 'Suraj Gupta' }))
})

test('password recovery requires a valid age', () => {
  assert.equal(forgotPasswordSchema.parse({ email: 'SURAJ@example.com', age: '24' }).email, 'suraj@example.com')
  assert.throws(() => forgotPasswordSchema.parse({ email: 'suraj@example.com', age: 12 }))
})
