import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/auth';
import {
  LayoutDashboard,
  UserPlus,
  Users,
  Calendar,
  CreditCard,
  FileText,
  Clock,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Mail,
  UserCheck,
} from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: UserRole[];
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Employees',
    path: '/employees',
    icon: Users,
    roles: ['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER'],
  },
  {
    label: 'Contracts',
    path: '/contracts',
    icon: FileText,
    roles: ['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER'],
  },
  {
    label: 'Schedules',
    path: '/schedules',
    icon: Clock,
    roles: ['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER'],
  },
  {
    label: 'Attendance',
    path: '/attendance',
    icon: UserCheck,
    roles: ['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'EMPLOYEE'],
  },
  {
    label: 'Leave Management',
    path: '/leave',
    icon: Calendar,
  },
  {
    label: 'Payroll & Payslips',
    path: '/payroll',
    icon: CreditCard,
  },
  {
    label: 'Email AI Ingestion',
    path: '/email-logs',
    icon: Mail,
  },
  {
    label: 'User Management',
    path: '/admin/users',
    icon: UserPlus,
    roles: ['ADMIN'],
  },
];

export const AppLayout: React.FC = () => {
  const { user, logout, hasRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/auth/login');
  };

  const getRoleBadgeColor = (r?: UserRole) => {
    switch (r) {
      case 'ADMIN':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'HR_PAYROLL_MANAGER':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'HR_MANAGER':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'HR_PAYROLL_USER':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default:
        return 'bg-teal-50 text-teal-700 border-teal-200';
    }
  };

  const visibleNavItems = navItems.filter((item) => {
    if (!item.roles) return true;
    return hasRole(item.roles);
  });

  const empName = user?.employee
    ? `${user.employee.firstName} ${user.employee.lastName}`
    : user?.email.split('@')[0] || 'User';

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-slate-900 font-sans flex flex-col selection:bg-orange-100 selection:text-orange-600">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="flex items-center">
              <img src="/logo.webp" alt="PeoplePay360" className="h-8 w-auto object-contain" />
            </Link>
            <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] uppercase font-extrabold tracking-wider bg-orange-50 text-[#FF5E1E] rounded-md border border-orange-200/80">
              Platform Portal
            </span>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-orange-50 text-[#FF5E1E] border border-orange-200/80 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right User Badge & Controls */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 rounded-2xl hover:bg-slate-100 border border-slate-200/80 transition-all focus:outline-none cursor-pointer bg-white"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#FF5E1E] to-[#FF8038] flex items-center justify-center text-white font-extrabold text-xs uppercase shadow-sm">
                  {empName.slice(0, 2)}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-900 line-clamp-1">{empName}</span>
                  <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                    {user?.role}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* User Menu Dropdown */}
              {userDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2"
                  onClick={() => setUserDropdownOpen(false)}
                >
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900">{empName}</p>
                    <p className="text-[11px] text-slate-500 font-mono">{user?.email}</p>
                    <div className="mt-2">
                      <span
                        className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase rounded-md border ${getRoleBadgeColor(
                          user?.role
                        )}`}
                      >
                        Role: {user?.role ? user.role.replace(/_/g, ' ') : 'USER'}
                      </span>
                    </div>
                  </div>

                  {user?.role === 'ADMIN' && (
                    <Link
                      to="/admin/users/new"
                      className="flex items-center gap-2 px-4 py-2.5 text-xs text-[#FF5E1E] hover:bg-orange-50 font-bold transition-colors"
                    >
                      <UserPlus className="w-4 h-4" /> Admin User Provisioning
                    </Link>
                  )}

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 font-bold transition-colors cursor-pointer text-left"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1 shadow-md">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold ${
                    isActive ? 'bg-orange-50 text-[#FF5E1E]' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500 font-medium">
        PeoplePay360 — AI-Powered HR & Payroll Automation Platform &copy; 2026
      </footer>
    </div>
  );
};
