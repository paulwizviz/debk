import React from 'react';
import {
  AppBar,
  Box,
  IconButton,
  Toolbar,
  Typography,
} from '@mui/material';
import { Logout as LogoutIcon, Home as HomeIcon } from '@mui/icons-material';
import { apiPost } from '../api/client';
import { useNavigate, useLocation } from 'react-router-dom';

const MainLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const showHome = location.pathname !== '/';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar>
          {showHome && (
            <IconButton
              color="inherit"
              aria-label="home"
              edge="start"
              onClick={() => navigate('/')}
              sx={{ mr: 1 }}
            >
              <HomeIcon />
            </IconButton>
          )}
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            DEBK — Double-entry bookkeeping
          </Typography>
          <IconButton
            color="inherit"
            aria-label="sign out"
            edge="end"
            onClick={async () => {
              try {
                await apiPost('/api/auth/logout', {});
              } catch {
                /* ignore */
              }
              navigate('/login', { replace: true });
            }}
          >
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          pt: 0,
        }}
      >
        <Toolbar />
        <Box sx={{ flexGrow: 1, px: 3, pb: 3, width: '100%', boxSizing: 'border-box' }}>{children}</Box>
      </Box>
    </Box>
  );
};

export default MainLayout;
