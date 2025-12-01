// frontend/src/App.jsx

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import CalendarPage from "./pages/CalendarPage";
import AdminReviewPage from "./pages/AdminReviewPage";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./hooks/useAuth";
import CreateJobPage from "./pages/CreateJobPage";
import CreateCompanyPage from "./pages/CreateCompanyPage";
import CreateTechnicianPage from "./pages/CreateTechnicianPage";
import MainLayout from "./components/layout/MainLayout";



const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (user.role !== "ADMIN" && user.role !== "SEMI_ADMIN") {
    return <Navigate to="/calendar" />;
  }
  return children;
};

const AppInner = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route element={<MainLayout />}>
    <Route
      path="/calendar"
      element={
        <PrivateRoute>
          <CalendarPage />
        </PrivateRoute>
      }
    />
    <Route
      path="/admin/review"
      element={
        <AdminRoute>
          <AdminReviewPage />
        </AdminRoute>
      }
    />
    <Route
  path="/jobs/new"
  element={
    <AdminRoute>
      <CreateJobPage />
    </AdminRoute>
  }
/>
<Route
  path="/admin/companies/new"
  element={
    <AdminRoute>
      <CreateCompanyPage />
    </AdminRoute>
  }
/>

<Route
  path="/admin/technicians/new"
  element={
    <AdminRoute>
      <CreateTechnicianPage />
    </AdminRoute>
  }
/>
</Route>
<Route path="*" element={<LoginPage />} />
    <Route path="*" element={<Navigate to="/calendar" />} />
  </Routes>
);

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppInner />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
