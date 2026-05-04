import React, { useEffect, useState } from 'react';
import {
  Alert,
  Grid,
  Paper,
  Typography,
  Box,
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
  Chip,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import ContextBar from './ContextBar';
import { useApp } from '../context/AppContext';
import { useUserSession } from '../context/UserSessionContext';
import { apiGet } from '../api/client';
import { formatMoney, formatDate, todayISODate } from '../utils/money';

/**
 * Financial Pulse dashboard (§4.2): A/L/E from balance sheet API, P&L range, recent activity (view-only, reverse hint).
 */
export default function Dashboard() {
  const { currency, activePeriod } = useApp();
  const { portalIdentity } = useUserSession();
  const [bs, setBs] = useState(null);
  const [pl, setPl] = useState(null);
  const [entries, setEntries] = useState([]);
  const [viewEntry, setViewEntry] = useState(null);
  const [rangeFrom, setRangeFrom] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [rangeTo, setRangeTo] = useState(todayISODate);

  const asOf = todayISODate();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [bsData, ent] = await Promise.all([
          apiGet(`/api/reports/balance-sheet?as_of=${asOf}`),
          apiGet('/api/journal-entries'),
        ]);
        if (!cancelled) {
          setBs(bsData);
          setEntries(ent || []);
        }
      } catch (e) {
        console.error(e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [asOf]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const plData = await apiGet(
          `/api/reports/income-statement?from=${rangeFrom}&to=${rangeTo}`,
        );
        if (!cancelled) setPl(plData);
      } catch (e) {
        console.error(e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [rangeFrom, rangeTo]);

  const recent = [...entries]
    .sort((a, b) => {
      const ta = new Date(a.entry_date || 0).getTime();
      const tb = new Date(b.entry_date || 0).getTime();
      return tb - ta;
    })
    .slice(0, 8);

  const totalDebits = (e) =>
    (e.lines || []).filter((l) => l.side === 'Debit').reduce((s, l) => s + l.amount, 0);

  return (
    <Box>
      <ContextBar />
      {portalIdentity && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Allocate other users from the home screen under{' '}
          <Button component={RouterLink} to="/identity" size="small" sx={{ verticalAlign: 'baseline' }}>
            Identity & access
          </Button>
          .
        </Alert>
      )}
      <Typography variant="h4" gutterBottom>
        Financial Pulse
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Balances use the balance sheet report as of today. Posted journals are immutable—correct mistakes with a reversing
        entry in the{' '}
        <Button component={RouterLink} to="/books/workbench" size="small">
          Journal workbench
        </Button>
        .
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" color="primary" gutterBottom>
              Total assets
            </Typography>
            <Typography variant="h4">
              {bs ? formatMoney(bs.total_assets, currency) : '—'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              As of {formatDate(asOf)}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" color="primary" gutterBottom>
              Total liabilities
            </Typography>
            <Typography variant="h4">
              {bs ? formatMoney(bs.total_liabilities, currency) : '—'}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" color="primary" gutterBottom>
              Total equity (book)
            </Typography>
            <Typography variant="h4">
              {bs ? formatMoney(bs.total_equity, currency) : '—'}
            </Typography>
            {bs && Math.abs(bs.unclosed_pl) > 0.0001 && (
              <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                Unclosed revenue/expense (net): {formatMoney(bs.unclosed_pl, currency)} · Equation check Δ{' '}
                {formatMoney(bs.equation_delta, currency)}
              </Typography>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" color="primary" gutterBottom>
              Revenue vs expense (selected range)
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
              <TextField
                type="date"
                label="From"
                size="small"
                value={rangeFrom}
                onChange={(e) => setRangeFrom(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                type="date"
                label="To"
                size="small"
                value={rangeTo}
                onChange={(e) => setRangeTo(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Stack>
            {pl && (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">
                    Total revenue
                  </Typography>
                  <Typography variant="h6">{formatMoney(pl.total_revenue, currency)}</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">
                    Total expenses
                  </Typography>
                  <Typography variant="h6">{formatMoney(pl.total_expenses, currency)}</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">
                    Net income
                  </Typography>
                  <Typography variant="h6" color={pl.net_income >= 0 ? 'success.main' : 'error.main'}>
                    {formatMoney(pl.net_income, currency)}
                  </Typography>
                </Grid>
              </Grid>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="h6" color="primary">
                Recent activity
              </Typography>
              <Button component={RouterLink} to="/books/journal" size="small">
                Full journal
              </Button>
            </Stack>
            {activePeriod && (
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                Active period in the bar: {activePeriod.label || `#${activePeriod.id}`} — new posts must fall in this range.
              </Typography>
            )}
            {recent.length > 0 ? (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Seq</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Kind</TableCell>
                    <TableCell align="right">Debits</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recent.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{entry.journal_seq}</TableCell>
                      <TableCell>{formatDate(entry.entry_date)}</TableCell>
                      <TableCell>{entry.description}</TableCell>
                      <TableCell>
                        <Chip size="small" label={entry.entry_kind || 'normal'} variant="outlined" />
                      </TableCell>
                      <TableCell align="right">{formatMoney(totalDebits(entry), currency)}</TableCell>
                      <TableCell align="right">
                        <Button size="small" onClick={() => setViewEntry(entry)}>
                          View
                        </Button>
                        <Button
                          size="small"
                          component={RouterLink}
                          to={`/books/workbench?reverse=${entry.id}`}
                          state={{ reverseEntry: entry }}
                        >
                          Reverse in workbench
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Typography color="text.secondary">No transactions yet. Use the workbench to post.</Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={!!viewEntry} onClose={() => setViewEntry(null)} maxWidth="md" fullWidth>
        <DialogTitle>Journal entry #{viewEntry?.journal_seq}</DialogTitle>
        <DialogContent dividers>
          {viewEntry && (
            <Stack spacing={1}>
              <Typography variant="body2">
                <strong>Date:</strong> {formatDate(viewEntry.entry_date)}
              </Typography>
              <Typography variant="body2">
                <strong>Description:</strong> {viewEntry.description}
              </Typography>
              <Typography variant="body2">
                <strong>Reference:</strong> {viewEntry.reference || '—'}
              </Typography>
              <Typography variant="body2">
                <strong>Kind:</strong> {viewEntry.entry_kind} · <strong>Closing:</strong>{' '}
                {viewEntry.is_closing ? 'Yes' : 'No'}
              </Typography>
              <Table size="small" sx={{ mt: 1 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Account ID</TableCell>
                    <TableCell>Side</TableCell>
                    <TableCell align="right">Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(viewEntry.lines || []).map((line) => (
                    <TableRow key={line.id}>
                      <TableCell>{line.account_id}</TableCell>
                      <TableCell>{line.side}</TableCell>
                      <TableCell align="right">{formatMoney(line.amount, currency)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Typography variant="caption" color="text.secondary">
                Posted entries cannot be edited. Use Reverse to open the workbench with opposite lines.
              </Typography>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewEntry(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
