
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import QuizTakerPage from './pages/QuizTakerPage';
import Header from './components/layout/Header';
import { Role } from './types';

// Fix: Replaced JSX.Element with React.ReactElement to resolve "Cannot find namespace 'JSX'" error.
const ProtectedRoute: React.FC<{ children: React.ReactElement; role: Role }> = ({ children, role }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" />;
  }
  if (user.role !== role) {
    return <Navigate to={user.role === Role.ADMIN ? '/admin' : '/student'} />;
  }
  return children;
};

const AppRoutes: React.FC = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-900">
                <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900">
            <Header />
            <main className="container mx-auto p-4 md:p-8">
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route
                        path="/student"
                        element={
                            <ProtectedRoute role={Role.STUDENT}>
                                <StudentDashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/student/quiz/:quizId"
                        element={
                            <ProtectedRoute role={Role.STUDENT}>
                                <QuizTakerPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin"
                        element={
                            <ProtectedRoute role={Role.ADMIN}>
                                <AdminDashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route path="/" element={<Navigate to={user ? (user.role === Role.ADMIN ? '/admin' : '/student') : '/login'} />} />
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </main>
        </div>
    );
};


const App: React.FC = () => {
  return (
    <AuthProvider>
        <HashRouter>
            <AppRoutes />
        </HashRouter>
    </AuthProvider>
  );
}

export default App;