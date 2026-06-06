import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  MenuBook as MenuBookIcon,
  AccountTree as AccountTreeIcon,
  EventNote as EventNoteIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { useUserSession } from '../context/UserSessionContext';

const MOBILE_WIDTH = 260;
const MIN_WIDTH = 200;
const MAX_WIDTH = 420;
const COLLAPSED_WIDTH = 72;
const COLLAPSE_THRESHOLD = 150;
const DEFAULT_WIDTH = 260;
const STORAGE_KEY = 'debk-books-drawer-width';

function readInitialWidth() {
  try {
    const v = parseInt(localStorage.getItem(STORAGE_KEY), 10);
    if (!Number.isNaN(v)) {
      if (v <= COLLAPSED_WIDTH) return COLLAPSED_WIDTH;
      return Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, v));
    }
  } catch {
    /* ignore storage access errors */
  }
  return DEFAULT_WIDTH;
}

const items = [
  { text: 'Overview', icon: <DashboardIcon />, path: '/books', match: (p) => p === '/books' || p.startsWith('/books/ledger') },
  { text: 'Journal', icon: <MenuBookIcon />, path: '/books/journal', match: (p) => p === '/books/journal' || p === '/books/workbench' },
  { text: 'Chart of accounts', icon: <AccountTreeIcon />, path: '/books/accounts', match: (p) => p === '/books/accounts' },
  { text: 'Periods', icon: <EventNoteIcon />, path: '/books/periods', match: (p) => p === '/books/periods' },
  { text: 'Reports', icon: <AssessmentIcon />, path: '/books/reports', match: (p) => p === '/books/reports' },
];

export default function BookkeepingLayout() {
  const smDown = useMediaQuery((theme) => theme.breakpoints.down('sm'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [width, setWidth] = useState(readInitialWidth);
  const [dragging, setDragging] = useState(false);
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { portalBooks } = useUserSession();

  const collapsed = width <= COLLAPSED_WIDTH;

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(width));
    } catch {
      /* ignore storage access errors */
    }
  }, [width]);

  useEffect(() => {
    if (!dragging) return undefined;
    const onMove = (e) => {
      const left = containerRef.current?.getBoundingClientRect().left ?? 0;
      const next = e.clientX - left;
      if (next < COLLAPSE_THRESHOLD) {
        setWidth(COLLAPSED_WIDTH);
      } else {
        setWidth(Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, next)));
      }
    };
    const onUp = () => setDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    const prevSelect = document.body.style.userSelect;
    const prevCursor = document.body.style.cursor;
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'ew-resize';
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      document.body.style.userSelect = prevSelect;
      document.body.style.cursor = prevCursor;
    };
  }, [dragging]);

  const startDrag = useCallback((e) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const toggleCollapse = useCallback(() => {
    setWidth((w) => (w <= COLLAPSED_WIDTH ? DEFAULT_WIDTH : COLLAPSED_WIDTH));
  }, []);

  useEffect(() => {
    if (!portalBooks) {
      navigate('/', { replace: true });
    }
  }, [portalBooks, navigate]);

  if (!portalBooks) {
    return null;
  }

  const pathNorm = location.pathname.replace(/\/$/, '') || '/';

  const renderDrawer = (mini) => (
    <div>
      {!mini && (
        <Typography
          variant="overline"
          sx={{ display: 'block', px: 2.5, pt: 1, pb: 0.5, color: 'text.secondary', letterSpacing: '0.12em' }}
        >
          Bookkeeping
        </Typography>
      )}
      <List sx={mini ? { pt: 5 } : undefined}>
        {items.map((item) => {
          const active = item.match(pathNorm);
          const button = (
            <ListItemButton
              onClick={() => {
                navigate(item.path);
                setMobileOpen(false);
              }}
              selected={active}
              sx={mini ? { justifyContent: 'center', px: 1.5 } : undefined}
            >
              <ListItemIcon
                sx={{
                  color: active ? 'primary.main' : 'inherit',
                  minWidth: mini ? 0 : 40,
                  justifyContent: 'center',
                }}
              >
                {item.icon}
              </ListItemIcon>
              {!mini && (
                <ListItemText primary={item.text} primaryTypographyProps={{ fontWeight: active ? 700 : 500 }} />
              )}
            </ListItemButton>
          );
          return (
            <ListItem key={item.path} disablePadding sx={{ display: 'block' }}>
              {mini ? (
                <Tooltip title={item.text} placement="right">
                  {button}
                </Tooltip>
              ) : (
                button
              )}
            </ListItem>
          );
        })}
      </List>
    </div>
  );

  const paperTransition = dragging ? 'none' : 'width 160ms ease';

  return (
    <Box ref={containerRef} sx={{ display: 'flex', width: '100%', alignItems: 'stretch', flex: 1, minHeight: 0 }}>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: MOBILE_WIDTH,
            borderRadius: 0,
            border: 'none',
            borderRight: '1px solid',
            borderColor: 'divider',
          },
        }}
      >
        {renderDrawer(false)}
      </Drawer>
      <Box sx={{ display: { xs: 'none', sm: 'flex' }, position: 'relative', flexShrink: 0 }}>
        <Drawer
          variant="permanent"
          sx={{
            width,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width,
              position: 'relative',
              height: '100%',
              overflowX: 'hidden',
              transition: paperTransition,
              borderRadius: 0,
              border: 'none',
              borderRight: '1px solid',
              borderColor: 'divider',
            },
          }}
          open
        >
          {renderDrawer(collapsed)}
        </Drawer>
        <Box
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize navigation panel (double-click to collapse)"
          onMouseDown={startDrag}
          onDoubleClick={toggleCollapse}
          sx={{
            position: 'absolute',
            top: 0,
            right: -3,
            width: 6,
            height: '100%',
            cursor: 'ew-resize',
            zIndex: 2,
            '&:hover::after, &:active::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 2,
              width: 2,
              height: '100%',
              backgroundColor: 'primary.main',
              opacity: 0.7,
            },
          }}
        />
      </Box>
      <Box component="div" sx={{ flexGrow: 1, minWidth: 0, pl: { xs: 0, sm: 3 } }}>
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
