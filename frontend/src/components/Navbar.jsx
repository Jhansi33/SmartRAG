import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Calendar, User } from 'lucide-react';

const Navbar = () => {
  const { user } = useAuth();
  const location = useLocation();

  // Map paths to beautiful, clean page titles
  const getPageTitle = (path) => {
    switch (path) {
      case '/dashboard':
        return 'System Dashboard';
      case '/chatbot':
        return 'Domain RAG Chatbot';
      case '/tag-generator':
        return 'AI Tagging Expert';
      case '/feedback-database':
        return 'Feedback Q&A Repository';
      case '/evaluation-metrics':
        return 'RAG Precision & Quality Analytics';
      case '/upload-documents':
        return 'Ingest System Knowledge';
      case '/profile-settings':
        return 'Profile Settings';
      default:
        return 'Dashboard';
    }
  };

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <header className="glass-panel w-full border-b border-slate-200/50 dark:border-slate-800/40 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
      {/* Page Title */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
          {getPageTitle(location.pathname)}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Enterprise Knowledge Management System
        </p>
      </div>

      {/* Right side items */}
      <div className="flex items-center gap-4">
        {/* Date display */}
        <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100/50 dark:bg-slate-800/30 text-xs font-semibold text-slate-600 dark:text-slate-300 border border-slate-200/30 dark:border-slate-800/10">
          <Calendar size={14} className="text-brand-500" />
          {todayStr}
        </div>

        {/* Quick User Greeting */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Welcome back, <span className="font-bold text-slate-700 dark:text-slate-200">{user?.name?.split(' ')[0] || 'User'}</span>
          </span>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
