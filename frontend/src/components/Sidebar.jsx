import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  LayoutDashboard,
  MessageSquare,
  UploadCloud,
  Database,
  Hash,
  BarChart3,
  Settings,
  LogOut,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  User
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout, isAdmin } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, adminOnly: false },
    { path: '/chatbot', label: 'RAG Chatbot', icon: MessageSquare, adminOnly: false },
    { path: '/tag-generator', label: 'Tag Generator', icon: Hash, adminOnly: false },
    { path: '/feedback-database', label: 'Feedback QA', icon: Database, adminOnly: false },
    { path: '/evaluation-metrics', label: 'Evaluation RAG', icon: BarChart3, adminOnly: false },
    { path: '/upload-documents', label: 'Upload System', icon: UploadCloud, adminOnly: true },
    { path: '/profile-settings', label: 'Profile Settings', icon: Settings, adminOnly: false },
  ];

  return (
    <aside
      className={`glass-panel fixed top-0 left-0 z-40 h-screen border-r border-slate-200/50 dark:border-slate-800/40 transition-all duration-300 ease-in-out flex flex-col justify-between
        ${isCollapsed ? 'w-20' : 'w-64'}
      `}
    >
      {/* Header / Logo */}
      <div>
        <div className="flex items-center justify-between p-5 border-b border-slate-200/50 dark:border-slate-800/40">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 text-white font-bold text-lg shadow-md shadow-brand-500/20">
              DG
            </div>
            {!isCollapsed && (
              <span className="font-bold text-base tracking-tight text-slate-800 dark:text-slate-100 whitespace-nowrap animate-fade-in">
                Domain<span className="text-brand-500">RAG</span>
              </span>
            )}
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex h-7 w-7 items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="mt-6 px-3 space-y-1">
          {navItems.map((item) => {
            // Hide admin-only tabs if standard user
            if (item.adminOnly && !isAdmin) return null;
            
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium text-sm transition-all duration-200 group relative
                  ${isActive 
                    ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20' 
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/80'
                  }
                `}
              >
                <Icon size={20} className={isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-brand-500 dark:group-hover:text-brand-400 transition-colors'} />
                {!isCollapsed && <span className="fade-in">{item.label}</span>}
                
                {/* Collapsed Tooltip */}
                {isCollapsed && (
                  <div className="absolute left-full ml-4 px-3 py-2 bg-slate-900 dark:bg-slate-800 text-white text-xs font-semibold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-md whitespace-nowrap z-50">
                    {item.label}
                    {item.adminOnly && <span className="ml-1 text-[10px] text-amber-400">(Admin)</span>}
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer (User Details & Theme Controls) */}
      <div className="p-4 border-t border-slate-200/50 dark:border-slate-800/40 space-y-4">
        {/* Theme Toggle (Inline or Collapsed) */}
        <button
          onClick={toggleTheme}
          className="flex w-full items-center justify-between p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <div className="flex items-center gap-3">
            {darkMode ? <Sun size={20} className="text-amber-500 animate-spin" style={{ animationDuration: '10s' }} /> : <Moon size={20} className="text-brand-500" />}
            {!isCollapsed && <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Theme</span>}
          </div>
          {!isCollapsed && (
            <div className={`h-5 w-9 rounded-full p-0.5 transition-colors duration-200 ${darkMode ? 'bg-brand-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
              <div className={`h-4 w-4 rounded-full bg-white transition-transform duration-200 ${darkMode ? 'translate-x-4' : 'translate-x-0'}`}></div>
            </div>
          )}
        </button>

        {/* User Card */}
        <div className="flex items-center justify-between gap-3 p-1.5 rounded-xl bg-slate-100/40 dark:bg-slate-800/20 overflow-hidden border border-slate-200/20 dark:border-slate-800/10">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 shadow-inner">
              <User size={18} />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col text-left overflow-hidden fade-in">
                <span className="font-semibold text-sm text-slate-800 dark:text-slate-200 truncate">
                  {user?.name || 'Loading...'}
                </span>
                <span className="flex items-center gap-1 text-[10px] font-bold tracking-wide uppercase text-slate-400 dark:text-slate-500">
                  {isAdmin ? (
                    <span className="flex items-center gap-0.5 text-amber-500 dark:text-amber-400">
                      <ShieldCheck size={10} /> Admin
                    </span>
                  ) : (
                    'User Account'
                  )}
                </span>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <button
              onClick={handleLogout}
              className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-colors"
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
