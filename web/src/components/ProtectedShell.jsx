import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import MainLayout from './MainLayout';
import { UserSessionProvider } from '../context/UserSessionContext';
import { useApp } from '../context/AppContext';
import { apiGet } from '../api/client';

/** Wraps the main shell; redirects to /login until session is valid. */
export default function ProtectedShell() {
  const navigate = useNavigate();
  const { refreshAll } = useApp();
  const [me, setMe] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const profile = await apiGet('/api/auth/me');
        if (!cancelled) setMe(profile);
      } catch {
        if (!cancelled) navigate('/login', { replace: true });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  useEffect(() => {
    if (!me?.id) return;
    refreshAll();
  }, [me?.id, refreshAll]);

  if (!me) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <UserSessionProvider operator={me}>
      <MainLayout>
        <Outlet />
      </MainLayout>
    </UserSessionProvider>
  );
}
