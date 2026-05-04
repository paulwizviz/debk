import React, { useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Box, Button, Typography } from '@mui/material';
import ContextBar from './ContextBar';
import Accounts from './Accounts';
import { useUserSession } from '../context/UserSessionContext';

/** Chart of accounts only (configuration administrator / super user). */
export default function CoaSetup() {
  const navigate = useNavigate();
  const { portalConfigure, canBusinessWrite } = useUserSession();

  useEffect(() => {
    if (!portalConfigure) {
      navigate('/', { replace: true });
    }
  }, [portalConfigure, navigate]);

  if (!portalConfigure) {
    return null;
  }

  return (
    <Box>
      <ContextBar />
      <Typography variant="h4" gutterBottom>
        Chart of accounts
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Add and edit accounts. Retained Earnings (3999) is provisioned on the server when missing.
      </Typography>
      {canBusinessWrite && (
        <Box sx={{ mb: 2 }}>
          <Button component={RouterLink} to="/business" variant="outlined" size="small">
            Legal entity & functional currency
          </Button>
        </Box>
      )}
      <Accounts embedded />
    </Box>
  );
}
