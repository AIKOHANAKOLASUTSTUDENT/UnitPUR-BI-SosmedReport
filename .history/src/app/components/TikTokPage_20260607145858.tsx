import { useState } from 'react';
import { useOutletContext } from 'react-router';
import {
  Box, Card, CardContent, Typography, Button, TextField,
  IconButton, Chip, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Avatar, LinearProgress, Alert,
} from '@mui/material';
import { Music2, Plus, Trash2, BarChart3, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import type { OutletContextType } from '../types';
import { calculateTotalEngagement, parseContentUrls } from '../lib/content';
import {
  analyzePlatformContent,
  disconnectPlatform,
  getFriendlyErrorMessage,
  startPlatformConnection,
} from '../lib/platformApi';

const PLATFORM_COLOR = '#010101';
const PLATFORM_ACCENT = '#fe2c55';

export default function TikTokPage() {
  const {
    platformAuth,
    tiktokPosts,
    platformConnections,
    refreshBootstrap,
  } =
    useOutletContext<OutletContextType>();

  const [urlInputs, setUrlInputs] = useState(['']);
  const [analyzing, setAnalyzing] = useState(false);
  const [bulkInput, setBulkInput] = useState('');
  const [bulkMode, setBulkMode] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      await startPlatformConnection('tiktok');
      await refreshBootstrap();
      toast.success('Connected to TikTok successfully.');
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error));
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectPlatform('tiktok');
      await refreshBootstrap();
      toast.info('Disconnected from TikTok');
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error));
    }
  };

  const addUrlRow = () => setUrlInputs([...urlInputs, '']);
  const removeUrlRow = (index: number) => setUrlInputs(urlInputs.filter((_, i) => i !== index));
  const updateUrl = (index: number, value: string) => {
    const updated = [...urlInputs];
    updated[index] = value;
    setUrlInputs(updated);
  };

  const parseUrls = (text: string): string[] => {
    return parseContentUrls(text);
  };

  const detectedUrls = parseUrls(bulkInput);

  const handleAnalyze = async () => {
    let validUrls: string[] = [];

    if (bulkMode) {
      validUrls = detectedUrls;
      if (!validUrls.length) {
        toast.error('Please enter at least one URL');
        return;
      }
    } else {
      validUrls = urlInputs.filter((u) => u.trim());
      if (!validUrls.length) {
        toast.error('Please enter at least one URL');
        return;
      }
    }

    setAnalyzing(true);
    try {
      const response = await analyzePlatformContent('tiktok', validUrls.map((url) => ({ url })));
      await refreshBootstrap();

      if (bulkMode) {
        setBulkInput('');
      } else {
        setUrlInputs(['']);
      }

      toast.success(response.message);
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error));
    } finally {
      setAnalyzing(false);
    }
  };

  const totalEngagement = (p: { likes: number; comments: number; shares: number; saves?: number; views?: number; reach?: number }) =>
    calculateTotalEngagement(p);

  const connectedAccount = platformConnections.tiktok;

  if (!platformAuth.tiktok) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Card sx={{ maxWidth: 420, width: '100%', textAlign: 'center', border: `2px solid #fe2c5530` }}>
          <CardContent sx={{ p: 5 }}>
            <Box sx={{ width: 80, height: 80, borderRadius: '20px', bgcolor: '#010101', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3, position: 'relative' }}>
              <Music2 size={40} color="white" />
              <Box sx={{ position: 'absolute', top: 8, right: 8, width: 16, height: 16, borderRadius: '50%', bgcolor: '#fe2c55' }} />
              <Box sx={{ position: 'absolute', top: 8, right: 16, width: 16, height: 16, borderRadius: '50%', bgcolor: '#25f4ee', opacity: 0.8 }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>Connect TikTok</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4 }}>
              Connect a TikTok Business account to retrieve real engagement metrics from the official TikTok Developer API.
            </Typography>
            <Button
              variant="contained"
              size="large"
              fullWidth
              startIcon={<LogIn size={18} />}
              onClick={handleConnect}
              disabled={connecting}
              sx={{ bgcolor: PLATFORM_COLOR, '&:hover': { bgcolor: '#222' }, py: 1.5 }}
            >
              {connecting ? 'Connecting...' : 'Connect TikTok'}
            </Button>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 2 }}>
              Authentication is handled through OAuth and tokens are stored securely on the backend.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <Box sx={{ width: 48, height: 48, borderRadius: '12px', bgcolor: '#010101', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Music2 size={28} color="white" />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>TikTok Analysis</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {connectedAccount?.accountName || 'Connected account'} &nbsp;
            <Chip label="Connected" size="small" sx={{ bgcolor: '#d1fae5', color: '#065f46' }} />
          </Typography>
        </Box>
        <Button variant="outlined" color="error" size="small" onClick={handleDisconnect}>Disconnect</Button>
      </Box>

      <Card sx={{ mb: 3, border: `1px solid #fe2c5530`, bgcolor: '#fff5f5' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Add TikTok Videos to Analyze</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                size="small"
                variant={!bulkMode ? 'contained' : 'outlined'}
                onClick={() => setBulkMode(false)}
                sx={!bulkMode ? { bgcolor: PLATFORM_ACCENT, '&:hover': { bgcolor: '#e0183f' } } : {}}
              >
                Single
              </Button>
              <Button
                size="small"
                variant={bulkMode ? 'contained' : 'outlined'}
                onClick={() => setBulkMode(true)}
                sx={bulkMode ? { bgcolor: PLATFORM_ACCENT, '&:hover': { bgcolor: '#e0183f' } } : {}}
              >
                Bulk
              </Button>
            </Box>
          </Box>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
            Paste TikTok video URLs. All content is video format — metrics include Views, Likes, Comments, Shares, and Saves.
          </Typography>

          {bulkMode ? (
            <Box>
              <TextField
                multiline
                rows={6}
                fullWidth
                value={bulkInput}
                onChange={(e) => setBulkInput(e.target.value)}
                placeholder="Paste multiple TikTok URLs here, separated by space, comma, or new line&#10;&#10;Example:&#10;https://www.tiktok.com/@user/video/123&#10;https://www.tiktok.com/@user/video/456, https://www.tiktok.com/@user/video/789"
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
              {urlInputs.map((url, i) => (
                <Box key={i} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
                  <TextField
                    label={`TikTok Video URL ${i + 1}`}
                    value={url}
                    onChange={(e) => updateUrl(i, e.target.value)}
                    placeholder="https://www.tiktok.com/@user/video/..."
                    sx={{ flex: 1 }}
                    size="small"
                  />
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
              sx={{ ml: 'auto', bgcolor: PLATFORM_ACCENT, '&:hover': { bgcolor: '#e0183f' } }}
            >
              {analyzing ? 'Analyzing...' : 'Analyze'}
            </Button>
          </Box>
          {analyzing && <LinearProgress sx={{ mt: 2, '& .MuiLinearProgress-bar': { bgcolor: PLATFORM_ACCENT } }} />}
        </CardContent>
      </Card>

      {tiktokPosts.length > 0 ? (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Results ({tiktokPosts.length} videos)
            </Typography>
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Thumbnail</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Link</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Views</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Likes</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Comments</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Shares</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Saves</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Engagement</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tiktokPosts.map((post) => (
                    <TableRow key={post.id} hover>
                      <TableCell><Avatar variant="rounded" src={post.thumbnail} sx={{ width: 40, height: 40 }} /></TableCell>
                      <TableCell><a href={post.link} target="_blank" rel="noopener noreferrer" style={{ color: PLATFORM_ACCENT, textDecoration: 'none', fontSize: 12 }}>View</a></TableCell>
                      <TableCell align="right">{post.views.toLocaleString()}</TableCell>
                      <TableCell align="right">{post.likes.toLocaleString()}</TableCell>
                      <TableCell align="right">{post.comments.toLocaleString()}</TableCell>
                      <TableCell align="right">{post.shares.toLocaleString()}</TableCell>
                      <TableCell align="right">{post.saves.toLocaleString()}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: PLATFORM_ACCENT }}>{totalEngagement(post).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      ) : (
        <Alert severity="info" icon={<Music2 size={20} />}>
          No TikTok videos analyzed yet. Enter video URLs above and click Analyze to get started.
        </Alert>
      )}
    </Box>
  );
}
