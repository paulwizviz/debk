import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
  Stack,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import ContextBar from './ContextBar';
import { apiGet } from '../api/client';
import { formatMoney, formatDate } from '../utils/money';
import { useApp } from '../context/AppContext';

/**
 * Full journal / audit trail (§4.4) with filters.
 */
export default function JournalAudit() {
  const { currency } = useApp();
  const [entries, setEntries] = useState([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [kind, setKind] = useState('');
  const [q, setQ] = useState('');
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    apiGet('/api/journal-entries')
      .then(setEntries)
      .catch(console.error);
  }, []);

  const filtered = useMemo(() => {
    return (entries || []).filter((e) => {
      if (kind && (e.entry_kind || 'normal') !== kind) return false;
      if (q && !(e.description || '').toLowerCase().includes(q.toLowerCase())) return false;
      const d = new Date(e.entry_date);
      if (from) {
        const f = new Date(from + 'T00:00:00');
        if (d < f) return false;
      }
      if (to) {
        const t = new Date(to + 'T23:59:59');
        if (d > t) return false;
      }
      return true;
    });
  }, [entries, from, to, kind, q]);

  return (
    <Box>
      <ContextBar />
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h4">Journal (audit trail)</Typography>
        <Button variant="contained" component={RouterLink} to="/books/workbench">
          New entry
        </Button>
      </Stack>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField
            size="small"
            label="From"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            size="small"
            label="To"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            size="small"
            select
            label="Entry kind"
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            sx={{ minWidth: 160 }}
            SelectProps={{ displayEmpty: true }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="normal">normal</MenuItem>
            <MenuItem value="adjusting">adjusting</MenuItem>
            <MenuItem value="closing">closing</MenuItem>
          </TextField>
          <TextField
            size="small"
            label="Search description"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            fullWidth
          />
        </Stack>
      </Paper>
      <Table size="small" component={Paper}>
        <TableHead>
          <TableRow>
            <TableCell>Seq</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Description</TableCell>
            <TableCell>Kind</TableCell>
            <TableCell align="right">Lines</TableCell>
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {filtered.map((e) => (
            <TableRow key={e.id} hover>
              <TableCell>{e.journal_seq}</TableCell>
              <TableCell>{formatDate(e.entry_date)}</TableCell>
              <TableCell>{e.description}</TableCell>
              <TableCell>
                <Chip size="small" label={e.entry_kind || 'normal'} variant="outlined" />
              </TableCell>
              <TableCell align="right">{(e.lines || []).length}</TableCell>
              <TableCell align="right">
                <Button size="small" onClick={() => setDetail(e)}>
                  View
                </Button>
                <Button size="small" component={RouterLink} to={`/books/workbench?reverse=${e.id}`} state={{ reverseEntry: e }}>
                  Reverse
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} align="center">
                No entries match filters.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={!!detail} onClose={() => setDetail(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Entry #{detail?.journal_seq}</DialogTitle>
        <DialogContent dividers>
          {detail && (
            <Stack spacing={1}>
              <Typography variant="body2">{formatDate(detail.entry_date)} · {detail.description}</Typography>
              <Typography variant="caption" color="text.secondary">
                Ref: {detail.reference || '—'} · Kind: {detail.entry_kind}
              </Typography>
              <Table size="small">
                <TableBody>
                  {(detail.lines || []).map((l) => (
                    <TableRow key={l.id}>
                      <TableCell>{l.account_id}</TableCell>
                      <TableCell>{l.side}</TableCell>
                      <TableCell align="right">{formatMoney(l.amount, currency)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetail(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
