import React from 'react';
import { Grid, Paper, Typography, Box } from '@mui/material';

/**
 * Dashboard view providing the "Financial Pulse".
 * UI labels use British English.
 */
const Dashboard = () => {
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
              £0.00
            </Typography>
            <Typography color="text.secondary" sx={{ flex: 1 }}>
              on 4 April 2026
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
              £0.00
            </Typography>
            <Typography color="text.secondary" sx={{ flex: 1 }}>
              on 4 April 2026
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
              £0.00
            </Typography>
            <Typography color="text.secondary" sx={{ flex: 1 }}>
              on 4 April 2026
            </Typography>
          </Paper>
        </Grid>
        {/* Recent Transactions Placeholder */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Recent Transactions
            </Typography>
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                No transactions recorded yet.
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
