import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Dashboard from "./pages/dashboard/Dashboard";
import Home from "./pages/Home";
import FindJobs from "./pages/jobs/FindJobs";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import Attendance from "./pages/attendance/Attendance";
import ContractList from "./pages/attendance/ContractList";


function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function GuestRoute({ children }) {
  const { user } = useAuth();
  return user ? <Navigate to="/dashboard" replace /> : children;
}

function ApplicantsRoute() {
  const { id } = useParams();
  return <DashboardLayout initialSection="ver_aplicaciones" initialJobId={id} />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<GuestRoute><Home /></GuestRoute>} />
        <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/attendance"
          element={
            <ProtectedRoute>
              <Attendance />
            </ProtectedRoute>  
          }
        />
         <Route
          path="/attendance/:contractId"
          element={<ProtectedRoute><Attendance /></ProtectedRoute>}
        />
        <Route
          path="/jobs/create"
          element={
            <ProtectedRoute>
              <DashboardLayout initialSection="crear_oferta" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/jobs"
          element={
            <ProtectedRoute>
              <FindJobs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/jobs/mine"
          element={
            <ProtectedRoute>
              <DashboardLayout initialSection="mis_ofertas" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/jobs/:id/applicants"
          element={
            <ProtectedRoute>
              <ApplicantsRoute />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;