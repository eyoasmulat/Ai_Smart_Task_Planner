
import { useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import ReferenceShell from "./components/ReferenceShell";
import CollectionPage from "./pages/CollectionPage";
import DashboardReferencePage from "./pages/DashboardReferencePage";
import HomePage from "./pages/HomePage";
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
      <Route element={<ReferenceShell searchTerm={searchTerm} onSearchChange={setSearchTerm} />}>
        <Route
          path="dashboard"
          element={<DashboardReferencePage searchTerm={searchTerm} />}
        />
        <Route path="plans" element={<CollectionPage kind="plans" searchTerm={searchTerm} />} />
        <Route path="tasks" element={<CollectionPage kind="tasks" searchTerm={searchTerm} />} />
        <Route path="calendar" element={<CollectionPage kind="calendar" searchTerm={searchTerm} />} />
        <Route path="settings" element={<CollectionPage kind="settings" searchTerm={searchTerm} />} />
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
