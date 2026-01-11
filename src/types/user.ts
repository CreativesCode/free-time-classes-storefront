export interface User {
  id: string;
  username: string;
  email: string;
  isTutor: boolean;
  isStaff: boolean;
  profilePicture?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  country?: string;
  bio?: string;
  specialties?: string;
  experience?: string;
  createdAt: string;
  updatedAt: string;
}
