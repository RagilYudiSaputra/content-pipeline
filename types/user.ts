export type UserRole = "admin" | "designer";

export type UserStatus = "active" | "inactive";

export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  avatar: string;
}