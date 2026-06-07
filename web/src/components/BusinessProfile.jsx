import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Stack,
  Alert,
} from '@mui/material';
import ContextBar from './ContextBar';
import CoaTemplatePicker from './CoaTemplatePicker';
import { apiGet, apiPatch, BUSINESS_ID } from '../api/client';
import { useUserSession } from '../context/UserSessionContext';

/** Legal name and functional currency (users with business:write). */
export default function BusinessProfile() {
  const navigate = useNavigate();
  const { canBusinessWrite } = useUserSession();
  const [business, setBusiness] = useState(null);
  const [legalName, setLegalName] = useState('');
  const [functionalCurrency, setFunctionalCurrency] = useState('GBP');
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    if (!canBusinessWrite) {
      navigate('/', { replace: true });
    }
  }, [canBusinessWrite, navigate]);

  const load = async () => {
    const list = await apiGet('/api/business');
    const b = (list || []).find((x) => x.id === BUSINESS_ID) || list?.[0];
    setBusiness(b);
    if (b) {
      setLegalName(b.legal_name || '');
      setFunctionalCurrency(b.functional_currency || 'GBP');
    }
  };

  useEffect(() => {
    if (!canBusinessWrite) return;
    load().catch((e) => setMsg({ severity: 'error', text: e.message }));
  }, [canBusinessWrite]);

  const saveBusiness = async () => {
    setMsg(null);
    try {
      await apiPatch(`/api/business/${BUSINESS_ID}`, {
        legal_name: legalName,
        functional_currency: functionalCurrency,
      });
      setMsg({ severity: 'success', text: 'Business profile saved.' });
      await load();
    } catch (e) {
      setMsg({ severity: 'error', text: e.message || String(e) });
    }
  };

  if (!canBusinessWrite) {
    return null;
  }

  return (
    <Box>
      <ContextBar />
      <Typography variant="h4" gutterBottom>
        Legal entity & currency
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Configure the registered legal name and functional currency for this business.
      </Typography>
      <Paper sx={{ p: 2, maxWidth: 480 }}>
        {msg && (
          <Alert severity={msg.severity} sx={{ mb: 2 }} onClose={() => setMsg(null)}>
            {msg.text}
          </Alert>
        )}
        <Stack spacing={2}>
          <TextField
            label="Legal name"
            value={legalName}
            onChange={(e) => setLegalName(e.target.value)}
            fullWidth
            required
            helperText="e.g. ACME Private Limited"
          />
          <TextField
            label="Functional currency (ISO code)"
            value={functionalCurrency}
            onChange={(e) => setFunctionalCurrency(e.target.value.toUpperCase())}
            fullWidth
            helperText="Used for display (GBP, USD, …)."
          />
          <Button variant="contained" onClick={saveBusiness} disabled={!legalName}>
            Save profile
          </Button>
          {business && (
            <Typography variant="caption" color="text.secondary">
              Business ID: {business.id}
            </Typography>
          )}
        </Stack>
      </Paper>

      <CoaTemplatePicker />
    </Box>
  );
}
