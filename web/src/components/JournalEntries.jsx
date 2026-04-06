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
  IconButton,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';

const JournalEntries = () => {
  const [entries, setEntries] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [open, setOpen] = useState(false);
  const [newEntry, setNewEntry] = useState({
    EntryDate: new Date().toISOString().split('T')[0],
    Description: '',
    Reference: '',
    IsClosing: false,
    Lines: [
      { AccountID: '', Amount: 0, Side: 'Debit' },
      { AccountID: '', Amount: 0, Side: 'Credit' },
    ],
  });

  const fetchEntries = async () => {
    try {
      const response = await fetch('/api/journal-entries');
      const data = await response.json();
      setEntries(data || []);
    } catch (error) {
      console.error('Error fetching entries:', error);
    }
  };

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
    fetchEntries();
    fetchAccounts();
  }, []);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleEntryChange = (e) => {
    const { name, value } = e.target;
    setNewEntry((prev) => ({ ...prev, [name]: value }));
  };

  const handleLineChange = (index, field, value) => {
    const updatedLines = [...newEntry.Lines];
    updatedLines[index][field] = field === 'Amount' ? parseFloat(value) || 0 : value;
    setNewEntry((prev) => ({ ...prev, Lines: updatedLines }));
  };

  const addLine = () => {
    setNewEntry((prev) => ({
      ...prev,
      Lines: [...prev.Lines, { AccountID: '', Amount: 0, Side: 'Debit' }],
    }));
  };

  const removeLine = (index) => {
    const updatedLines = newEntry.Lines.filter((_, i) => i !== index);
    setNewEntry((prev) => ({ ...prev, Lines: updatedLines }));
  };

  const calculateBalance = () => {
    let balance = 0;
    newEntry.Lines.forEach((line) => {
      if (line.Side === 'Debit') balance += line.Amount;
      else balance -= line.Amount;
    });
    return balance;
  };

  const handleSubmit = async () => {
    const balance = calculateBalance();
    if (Math.abs(balance) > 0.000001) {
      alert(`Entry is not balanced. Difference: ${balance.toFixed(2)}`);
      return;
    }

    try {
      const entryToPost = {
        ...newEntry,
        EntryDate: new Date(newEntry.EntryDate).toISOString(),
      };
      const response = await fetch('/api/journal-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entryToPost),
      });
      if (response.ok) {
        handleClose();
        fetchEntries();
        setNewEntry({
          EntryDate: new Date().toISOString().split('T')[0],
          Description: '',
          Reference: '',
          IsClosing: false,
          Lines: [
            { AccountID: '', Amount: 0, Side: 'Debit' },
            { AccountID: '', Amount: 0, Side: 'Credit' },
          ],
        });
      } else {
        const err = await response.text();
        alert(err);
      }
    } catch (error) {
      console.error('Error posting entry:', error);
    }
  };

  const balance = calculateBalance();

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4">General Ledger</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpen}>
          Post Transaction
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Reference</TableCell>
              <TableCell align="right">Amount</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {entries.map((entry) => {
              // Calculate total debits for display
              const totalAmount = entry.Lines.filter(l => l.Side === 'Debit').reduce((sum, l) => sum + l.Amount, 0);
              return (
                <TableRow key={entry.ID}>
                  <TableCell>{new Date(entry.EntryDate).toLocaleDateString('en-GB')}</TableCell>
                  <TableCell>{entry.Description}</TableCell>
                  <TableCell>{entry.Reference}</TableCell>
                  <TableCell align="right">£{totalAmount.toFixed(2)}</TableCell>
                </TableRow>
              );
            })}
            {entries.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No transactions recorded yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>Journal Entry Workbench</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <TextField
              type="date"
              label="Date"
              name="EntryDate"
              value={newEntry.EntryDate}
              onChange={handleEntryChange}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="Description"
              name="Description"
              value={newEntry.Description}
              onChange={handleEntryChange}
              fullWidth
            />
            <TextField
              label="Reference"
              name="Reference"
              value={newEntry.Reference}
              onChange={handleEntryChange}
              fullWidth
            />
          </Box>

          <Typography variant="h6" gutterBottom>
            Journal Lines
          </Typography>
          {newEntry.Lines.map((line, index) => (
            <Box key={index} sx={{ display: 'flex', gap: 2, mb: 1, alignItems: 'center' }}>
              <TextField
                select
                label="Account"
                value={line.AccountID}
                onChange={(e) => handleLineChange(index, 'AccountID', parseInt(e.target.value))}
                sx={{ flex: 2 }}
              >
                {accounts.map((acc) => (
                  <MenuItem key={acc.ID} value={acc.ID}>
                    {acc.Code} - {acc.Name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Side"
                value={line.Side}
                onChange={(e) => handleLineChange(index, 'Side', e.target.value)}
                sx={{ flex: 1 }}
              >
                <MenuItem value="Debit">Debit</MenuItem>
                <MenuItem value="Credit">Credit</MenuItem>
              </TextField>
              <TextField
                type="number"
                label="Amount"
                value={line.Amount}
                onChange={(e) => handleLineChange(index, 'Amount', e.target.value)}
                sx={{ flex: 1 }}
              />
              <IconButton onClick={() => removeLine(index)} disabled={newEntry.Lines.length <= 2}>
                <DeleteIcon />
              </IconButton>
            </Box>
          ))}
          <Button startIcon={<AddIcon />} onClick={addLine} sx={{ mt: 1 }}>
            Add Line
          </Button>

          <Box sx={{ mt: 3, p: 2, bgcolor: Math.abs(balance) > 0.000001 ? 'error.light' : 'success.light', borderRadius: 1 }}>
            <Typography variant="subtitle1">
              Difference: £{balance.toFixed(2)}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={Math.abs(balance) > 0.000001}
          >
            Post
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default JournalEntries;
