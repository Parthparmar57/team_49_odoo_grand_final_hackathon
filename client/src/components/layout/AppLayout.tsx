import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/auth';
import {
  ShieldCheck,
  LayoutDashboard,
  UserPlus,
  Users,
  Calendar,
  CreditCard,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Mail,
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
    label: 'Employees',
    path: '/employees',
    icon: Users,
    roles: ['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER'],
  },
  {
    label: 'Email AI Ingestion',
    path: '/email-logs',
    icon: Mail,
  },
  {
    label: 'Create User (Admin)',
    path: '/admin/users/new',
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
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      case 'HR_PAYROLL_MANAGER':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'HR_MANAGER':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
      case 'HR_PAYROLL_USER':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
      default:
        return 'bg-teal-500/10 text-teal-400 border-teal-500/30';
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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-tr from-orange-500 to-amber-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-lg tracking-tight text-white">
                PeoplePay<span className="text-orange-500">360</span>
              </span>
            </Link>
            <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-slate-800 text-slate-400 rounded border border-slate-700">
              Platform Portal
            </span>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-orange-500/10 text-orange-400 border border-orange-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
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
                className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-800 border border-slate-800 transition-all focus:outline-none cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-slate-800 flex items-center justify-center text-white font-bold text-xs uppercase shadow">
                  {empName.slice(0, 2)}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-bold text-white line-clamp-1">{empName}</span>
                  <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                    {user?.role}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* User Menu Dropdown */}
              {userDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2"
                  onClick={() => setUserDropdownOpen(false)}
                >
                  <div className="px-4 py-3 border-b border-slate-800">
                    <p className="text-xs font-bold text-white">{empName}</p>
                    <p className="text-[11px] text-slate-400 font-mono">{user?.email}</p>
                    <div className="mt-2">
                      <span
                        className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${getRoleBadgeColor(
                          user?.role
                        )}`}
                      >
                        Role: {user?.role.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>

                  {user?.role === 'ADMIN' && (
                    <Link
                      to="/admin/users/new"
                      className="flex items-center gap-2 px-4 py-2.5 text-xs text-orange-400 hover:bg-slate-800 font-medium transition-colors"
                    >
                      <UserPlus className="w-4 h-4" /> Admin User Provisioning
                    </Link>
                  )}

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-red-400 hover:bg-red-500/10 font-medium transition-colors cursor-pointer text-left"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800 bg-slate-900 px-4 py-3 space-y-1">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold ${
                    isActive ? 'bg-orange-500/10 text-orange-400' : 'text-slate-400 hover:bg-slate-800'
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
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
        PeoplePay360 — AI-Powered HR & Payroll Automation Platform &copy; 2026
      </footer>
    </div>
  );
};
