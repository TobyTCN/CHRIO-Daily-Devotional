import { Navigate, Route, Routes } from "react-router-dom";
import { isConfigured } from "./lib/supabase.js";
import ReaderLayout from "./components/ReaderLayout.jsx";
import SetupNotice from "./components/SetupNotice.jsx";
import DayPage from "./pages/DayPage.jsx";
import Archive from "./pages/Archive.jsx";
import AdminLayout from "./pages/admin/AdminLayout.jsx";
import Login from "./pages/admin/Login.jsx";
import ResetPassword from "./pages/admin/ResetPassword.jsx";
import Dashboard from "./pages/admin/Dashboard.jsx";
import Upload from "./pages/admin/Upload.jsx";
import Entries from "./pages/admin/Entries.jsx";
import EditEntry from "./pages/admin/EditEntry.jsx";

export default function App() {
  if (!isConfigured) return <SetupNotice />;
  return (
    <Routes>
      <Route element={<ReaderLayout />}>
        <Route index element={<DayPage />} />
        <Route path="day/:date" element={<DayPage />} />
        <Route path="archive" element={<Archive />} />
      </Route>
      <Route path="admin/login" element={<Login />} />
      <Route path="admin/reset" element={<ResetPassword />} />
      <Route path="admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="upload" element={<Upload />} />
        <Route path="entries" element={<Entries />} />
        <Route path="entries/new" element={<EditEntry />} />
        <Route path="entries/:date" element={<EditEntry />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
