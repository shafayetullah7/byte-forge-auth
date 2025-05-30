import { DeviceInfo } from 'src/drizzle/schema';
import { LocalAdminAuth } from '../../admin-auth/types/local-auth-admin.type';

export type CreateAdminSession = {
  adminAuth: LocalAdminAuth;
  deviceInfo: DeviceInfo;
  ip: string;
};
