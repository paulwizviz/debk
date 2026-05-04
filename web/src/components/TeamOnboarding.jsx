import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormGroup,
  Paper,
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

function rowIsBookkeeperOnly(row) {
  return row.roles?.length > 0 && row.roles.every((r) => r === 'bookkeep');
}

export default function TeamOnboarding() {
  const navigate = useNavigate();
  const { isFullAdmin, canInviteUsers, portalIdentity } = useUserSession();
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [pwTarget, setPwTarget] = useState(null);
  const [login, setLogin] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [roles, setRoles] = useState(['bookkeep']);
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
    setRoles(isFullAdmin ? ['bookkeep'] : ['bookkeep']);
    setAddOpen(true);
  };

  const toggleRole = (role) => {
    setRoles((prev) => {
      const has = prev.includes(role);
      if (has) return prev.filter((r) => r !== role);
      return [...prev, role];
    });
  };

  const submitAdd = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const body = {
        login,
        display_name: displayName || login,
        password,
        roles: isFullAdmin ? roles : ['bookkeep'],
      };
      if (!body.login || !body.password || !body.roles.length) {
        setError('Login, password, and at least one role are required.');
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
        {isFullAdmin
          ? 'Create accounts for configuration administrators (e.g. Bob) or bookkeepers (e.g. Charlene). Only bookkeepers can be created by a configuration administrator without full admin rights.'
          : 'Create bookkeeper accounts (e.g. Charlene). Ask a full administrator if you need another configuration administrator.'}
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
            <TableCell>Roles</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.login}</TableCell>
              <TableCell>{row.display_name}</TableCell>
              <TableCell>{(row.roles || []).join(', ')}</TableCell>
              <TableCell>{row.status}</TableCell>
              <TableCell align="right">
                {(isFullAdmin || rowIsBookkeeperOnly(row)) && (
                  <Button size="small" startIcon={<VpnKeyIcon />} onClick={() => openPw(row)}>
                    Set password
                  </Button>
                )}
                {isFullAdmin ? (
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
            {isFullAdmin ? (
              <Box sx={{ mt: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Roles
                </Typography>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={roles.includes('full_admin')}
                        onChange={() => toggleRole('full_admin')}
                      />
                    }
                    label="Full administrator"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={roles.includes('configure')}
                        onChange={() => toggleRole('configure')}
                      />
                    }
                    label="Configuration administrator (COA, business profile)"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={roles.includes('bookkeep')}
                        onChange={() => toggleRole('bookkeep')}
                      />
                    }
                    label="Bookkeeper (journal & reports)"
                  />
                </FormGroup>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                New user will be assigned the <strong>bookkeeper</strong> role only.
              </Typography>
            )}
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
