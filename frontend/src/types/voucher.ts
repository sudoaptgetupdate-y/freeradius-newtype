export type VoucherBatch = {
  id: string
  tenantId: string
  prefix: string
  amount: number
  groupname: string
  type: string
  createdAt: string
}

export type Profile = {
  name: string
  tenantId: string
}

export interface VoucherSettings {
  tenantId: string;
  defaultPrefix: string | null;
  logoUrl: string | null;
  headerText: string | null;
  ssidName: string | null;
  footerText: string | null;
  createdAt: string;
  updatedAt: string;
}
