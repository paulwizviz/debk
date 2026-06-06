import React from 'react';
import {
  AppBar,
  Avatar,
  Box,
  Chip,
  IconButton,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Logout as LogoutIcon,
  Home as HomeIcon,
  Brightness4 as DarkIcon,
  Brightness7 as LightIcon,
} from '@mui/icons-material';
import { apiPost } from '../api/client';
import { useNavigate, useLocation } from 'react-router-dom';
import { useColorMode } from '../context/ColorModeContext';
import { useUserSession } from '../context/UserSessionContext';

const MainLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const showHome = location.pathname !== '/';
  const { mode, toggle } = useColorMode();
  const { operator } = useUserSession();
  const name = operator?.display_name || operator?.login || 'Operator';
  const initial = name.charAt(0).toUpperCase();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          borderRadius: 0,
          border: 'none',
          borderBottom: '1px solid',
          borderColor: 'divider',
          boxShadow: 'none',
        }}
      >
        <Toolbar sx={{ gap: 1 }}>
          {showHome && (
            <IconButton
              color="inherit"
              aria-label="home"
              edge="start"
              onClick={() => navigate('/')}
              sx={{ mr: 0.5 }}
            >
              <HomeIcon />
            </IconButton>
          )}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              flexGrow: 1,
              minWidth: 0,
            }}
          >
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{
                fontWeight: 800,
                letterSpacing: '0.04em',
                lineHeight: 1.15,
                background: 'linear-gradient(135deg, #2DD4BF, #22D3EE)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              DEBK
            </Typography>
            <Typography
              variant="caption"
              noWrap
              sx={{ color: 'text.secondary', lineHeight: 1.15 }}
            >
              Double-entry bookkeeping
            </Typography>
          </Box>
          <Tooltip title={mode === 'dark' ? 'Switch to bright theme' : 'Switch to dark theme'}>
            <IconButton color="inherit" aria-label="toggle theme" onClick={toggle}>
              {mode === 'dark' ? <LightIcon /> : <DarkIcon />}
            </IconButton>
          </Tooltip>
          <Chip
            avatar={
              <Avatar sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>{initial}</Avatar>
            }
            label={name}
            variant="outlined"
            sx={{ display: { xs: 'none', sm: 'inline-flex' }, borderColor: 'divider' }}
          />
          <Tooltip title="Sign out">
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
          </Tooltip>
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
        <Box sx={{ flexGrow: 1, px: 3, pt: 4, pb: 3, width: '100%', boxSizing: 'border-box' }}>{children}</Box>
      </Box>
    </Box>
  );
};

export default MainLayout;
