import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  MenuBook as MenuBookIcon,
  EditNote as EditNoteIcon,
  EventNote as EventNoteIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { useUserSession } from '../context/UserSessionContext';

const drawerWidth = 260;

const items = [
  { text: 'Financial Pulse', icon: <DashboardIcon />, path: '/books', match: (p) => p === '/books' || p.startsWith('/books/ledger') },
  { text: 'Journal (audit)', icon: <MenuBookIcon />, path: '/books/journal', match: (p) => p === '/books/journal' },
  { text: 'Journal workbench', icon: <EditNoteIcon />, path: '/books/workbench', match: (p) => p === '/books/workbench' },
  { text: 'Periods & closing', icon: <EventNoteIcon />, path: '/books/periods', match: (p) => p === '/books/periods' },
  { text: 'Reports', icon: <AssessmentIcon />, path: '/books/reports', match: (p) => p === '/books/reports' },
];

export default function BookkeepingLayout() {
  const smDown = useMediaQuery((theme) => theme.breakpoints.down('sm'));
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { portalBooks } = useUserSession();

  useEffect(() => {
    if (!portalBooks) {
      navigate('/', { replace: true });
    }
  }, [portalBooks, navigate]);

  if (!portalBooks) {
    return null;
  }

  const pathNorm = location.pathname.replace(/\/$/, '') || '/';

  const drawer = (
    <div>
      <Toolbar />
      <List>
        {items.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              onClick={() => {
                navigate(item.path);
                setMobileOpen(false);
              }}
              selected={item.match(pathNorm)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex', width: '100%', alignItems: 'stretch', flex: 1, minHeight: 0 }}>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
      >
        <Typography variant="subtitle2" sx={{ px: 2, pt: 1, color: 'text.secondary' }}>
          Bookkeeping
        </Typography>
        {drawer}
      </Drawer>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, position: 'relative', height: '100%' },
        }}
        open
      >
        <Typography variant="subtitle2" sx={{ px: 2, pt: 1, color: 'text.secondary' }}>
          Bookkeeping
        </Typography>
        {drawer}
      </Drawer>
      <Box component="div" sx={{ flexGrow: 1, minWidth: 0 }}>
        {smDown && (
          <Toolbar variant="dense" disableGutters sx={{ minHeight: 44, pl: 0.5 }}>
            <IconButton color="inherit" aria-label="open bookkeeping menu" edge="start" onClick={() => setMobileOpen(true)}>
              <MenuIcon />
            </IconButton>
            <Typography variant="subtitle1" sx={{ ml: 0.5 }}>
              Bookkeeping menu
            </Typography>
          </Toolbar>
        )}
        <Outlet />
      </Box>
    </Box>
  );
}
