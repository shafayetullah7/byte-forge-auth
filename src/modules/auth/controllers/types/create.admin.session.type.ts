import { DeviceInfo } from '@/_db/drizzle/schema';
import { AdminAuth } from './admin-auth.type';

export type CreateAdminSession = {
  adminAuth: AdminAuth;
  deviceInfo: DeviceInfo;
  ip: string;
};
