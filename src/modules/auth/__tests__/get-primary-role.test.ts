import { describe, it, expect } from 'vitest'
import type { Role } from '@/shared/types'
import { getPrimaryRole, hasRole } from '../access.guards'
import { adminUser, merchantUser, basicMerchantUser, regularUser } from './fixtures'

describe('getPrimaryRole', () => {
  it('returns null for null user', () => {
    expect(getPrimaryRole(null)).toBe(null)
  })

  it('returns null for undefined user', () => {
    expect(getPrimaryRole(undefined)).toBe(null)
  })

  it('returns admin for admin user', () => {
    expect(getPrimaryRole(adminUser)).toBe('admin')
  })

  it('returns merchant for verified merchant', () => {
    expect(getPrimaryRole(merchantUser)).toBe('merchant')
  })

  it('returns basic_merchant for basic merchant', () => {
    expect(getPrimaryRole(basicMerchantUser)).toBe('basic_merchant')
  })

  it('returns user for regular user', () => {
    expect(getPrimaryRole(regularUser)).toBe('user')
  })

  it('prioritizes admin over merchant when both exist', () => {
    const user = { ...merchantUser, roles: ['merchant', 'admin'] }
    expect(getPrimaryRole(user)).toBe('admin')
  })

  it('prioritizes merchant over basic_merchant', () => {
    const user = { ...basicMerchantUser, roles: ['basic_merchant', 'merchant'] }
    expect(getPrimaryRole(user)).toBe('merchant')
  })

  it('returns user as fallback', () => {
    const user = { ...regularUser, roles: ['user'] }
    expect(getPrimaryRole(user)).toBe('user')
  })

  it('returns null for user with no role', () => {
    const user = {
      id: '8',
      name: 'NoRole',
      email: 'norole@test.com',
      role: undefined as unknown as Role,
      password: '123',
    }
    expect(getPrimaryRole(user)).toBe(null)
  })
})

describe('role priority for business rules', () => {
  it('admin has highest priority - should see admin dashboard', () => {
    expect(getPrimaryRole(adminUser)).toBe('admin')
    expect(hasRole(adminUser, ['admin'])).toBe(true)
  })

  it('verified merchant has second priority - should see merchant dashboard', () => {
    expect(getPrimaryRole(merchantUser)).toBe('merchant')
    expect(hasRole(merchantUser, ['merchant'])).toBe(true)
  })

  it('basic_merchant has third priority - cannot access verified merchant features', () => {
    expect(getPrimaryRole(basicMerchantUser)).toBe('basic_merchant')
    expect(hasRole(basicMerchantUser, ['merchant'])).toBe(false)
    expect(hasRole(basicMerchantUser, ['basic_merchant'])).toBe(true)
  })

  it('user is lowest priority - cannot access merchant or admin', () => {
    expect(getPrimaryRole(regularUser)).toBe('user')
    expect(hasRole(regularUser, ['admin'])).toBe(false)
    expect(hasRole(regularUser, ['merchant'])).toBe(false)
    expect(hasRole(regularUser, ['basic_merchant'])).toBe(false)
  })

  it('admin can do everything - check multiple roles', () => {
    expect(hasRole(adminUser, ['admin', 'merchant', 'user'])).toBe(true)
  })
})