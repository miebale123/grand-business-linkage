import type { UserRecord } from '@/shared/types'

export const adminUser: UserRecord = {
  id: '1',
  name: 'Admin',
  email: 'admin@test.com',
  role: 'admin',
  password: '123',
}

export const merchantUser: UserRecord = {
  id: '2',
  name: 'Merchant',
  email: 'merchant@test.com',
  role: 'merchant',
  roles: ['merchant', 'basic_merchant'],
  password: '123',
}

export const basicMerchantUser: UserRecord = {
  id: '3',
  name: 'Basic',
  email: 'basic@test.com',
  role: 'basic_merchant',
  password: '123',
}

export const regularUser: UserRecord = {
  id: '4',
  name: 'User',
  email: 'user@test.com',
  role: 'user',
  password: '123',
}