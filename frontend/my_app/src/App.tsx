
import { useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import AppLayout from "./components/AppLayout";
import DashboardPage from "./pages/DashboardPage";
import HomePage from "./pages/HomePage";
import WorkspacePage from "./pages/WorkspacePage";
import "./index.css";

function PlannerApp() {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  return (
    <Routes>
      <Route
        path="/"
        element={
          <HomePage
            onCreatePlan={() => navigate("/dashboard?create=1")}
          />
        }
      />
      <Route element={<AppLayout searchTerm={searchTerm} onSearchChange={setSearchTerm} />}>
        <Route
          path="dashboard"
          element={<DashboardPage searchTerm={searchTerm} />}
        />
        <Route path="plans" element={<WorkspacePage kind="plans" searchTerm={searchTerm} />} />
        <Route path="tasks" element={<WorkspacePage kind="tasks" searchTerm={searchTerm} />} />
        <Route path="calendar" element={<WorkspacePage kind="calendar" searchTerm={searchTerm} />} />
        <Route path="settings" element={<WorkspacePage kind="settings" searchTerm={searchTerm} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <PlannerApp />
    </BrowserRouter>
  );
}
