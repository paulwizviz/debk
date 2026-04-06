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
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

const accountTypes = ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'];

const Accounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [open, setOpen] = useState(false);
  const [newAccount, setNewAccount] = useState({
    Code: '',
    Name: '',
    Type: 'Asset',
    IsTemp: false,
    IsContra: false,
  });

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/accounts');
      const data = await response.json();
      setAccounts(data || []);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewAccount((prev) => ({
      ...prev,
      [name]: value,
      // Logic for IsTemp based on type
      IsTemp: value === 'Revenue' || value === 'Expense',
    }));
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAccount),
      });
      if (response.ok) {
        handleClose();
        fetchAccounts();
        setNewAccount({ Code: '', Name: '', Type: 'Asset', IsTemp: false, IsContra: false });
      } else {
        const err = await response.text();
        alert(err);
      }
    } catch (error) {
      console.error('Error creating account:', error);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4">Chart of Accounts</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpen}>
          Add Account
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Is Temporary</TableCell>
              <TableCell>Is Contra</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {accounts.map((account) => (
              <TableRow key={account.ID}>
                <TableCell>{account.Code}</TableCell>
                <TableCell>{account.Name}</TableCell>
                <TableCell>{account.Type}</TableCell>
                <TableCell>{account.IsTemp ? 'Yes' : 'No'}</TableCell>
                <TableCell>{account.IsContra ? 'Yes' : 'No'}</TableCell>
              </TableRow>
            ))}
            {accounts.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No accounts found. Create your first account!
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Add New Account</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Account Code"
            name="Code"
            value={newAccount.Code}
            onChange={handleChange}
            fullWidth
            required
          />
          <TextField
            label="Account Name"
            name="Name"
            value={newAccount.Name}
            onChange={handleChange}
            fullWidth
            required
          />
          <TextField
            select
            label="Account Type"
            name="Type"
            value={newAccount.Type}
            onChange={handleChange}
            fullWidth
            required
          >
            {accountTypes.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
          {/* Simple toggle for Contra-Asset/Liability could be added here if needed */}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Accounts;
