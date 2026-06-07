import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Alert, Paper, Stack, Chip } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useSearchParams, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { apiGet } from '../api/client';
import { formatMoney } from '../utils/money';
import QuickTransactionDialog from './QuickTransactionDialog';

/**
 * Journal entry launcher (§4.3): records each transaction as a single entry via
 * the Quick Transaction dialog (one Category debit + one Paid from credit).
 */
export default function Workbench() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const { refreshAll, currency } = useApp();
  const [accounts, setAccounts] = useState([]);
  const [open, setOpen] = useState(false);
  const [initial, setInitial] = useState(null);
  const [message, setMessage] = useState(null);
  const [posted, setPosted] = useState(null);

  useEffect(() => {
    apiGet('/api/accounts')
      .then((d) => setAccounts(d || []))
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
      const lines = src.lines || [];
      const debit = lines.find((l) => l.side === 'Debit');
      const credit = lines.find((l) => l.side === 'Credit');
      const baseDescription = `Reversal of #${src.journal_seq}: ${src.description}`;
      if (lines.length === 2 && debit && credit) {
        // A reversal swaps the debit and credit sides.
        setInitial({
          description: baseDescription,
          amount: String(debit.amount),
          debit_account_id: String(credit.account_id),
          credit_account_id: String(debit.account_id),
        });
        setMessage(null);
      } else {
        setInitial({ description: baseDescription });
        setMessage({
          severity: 'warning',
          text: 'This entry has multiple lines and cannot be reversed as a single quick transaction. Enter the reversal manually.',
        });
      }
      setOpen(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [reverseId, reverseEntryState]);

  const clearReverseParam = () => {
    if (!reverseId) return;
    const next = new URLSearchParams(searchParams);
    next.delete('reverse');
    setSearchParams(next, { replace: true });
  };

  const handleClose = () => {
    setOpen(false);
    setInitial(null);
    clearReverseParam();
  };

  const handlePosted = async (entry) => {
    setPosted(entry);
    setMessage({ severity: 'success', text: `Posted “${entry.description}”.` });
    try {
      await refreshAll?.();
    } catch {
      /* ignore refresh errors */
    }
  };

  const handleNew = () => {
    setInitial(null);
    setOpen(true);
  };

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Record a transaction as a single entry: pick what it was for (<strong>Category</strong>) and where the money came
        from (<strong>Paid from</strong>). DEBK posts the balanced double entry for you.
      </Typography>

      {message && (
        <Alert severity={message.severity} sx={{ mb: 2 }} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      <Button variant="contained" size="large" startIcon={<AddIcon />} onClick={handleNew}>
        New transaction
      </Button>

      {posted && <PostedEntry entry={posted} currency={currency} />}

      <QuickTransactionDialog
        open={open}
        onClose={handleClose}
        accounts={accounts}
        initial={initial}
        onPosted={handlePosted}
      />
    </Box>
  );
}

const acctLabel = (a) => (a ? `${a.code} — ${a.name}` : '—');

/** Shows the balanced double entry DEBK posted for the last quick transaction. */
function PostedEntry({ entry, currency }) {
  const amount = formatMoney(entry.amount, currency);
  return (
    <Paper variant="outlined" sx={{ mt: 3, p: 2, maxWidth: 560 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 1 }}>
        <Typography variant="overline" color="text.secondary">
          Posted entry{entry.journal_seq ? ` · #${entry.journal_seq}` : ''}
        </Typography>
        {entry.entry_date && (
          <Typography variant="caption" color="text.secondary">
            {entry.entry_date}
          </Typography>
        )}
      </Stack>
      <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
        {entry.description}
      </Typography>
      <Stack spacing={1}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
            <Chip size="small" color="success" label="DEBIT" />
            <Typography variant="body2" noWrap>
              {acctLabel(entry.debit)}
            </Typography>
          </Stack>
          <Typography variant="body2">{amount}</Typography>
        </Stack>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
            <Chip size="small" color="warning" label="CREDIT" />
            <Typography variant="body2" noWrap>
              {acctLabel(entry.credit)}
            </Typography>
          </Stack>
          <Typography variant="body2">{amount}</Typography>
        </Stack>
      </Stack>
    </Paper>
  );
}
