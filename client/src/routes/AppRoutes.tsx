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

        {/* Admin Only Route */}
        <Route
          path="/admin/users/new"
          element={
            <RoleGuard allowedRoles={['ADMIN']}>
              <CreateUserPage />
            </RoleGuard>
          }
        />

        {/* HR & Payroll Core Module Routes */}
        <Route path="/employees" element={<EmployeesPage />} />
        <Route path="/employees/new" element={<EmployeeForm />} />
        <Route path="/employees/:id" element={<EmployeeDetail />} />
        <Route path="/employees/:id/edit" element={<EmployeeForm />} />

        <Route path="/contracts" element={<ContractsPage />} />
        <Route path="/contracts/new" element={<ContractForm />} />
        <Route path="/contracts/:id/edit" element={<ContractForm />} />

        <Route path="/schedules" element={<SchedulesPage />} />
        <Route path="/attendance" element={<AttendancePage />} />
        <Route path="/leave" element={<TimeOffPage />} />
        
        <Route path="/payroll" element={<PayrollPage />} />
        <Route path="/payroll/payruns/:id" element={<PayrunDetail />} />

        <Route path="/email-logs" element={<DashboardPage />} />
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
