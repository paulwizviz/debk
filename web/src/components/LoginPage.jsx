import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { apiGet, apiPost, BUSINESS_ID } from '../api/client';

export default function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('loading'); // loading | bootstrap | login
  const [error, setError] = useState('');
  const [login, setLogin] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const st = await apiGet('/api/auth/bootstrap-status');
        if (cancelled) return;
        if (st.needs_bootstrap) {
          setMode('bootstrap');
          return;
        }
        try {
          await apiGet('/api/auth/me');
          if (!cancelled) navigate('/', { replace: true });
        } catch {
          if (!cancelled) setMode('login');
        }
      } catch (e) {
        if (!cancelled) {
          setError(e.message || String(e));
          setMode('login');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const submitBootstrap = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await apiPost('/api/auth/bootstrap', {
        business_id: BUSINESS_ID,
        login,
        display_name: displayName || login,
        password,
      });
      // First administrator should allocate other users (Bob, Charlene) next — not the journal.
      navigate('/identity', { replace: true });
    } catch (err) {
      setError(err.message || String(err));
    }
  };

  const submitLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await apiPost('/api/auth/login', {
        business_id: BUSINESS_ID,
        login,
        password,
      });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || String(err));
    }
  };

  if (mode === 'loading' && !error) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Typography>Loading…</Typography>
      </Container>
    );
  }

  const title = mode === 'bootstrap' ? 'Create first administrator' : 'Sign in';
  const subtitle =
    mode === 'bootstrap'
      ? 'No users exist yet. Create the first account for this business (full administrator).'
      : 'Enter your credentials for this DEBK installation.';

  return (
    <Container maxWidth="sm" sx={{ mt: 6 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {subtitle}
        </Typography>
        {error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : null}
        <Box component="form" onSubmit={mode === 'bootstrap' ? submitBootstrap : submitLogin}>
          <TextField
            label="Login"
            name="login"
            fullWidth
            margin="normal"
            required
            autoComplete="username"
            value={login}
            onChange={(ev) => setLogin(ev.target.value)}
          />
          {mode === 'bootstrap' ? (
            <TextField
              label="Display name (optional)"
              name="displayName"
              fullWidth
              margin="normal"
              value={displayName}
              onChange={(ev) => setDisplayName(ev.target.value)}
            />
          ) : null}
          <TextField
            label="Password"
            name="password"
            type="password"
            fullWidth
            margin="normal"
            required
            autoComplete={mode === 'bootstrap' ? 'new-password' : 'current-password'}
            value={password}
            onChange={(ev) => setPassword(ev.target.value)}
          />
          <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
            {mode === 'bootstrap' ? 'Create account' : 'Sign in'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
