import React, { useEffect, useState } from 'react';
import { Box, Tab, Tabs, Typography } from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import ContextBar from './ContextBar';
import Workbench from './Workbench';
import JournalAudit from './JournalAudit';

/**
 * Journal: a single bookkeeping surface that splits journal entry (workbench)
 * and the audit trail into two tabs.
 */
export default function Journal() {
  const [searchParams, setSearchParams] = useSearchParams();
  const reverseId = searchParams.get('reverse');
  const tabParam = searchParams.get('tab');
  const [tab, setTab] = useState(tabParam === 'audit' && !reverseId ? 'audit' : 'entry');

  useEffect(() => {
    if (reverseId) setTab('entry');
  }, [reverseId]);

  const handleChange = (_event, value) => {
    setTab(value);
    const next = new URLSearchParams(searchParams);
    next.set('tab', value);
    if (value !== 'entry') {
      next.delete('reverse');
    }
    setSearchParams(next, { replace: true });
  };

  return (
    <Box>
      <ContextBar />
      <Typography variant="h4" gutterBottom>
        Journal
      </Typography>
      <Tabs value={tab} onChange={handleChange} sx={{ mb: 2 }}>
        <Tab value="entry" label="Workbench" />
        <Tab value="audit" label="Audit" />
      </Tabs>
      <Box sx={{ display: tab === 'entry' ? 'block' : 'none' }}>
        <Workbench />
      </Box>
      {tab === 'audit' && <JournalAudit />}
    </Box>
  );
}
