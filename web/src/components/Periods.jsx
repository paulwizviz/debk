import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Alert,
  Divider,
} from '@mui/material';
import ContextBar from './ContextBar';
import { useApp } from '../context/AppContext';
import { apiGet, apiPost, BUSINESS_ID } from '../api/client';
import { formatMoney, formatDate, todayISODate } from '../utils/money';

/**
 * Period management & closing assistant preview (§4.5, UC6).
 */
export default function Periods() {
  const { currency, refreshPeriods } = useApp();
  const [periods, setPeriods] = useState([]);
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [start, setStart] = useState(todayISODate());
  const [end, setEnd] = useState(todayISODate());
  const [msg, setMsg] = useState(null);
  const [closingPeriod, setClosingPeriod] = useState(null);
  const [tb, setTb] = useState([]);
  const [pl, setPl] = useState(null);
  const [accounts, setAccounts] = useState([]);

  const load = async () => {
    const [p, a] = await Promise.all([apiGet('/api/periods'), apiGet('/api/accounts')]);
    setPeriods(p || []);
    setAccounts(a || []);
  };

  useEffect(() => {
    load().catch(console.error);
  }, []);

  const openClosing = async (period) => {
    setClosingPeriod(period);
    setMsg(null);
    const asOf = formatDateInput(period.end);
    const fromD = formatDateInput(period.start);
    try {
      const [tbData, plData] = await Promise.all([
        apiGet(`/api/reports/trial-balance?as_of=${asOf}`),
        apiGet(`/api/reports/income-statement?from=${fromD}&to=${asOf}`),
      ]);
      setTb(tbData || []);
      setPl(plData);
    } catch (e) {
      setMsg({ severity: 'error', text: e.message });
    }
  };

  const tempRows = useMemo(() => {
    if (!tb.length || !accounts.length) return [];
    const idToAcc = Object.fromEntries(accounts.map((a) => [a.id, a]));
    return tb
      .map((row) => ({ ...row, account: idToAcc[row.account_id] }))
      .filter((r) => r.account?.is_temp);
  }, [tb, accounts]);

  const createPeriod = async () => {
    setMsg(null);
    try {
      await apiPost('/api/periods', {
        business_id: BUSINESS_ID,
        label,
        start: new Date(start + 'T00:00:00Z').toISOString(),
        end: new Date(end + 'T23:59:59Z').toISOString(),
      });
      setOpen(false);
      setLabel('');
      await load();
      await refreshPeriods();
    } catch (e) {
      setMsg({ severity: 'error', text: e.message });
    }
  };

  const closePeriod = async (id) => {
    try {
      await apiPost(`/api/periods/${id}/close`, {});
      await load();
      await refreshPeriods();
      setClosingPeriod(null);
    } catch (e) {
      setMsg({ severity: 'error', text: e.message });
    }
  };

  return (
    <Box>
      <ContextBar />
      <Typography variant="h4" gutterBottom>
        Periods & closing
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Define accounting periods so every journal posts into a date range. Closing assistant summarises temporary accounts and
        net income; post the actual closing entry in the workbench with <strong>entry_kind = closing</strong> to Retained
        Earnings (server automation can be added later).
      </Typography>

      {msg && (
        <Alert severity={msg.severity} sx={{ mb: 2 }} onClose={() => setMsg(null)}>
          {msg.text}
        </Alert>
      )}

      <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h6">Periods</Typography>
        <Button variant="contained" onClick={() => setOpen(true)}>
          Open new period
        </Button>
      </Stack>

      <Table size="small" component={Paper}>
        <TableHead>
          <TableRow>
            <TableCell>Label</TableCell>
            <TableCell>Start</TableCell>
            <TableCell>End</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {periods.map((p) => (
            <TableRow key={p.id}>
              <TableCell>{p.label || `Period #${p.id}`}</TableCell>
              <TableCell>{formatDate(p.start)}</TableCell>
              <TableCell>{formatDate(p.end)}</TableCell>
              <TableCell>{p.is_closed ? 'Closed' : 'Open'}</TableCell>
              <TableCell align="right">
                <Button size="small" onClick={() => openClosing(p)}>
                  Closing assistant
                </Button>
                {!p.is_closed && (
                  <Button size="small" color="warning" onClick={() => closePeriod(p.id)}>
                    Close period
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
          {periods.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} align="center">
                No periods. Create one before posting journals.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Open period</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Label" value={label} onChange={(e) => setLabel(e.target.value)} fullWidth placeholder="FY 2026" />
            <TextField
              type="date"
              label="Start"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              type="date"
              label="End"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={createPeriod}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!closingPeriod} onClose={() => setClosingPeriod(null)} maxWidth="md" fullWidth>
        <DialogTitle>Closing assistant — {closingPeriod?.label || `Period #${closingPeriod?.id}`}</DialogTitle>
        <DialogContent dividers>
          {pl && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Net income (period)
              </Typography>
              <Typography>
                Revenue {formatMoney(pl.total_revenue, currency)} · Expenses {formatMoney(pl.total_expenses, currency)} · Net{' '}
                {formatMoney(pl.net_income, currency)}
              </Typography>
            </Box>
          )}
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" gutterBottom>
            Temporary accounts (trial balance at period end)
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Code</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell align="right">Debit</TableCell>
                <TableCell align="right">Credit</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tempRows.map((r) => (
                <TableRow key={r.account_id}>
                  <TableCell>{r.code}</TableCell>
                  <TableCell>{r.name}</TableCell>
                  <TableCell>{r.type}</TableCell>
                  <TableCell align="right">{formatMoney(r.debit, currency)}</TableCell>
                  <TableCell align="right">{formatMoney(r.credit, currency)}</TableCell>
                </TableRow>
              ))}
              {tempRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No temporary balances or no data.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <Alert severity="info" sx={{ mt: 2 }}>
            Post a balanced <strong>closing</strong> journal in the workbench that clears these accounts into Retained Earnings
            (3999), then use &quot;Close period&quot; when finished.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClosingPeriod(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function formatDateInput(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return todayISODate();
  return d.toISOString().slice(0, 10);
}
