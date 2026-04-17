import { describe, it, expect } from 'vitest'
import type { UserRecord, Role } from '@/shared/types'
import {
  isAuthenticated,
  hasRole,
  canAccess,
  getPrimaryRole,
  getUserRolesList,
} from '../access.guards'

describe('access.guards', () => {
  describe('isAuthenticated', () => {
    it('returns false for null user', () => {
      expect(isAuthenticated(null)).toBe(false)
    })

    it('returns false for undefined user', () => {
      expect(isAuthenticated(undefined)).toBe(false)
    })

    it('returns true for valid user', () => {
      const user: UserRecord = {
        id: '1',
        name: 'Test',
        email: 'test@test.com',
        role: 'user',
        password: '123',
      }
      expect(isAuthenticated(user)).toBe(true)
    })
  })

  describe('hasRole', () => {
    const adminUser: UserRecord = {
      id: '1',
      name: 'Admin',
      email: 'admin@test.com',
      role: 'admin',
      password: '123',
    }
    const merchantUser: UserRecord = {
      id: '2',
      name: 'Merchant',
      email: 'merchant@test.com',
      role: 'merchant',
      roles: ['merchant', 'basic_merchant'],
      password: '123',
    }
    const basicMerchantUser: UserRecord = {
      id: '3',
      name: 'Basic',
      email: 'basic@test.com',
      role: 'basic_merchant',
      password: '123',
    }
    const regularUser: UserRecord = {
      id: '4',
      name: 'User',
      email: 'user@test.com',
      role: 'user',
      password: '123',
    }

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

  describe('canAccess', () => {
    const adminUser: UserRecord = {
      id: '1',
      name: 'Admin',
      email: 'admin@test.com',
      role: 'admin',
      password: '123',
    }
    const merchantUser: UserRecord = {
      id: '2',
      name: 'Merchant',
      email: 'merchant@test.com',
      role: 'merchant',
      password: '123',
    }
    const regularUser: UserRecord = {
      id: '3',
      name: 'User',
      email: 'user@test.com',
      role: 'user',
      password: '123',
    }

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

  describe('getPrimaryRole', () => {
    it('returns null for null user', () => {
      expect(getPrimaryRole(null)).toBe(null)
    })

    it('returns null for undefined user', () => {
      expect(getPrimaryRole(undefined)).toBe(null)
    })

    it('returns admin for admin user', () => {
      const user: UserRecord = {
        id: '1',
        name: 'Admin',
        email: 'admin@test.com',
        role: 'admin',
        password: '123',
      }
      expect(getPrimaryRole(user)).toBe('admin')
    })

    it('returns merchant for verified merchant', () => {
      const user: UserRecord = {
        id: '2',
        name: 'Merchant',
        email: 'merchant@test.com',
        role: 'merchant',
        password: '123',
      }
      expect(getPrimaryRole(user)).toBe('merchant')
    })

    it('returns basic_merchant for basic merchant', () => {
      const user: UserRecord = {
        id: '3',
        name: 'Basic',
        email: 'basic@test.com',
        role: 'basic_merchant',
        password: '123',
      }
      expect(getPrimaryRole(user)).toBe('basic_merchant')
    })

    it('returns user for regular user', () => {
      const user: UserRecord = {
        id: '4',
        name: 'User',
        email: 'user@test.com',
        role: 'user',
        password: '123',
      }
      expect(getPrimaryRole(user)).toBe('user')
    })

    it('prioritizes admin over merchant when both exist', () => {
      const user: UserRecord = {
        id: '5',
        name: 'Multi',
        email: 'multi@test.com',
        role: 'merchant',
        roles: ['merchant', 'admin'],
        password: '123',
      }
      expect(getPrimaryRole(user)).toBe('admin')
    })

    it('prioritizes merchant over basic_merchant', () => {
      const user: UserRecord = {
        id: '6',
        name: 'Multi',
        email: 'multi@test.com',
        role: 'basic_merchant',
        roles: ['basic_merchant', 'merchant'],
        password: '123',
      }
      expect(getPrimaryRole(user)).toBe('merchant')
    })

    it('returns user as fallback', () => {
      const user: UserRecord = {
        id: '7',
        name: 'User',
        email: 'user@test.com',
        role: 'user',
        roles: ['user'],
        password: '123',
      }
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

  describe('getUserRolesList', () => {
    it('returns empty array for null user', () => {
      expect(getUserRolesList(null)).toEqual([])
    })

    it('returns single role for user', () => {
      const user: UserRecord = {
        id: '1',
        name: 'User',
        email: 'user@test.com',
        role: 'user',
        password: '123',
      }
      expect(getUserRolesList(user)).toEqual(['user'])
    })

    it('returns all roles for merchant with multiple roles', () => {
      const user: UserRecord = {
        id: '2',
        name: 'Merchant',
        email: 'merchant@test.com',
        role: 'merchant',
        roles: ['merchant', 'basic_merchant'],
        password: '123',
      }
      const roles = getUserRolesList(user)
      expect(roles).toContain('merchant')
      expect(roles).toContain('basic_merchant')
    })
  })
})

describe('role priority for business rules', () => {
  it('admin has highest priority - should see admin dashboard', () => {
    const admin: UserRecord = {
      id: '1',
      name: 'Admin',
      email: 'admin@test.com',
      role: 'admin',
      password: '123',
    }
    expect(getPrimaryRole(admin)).toBe('admin')
    expect(hasRole(admin, ['admin'])).toBe(true)
  })

  it('verified merchant has second priority - should see merchant dashboard', () => {
    const merchant: UserRecord = {
      id: '2',
      name: 'Merchant',
      email: 'merchant@test.com',
      role: 'merchant',
      password: '123',
    }
    expect(getPrimaryRole(merchant)).toBe('merchant')
    expect(hasRole(merchant, ['merchant'])).toBe(true)
  })

  it('basic_merchant has third priority - cannot access verified merchant features', () => {
    const basicMerchant: UserRecord = {
      id: '3',
      name: 'Basic',
      email: 'basic@test.com',
      role: 'basic_merchant',
      password: '123',
    }
    expect(getPrimaryRole(basicMerchant)).toBe('basic_merchant')
    expect(hasRole(basicMerchant, ['merchant'])).toBe(false)
    expect(hasRole(basicMerchant, ['basic_merchant'])).toBe(true)
  })

  it('user is lowest priority - cannot access merchant or admin', () => {
    const user: UserRecord = {
      id: '4',
      name: 'User',
      email: 'user@test.com',
      role: 'user',
      password: '123',
    }
    expect(getPrimaryRole(user)).toBe('user')
    expect(hasRole(user, ['admin'])).toBe(false)
    expect(hasRole(user, ['merchant'])).toBe(false)
    expect(hasRole(user, ['basic_merchant'])).toBe(false)
  })

  it('admin can do everything - check multiple roles', () => {
    const admin: UserRecord = {
      id: '1',
      name: 'Admin',
      email: 'admin@test.com',
      role: 'admin',
      password: '123',
    }
    expect(hasRole(admin, ['admin', 'merchant', 'user'])).toBe(true)
  })
})
