import React, { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardActionArea,
  CardContent,
  Button,
  Alert,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import { apiGet, apiPost } from '../api/client';

/**
 * Administrator-only pre-population of the chart of accounts. Templates are
 * offered only while the chart is empty; once one is applied the options
 * disappear and the chart is extended via Bookkeeping → Chart of accounts.
 */
export default function CoaTemplatePicker() {
  const [available, setAvailable] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [applying, setApplying] = useState(false);
  const [msg, setMsg] = useState(null);

  const load = async () => {
    try {
      const data = await apiGet('/api/accounts/templates');
      setAvailable(!!data.available);
      setTemplates(data.templates || []);
    } catch (e) {
      setMsg({ severity: 'error', text: e.message || String(e) });
    } finally {
      setLoaded(true);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const apply = async () => {
    if (!confirm) return;
    setApplying(true);
    setMsg(null);
    try {
      const created = await apiPost(`/api/accounts/templates/${confirm.key}`, {});
      setConfirm(null);
      await load();
      setMsg({
        severity: 'success',
        text: `Added ${created?.length ?? 0} starter accounts for “${confirm.name}”. Extend them under Bookkeeping → Chart of accounts.`,
      });
    } catch (e) {
      setMsg({ severity: 'error', text: e.message || String(e) });
    } finally {
      setApplying(false);
    }
  };

  if (!loaded) return null;

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Pre-populate chart of accounts
      </Typography>

      {msg && (
        <Alert severity={msg.severity} sx={{ mb: 2, maxWidth: 720 }} onClose={() => setMsg(null)}>
          {msg.text}
        </Alert>
      )}

      {available ? (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 720 }}>
            Choose the enterprise type closest to your business to create a starter chart of
            accounts. You can apply only one, and you can add or adjust accounts afterwards under
            Bookkeeping → Chart of accounts.
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {templates.map((t) => (
              <Card key={t.key} variant="outlined" sx={{ width: 280 }}>
                <CardActionArea onClick={() => setConfirm(t)} sx={{ height: '100%' }}>
                  <CardContent>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{ mb: 1 }}
                    >
                      <Typography variant="h6">{t.name}</Typography>
                      <Chip
                        size="small"
                        icon={<AccountTreeIcon />}
                        label={`${t.account_count} accounts`}
                      />
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      {t.description}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            ))}
          </Box>
        </>
      ) : (
        <Paper variant="outlined" sx={{ p: 2, maxWidth: 720 }}>
          <Typography variant="body2" color="text.secondary">
            The chart of accounts has already been set up, so the starter templates are no longer
            available. Manage and extend accounts under{' '}
            <Button component={RouterLink} to="/books/accounts" size="small" sx={{ px: 0.5 }}>
              Bookkeeping → Chart of accounts
            </Button>
            .
          </Typography>
        </Paper>
      )}

      <Dialog open={!!confirm} onClose={() => !applying && setConfirm(null)}>
        <DialogTitle>Create {confirm?.name} accounts?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This adds {confirm?.account_count} starter accounts for a{' '}
            {confirm?.name?.toLowerCase()} business. Pre-population is a one-time setup — the
            template options will no longer be available afterwards, but you can still add or edit
            accounts under Bookkeeping → Chart of accounts.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirm(null)} disabled={applying}>
            Cancel
          </Button>
          <Button variant="contained" onClick={apply} disabled={applying}>
            {applying ? 'Creating…' : 'Create accounts'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
