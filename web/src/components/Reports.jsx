import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Stack,
  Alert,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import ContextBar from './ContextBar';
import { useApp } from '../context/AppContext';
import { apiGet } from '../api/client';
import { formatMoney, formatDate, todayISODate } from '../utils/money';

/**
 * Financial statements & trial balance — Alice view (§4.6).
 */
export default function Reports() {
  const { currency } = useApp();
  const [tab, setTab] = useState(0);
  const [asOf, setAsOf] = useState(todayISODate());
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(todayISODate());
  const [tb, setTb] = useState([]);
  const [pl, setPl] = useState(null);
  const [bs, setBs] = useState(null);
  const [err, setErr] = useState(null);

  const loadTB = async () => {
    setErr(null);
    try {
      const data = await apiGet(`/api/reports/trial-balance?as_of=${asOf}`);
      setTb(data || []);
    } catch (e) {
      setErr(e.message);
    }
  };

  const loadPL = async () => {
    setErr(null);
    try {
      const data = await apiGet(`/api/reports/income-statement?from=${from}&to=${to}`);
      setPl(data);
    } catch (e) {
      setErr(e.message);
    }
  };

  const loadBS = async () => {
    setErr(null);
    try {
      const data = await apiGet(`/api/reports/balance-sheet?as_of=${asOf}`);
      setBs(data);
    } catch (e) {
      setErr(e.message);
    }
  };

  useEffect(() => {
    if (tab === 0) loadTB();
    if (tab === 1) loadPL();
    if (tab === 2) loadBS();
  }, [tab]);

  const tbTotals = tb.reduce(
    (a, r) => ({ dr: a.dr + r.debit, cr: a.cr + r.credit }),
    { dr: 0, cr: 0 },
  );

  return (
    <Box>
      <ContextBar />
      <Typography variant="h4" gutterBottom>
        Reports
      </Typography>
      {err && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErr(null)}>
          {err}
        </Alert>
      )}

      <Paper sx={{ mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Trial balance" />
          <Tab label="Profit & loss" />
          <Tab label="Balance sheet" />
        </Tabs>
      </Paper>

      {tab === 0 && (
        <Paper sx={{ p: 2 }}>
          <Stack direction="row" spacing={2} sx={{ mb: 2 }} alignItems="center">
            <TextField
              type="date"
              label="As of"
              value={asOf}
              onChange={(e) => setAsOf(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <Button variant="contained" onClick={loadTB}>
              Run
            </Button>
          </Stack>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Code</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell align="right">Debit</TableCell>
                <TableCell align="right">Credit</TableCell>
                <TableCell>Drill-down</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tb.map((r) => (
                <TableRow key={r.account_id}>
                  <TableCell>{r.code}</TableCell>
                  <TableCell>
                    {r.name}
                    {r.is_contra && (
                      <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                        (contra)
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{r.type}</TableCell>
                  <TableCell align="right">{formatMoney(r.debit, currency)}</TableCell>
                  <TableCell align="right">{formatMoney(r.credit, currency)}</TableCell>
                  <TableCell>
                    <Button size="small" component={RouterLink} to={`/books/ledger/account/${r.account_id}`}>
                      Ledger
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={3}>
                  <strong>Totals</strong>
                </TableCell>
                <TableCell align="right">
                  <strong>{formatMoney(tbTotals.dr, currency)}</strong>
                </TableCell>
                <TableCell align="right">
                  <strong>{formatMoney(tbTotals.cr, currency)}</strong>
                </TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </Paper>
      )}

      {tab === 1 && (
        <Paper sx={{ p: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
            <TextField type="date" label="From" value={from} onChange={(e) => setFrom(e.target.value)} InputLabelProps={{ shrink: true }} />
            <TextField type="date" label="To" value={to} onChange={(e) => setTo(e.target.value)} InputLabelProps={{ shrink: true }} />
            <Button variant="contained" onClick={loadPL}>
              Run
            </Button>
          </Stack>
          {pl && (
            <>
              <Typography variant="subtitle2" gutterBottom>
                Revenue
              </Typography>
              <Table size="small" sx={{ mb: 2 }}>
                <TableBody>
                  {(pl.revenue_lines || []).map((r) => (
                    <TableRow key={r.account_id}>
                      <TableCell>
                        {r.code} — {r.name}
                      </TableCell>
                      <TableCell align="right">{formatMoney(r.amount, currency)}</TableCell>
                      <TableCell>
                        <Button size="small" component={RouterLink} to={`/books/ledger/account/${r.account_id}`}>
                          Ledger
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Typography variant="subtitle2" gutterBottom>
                Expenses (incl. dividends/drawings recorded as expense/temp)
              </Typography>
              <Table size="small" sx={{ mb: 2 }}>
                <TableBody>
                  {(pl.expense_lines || []).map((r) => (
                    <TableRow key={r.account_id}>
                      <TableCell>
                        {r.code} — {r.name}
                      </TableCell>
                      <TableCell align="right">{formatMoney(r.amount, currency)}</TableCell>
                      <TableCell>
                        <Button size="small" component={RouterLink} to={`/books/ledger/account/${r.account_id}`}>
                          Ledger
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Typography variant="h6">
                Net income: {formatMoney(pl.net_income, currency)}
              </Typography>
            </>
          )}
        </Paper>
      )}

      {tab === 2 && (
        <Paper sx={{ p: 2 }}>
          <Stack direction="row" spacing={2} sx={{ mb: 2 }} alignItems="center">
            <TextField type="date" label="As of" value={asOf} onChange={(e) => setAsOf(e.target.value)} InputLabelProps={{ shrink: true }} />
            <Button variant="contained" onClick={loadBS}>
              Run
            </Button>
          </Stack>
          {bs && (
            <>
              <Typography variant="subtitle2">As of {formatDate(bs.as_of)}</Typography>
              <Typography variant="h6" sx={{ mt: 2 }}>
                Assets
              </Typography>
              <Table size="small">
                <TableBody>
                  {(bs.assets || []).map((r) => (
                    <TableRow key={r.account_id}>
                      <TableCell>
                        {r.code} — {r.name}
                      </TableCell>
                      <TableCell align="right">{formatMoney(r.amount, currency)}</TableCell>
                      <TableCell>
                        <Button size="small" component={RouterLink} to={`/books/ledger/account/${r.account_id}`}>
                          Ledger
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Typography align="right" sx={{ mb: 2 }}>
                <strong>Total assets {formatMoney(bs.total_assets, currency)}</strong>
              </Typography>

              <Typography variant="h6">Liabilities</Typography>
              <Table size="small">
                <TableBody>
                  {(bs.liabilities || []).map((r) => (
                    <TableRow key={r.account_id}>
                      <TableCell>
                        {r.code} — {r.name}
                      </TableCell>
                      <TableCell align="right">{formatMoney(r.amount, currency)}</TableCell>
                      <TableCell>
                        <Button size="small" component={RouterLink} to={`/books/ledger/account/${r.account_id}`}>
                          Ledger
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Typography align="right" sx={{ mb: 2 }}>
                <strong>Total liabilities {formatMoney(bs.total_liabilities, currency)}</strong>
              </Typography>

              <Typography variant="h6">Equity</Typography>
              <Table size="small">
                <TableBody>
                  {(bs.equity || []).map((r) => (
                    <TableRow key={r.account_id}>
                      <TableCell>
                        {r.code} — {r.name}
                      </TableCell>
                      <TableCell align="right">{formatMoney(r.amount, currency)}</TableCell>
                      <TableCell>
                        <Button size="small" component={RouterLink} to={`/books/ledger/account/${r.account_id}`}>
                          Ledger
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Typography align="right">
                <strong>Total equity {formatMoney(bs.total_equity, currency)}</strong>
              </Typography>
              <Alert severity="info" sx={{ mt: 2 }}>
                Unclosed P&amp;L effect: {formatMoney(bs.unclosed_pl, currency)} · Equation Δ {formatMoney(bs.equation_delta, currency)}{' '}
                (should be ~0 when books tie)
              </Alert>
            </>
          )}
        </Paper>
      )}
    </Box>
  );
}
