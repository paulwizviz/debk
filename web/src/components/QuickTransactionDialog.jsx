import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Stack,
  TextField,
  MenuItem,
  Button,
  Alert,
  Typography,
  InputAdornment,
  Chip,
} from '@mui/material';
import { useApp } from '../context/AppContext';
import { apiPost, BUSINESS_ID } from '../api/client';
import { formatMoney, todayISODate } from '../utils/money';

const CURRENCY_SYMBOLS = { GBP: '£', USD: '$', EUR: '€', AUD: 'A$' };

function emptyForm() {
  return {
    entry_date: todayISODate(),
    description: '',
    amount: '',
    debit_account_id: '',
    credit_account_id: '',
  };
}

/**
 * Quick Transaction: capture one transaction as a single entry (one debit
 * "Category" + one credit "Paid from") and post the balanced double entry.
 */
export default function QuickTransactionDialog({ open, onClose, accounts = [], initial, onPosted }) {
  const { currency, activePeriodId, activePeriod } = useApp();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      setForm({ ...emptyForm(), ...(initial || {}) });
      setError(null);
    }
  }, [open, initial]);

  const sym = CURRENCY_SYMBOLS[currency] || `${currency} `;
  const amountNum = parseFloat(form.amount);
  const amountValid = Number.isFinite(amountNum) && amountNum > 0;

  const accountLabel = (a) => `${a.code} — ${a.name}`;
  const debitAccount = accounts.find((a) => String(a.id) === String(form.debit_account_id));
  const creditAccount = accounts.find((a) => String(a.id) === String(form.credit_account_id));

  const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  const handlePost = async () => {
    setError(null);
    if (!activePeriodId) {
      setError('Select an active accounting period in the context bar.');
      return;
    }
    if (activePeriod?.is_closed) {
      setError('This period is closed. Choose another period or open a new one.');
      return;
    }
    if (!form.description.trim()) {
      setError('Enter a description.');
      return;
    }
    if (!amountValid) {
      setError('Enter an amount greater than zero.');
      return;
    }
    if (!form.debit_account_id || !form.credit_account_id) {
      setError('Choose both a Category and a Paid from account.');
      return;
    }
    if (String(form.debit_account_id) === String(form.credit_account_id)) {
      setError('Category and Paid from must be different accounts.');
      return;
    }

    const body = {
      business_id: BUSINESS_ID,
      period_id: activePeriodId,
      entry_date: new Date(`${form.entry_date}T12:00:00Z`).toISOString(),
      description: form.description.trim(),
      reference: '',
      entry_kind: 'normal',
      lines: [
        { account_id: parseInt(form.debit_account_id, 10), amount: amountNum, side: 'Debit' },
        { account_id: parseInt(form.credit_account_id, 10), amount: amountNum, side: 'Credit' },
      ],
    };

    setSaving(true);
    try {
      await apiPost('/api/journal-entries', body);
      onPosted?.(body.description);
      onClose?.();
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setSaving(false);
    }
  };

  const showPreview = (debitAccount || creditAccount) && amountValid;

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Quick Transaction</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          <TextField
            type="date"
            label="Date"
            value={form.entry_date}
            onChange={set('entry_date')}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <TextField
            label="Description"
            value={form.description}
            onChange={set('description')}
            fullWidth
            required
            placeholder="e.g. Monthly Printer Ink & Paper"
          />
          <TextField
            label="Amount"
            value={form.amount}
            onChange={set('amount')}
            type="number"
            inputProps={{ min: 0, step: '0.01' }}
            fullWidth
            InputProps={{ startAdornment: <InputAdornment position="start">{sym.trim()}</InputAdornment> }}
          />
          <TextField
            select
            label="Category"
            value={form.debit_account_id}
            onChange={set('debit_account_id')}
            fullWidth
            helperText="Account to debit (what the transaction is for)"
          >
            {accounts.map((a) => (
              <MenuItem key={a.id} value={String(a.id)}>
                {accountLabel(a)}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Paid from"
            value={form.credit_account_id}
            onChange={set('credit_account_id')}
            fullWidth
            helperText="Account to credit (where the money comes from)"
          >
            {accounts.map((a) => (
              <MenuItem key={a.id} value={String(a.id)}>
                {accountLabel(a)}
              </MenuItem>
            ))}
          </TextField>

          {showPreview && (
            <Box sx={{ p: 1.5, borderRadius: 1, border: 1, borderColor: 'divider', bgcolor: 'background.default' }}>
              <Typography variant="overline" color="text.secondary">
                System entry (auto-generated)
              </Typography>
              <Stack spacing={1} sx={{ mt: 0.5 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                    <Chip size="small" color="success" label="DEBIT" />
                    <Typography variant="body2" noWrap>
                      {debitAccount ? accountLabel(debitAccount) : '—'}
                    </Typography>
                  </Stack>
                  <Typography variant="body2">{formatMoney(amountNum, currency)}</Typography>
                </Stack>
                <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                    <Chip size="small" color="warning" label="CREDIT" />
                    <Typography variant="body2" noWrap>
                      {creditAccount ? accountLabel(creditAccount) : '—'}
                    </Typography>
                  </Stack>
                  <Typography variant="body2">{formatMoney(amountNum, currency)}</Typography>
                </Stack>
              </Stack>
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handlePost} disabled={saving}>
          Post transaction
        </Button>
      </DialogActions>
    </Dialog>
  );
}
