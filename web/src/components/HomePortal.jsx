import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Card, CardActionArea, CardContent, Typography } from '@mui/material';
import { Group as GroupIcon, AccountBalance as AccountBalanceIcon, MenuBook as MenuBookIcon } from '@mui/icons-material';
import { useUserSession } from '../context/UserSessionContext';

const cardSx = {
  maxWidth: 320,
  minHeight: 200,
  textAlign: 'center',
  transition: 'transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    borderColor: 'primary.main',
  },
};

export default function HomePortal() {
  const navigate = useNavigate();
  const { portalIdentity, portalConfigure, portalBooks, operator } = useUserSession();

  const tiles = [
    portalIdentity && {
      key: 'identity',
      title: 'Identity & access',
      subtitle: 'Manage operators, roles, and passwords.',
      icon: <GroupIcon sx={{ fontSize: 56, color: 'primary.main' }} />,
      path: '/identity',
    },
    portalConfigure && {
      key: 'configure',
      title: 'Configuration',
      subtitle: 'Maintain the legal entity and functional currency.',
      icon: <AccountBalanceIcon sx={{ fontSize: 56, color: 'secondary.main' }} />,
      path: '/configure',
    },
    portalBooks && {
      key: 'books',
      title: 'Bookkeeping',
      subtitle: 'Journals, chart of accounts, periods, and reports.',
      icon: <MenuBookIcon sx={{ fontSize: 56, color: 'success.main' }} />,
      path: '/books',
    },
  ].filter(Boolean);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Welcome
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Signed in as <strong>{operator?.display_name || operator?.login}</strong>. Choose an area you are allowed to use.
      </Typography>
      {tiles.length === 0 ? (
        <Typography color="text.secondary">No areas are available for your roles. Contact an administrator.</Typography>
      ) : (
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 3,
            justifyContent: 'flex-start',
          }}
        >
          {tiles.map((t) => (
            <Card key={t.key} sx={cardSx} elevation={3}>
              <CardActionArea onClick={() => navigate(t.path)} sx={{ height: '100%', p: 2 }}>
                <CardContent>
                  <Box sx={{ mb: 1 }}>{t.icon}</Box>
                  <Typography variant="h6" component="div" gutterBottom>
                    {t.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t.subtitle}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
}
