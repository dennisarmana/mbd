import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Pagination, 
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Button,
  Chip,
  IconButton,
  Collapse,
  Divider
} from '@mui/material';
import {
  KeyboardArrowDown as ExpandMoreIcon,
  KeyboardArrowUp as ExpandLessIcon,
  SaveAlt as DownloadIcon,
  ViewList as ThreadViewIcon,
  Email as EmailViewIcon
} from '@mui/icons-material';
import { EmailPreview } from '../../types';

interface DatasetBrowserProps {
  emails: EmailPreview[];
  onDownload: () => void;
}

/**
 * Component for browsing the full dataset with pagination
 */
const DatasetBrowser: React.FC<DatasetBrowserProps> = ({ emails, onDownload }) => {
  const [page, setPage] = useState(1);
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'email' | 'thread'>('email');
  
  const pageSize = 10;
  const totalPages = Math.ceil(emails.length / pageSize);
  
  // Group emails by thread if in thread view
  const emailsByThread: Record<string, EmailPreview[]> = {};
  if (viewMode === 'thread') {
    emails.forEach(email => {
      const threadId = email.threadId || 'unknown';
      if (!emailsByThread[threadId]) {
        emailsByThread[threadId] = [];
      }
      emailsByThread[threadId].push(email);
    });
    
    // Sort emails within threads by timestamp
    Object.keys(emailsByThread).forEach(threadId => {
      emailsByThread[threadId].sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
    });
  }
  
  // Get current page items
  const currentPageEmails = emails.slice((page - 1) * pageSize, page * pageSize);
  
  // Get current page threads
  const currentPageThreads = viewMode === 'thread' 
    ? Object.keys(emailsByThread)
        .slice((page - 1) * pageSize, page * pageSize)
        .map(threadId => ({
          threadId,
          emails: emailsByThread[threadId],
          subject: emailsByThread[threadId][0].subject.replace(/^RE: /, '')
        }))
    : [];
  
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    setExpandedEmail(null); // Collapse all when changing page
  };
  
  const toggleExpand = (emailId: string) => {
    setExpandedEmail(expandedEmail === emailId ? null : emailId);
  };
  
  const handleViewModeChange = (event: React.SyntheticEvent, newMode: 'email' | 'thread') => {
    if (newMode !== null) {
      setViewMode(newMode);
      setPage(1); // Reset to first page when changing view
      setExpandedEmail(null);
    }
  };
  
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };
  
  const renderEmailContent = (email: EmailPreview) => {
    return (
      <Box sx={{ p: 2, mt: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
        <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
          {email.body || email.preview}
        </Typography>
      </Box>
    );
  };
  
  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Dataset Browser</Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<DownloadIcon />}
          onClick={onDownload}
        >
          Download Dataset
        </Button>
      </Box>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={viewMode} onChange={handleViewModeChange}>
          <Tab 
            icon={<EmailViewIcon />} 
            label="Email View" 
            value="email" 
            iconPosition="start"
          />
          <Tab 
            icon={<ThreadViewIcon />} 
            label="Thread View" 
            value="thread" 
            iconPosition="start" 
          />
        </Tabs>
      </Box>
      
      {viewMode === 'email' ? (
        <TableContainer component={Paper} sx={{ mb: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell></TableCell>
                <TableCell>From</TableCell>
                <TableCell>To</TableCell>
                <TableCell>Subject</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {currentPageEmails.map((email) => (
                <React.Fragment key={email.id}>
                  <TableRow hover>
                    <TableCell padding="checkbox">
                      <IconButton 
                        size="small" 
                        onClick={() => toggleExpand(email.id)}
                      >
                        {expandedEmail === email.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {email.fromName || email.from}
                      </Typography>
                      {email.fromName && (
                        <Typography variant="caption" display="block" color="text.secondary">
                          {email.from}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {email.to.map((to, index) => (
                        <Chip 
                          key={index} 
                          label={email.toNames?.[index] || to} 
                          size="small" 
                          sx={{ mr: 0.5, mb: 0.5 }} 
                        />
                      ))}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {email.subject}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatTimestamp(email.timestamp)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={5} sx={{ py: 0 }}>
                      <Collapse in={expandedEmail === email.id} timeout="auto" unmountOnExit>
                        {renderEmailContent(email)}
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Box sx={{ mb: 2 }}>
          {currentPageThreads.map(thread => (
            <Paper key={thread.threadId} sx={{ mb: 2, p: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                {thread.subject}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                {thread.emails.length} emails in this thread
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {thread.emails.map((email, index) => (
                <Box key={email.id} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Box>
                      <Typography variant="subtitle2">
                        {email.fromName || email.from}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatTimestamp(email.timestamp)}
                      </Typography>
                    </Box>
                    <IconButton 
                      size="small" 
                      onClick={() => toggleExpand(email.id)}
                    >
                      {expandedEmail === email.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  </Box>
                  <Box sx={{ ml: 2, pl: 2, borderLeft: '2px solid', borderColor: 'divider' }}>
                    <Collapse in={expandedEmail === email.id || index === 0} timeout="auto">
                      {renderEmailContent(email)}
                    </Collapse>
                  </Box>
                  {index < thread.emails.length - 1 && <Divider sx={{ my: 2 }} />}
                </Box>
              ))}
            </Paper>
          ))}
        </Box>
      )}
      
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Pagination 
          count={totalPages} 
          page={page} 
          onChange={handlePageChange} 
          color="primary" 
        />
      </Box>
    </Paper>
  );
};

export default DatasetBrowser;
