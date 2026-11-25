import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { SidebarLayout } from './components/SidebarLayout';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute';

// Public Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Citizen Pages
import { CitizenDashboard } from './pages/CitizenDashboard';
import { CreateComplaintPage } from './pages/CreateComplaintPage';
import { ComplaintDetailPage } from './pages/ComplaintDetailPage';
import { MyComplaintsPage } from './pages/MyComplaintsPage';
import { TrackComplaintPage } from './pages/TrackComplaintPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ProfilePage } from './pages/ProfilePage';
import { HelpSupportPage } from './pages/HelpSupportPage';

// Admin Pages
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminAllComplaintsPage } from './pages/AdminAllComplaintsPage';
import { AdminComplaintDetailPage } from './pages/AdminComplaintDetailPage';
import { AdminAnalyticsPage } from './pages/AdminAnalyticsPage';
import { AdminMapOverviewPage } from './pages/AdminMapOverviewPage';
import { AdminDepartmentPage } from './pages/AdminDepartmentPage';
import { AdminDuplicatesPage } from './pages/AdminDuplicatesPage';
import { AdminAuthorityDirectoryPage } from './pages/AdminAuthorityDirectoryPage';
import { AdminAuditLogPage } from './pages/AdminAuditLogPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { AdminSettingsPage } from './pages/AdminSettingsPage';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
            {/* Public Layout */}
            <Route
              path="/"
              element={
                <div className="min-h-screen flex flex-col bg-[#F5F7FA] text-[#172B4D]">
                  <Navbar />
                  <main className="flex-1">
                    <LandingPage />
                  </main>
                  <Footer />
                </div>
              }
            />
            <Route
              path="/login"
              element={
                <div className="min-h-screen flex flex-col bg-[#F5F7FA] text-[#172B4D]">
                  <Navbar />
                  <main className="flex-1">
                    <LoginPage />
                  </main>
                  <Footer />
                </div>
              }
            />
            <Route
              path="/register"
              element={
                <div className="min-h-screen flex flex-col bg-[#F5F7FA] text-[#172B4D]">
                  <Navbar />
                  <main className="flex-1">
                    <RegisterPage />
                  </main>
                  <Footer />
                </div>
              }
            />

            {/* Citizen Protected Routes with SidebarLayout */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <SidebarLayout>
                    <CitizenDashboard />
                  </SidebarLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/complaints"
              element={
                <ProtectedRoute>
                  <SidebarLayout>
                    <MyComplaintsPage />
                  </SidebarLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/complaints/new"
              element={
                <ProtectedRoute>
                  <SidebarLayout>
                    <CreateComplaintPage />
                  </SidebarLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/complaints/:id"
              element={
                <ProtectedRoute>
                  <SidebarLayout>
                    <ComplaintDetailPage />
                  </SidebarLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/track"
              element={
                <ProtectedRoute>
                  <SidebarLayout>
                    <TrackComplaintPage />
                  </SidebarLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <SidebarLayout>
                    <NotificationsPage />
                  </SidebarLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <SidebarLayout>
                    <ProfilePage />
                  </SidebarLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/help"
              element={
                <ProtectedRoute>
                  <SidebarLayout>
                    <HelpSupportPage />
                  </SidebarLayout>
                </ProtectedRoute>
              }
            />

            {/* Administrator Protected Routes with SidebarLayout */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <SidebarLayout>
                    <AdminDashboard />
                  </SidebarLayout>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/all-complaints"
              element={
                <AdminRoute>
                  <SidebarLayout>
                    <AdminAllComplaintsPage />
                  </SidebarLayout>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/map"
              element={
                <AdminRoute>
                  <SidebarLayout>
                    <AdminMapOverviewPage />
                  </SidebarLayout>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/complaints/:id"
              element={
                <AdminRoute>
                  <SidebarLayout>
                    <AdminComplaintDetailPage />
                  </SidebarLayout>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/departments"
              element={
                <AdminRoute>
                  <SidebarLayout>
                    <AdminDepartmentPage />
                  </SidebarLayout>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <AdminRoute>
                  <SidebarLayout>
                    <AdminAnalyticsPage />
                  </SidebarLayout>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/duplicates"
              element={
                <AdminRoute>
                  <SidebarLayout>
                    <AdminDuplicatesPage />
                  </SidebarLayout>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/authorities"
              element={
                <AdminRoute>
                  <SidebarLayout>
                    <AdminAuthorityDirectoryPage />
                  </SidebarLayout>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/audit-logs"
              element={
                <AdminRoute>
                  <SidebarLayout>
                    <AdminAuditLogPage />
                  </SidebarLayout>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <AdminRoute>
                  <SidebarLayout>
                    <AdminUsersPage />
                  </SidebarLayout>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <AdminRoute>
                  <SidebarLayout>
                    <AdminSettingsPage />
                  </SidebarLayout>
                </AdminRoute>
              }
            />

            {/* Fallback */}
            <Route
              path="*"
              element={
                <div className="min-h-screen flex flex-col bg-[#F5F7FA]">
                  <Navbar />
                  <main className="flex-1">
                    <NotFoundPage />
                  </main>
                  <Footer />
                </div>
              }
            />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
