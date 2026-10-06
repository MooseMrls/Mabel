import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { Layout, RequireAuth } from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Publishers from './pages/Publishers.jsx';
import Books from './pages/Books.jsx';
import Evaluate from './pages/Evaluate.jsx';
import MyEvaluations from './pages/MyEvaluations.jsx';
import EvaluationPage from './pages/EvaluationPage.jsx';
import AdminReports from './pages/AdminReports.jsx';
import AdminCatalog from './pages/AdminCatalog.jsx';
import AdminEvaluators from './pages/AdminEvaluators.jsx';

const Guard = ({ admin, any, children }) => <RequireAuth admin={admin} any={any}>{children}</RequireAuth>;

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Guard any><Layout /></Guard>}>
        <Route element={<Guard><Outlet /></Guard>}>
          <Route path="/" element={<Publishers />} />
          <Route path="/publishers/:pid" element={<Books />} />
          <Route path="/books/:bid/evaluate" element={<Evaluate />} />
          <Route path="/evaluations" element={<MyEvaluations />} />
        </Route>
        <Route path="/evaluations/:id" element={<EvaluationPage />} />
        <Route element={<Guard admin><Outlet /></Guard>}>
          <Route path="/admin" element={<AdminReports />} />
          <Route path="/admin/evaluations/:id" element={<EvaluationPage />} />
          <Route path="/admin/catalog" element={<AdminCatalog />} />
          <Route path="/admin/evaluators" element={<AdminEvaluators />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

