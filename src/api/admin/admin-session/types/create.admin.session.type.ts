import { DeviceInfo } from 'src/drizzle/schema';
import { AdminAuth } from '../../admin-auth/types/admin-auth.type';

export type CreateAdminSession = {
  adminAuth: AdminAuth;
  deviceInfo: DeviceInfo;
  ip: string;
};
