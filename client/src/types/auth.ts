export type UserRole = 'EMPLOYEE' | 'HR_MANAGER' | 'HR_PAYROLL_USER' | 'HR_PAYROLL_MANAGER' | 'ADMIN';

export type AccountStatus = 'ACTIVE' | 'INACTIVE';

export interface Department {
  id: string;
  name: string;
  code: string;
}

export interface EmployeeSummary {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  designation: string;
  departmentId?: string;
  department?: Department;
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  employee?: EmployeeSummary | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
}

export interface AdminCreateUserPayload {
  email: string;
  password?: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  employeeId?: string | null;
  status?: AccountStatus;
}

export interface AuthResponse {
  user: User;
  token: string;
}
