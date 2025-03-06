export interface User {
  id: string;
  username: string;
  email: string;
  isTutor: boolean;
  isStaff: boolean;
  profileImage?: string;
  createdAt: string;
  updatedAt: string;
}
