import React from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useApp } from '../context/AppContext';
import { formatDate } from '../utils/money';

/**
 * Context bar: business name, functional currency, active accounting period (§4.2).
 */
export default function ContextBar() {
  const {
    business,
    currency,
    periods,
    activePeriodId,
    setActivePeriodId,
    loading,
    error,
    refreshAll,
  } = useApp();

  if (loading && !business) {
    return (
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <CircularProgress size={20} />
        <Typography variant="body2" color="text.secondary">
          Loading books…
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 2 }}>
      {error && (
        <Alert severity="error" onClose={() => refreshAll()} sx={{ mb: 1 }}>
          {error}
        </Alert>
      )}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        sx={{
          flexWrap: 'wrap',
          p: 1.5,
          borderRadius: 1,
          bgcolor: 'background.paper',
          border: 1,
          borderColor: 'divider',
        }}
      >
        <Typography variant="subtitle1" fontWeight={600}>
          {business?.legal_name || 'Business'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Functional currency: <strong>{currency}</strong>
        </Typography>
        <FormControl size="small" sx={{ minWidth: 260 }}>
          <InputLabel id="active-period-label">Active period</InputLabel>
          <Select
            labelId="active-period-label"
            label="Active period"
            value={activePeriodId === '' ? '' : activePeriodId}
            onChange={(e) => {
              const v = e.target.value;
              setActivePeriodId(v === '' ? '' : Number(v));
            }}
          >
            {periods.length === 0 && (
              <MenuItem value="" disabled>
                No periods — create one under Periods & closing
              </MenuItem>
            )}
            {periods.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {p.label || `Period #${p.id}`} · {formatDate(p.start)} – {formatDate(p.end)}
                {p.is_closed ? ' (closed)' : ''}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>
    </Box>
  );
}
