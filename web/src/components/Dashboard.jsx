import React, { useState, useEffect } from 'react';
import { Grid, Paper, Typography, Box, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';

/**
 * Dashboard view providing the "Financial Pulse".
 * UI labels use British English.
 */
const Dashboard = () => {
  const [summary, setSummary] = useState({ assets: 0, liabilities: 0, equity: 0 });
  const [recentEntries, setRecentEntries] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [accRes, entryRes] = await Promise.all([
          fetch('/api/accounts'),
          fetch('/api/journal-entries')
        ]);
        const accounts = await accRes.json();
        const entries = await entryRes.json();

        // Simple balance calculation
        const balances = {}; // AccountID -> Balance
        (entries || []).forEach(entry => {
          entry.Lines.forEach(line => {
            if (!balances[line.AccountID]) balances[line.AccountID] = 0;
            if (line.Side === 'Debit') balances[line.AccountID] += line.Amount;
            else balances[line.AccountID] -= line.Amount;
          });
        });

        let assets = 0, liabilities = 0, equity = 0;
        (accounts || []).forEach(acc => {
          const bal = balances[acc.ID] || 0;
          if (acc.Type === 'Asset') assets += bal;
          else if (acc.Type === 'Liability') liabilities += Math.abs(bal);
          else if (acc.Type === 'Equity') equity += Math.abs(bal);
          else if (acc.Type === 'Revenue') equity += Math.abs(bal); // Simplified
          else if (acc.Type === 'Expense') equity -= bal; // Simplified
        });

        setSummary({ assets, liabilities, equity });
        setRecentEntries((entries || []).slice(0, 5));
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };
    fetchData();
  }, []);

  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Financial Pulse
      </Typography>
      <Grid container spacing={3}>
        {/* Assets Summary */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Total Assets
            </Typography>
            <Typography component="p" variant="h4">
              £{summary.assets.toFixed(2)}
            </Typography>
            <Typography color="text.secondary" sx={{ flex: 1 }}>
              on {today}
            </Typography>
          </Paper>
        </Grid>
        {/* Liabilities Summary */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Total Liabilities
            </Typography>
            <Typography component="p" variant="h4">
              £{summary.liabilities.toFixed(2)}
            </Typography>
            <Typography color="text.secondary" sx={{ flex: 1 }}>
              on {today}
            </Typography>
          </Paper>
        </Grid>
        {/* Equity Summary */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Total Equity
            </Typography>
            <Typography component="p" variant="h4">
              £{summary.equity.toFixed(2)}
            </Typography>
            <Typography color="text.secondary" sx={{ flex: 1 }}>
              on {today}
            </Typography>
          </Paper>
        </Grid>
        {/* Recent Transactions */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Recent Transactions
            </Typography>
            {recentEntries.length > 0 ? (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell align="right">Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentEntries.map((entry) => (
                    <TableRow key={entry.ID}>
                      <TableCell>{new Date(entry.EntryDate).toLocaleDateString('en-GB')}</TableCell>
                      <TableCell>{entry.Description}</TableCell>
                      <TableCell align="right">
                        £{entry.Lines.filter(l => l.Side === 'Debit').reduce((sum, l) => sum + l.Amount, 0).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  No transactions recorded yet.
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
