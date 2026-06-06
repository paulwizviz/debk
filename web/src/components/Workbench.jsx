import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Alert } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useSearchParams, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { apiGet } from '../api/client';
import QuickTransactionDialog from './QuickTransactionDialog';

/**
 * Journal entry launcher (§4.3): records each transaction as a single entry via
 * the Quick Transaction dialog (one Category debit + one Paid from credit).
 */
export default function Workbench() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const { refreshAll } = useApp();
  const [accounts, setAccounts] = useState([]);
  const [open, setOpen] = useState(false);
  const [initial, setInitial] = useState(null);
  const [message, setMessage] = useState(null);

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

  const handlePosted = async (description) => {
    setMessage({ severity: 'success', text: `Posted “${description}”.` });
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
