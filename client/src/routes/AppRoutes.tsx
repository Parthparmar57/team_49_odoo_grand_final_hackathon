import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { PublicOnlyRoute } from '../components/auth/PublicOnlyRoute';
import { RoleGuard } from '../components/auth/RoleGuard';
import { AppLayout } from '../components/layout/AppLayout';

import { LandingPage } from '../features/landingpage/LandingPage';
import { LoginPage } from '../features/auth/LoginPage';
import { ForgotPasswordPage } from '../features/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '../features/auth/ResetPasswordPage';
import { CreateUserPage } from '../features/admin/CreateUserPage';
import UserManagementPage from '../features/admin/UserManagementPage';
import SalaryStructuresPage from '../features/payroll/structures/SalaryStructuresPage';
import { DashboardPage } from '../features/dashboard/DashboardPage';

// HR & Payroll Feature Components
import EmployeesPage from '../features/employees/EmployeesPage';
import EmployeeForm from '../features/employees/EmployeeForm';
import EmployeeDetail from '../features/employees/EmployeeDetail';
import ContractsPage from '../features/contracts/ContractsPage';
import ContractForm from '../features/contracts/ContractForm';
import SchedulesPage from '../features/schedules/SchedulesPage';
import AttendancePage from '../features/attendance/AttendancePage';
import TimeOffPage from '../features/leave/TimeOffPage';
import PayrollPage from '../features/payroll/PayrollPage';
import PayrunDetail from '../features/payroll/PayrunDetail';
import { NotFoundPage } from '../features/notfound/NotFoundPage';


export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Landing Page at Root (/) */}
      <Route path="/" element={<LandingPage />} />

      {/* Public Authentication Routes */}
      <Route
        path="/auth/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/auth/forgot-password"
        element={
          <PublicOnlyRoute>
            <ForgotPasswordPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/auth/reset-password/:token"
        element={
          <PublicOnlyRoute>
            <ResetPasswordPage />
          </PublicOnlyRoute>
        }
      />

      {/* Protected Main Application Routes inside AppLayout */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* ========================================== */}
        {/* DEVELOPER 1: ADMIN & SALARY STRUCTURE ROUTES */}
        {/* ========================================== */}
        <Route
          path="/admin/users"
          element={
            <RoleGuard allowedRoles={['ADMIN', 'HR_PAYROLL_MANAGER', 'HR_MANAGER']}>
              <UserManagementPage />
            </RoleGuard>
          }
        />
        <Route
          path="/admin/users/new"
          element={
            <RoleGuard allowedRoles={['ADMIN', 'HR_PAYROLL_MANAGER', 'HR_MANAGER']}>
              <CreateUserPage />
            </RoleGuard>
          }
        />
        <Route
          path="/admin/create-user"
          element={
            <RoleGuard allowedRoles={['ADMIN', 'HR_PAYROLL_MANAGER', 'HR_MANAGER']}>
              <CreateUserPage />
            </RoleGuard>
          }
        />

        <Route
          path="/payroll/structures"
          element={
            <RoleGuard allowedRoles={['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER']}>
              <SalaryStructuresPage />
            </RoleGuard>
          }
        />


        {/* HR & Payroll Core Module Routes */}
        <Route
          path="/employees"
          element={
            <RoleGuard allowedRoles={['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER']}>
              <EmployeesPage />
            </RoleGuard>
          }
        />
        <Route
          path="/employees/new"
          element={
            <RoleGuard allowedRoles={['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_MANAGER']}>
              <EmployeeForm />
            </RoleGuard>
          }
        />
        <Route
          path="/employees/:id"
          element={
            <RoleGuard allowedRoles={['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'EMPLOYEE']}>
              <EmployeeDetail />
            </RoleGuard>
          }
        />
        <Route
          path="/employees/:id/edit"
          element={
            <RoleGuard allowedRoles={['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_MANAGER']}>
              <EmployeeForm />
            </RoleGuard>
          }
        />

        <Route
          path="/contracts"
          element={
            <RoleGuard allowedRoles={['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER']}>
              <ContractsPage />
            </RoleGuard>
          }
        />
        <Route
          path="/contracts/new"
          element={
            <RoleGuard allowedRoles={['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_MANAGER']}>
              <ContractForm />
            </RoleGuard>
          }
        />
        <Route
          path="/contracts/:id/edit"
          element={
            <RoleGuard allowedRoles={['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_MANAGER']}>
              <ContractForm />
            </RoleGuard>
          }
        />

        <Route
          path="/schedules"
          element={
            <RoleGuard allowedRoles={['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER']}>
              <SchedulesPage />
            </RoleGuard>
          }
        />
        <Route
          path="/attendance"
          element={
            <RoleGuard allowedRoles={['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'EMPLOYEE']}>
              <AttendancePage />
            </RoleGuard>
          }
        />
        <Route
          path="/leave"
          element={
            <RoleGuard allowedRoles={['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'EMPLOYEE']}>
              <TimeOffPage />
            </RoleGuard>
          }
        />
        
        <Route
          path="/payroll"
          element={
            <RoleGuard allowedRoles={['ADMIN', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER']}>
              <PayrollPage />
            </RoleGuard>
          }
        />
        <Route
          path="/payroll/payruns/:id"
          element={
            <RoleGuard allowedRoles={['ADMIN', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER']}>
              <PayrunDetail />
            </RoleGuard>
          }
        />
      </Route>

      {/* Catch-all 404 Route Not Found Page */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
