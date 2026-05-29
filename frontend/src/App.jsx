import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';

// Sidebar & Navbar
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

// Page components
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Chatbot from './pages/Chatbot';
import UploadDocuments from './pages/UploadDocuments';
import FeedbackDatabase from './pages/FeedbackDatabase';
import TagGenerator from './pages/TagGenerator';
import EvaluationMetrics from './pages/EvaluationMetrics';
import ProfileSettings from './pages/ProfileSettings';

// Layout shell wrapper
const AppLayout = ({ children }) => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Workspace (shifted right to account for sidebar) */}
      <div className="flex-1 flex flex-col h-full overflow-hidden pl-20 md:pl-64 transition-all duration-300">
        {/* Top Navbar Header */}
        <Navbar />

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50/50 dark:bg-slate-950/40">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            {/* Public Authentication Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Core Application Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Dashboard />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/chatbot"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Chatbot />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/upload-documents"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AppLayout>
                    <UploadDocuments />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/feedback-database"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <FeedbackDatabase />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/tag-generator"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <TagGenerator />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/evaluation-metrics"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <EvaluationMetrics />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile-settings"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ProfileSettings />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            {/* Default fallbacks */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
