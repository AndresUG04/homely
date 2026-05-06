import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Dashboard from "./pages/dashboard/Dashboard";
import Home from "./pages/Home";
import FindJobs from "./pages/jobs/FindJobs";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import Attendance from "./pages/attendance/Attendance";
import EmployerReviewContract from "./pages/jobs/EmployerReviewContract";

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

function ContractRoute() {
  const { jobId, applicationId } = useParams();
  return <DashboardLayout initialSection="adjuntar_contrato" initialJobId={jobId} initialApplicationId={applicationId} />;
}

function ContractSignRoute() {
  const { contractId } = useParams();
  return <DashboardLayout initialSection="firmar_contrato" initialContractId={contractId} />;
}

function EmployerReviewRoute() {
  const { contractId } = useParams();
  return <DashboardLayout initialSection="revisar_contrato" initialContractId={contractId} />;
}

function AttendanceRoute() {
  return <DashboardLayout initialSection="asistencia" />;
}

function ProfileRoute() {
  return <DashboardLayout initialSection="perfil" />;
}

function SearchWorkersRoute() {
  return <DashboardLayout initialSection="buscar_trabajadoras" />;
}

function PaymentsRoute() {
  return <DashboardLayout initialSection="pagos" />;
}

function BenefitsRoute() {
  return <DashboardLayout initialSection="beneficios" />;
}

function ReportsRoute() {
  return <DashboardLayout initialSection="reportes" />;
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
              <DashboardLayout initialSection="buscar_empleo" />
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
        <Route
          path="/jobs/:jobId/contracts/:applicationId"
          element={
            <ProtectedRoute>
              <ContractRoute />
            </ProtectedRoute>
          }
        />
        <Route
          path="/contracts/:contractId/sign"
          element={
            <ProtectedRoute>
              <ContractSignRoute />
            </ProtectedRoute>
          }
        />
        <Route
          path="/contracts/:contractId/review"
          element={
            <ProtectedRoute>
              <EmployerReviewRoute />
            </ProtectedRoute>
          }
        />
        <Route
          path="/contracts"
          element={
            <ProtectedRoute>
              <DashboardLayout initialSection="mis_contratos" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/attendance"
          element={
            <ProtectedRoute>
              <AttendanceRoute />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/profile"
          element={
            <ProtectedRoute>
              <ProfileRoute />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/search-workers"
          element={
            <ProtectedRoute>
              <SearchWorkersRoute />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/payments"
          element={
            <ProtectedRoute>
              <PaymentsRoute />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/benefits"
          element={
            <ProtectedRoute>
              <BenefitsRoute />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/reports"
          element={
            <ProtectedRoute>
              <ReportsRoute />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;