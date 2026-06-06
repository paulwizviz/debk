import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Link,
  Breadcrumbs,
} from '@mui/material';
import ContextBar from './ContextBar';
import { apiGet } from '../api/client';
import { formatMoney, formatDate } from '../utils/money';
import { useApp } from '../context/AppContext';

/**
 * Account ledger (genledger) — running balance for one account (§4.4).
 */
export default function AccountLedger() {
  const { id } = useParams();
  const accountId = parseInt(id, 10);
  const { currency } = useApp();
  const [account, setAccount] = useState(null);
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [acc, ent] = await Promise.all([
          apiGet(`/api/accounts/${accountId}`),
          apiGet('/api/journal-entries'),
        ]);
        if (!cancelled) {
          setAccount(acc);
          setEntries(ent || []);
        }
      } catch (e) {
        console.error(e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accountId]);

  const rows = useMemo(() => {
    const out = [];
    const sorted = [...entries].sort((a, b) => {
      const ta = new Date(a.entry_date).getTime();
      const tb = new Date(b.entry_date).getTime();
      if (ta !== tb) return ta - tb;
      return (a.journal_seq || 0) - (b.journal_seq || 0);
    });
    let running = 0;
    sorted.forEach((e) => {
      (e.lines || [])
        .filter((l) => l.account_id === accountId)
        .forEach((l) => {
          const delta = l.side === 'Debit' ? l.amount : -l.amount;
          running += delta;
          out.push({
            id: `${e.id}-${l.id}`,
            date: e.entry_date,
            seq: e.journal_seq,
            desc: e.description,
            kind: e.entry_kind,
            side: l.side,
            amount: l.amount,
            running,
          });
        });
    });
    return out;
  }, [entries, accountId]);

  return (
    <Box>
      <ContextBar />
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component={RouterLink} to="/books/accounts" underline="hover">
          Chart of accounts
        </Link>
        <Typography color="text.primary">Ledger</Typography>
      </Breadcrumbs>
      <Typography variant="h4" gutterBottom>
        {account ? `${account.code} — ${account.name}` : 'Account ledger'}
      </Typography>
      {account && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Type {account.type}
          {account.is_contra ? ' · Contra-asset' : ''} · Running total = debits minus credits on this account (raw ledger).
        </Typography>
      )}
      <Table size="small" component={Paper}>
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Seq</TableCell>
            <TableCell>Description</TableCell>
            <TableCell>Kind</TableCell>
            <TableCell>Side</TableCell>
            <TableCell align="right">Amount</TableCell>
            <TableCell align="right">Running</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell>{formatDate(r.date)}</TableCell>
              <TableCell>{r.seq}</TableCell>
              <TableCell>{r.desc}</TableCell>
              <TableCell>{r.kind}</TableCell>
              <TableCell>{r.side}</TableCell>
              <TableCell align="right">{formatMoney(r.amount, currency)}</TableCell>
              <TableCell align="right">{formatMoney(r.running, currency)}</TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} align="center">
                No lines for this account yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Box>
  );
}
