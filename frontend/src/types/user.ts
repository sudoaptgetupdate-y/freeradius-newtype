export type UserData = {
  id: string
  username: string
  mac: string
  ip: string
  dataUsage: string
  status: string
  isOnline: boolean
  isSuspended?: boolean
  profileName: string
  groupName?: string
  groupId?: string
  tenantId?: string
}

export type ProfileData = {
  name: string
  tenantId?: string
}

export type GroupData = {
  id: string
  name: string
  tenantId: string
}

export type TenantData = {
  id: string
  name: string
}
