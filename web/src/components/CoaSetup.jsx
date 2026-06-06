import React from 'react';
import { Box, Typography } from '@mui/material';
import ContextBar from './ContextBar';
import Accounts from './Accounts';

/** Chart of accounts within the bookkeeping area (operators with coa:read/coa:write). */
export default function CoaSetup() {
  return (
    <Box>
      <ContextBar />
      <Typography variant="h4" gutterBottom>
        Chart of accounts
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Add and edit accounts. Retained Earnings (3999) is provisioned on the server when missing.
      </Typography>
      <Accounts embedded />
    </Box>
  );
}
