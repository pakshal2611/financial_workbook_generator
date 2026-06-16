import { Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { DashboardPage } from "./pages/DashboardPage";
import { DocumentsPage } from "./pages/DocumentsPage";
import { DocumentDetailPage } from "./pages/DocumentDetailPage";
import { AnalysisPage } from "./pages/AnalysisPage";
import { WorkbooksPage } from "./pages/WorkbooksPage";

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="documents" element={<DocumentsPage />} />
        <Route path="documents/:id" element={<DocumentDetailPage />} />
        <Route path="analysis" element={<AnalysisPage />} />
        <Route path="workbooks" element={<WorkbooksPage />} />
      </Route>
    </Routes>
  );
}

export default App;
