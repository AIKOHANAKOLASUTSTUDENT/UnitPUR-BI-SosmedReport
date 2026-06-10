import { useState } from 'react';
import { useOutletContext } from 'react-router';
import {
  Box, Card, CardContent, Typography, Button, TextField, MenuItem,
  IconButton, Chip, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Avatar, LinearProgress, Alert,
} from '@mui/material';
import { Youtube, Plus, Trash2, BarChart3, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import type { OutletContextType, YouTubePost } from '../types';
import { calculateTotalEngagement, parseContentUrls } from '../lib/content';
import {
  analyzePlatformContent,
  disconnectPlatform,
  getFriendlyErrorMessage,
  startPlatformConnection,
} from '../lib/platformApi';

const PLATFORM_COLOR = '#FF0000';
const PLATFORM_BG = '#fff5f5';

export default function YouTubePage() {
  const {
    platformAuth,
    youtubePosts,
    platformConnections,
    refreshBootstrap,
  } =
    useOutletContext<OutletContextType>();

  const [urlInputs, setUrlInputs] = useState([{ url: '', contentType: 'Video' as YouTubePost['contentType'] }]);
  const [analyzing, setAnalyzing] = useState(false);
  const [bulkInput, setBulkInput] = useState('');
  const [bulkMode, setBulkMode] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      await startPlatformConnection('youtube');
      await refreshBootstrap();
      toast.success('Connected to YouTube successfully.');
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error));
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectPlatform('youtube');
      await refreshBootstrap();
      toast.info('Disconnected from YouTube');
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error));
    }
  };

  const addUrlRow = () => setUrlInputs([...urlInputs, { url: '', contentType: 'Video' }]);
  const removeUrlRow = (index: number) => setUrlInputs(urlInputs.filter((_, i) => i !== index));
  const updateRow = (index: number, field: 'url' | 'contentType', value: string) => {
    const updated = [...urlInputs];
    (updated[index] as any)[field] = value;
    setUrlInputs(updated);
  };

  const parseUrls = (text: string): string[] => {
    return parseContentUrls(text);
  };

  const detectedUrls = parseUrls(bulkInput);

  const handleAnalyze = async () => {
    let validRows: Array<{ url: string; contentType: YouTubePost['contentType'] }> = [];

    if (bulkMode) {
      const urls = detectedUrls;
      if (!urls.length) {
        toast.error('Please enter at least one URL');
        return;
      }
      validRows = urls.map((url) => ({ url, contentType: 'Video' as YouTubePost['contentType'] }));
    } else {
      validRows = urlInputs.filter((r) => r.url.trim());
      if (!validRows.length) {
        toast.error('Please enter at least one URL');
        return;
      }
    }

    setAnalyzing(true);
    try {
      const response = await analyzePlatformContent('youtube', validRows);
      await refreshBootstrap();

      if (bulkMode) {
        setBulkInput('');
      } else {
        setUrlInputs([{ url: '', contentType: 'Video' }]);
      }

      toast.success(response.message);
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error));
    } finally {
      setAnalyzing(false);
    }
  };

  const totalEngagement = (p: YouTubePost) => calculateTotalEngagement(p);

  const connectedAccount = platformConnections.youtube;

  if (!platformAuth.youtube) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Card sx={{ maxWidth: 420, width: '100%', textAlign: 'center', border: `2px solid #FF000030` }}>
          <CardContent sx={{ p: 5 }}>
            <Box sx={{ width: 80, height: 80, borderRadius: '20px', bgcolor: PLATFORM_COLOR, display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3 }}>
              <Youtube size={48} color="white" />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>Connect YouTube</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4 }}>
              Connect a Google account with YouTube access to retrieve real video metrics through the official YouTube Data API.
            </Typography>
            <Button
              variant="contained"
              size="large"
              fullWidth
              startIcon={<LogIn size={18} />}
              onClick={handleConnect}
              disabled={connecting}
              sx={{ bgcolor: PLATFORM_COLOR, '&:hover': { bgcolor: '#cc0000' }, py: 1.5 }}
            >
              {connecting ? 'Connecting...' : 'Connect Google Account'}
            </Button>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 2 }}>
              OAuth tokens are stored securely on the backend and refreshed automatically when supported.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <Box sx={{ width: 48, height: 48, borderRadius: '12px', bgcolor: PLATFORM_COLOR, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Youtube size={28} color="white" />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>YouTube Analysis</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {connectedAccount?.accountName || 'Connected account'} &nbsp;
            <Chip label="Connected" size="small" sx={{ bgcolor: '#d1fae5', color: '#065f46' }} />
          </Typography>
        </Box>
        <Button variant="outlined" color="error" size="small" onClick={handleDisconnect}>Disconnect</Button>
      </Box>

      <Card sx={{ mb: 3, border: `1px solid #FF000030`, bgcolor: PLATFORM_BG }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Add YouTube Content to Analyze</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                size="small"
                variant={!bulkMode ? 'contained' : 'outlined'}
                onClick={() => setBulkMode(false)}
                sx={!bulkMode ? { bgcolor: PLATFORM_COLOR, '&:hover': { bgcolor: '#cc0000' } } : {}}
              >
                Single
              </Button>
              <Button
                size="small"
                variant={bulkMode ? 'contained' : 'outlined'}
                onClick={() => setBulkMode(true)}
                sx={bulkMode ? { bgcolor: PLATFORM_COLOR, '&:hover': { bgcolor: '#cc0000' } } : {}}
              >
                Bulk
              </Button>
            </Box>
          </Box>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
            Analyze Videos or Shorts. YouTube metrics include Views, Watch Time (hours), Subscribers Gained, Likes, Comments, and Shares.
          </Typography>

          {bulkMode ? (
            <Box>
              <TextField
                multiline
                rows={6}
                fullWidth
                value={bulkInput}
                onChange={(e) => setBulkInput(e.target.value)}
                placeholder="Paste multiple YouTube URLs here, separated by space, comma, or new line&#10;&#10;Example:&#10;https://www.youtube.com/watch?v=abc123&#10;https://www.youtube.com/shorts/xyz456, https://www.youtube.com/watch?v=def789"
                sx={{ mb: 2 }}
              />
              {detectedUrls.length > 0 && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Detected {detectedUrls.length} URL{detectedUrls.length > 1 ? 's' : ''}
                </Alert>
              )}
            </Box>
          ) : (
            <>
              {urlInputs.map((row, i) => (
                <Box key={i} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
                  <TextField
                    label={`YouTube URL ${i + 1}`}
                    value={row.url}
                    onChange={(e) => updateRow(i, 'url', e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    sx={{ flex: 1 }}
                    size="small"
                  />
                  <TextField
                    select
                    label="Type"
                    value={row.contentType}
                    onChange={(e) => updateRow(i, 'contentType', e.target.value)}
                    size="small"
                    sx={{ minWidth: 130 }}
                  >
                    {['Video', 'Short'].map((t) => (
                      <MenuItem key={t} value={t}>{t}</MenuItem>
                    ))}
                  </TextField>
                  <IconButton color="error" onClick={() => removeUrlRow(i)} disabled={urlInputs.length === 1}>
                    <Trash2 size={18} />
                  </IconButton>
                </Box>
              ))}
            </>
          )}

          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            {!bulkMode && <Button startIcon={<Plus size={16} />} onClick={addUrlRow} size="small">Add Another URL</Button>}
            <Button
              variant="contained"
              startIcon={<BarChart3 size={16} />}
              onClick={handleAnalyze}
              disabled={analyzing}
              sx={{ ml: 'auto', bgcolor: PLATFORM_COLOR, '&:hover': { bgcolor: '#cc0000' } }}
            >
              {analyzing ? 'Analyzing...' : 'Analyze'}
            </Button>
          </Box>
          {analyzing && <LinearProgress sx={{ mt: 2, '& .MuiLinearProgress-bar': { bgcolor: PLATFORM_COLOR } }} />}
        </CardContent>
      </Card>

      {youtubePosts.length > 0 ? (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Results ({youtubePosts.length} items)
            </Typography>
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Thumbnail</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Link</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Views</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Watch Time (hrs)</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Subs Gained</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Likes</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Comments</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Shares</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Engagement</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {youtubePosts.map((post) => (
                    <TableRow key={post.id} hover>
                      <TableCell><Avatar variant="rounded" src={post.thumbnail} sx={{ width: 40, height: 40 }} /></TableCell>
                      <TableCell>
                        <Chip label={post.contentType} size="small"
                          sx={{ bgcolor: post.contentType === 'Short' ? '#fee2e2' : '#fef3c7', color: post.contentType === 'Short' ? '#991b1b' : '#92400e' }} />
                      </TableCell>
                      <TableCell><a href={post.link} target="_blank" rel="noopener noreferrer" style={{ color: PLATFORM_COLOR, textDecoration: 'none', fontSize: 12 }}>View</a></TableCell>
                      <TableCell align="right">{post.views.toLocaleString()}</TableCell>
                      <TableCell align="right">{post.watchTimeHours.toLocaleString()}</TableCell>
                      <TableCell align="right">{post.subscribersGained.toLocaleString()}</TableCell>
                      <TableCell align="right">{post.likes.toLocaleString()}</TableCell>
                      <TableCell align="right">{post.comments.toLocaleString()}</TableCell>
                      <TableCell align="right">{post.shares.toLocaleString()}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: PLATFORM_COLOR }}>{totalEngagement(post).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      ) : (
        <Alert severity="info" icon={<Youtube size={20} />}>
          No YouTube content analyzed yet. Enter video URLs above and click Analyze to get started.
        </Alert>
      )}
    </Box>
  );
}
