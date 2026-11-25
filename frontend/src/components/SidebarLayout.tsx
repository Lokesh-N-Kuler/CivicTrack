import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import {
  Shield,
  LayoutDashboard,
  PlusCircle,
  ClipboardList,
  Search,
  Bell,
  User as UserIcon,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Building2,
  BarChart3,
  MapPin,
  Copy,
  Users,
  Settings,
  FileText,
  AlertCircle,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  isPrimaryCta?: boolean;
  badge?: number;
}

export const SidebarLayout: React.FC<Props> = ({ children }) => {
  const { user, isAdmin, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const citizenNavItems: NavItem[] = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Report a Problem', path: '/complaints/new', icon: PlusCircle, isPrimaryCta: true },
    { label: 'My Complaints', path: '/complaints', icon: ClipboardList },
    { label: 'Track Complaint', path: '/track', icon: Search },
    { label: 'Notifications', path: '/notifications', icon: Bell, badge: unreadCount },
    { label: 'Profile', path: '/profile', icon: UserIcon },
    { label: 'Help and Support', path: '/help', icon: HelpCircle },
  ];

  const adminNavItems: NavItem[] = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'User Management', path: '/admin/users', icon: Users },
    { label: 'Complaint Management', path: '/admin/complaints', icon: FileText },
    { label: 'Department Management', path: '/admin/departments', icon: Building2 },
    { label: 'Priority & Escalation', path: '/admin/escalations', icon: AlertCircle },
    { label: 'Map Overview', path: '/admin/map', icon: MapPin },
    { label: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
    { label: 'Audit Logs', path: '/admin/audit-logs', icon: Shield },
    { label: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  const navItems = isAdmin ? adminNavItems : citizenNavItems;

  const isActive = (path: string) => {
    if (path === '/admin' && location.pathname === '/admin') return true;
    if (path === '/admin/complaints' && (location.pathname === '/admin/complaints' || location.pathname === '/admin/all-complaints')) return true;
    if (path === '/dashboard' && location.pathname === '/dashboard') return true;
    if (path === '/complaints' && location.pathname === '/complaints') return true;
    if (path !== '/admin' && path !== '/admin/complaints' && path !== '/dashboard' && path !== '/complaints') {
      return location.pathname.startsWith(path);
    }
    return false;
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <header className="md:hidden bg-[#17324D] text-white px-4 py-3 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <Link to={isAdmin ? '/admin' : '/dashboard'} className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center text-white font-bold">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <span className="font-extrabold text-sm tracking-tight">CivicTrack</span>
            <span className="text-[10px] text-blue-200 block -mt-1">Bengaluru</span>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
            className="p-1.5 relative text-slate-200 hover:text-white rounded-md"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#DC2626] rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 text-slate-200 hover:text-white rounded-md"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Desktop Collapsible Sidebar */}
      <aside
        className={`hidden md:flex flex-col bg-[#17324D] text-white transition-all duration-300 z-30 shrink-0 sticky top-0 h-screen ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Sidebar Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-[#234668]">
          <Link
            to={isAdmin ? '/admin' : '/dashboard'}
            className={`flex items-center gap-3 overflow-hidden ${isCollapsed ? 'justify-center w-full' : ''}`}
          >
            <div className="w-9 h-9 rounded-lg bg-[#2563EB] flex items-center justify-center text-white shrink-0 shadow-xs">
              <Shield className="w-5 h-5" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-base tracking-tight text-white">CivicTrack</span>
                  <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.2 bg-blue-500/20 text-blue-300 rounded border border-blue-400/30">
                    BBMP
                  </span>
                </div>
                <div className="text-[10px] text-slate-300 truncate">
                  Bengaluru Grievance Hub
                </div>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            if (item.isPrimaryCta) {
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all shadow-xs my-2 ${
                    isCollapsed ? 'justify-center' : ''
                  } bg-[#2563EB] hover:bg-[#1D4ED8] text-white`}
                  title={item.label}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors relative group ${
                  isCollapsed ? 'justify-center' : ''
                } ${
                  active
                    ? 'bg-[#2563EB] text-white font-bold'
                    : 'text-slate-300 hover:bg-[#1E4064] hover:text-white'
                }`}
                title={item.label}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
                {!isCollapsed && item.badge !== undefined && item.badge > 0 && (
                  <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#DC2626] text-white">
                    {item.badge}
                  </span>
                )}
                {isCollapsed && item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#DC2626]" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Sidebar Footer User & Collapse Controls */}
        <div className="p-3 border-t border-[#234668] space-y-2">
          {/* User profile capsule */}
          <div
            className={`flex items-center gap-2.5 p-2 rounded-lg bg-[#0F2133] ${
              isCollapsed ? 'justify-center' : ''
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-[#2563EB] text-white font-bold text-xs flex items-center justify-center shrink-0">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1 text-left">
                <div className="text-xs font-bold text-white truncate">{user?.full_name}</div>
                <div className="text-[10px] text-blue-300 font-medium capitalize">
                  {isAdmin ? 'Administrator' : 'Citizen'}
                </div>
              </div>
            )}
          </div>

          {/* Action Row: Collapse Button + Logout */}
          <div className="flex items-center justify-between gap-1 pt-1">
            <button
              type="button"
              onClick={handleLogout}
              className={`flex items-center gap-2 px-2.5 py-1.5 text-xs text-red-300 hover:text-red-100 hover:bg-red-950/40 rounded-md transition-colors ${
                isCollapsed ? 'w-full justify-center' : ''
              }`}
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              {!isCollapsed && <span>Logout</span>}
            </button>

            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 text-slate-400 hover:text-white rounded-md transition-colors"
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/60 flex flex-col backdrop-blur-xs">
          <div className="bg-[#17324D] text-white w-72 h-full flex flex-col p-4 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#234668]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center text-white font-bold">
                  <Shield className="w-4 h-4" />
                </div>
                <span className="font-extrabold text-base">CivicTrack</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 py-4 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                      item.isPrimaryCta
                        ? 'bg-[#2563EB] text-white font-bold mb-2'
                        : active
                        ? 'bg-[#2563EB] text-white'
                        : 'text-slate-300 hover:bg-[#1E4064]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#DC2626] text-white">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            <div className="pt-4 border-t border-[#234668]">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-300 hover:text-red-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Desktop Top Bar */}
        <header className="hidden md:flex bg-white border-b border-[#E2E8F0] h-16 px-6 items-center justify-between shrink-0 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-[#64748B]">Bengaluru Grievance Portal</span>
            <span className="text-[#CBD5E1]">/</span>
            <span className="text-xs font-bold text-[#172B4D] capitalize">
              {isAdmin ? 'Administrative Service Suite' : 'Citizen Service Dashboard'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick Track Search Input */}
            <Link
              to="/track"
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#CBD5E1] text-[#64748B] hover:text-[#172B4D] text-xs font-medium rounded-lg transition-colors"
            >
              <Search className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Quick Track ID...</span>
            </Link>

            {/* Notifications Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                className="p-2 text-[#64748B] hover:text-[#172B4D] hover:bg-[#F8FAFC] rounded-lg relative transition-colors"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#DC2626]" />
                )}
              </button>

              {/* Notifications Dropdown Panel */}
              {notifDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-[#E2E8F0] rounded-xl shadow-lg z-50 p-2 divide-y divide-[#F1F5F9]">
                  <div className="px-3 py-2 flex items-center justify-between">
                    <span className="text-xs font-bold text-[#172B4D]">Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllAsRead}
                        className="text-[11px] font-semibold text-[#2563EB] hover:text-[#1D4ED8]"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="max-h-64 overflow-y-auto divide-y divide-[#F8FAFC] py-1">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-xs text-[#64748B]">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.slice(0, 5).map((n) => (
                        <div
                          key={n.id}
                          className={`p-2.5 text-xs rounded-lg transition-colors ${
                            !n.is_read ? 'bg-[#EFF6FF]' : 'hover:bg-[#F8FAFC]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <span className="font-bold text-[#172B4D]">{n.title}</span>
                            {!n.is_read && (
                              <button
                                type="button"
                                onClick={() => markAsRead(n.id)}
                                className="text-[10px] text-[#2563EB] hover:underline"
                              >
                                Mark read
                              </button>
                            )}
                          </div>
                          <p className="text-[11px] text-[#64748B] mt-0.5">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="pt-2 text-center">
                    <Link
                      to="/notifications"
                      onClick={() => setNotifDropdownOpen(false)}
                      className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8]"
                    >
                      View all notifications &rarr;
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar Badge */}
            <Link
              to="/profile"
              className="flex items-center gap-2.5 pl-3 border-l border-[#E2E8F0] group"
            >
              <div className="w-8 h-8 rounded-full bg-[#17324D] text-white flex items-center justify-center font-bold text-xs group-hover:bg-[#2563EB] transition-colors">
                {user?.full_name?.charAt(0) || 'U'}
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-xs font-bold text-[#172B4D] group-hover:text-[#2563EB] transition-colors">
                  {user?.full_name}
                </div>
                <div className="text-[10px] text-[#64748B] capitalize">{user?.role}</div>
              </div>
            </Link>
          </div>
        </header>

        {/* Injected View Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

