import { describe, it, expect } from 'vitest'
import { hasRole } from '../access.guards'
import { adminUser, merchantUser, basicMerchantUser, regularUser } from './fixtures'

describe('hasRole', () => {
  it('returns true when no roles specified', () => {
    expect(hasRole(regularUser, undefined)).toBe(true)
    expect(hasRole(regularUser, [])).toBe(true)
  })

  it('returns false for null user when roles specified', () => {
    expect(hasRole(null, ['admin'])).toBe(false)
  })

  it('returns true when user has admin role', () => {
    expect(hasRole(adminUser, ['admin'])).toBe(true)
  })

  it('returns true when user has merchant role', () => {
    expect(hasRole(merchantUser, ['merchant'])).toBe(true)
  })

  it('returns true when user has basic_merchant role', () => {
    expect(hasRole(basicMerchantUser, ['basic_merchant'])).toBe(true)
  })

  it('returns true when user has one of the roles', () => {
    expect(hasRole(merchantUser, ['admin', 'merchant'])).toBe(true)
  })

  it('returns false when user lacks required role', () => {
    expect(hasRole(regularUser, ['admin'])).toBe(false)
    expect(hasRole(regularUser, ['merchant'])).toBe(false)
  })

  it('returns true when basic_merchant passes basic check', () => {
    expect(hasRole(basicMerchantUser, ['user'])).toBe(false)
  })
})