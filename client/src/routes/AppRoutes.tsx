import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { PublicOnlyRoute } from '../components/auth/PublicOnlyRoute';
import { RoleGuard } from '../components/auth/RoleGuard';
import { AppLayout } from '../components/layout/AppLayout';

import LandingPage from '../pages/LandingPage';
import { LoginPage } from '../features/auth/LoginPage';
import { ForgotPasswordPage } from '../features/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '../features/auth/ResetPasswordPage';
import { CreateUserPage } from '../features/admin/CreateUserPage';
import { DashboardPage } from '../features/dashboard/DashboardPage';

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

        {/* Fallback routes for other features if visited directly */}
        <Route path="/leave" element={<DashboardPage />} />
        <Route path="/payroll" element={<DashboardPage />} />
        <Route path="/employees" element={<DashboardPage />} />
        <Route path="/email-logs" element={<DashboardPage />} />
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
