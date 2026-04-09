import type { Role } from '@/shared/types'

export type AuthFeedbackType = 'info' | 'error' | 'success'

export type AuthFeedbackState = {
  type: AuthFeedbackType
  message: string
}

export type SignupRole = Extract<Role, 'user' | 'merchant'>

export type AuthRoleContent = {
  title: string
  copy: string
  cardTitle: string
}

export type AuthRoleOption = {
  value: string
  label: string
}

export type AuthIconName =
  | 'apple'
  | 'email'
  | 'eye'
  | 'eye-off'
  | 'google'
  | 'password'
  | 'user'
