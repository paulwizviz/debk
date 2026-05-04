import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Chip,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { apiGet, apiPost, BUSINESS_ID } from '../api/client';

const accountTypes = ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'];

/**
 * Chart of accounts manager (UC1). When embedded inside Setup, omits duplicate page title.
 */
export default function Accounts({ embedded }) {
  const [accounts, setAccounts] = useState([]);
  const [open, setOpen] = useState(false);
  const [newAccount, setNewAccount] = useState({
    code: '',
    name: '',
    type: 'Asset',
    is_temp: false,
    is_contra: false,
  });

  const fetchAccounts = async () => {
    const data = await apiGet('/api/accounts');
    setAccounts(data || []);
  };

  useEffect(() => {
    fetchAccounts().catch(console.error);
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const v = type === 'checkbox' ? checked : value;
    setNewAccount((prev) => {
      const next = { ...prev, [name]: v };
      if (name === 'type') {
        next.is_temp = value === 'Revenue' || value === 'Expense';
        if (value !== 'Asset') next.is_contra = false;
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    const body = {
      business_id: BUSINESS_ID,
      code: newAccount.code,
      name: newAccount.name,
      type: newAccount.type,
      is_temp: newAccount.is_temp,
      is_contra: newAccount.is_contra,
    };
    await apiPost('/api/accounts', body);
    setOpen(false);
    await fetchAccounts();
    setNewAccount({ code: '', name: '', type: 'Asset', is_temp: false, is_contra: false });
  };

  return (
    <Box>
      {!embedded && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h4">Chart of accounts</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
            Add account
          </Button>
        </Box>
      )}
      {embedded && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
            Add account
          </Button>
        </Box>
      )}

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Temporary</TableCell>
              <TableCell>Contra</TableCell>
              <TableCell>Ledger</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {accounts.map((account) => (
              <TableRow key={account.id}>
                <TableCell>
                  {account.code}
                  {account.code === '3999' && (
                    <Chip size="small" label="RE" sx={{ ml: 1 }} variant="outlined" />
                  )}
                </TableCell>
                <TableCell>{account.name}</TableCell>
                <TableCell>{account.type}</TableCell>
                <TableCell>{account.is_temp ? 'Yes' : 'No'}</TableCell>
                <TableCell>{account.is_contra ? 'Yes' : 'No'}</TableCell>
                <TableCell>
                  <Button size="small" component={RouterLink} to={`/books/ledger/account/${account.id}`}>
                    View ledger
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {accounts.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No accounts yet. Add cash, equity, and revenue accounts to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add account</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField label="Code" name="code" value={newAccount.code} onChange={handleChange} required fullWidth />
          <TextField label="Name" name="name" value={newAccount.name} onChange={handleChange} required fullWidth />
          <TextField select label="Type" name="type" value={newAccount.type} onChange={handleChange} fullWidth>
            {accountTypes.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
          <FormControlLabel
            control={
              <Checkbox
                name="is_temp"
                checked={newAccount.is_temp}
                onChange={handleChange}
              />
            }
            label="Temporary (nominal) — Revenue, Expense, or Dividends/Drawings"
          />
          <Typography variant="caption" color="text.secondary">
            Dividends/Drawings are temporary: pick Expense (or Equity per your policy) and tick Temporary.
          </Typography>
          <FormControlLabel
            control={
              <Checkbox
                name="is_contra"
                checked={newAccount.is_contra}
                onChange={handleChange}
                disabled={newAccount.type !== 'Asset'}
              />
            }
            label="Contra-asset (e.g. accumulated depreciation)"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={!newAccount.code || !newAccount.name}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
