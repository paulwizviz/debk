import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  TextField,
  Button,
  Stack,
  Alert,
} from '@mui/material';
import ContextBar from './ContextBar';
import { apiGet, apiPatch, BUSINESS_ID } from '../api/client';
import Accounts from './Accounts';

/**
 * System initialisation (UC1): business identity + chart of accounts (§4.1).
 */
export default function Setup() {
  const [tab, setTab] = useState(0);
  const [business, setBusiness] = useState(null);
  const [legalName, setLegalName] = useState('');
  const [functionalCurrency, setFunctionalCurrency] = useState('GBP');
  const [msg, setMsg] = useState(null);

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
    load().catch((e) => setMsg({ severity: 'error', text: e.message }));
  }, []);

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

  return (
    <Box>
      <ContextBar />
      <Typography variant="h4" gutterBottom>
        Business & books
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Define the legal entity and functional currency, then maintain your chart of accounts. Retained Earnings (3999) is
        provisioned automatically on the server when missing.
      </Typography>

      <Paper sx={{ mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Business profile" />
          <Tab label="Chart of accounts" />
        </Tabs>
      </Paper>

      {tab === 0 && (
        <Paper sx={{ p: 2 }}>
          {msg && (
            <Alert severity={msg.severity} sx={{ mb: 2 }} onClose={() => setMsg(null)}>
              {msg.text}
            </Alert>
          )}
          <Stack spacing={2} maxWidth={480}>
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
              helperText="Used for display (GBP, USD, …). Amounts are stored as decimals."
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
      )}

      {tab === 1 && <Accounts embedded />}
    </Box>
  );
}
