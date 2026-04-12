import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  MenuItem,
  Stack,
  Paper,
  IconButton,
  Alert,
  InputAdornment,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useSearchParams, useLocation } from 'react-router-dom';
import ContextBar from './ContextBar';
import { useApp } from '../context/AppContext';
import { apiGet, apiPost, BUSINESS_ID } from '../api/client';
import { formatMoney, todayISODate } from '../utils/money';

const ENTRY_KINDS = [
  { value: 'normal', label: 'Normal' },
  { value: 'adjusting', label: 'Adjusting (e.g. depreciation)' },
  { value: 'closing', label: 'Closing (usually from closing assistant)' },
];

const emptyLine = () => ({ account_id: '', amount: '', side: 'Debit' });

/**
 * Journal entry workbench (§4.3): multi-line, difference-to-zero, entry_kind, period, contra labels.
 */
export default function Workbench() {
  const { currency, activePeriodId, activePeriod } = useApp();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [accounts, setAccounts] = useState([]);
  const [accountFilter, setAccountFilter] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const [form, setForm] = useState({
    entry_date: todayISODate(),
    description: '',
    reference: '',
    entry_kind: 'normal',
    lines: [emptyLine(), { ...emptyLine(), side: 'Credit' }],
  });

  useEffect(() => {
    apiGet('/api/accounts')
      .then(setAccounts)
      .catch((e) => console.error(e));
  }, []);

  const reverseId = searchParams.get('reverse');
  const reverseEntryState = location.state?.reverseEntry;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let src = reverseEntryState;
      if (!src && reverseId) {
        try {
          src = await apiGet(`/api/journal-entries/${reverseId}`);
        } catch (e) {
          console.error(e);
        }
      }
      if (!src || cancelled) return;
      const lines = (src.lines || []).map((l) => ({
        account_id: l.account_id,
        amount: String(l.amount),
        side: l.side === 'Debit' ? 'Credit' : 'Debit',
      }));
      if (lines.length < 2) return;
      setForm((prev) => ({
        ...prev,
        description: `Reversal of #${src.journal_seq}: ${src.description}`,
        reference: src.reference ? `Rev ${src.reference}` : '',
        entry_kind: 'normal',
        lines,
      }));
    })();
    return () => {
      cancelled = true;
    };
  }, [reverseId, reverseEntryState]);

  const filteredAccounts = useMemo(() => {
    const q = accountFilter.trim().toLowerCase();
    if (!q) return accounts;
    return accounts.filter(
      (a) =>
        a.code.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q) ||
        a.type.toLowerCase().includes(q),
    );
  }, [accounts, accountFilter]);

  const accountLabel = (a) => {
    const tag = a.is_contra ? ' (contra-asset)' : '';
    return `${a.code} — ${a.name} [${a.type}]${tag}`;
  };

  const totals = useMemo(() => {
    let deb = 0;
    let cred = 0;
    form.lines.forEach((l) => {
      const amt = parseFloat(l.amount, 10);
      if (!Number.isFinite(amt) || amt <= 0) return;
      if (l.side === 'Debit') deb += amt;
      else cred += amt;
    });
    return { deb, cred, diff: deb - cred };
  }, [form.lines]);

  const updateLine = (idx, field, value) => {
    setForm((prev) => {
      const lines = [...prev.lines];
      lines[idx] = { ...lines[idx], [field]: value };
      return { ...prev, lines };
    });
  };

  const addLine = () => setForm((p) => ({ ...p, lines: [...p.lines, emptyLine()] }));
  const removeLine = (idx) => {
    if (form.lines.length <= 2) return;
    setForm((p) => ({ ...p, lines: p.lines.filter((_, i) => i !== idx) }));
  };

  const handlePost = async () => {
    setMessage(null);
    if (!activePeriodId) {
      setMessage({ severity: 'error', text: 'Select an active accounting period in the context bar.' });
      return;
    }
    if (activePeriod?.is_closed) {
      setMessage({ severity: 'error', text: 'This period is closed. Choose another period or open a new one.' });
      return;
    }
    if (Math.abs(totals.diff) > 0.000001) {
      setMessage({ severity: 'error', text: `Entry must balance. Difference: ${totals.diff.toFixed(2)}` });
      return;
    }

    const lines = form.lines
      .map((l) => ({
        account_id: parseInt(l.account_id, 10),
        amount: parseFloat(l.amount, 10),
        side: l.side,
      }))
      .filter((l) => l.account_id && Number.isFinite(l.amount) && l.amount > 0);

    if (lines.length < 2) {
      setMessage({ severity: 'error', text: 'At least two lines with valid account and positive amount.' });
      return;
    }

    const body = {
      business_id: BUSINESS_ID,
      period_id: activePeriodId,
      entry_date: new Date(form.entry_date + 'T12:00:00Z').toISOString(),
      description: form.description,
      reference: form.reference || '',
      entry_kind: form.entry_kind,
      lines,
    };

    setSaving(true);
    try {
      await apiPost('/api/journal-entries', body);
      setMessage({ severity: 'success', text: 'Posted successfully.' });
      setForm({
        entry_date: todayISODate(),
        description: '',
        reference: '',
        entry_kind: 'normal',
        lines: [emptyLine(), { ...emptyLine(), side: 'Credit' }],
      });
    } catch (e) {
      setMessage({ severity: 'error', text: e.message || String(e) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <ContextBar />
      <Typography variant="h4" gutterBottom>
        Journal workbench
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Use for treasury transfers, credit sales, payroll splits, and adjusting entries. Set <strong>Adjusting</strong> for
        non-routine postings (e.g. depreciation). Server validates balance, period dates, and accounts.
      </Typography>

      {message && (
        <Alert severity={message.severity} sx={{ mb: 2 }} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              type="date"
              label="Entry date"
              value={form.entry_date}
              onChange={(e) => setForm((p) => ({ ...p, entry_date: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Description"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="Reference (source document)"
              value={form.reference}
              onChange={(e) => setForm((p) => ({ ...p, reference: e.target.value }))}
              fullWidth
            />
            <TextField
              select
              label="Entry kind"
              value={form.entry_kind}
              onChange={(e) => setForm((p) => ({ ...p, entry_kind: e.target.value }))}
              sx={{ minWidth: 220 }}
            >
              {ENTRY_KINDS.map((k) => (
                <MenuItem key={k.value} value={k.value}>
                  {k.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
          <TextField
            size="small"
            label="Filter accounts"
            value={accountFilter}
            onChange={(e) => setAccountFilter(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">{filteredAccounts.length}</InputAdornment>
              ),
            }}
            helperText="Type code, name, or type to narrow the pickers below."
          />
        </Stack>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Lines
        </Typography>
        {form.lines.map((line, idx) => (
          <Stack key={idx} direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 1 }} alignItems="center">
            <TextField
              select
              label="Account"
              value={line.account_id}
              onChange={(e) => updateLine(idx, 'account_id', e.target.value)}
              sx={{ flex: 2, minWidth: 220 }}
            >
              {filteredAccounts.map((a) => (
                <MenuItem key={a.id} value={String(a.id)}>
                  {accountLabel(a)}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Side"
              value={line.side}
              onChange={(e) => updateLine(idx, 'side', e.target.value)}
              sx={{ minWidth: 120 }}
            >
              <MenuItem value="Debit">Debit</MenuItem>
              <MenuItem value="Credit">Credit</MenuItem>
            </TextField>
            <TextField
              label="Amount"
              value={line.amount}
              onChange={(e) => updateLine(idx, 'amount', e.target.value)}
              type="number"
              inputProps={{ min: 0, step: '0.01' }}
              sx={{ minWidth: 140 }}
            />
            <IconButton onClick={() => removeLine(idx)} disabled={form.lines.length <= 2} aria-label="remove line">
              <DeleteIcon />
            </IconButton>
          </Stack>
        ))}
        <Button startIcon={<AddIcon />} onClick={addLine} sx={{ mt: 1 }}>
          Add line
        </Button>

        <Box
          sx={{
            mt: 3,
            p: 2,
            borderRadius: 1,
            bgcolor: Math.abs(totals.diff) > 0.000001 ? 'error.light' : 'success.light',
          }}
        >
          <Typography>
            Debits: {formatMoney(totals.deb, currency)} · Credits: {formatMoney(totals.cred, currency)} ·{' '}
            <strong>Difference: {formatMoney(totals.diff, currency)}</strong>
          </Typography>
        </Box>

        <Button
          variant="contained"
          size="large"
          sx={{ mt: 2 }}
          disabled={saving || Math.abs(totals.diff) > 0.000001}
          onClick={handlePost}
        >
          Post journal
        </Button>
      </Paper>
    </Box>
  );
}
