import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams, useLocation } from 'react-router-dom';
import ProtectedShell from './components/ProtectedShell';
import LoginPage from './components/LoginPage';
import HomePortal from './components/HomePortal';
import Dashboard from './components/Dashboard';
import Journal from './components/Journal';
import Periods from './components/Periods';
import Reports from './components/Reports';
import AccountLedger from './components/AccountLedger';
import TeamOnboarding from './components/TeamOnboarding';
import CoaSetup from './components/CoaSetup';
import BusinessProfile from './components/BusinessProfile';
import BookkeepingLayout from './components/BookkeepingLayout';

function LegacyLedgerRedirect() {
  const { id } = useParams();
  return <Navigate to={`/books/ledger/account/${id}`} replace />;
}

function WorkbenchRedirect() {
  const loc = useLocation();
  const params = new URLSearchParams(loc.search);
  params.set('tab', 'entry');
  return <Navigate to={`/books/journal?${params.toString()}`} replace state={loc.state} />;
}

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<ProtectedShell />}>
          <Route index element={<HomePortal />} />
          <Route path="identity" element={<TeamOnboarding />} />
          <Route path="configure" element={<BusinessProfile />} />
          <Route path="business" element={<Navigate to="/configure" replace />} />
          <Route path="books" element={<BookkeepingLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="journal" element={<Journal />} />
            <Route path="workbench" element={<WorkbenchRedirect />} />
            <Route path="accounts" element={<CoaSetup />} />
            <Route path="periods" element={<Periods />} />
            <Route path="reports" element={<Reports />} />
            <Route path="ledger/account/:id" element={<AccountLedger />} />
          </Route>
          <Route path="settings/users" element={<Navigate to="/identity" replace />} />
          <Route path="setup" element={<Navigate to="/books/accounts" replace />} />
          <Route path="journal" element={<Navigate to="/books/journal" replace />} />
          <Route path="workbench" element={<Navigate to="/books/journal" replace />} />
          <Route path="periods" element={<Navigate to="/books/periods" replace />} />
          <Route path="reports" element={<Navigate to="/books/reports" replace />} />
          <Route path="ledger/account/:id" element={<LegacyLedgerRedirect />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
