export type AdminUserListRow = {
  id: string;
  firstName: string;
  lastName: string;
  userName: string;
  email: string | null;
  emailVerified: boolean;
  isActive: boolean;
  avatar: string | null;
  createdAt: Date;
};

export type AdminUserProfileRow = {
  id: string;
  firstName: string;
  lastName: string;
  userName: string;
  email: string | null;
  emailVerified: boolean;
  emailVerifiedAt: Date | null;
  isActive: boolean;
  avatar: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ListAdminUsersParams = {
  page: number;
  limit: number;
  sortBy: 'createdAt' | 'name';
  sortOrder: 'asc' | 'desc';
  buyersOnly?: boolean;
  search?: string;
};
