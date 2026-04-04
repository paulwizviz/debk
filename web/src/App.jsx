import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Typography, Box } from '@mui/material';
import MainLayout from './components/MainLayout';
import Dashboard from './components/Dashboard';

const Placeholder = ({ title }) => (
  <Box>
    <Typography variant="h4" gutterBottom>
      {title}
    </Typography>
    <Typography variant="body1">
      This is the {title} page. Implementation coming soon.
    </Typography>
  </Box>
);

/**
 * Main App component using US English for structure.
 */
const App = () => {
  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/accounts" element={<Placeholder title="Chart of Accounts" />} />
          <Route path="/ledger" element={<Placeholder title="General Ledger" />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
};

export default App;
