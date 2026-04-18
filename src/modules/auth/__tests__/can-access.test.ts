import { describe, it, expect } from 'vitest'
import { canAccess } from '../access.guards'
import { adminUser, merchantUser, regularUser } from './fixtures'

describe('canAccess', () => {
  it('returns true when no access requirement', () => {
    expect(canAccess(adminUser, undefined)).toBe(true)
    expect(canAccess(null, undefined)).toBe(true)
  })

  it('returns true for guestOnly when user is null', () => {
    expect(canAccess(null, { guestOnly: true })).toBe(true)
  })

  it('returns false for guestOnly when user exists', () => {
    expect(canAccess(regularUser, { guestOnly: true })).toBe(false)
  })

  it('returns true for requiresAuth when user exists', () => {
    expect(canAccess(regularUser, { requiresAuth: true })).toBe(true)
  })

  it('returns false for requiresAuth when user is null', () => {
    expect(canAccess(null, { requiresAuth: true })).toBe(false)
  })

  it('returns true when user has required role', () => {
    expect(canAccess(merchantUser, { roles: ['merchant'] })).toBe(true)
  })

  it('returns false when user lacks required role', () => {
    expect(canAccess(regularUser, { roles: ['admin'] })).toBe(false)
  })

  it('returns true when user has one of required roles', () => {
    expect(canAccess(merchantUser, { roles: ['admin', 'merchant', 'user'] })).toBe(true)
  })

  it('returns true for combined requirements - all met', () => {
    expect(canAccess(adminUser, { requiresAuth: true, roles: ['admin'] })).toBe(true)
  })

  it('returns false for combined requirements - role not met', () => {
    expect(canAccess(regularUser, { requiresAuth: true, roles: ['admin'] })).toBe(false)
  })

  it('returns false for combined requirements - auth not met', () => {
    expect(canAccess(null, { requiresAuth: true, roles: ['user'] })).toBe(false)
  })
})