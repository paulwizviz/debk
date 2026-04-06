import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './components/MainLayout';
import Dashboard from './components/Dashboard';
import Accounts from './components/Accounts';
import JournalEntries from './components/JournalEntries';

/**
 * Main App component using US English for structure.
 */
const App = () => {
  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/accounts" element={<Accounts />} />
          <Route path="/ledger" element={<JournalEntries />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
};

export default App;
