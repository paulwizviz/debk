import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Paper,
  Radio,
  RadioGroup,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { PersonAdd as PersonAddIcon, VpnKey as VpnKeyIcon } from '@mui/icons-material';
import { apiGet, apiPatch, apiPost } from '../api/client';
import { useUserSession } from '../context/UserSessionContext';

function formatRoles(slugs) {
  if (!slugs?.length) return '';
  return slugs
    .map((r) => {
      if (r === 'admin') return 'Administrator';
      if (r === 'user') return 'User';
      return r;
    })
    .join(', ');
}

export default function TeamOnboarding() {
  const navigate = useNavigate();
  const { isAdmin, canInviteUsers, portalIdentity } = useUserSession();
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [pwTarget, setPwTarget] = useState(null);
  const [login, setLogin] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [roleChoice, setRoleChoice] = useState('user');
  const [newPw, setNewPw] = useState('');

  const refresh = useCallback(async () => {
    setError('');
    try {
      const list = await apiGet('/api/operators');
      setRows(list || []);
    } catch (e) {
      setError(e.message || String(e));
    }
  }, []);

  useEffect(() => {
    if (!portalIdentity) {
      navigate('/', { replace: true });
      return;
    }
    refresh();
  }, [refresh, portalIdentity, navigate]);

  const openAdd = () => {
    setLogin('');
    setDisplayName('');
    setPassword('');
    setRoleChoice('user');
    setAddOpen(true);
  };

  const submitAdd = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const body = {
        login,
        display_name: displayName || login,
        password,
        roles: [roleChoice],
      };
      if (!body.login || !body.password || !body.roles.length) {
        setError('Login, password, and a role are required.');
        return;
      }
      await apiPost('/api/operators', body);
      setAddOpen(false);
      await refresh();
    } catch (err) {
      setError(err.message || String(err));
    }
  };

  const openPw = (row) => {
    setPwTarget(row);
    setNewPw('');
    setPwOpen(true);
  };

  const submitPw = async (e) => {
    e.preventDefault();
    setError('');
    if (!pwTarget || !newPw) return;
    try {
      await apiPost(`/api/operators/${pwTarget.id}/password`, { password: newPw });
      setPwOpen(false);
      setPwTarget(null);
    } catch (err) {
      setError(err.message || String(err));
    }
  };

  const toggleActive = async (row) => {
    setError('');
    const next = row.status === 'active' ? 'disabled' : 'active';
    try {
      await apiPatch(`/api/operators/${row.id}`, { status: next });
      await refresh();
    } catch (err) {
      setError(err.message || String(err));
    }
  };

  if (!portalIdentity) {
    return null;
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Identity & access
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Create <strong>Administrator</strong> accounts (identity, chart of accounts, business profile, and bookkeeping)
        or <strong>User</strong> accounts (bookkeeping only). Use <strong>Add user</strong> for a new sign-in,{' '}
        <strong>Set password</strong> when someone needs a new password, and <strong>Disable</strong> /{' '}
        <strong>Enable</strong> to stop or restore sign-in without deleting history.
      </Typography>
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      ) : null}
      {canInviteUsers ? (
        <Box sx={{ mb: 2 }}>
          <Button variant="contained" startIcon={<PersonAddIcon />} onClick={openAdd}>
            Add user
          </Button>
        </Box>
      ) : null}
      <Table size="small" component={Paper}>
        <TableHead>
          <TableRow>
            <TableCell>Login</TableCell>
            <TableCell>Display name</TableCell>
            <TableCell>Access</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.login}</TableCell>
              <TableCell>{row.display_name}</TableCell>
              <TableCell>{formatRoles(row.roles)}</TableCell>
              <TableCell>{row.status}</TableCell>
              <TableCell align="right">
                {isAdmin ? (
                  <Button size="small" startIcon={<VpnKeyIcon />} onClick={() => openPw(row)}>
                    Set password
                  </Button>
                ) : null}
                {isAdmin ? (
                  <Button size="small" sx={{ ml: 1 }} onClick={() => toggleActive(row)}>
                    {row.status === 'active' ? 'Disable' : 'Enable'}
                  </Button>
                ) : null}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={addOpen} onClose={() => setAddOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add user</DialogTitle>
        <Box component="form" onSubmit={submitAdd}>
          <DialogContent>
            <TextField
              label="Login"
              fullWidth
              required
              margin="normal"
              value={login}
              onChange={(ev) => setLogin(ev.target.value)}
            />
            <TextField
              label="Display name"
              fullWidth
              margin="normal"
              value={displayName}
              onChange={(ev) => setDisplayName(ev.target.value)}
            />
            <TextField
              label="Initial password"
              type="password"
              fullWidth
              required
              margin="normal"
              value={password}
              onChange={(ev) => setPassword(ev.target.value)}
            />
            <Typography variant="subtitle2" sx={{ mt: 2 }} gutterBottom>
              Access type
            </Typography>
            <RadioGroup value={roleChoice} onChange={(ev) => setRoleChoice(ev.target.value)}>
              <FormControlLabel
                value="user"
                control={<Radio />}
                label="User — bookkeeping and reports only"
              />
              <FormControlLabel
                value="admin"
                control={<Radio />}
                label="Administrator — identity, chart of accounts, business profile, and bookkeeping"
              />
            </RadioGroup>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">
              Create
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog open={pwOpen} onClose={() => setPwOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Set password — {pwTarget?.login}</DialogTitle>
        <Box component="form" onSubmit={submitPw}>
          <DialogContent>
            <TextField
              label="New password"
              type="password"
              fullWidth
              required
              value={newPw}
              onChange={(ev) => setNewPw(ev.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPwOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">
              Save
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}
