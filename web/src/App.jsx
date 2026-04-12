import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './components/MainLayout';
import Dashboard from './components/Dashboard';
import Setup from './components/Setup';
import JournalAudit from './components/JournalAudit';
import Workbench from './components/Workbench';
import Periods from './components/Periods';
import Reports from './components/Reports';
import AccountLedger from './components/AccountLedger';

const App = () => {
  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/setup" element={<Setup />} />
          <Route path="/journal" element={<JournalAudit />} />
          <Route path="/workbench" element={<Workbench />} />
          <Route path="/periods" element={<Periods />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/ledger/account/:id" element={<AccountLedger />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
};

export default App;
