import { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Tabs,
  Tab,
  Grid,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
} from '@mui/material';
import { Link as LinkIcon, Upload, Trash2, Heart, MessageCircle, Share2, Eye, Users, TrendingUp, Download } from 'lucide-react';
import { toast } from 'sonner';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Props {
  data: any[];
  setData: (data: any[]) => void;
  isConnected: boolean;
  onConnect: () => void;
}

export default function YouTubeWorkspace({ data, setData, isConnected, onConnect }: Props) {
  const [tabValue, setTabValue] = useState(0);
  const [singleLink, setSingleLink] = useState('');
  const [bulkLinks, setBulkLinks] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleConnect = () => {
    onConnect();
    toast.success('YouTube account connected successfully!');
  };

  const handleAddSingleLink = () => {
    if (!singleLink.trim() || (!singleLink.includes('youtube.com') && !singleLink.includes('youtu.be'))) {
      toast.error('Please enter a valid YouTube URL');
      return;
    }
    analyzeSingleLink(singleLink);
    setSingleLink('');
  };

  const handleAddBulkLinks = () => {
    if (!bulkLinks.trim()) {
      toast.error('Please paste some YouTube URLs');
      return;
    }
    const urls = bulkLinks.split(/[\n,\s]+/).filter(url => url.includes('youtube.com') || url.includes('youtu.be'));
    if (urls.length === 0) {
      toast.error('No valid YouTube URLs found');
      return;
    }
    analyzeMultipleLinks(urls);
    setBulkLinks('');
  };

  const analyzeSingleLink = (url: string) => {
    const newVideo = {
      id: data.length + 1,
      thumbnail: `https://images.unsplash.com/photo-${1600000000000 + data.length}?w=100&h=100&fit=crop`,
      title: `Video ${data.length + 1}`,
      url: url,
      likes: Math.floor(Math.random() * 50000) + 500,
      comments: Math.floor(Math.random() * 5000) + 50,
      shares: Math.floor(Math.random() * 2000) + 20,
      views: Math.floor(Math.random() * 1000000) + 10000,
      reach: Math.floor(Math.random() * 800000) + 8000,
      uploadDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    };
    setData([...data, newVideo]);
    toast.success('YouTube video analyzed!');
  };

  const analyzeMultipleLinks = (urls: string[]) => {
    const newVideos = urls.map((url, index) => ({
      id: data.length + index + 1,
      thumbnail: `https://images.unsplash.com/photo-${1600000000000 + data.length + index}?w=100&h=100&fit=crop`,
      title: `Video ${data.length + index + 1}`,
      url: url,
      likes: Math.floor(Math.random() * 50000) + 500,
      comments: Math.floor(Math.random() * 5000) + 50,
      shares: Math.floor(Math.random() * 2000) + 20,
      views: Math.floor(Math.random() * 1000000) + 10000,
      reach: Math.floor(Math.random() * 800000) + 8000,
      uploadDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    }));
    setData([...data, ...newVideos]);
    toast.success(`${urls.length} YouTube videos analyzed!`);
  };

  const kpis = useMemo(() => {
    return {
      totalVideos: data.length,
      totalLikes: data.reduce((sum, item) => sum + item.likes, 0),
      totalComments: data.reduce((sum, item) => sum + item.comments, 0),
      totalShares: data.reduce((sum, item) => sum + item.shares, 0),
      totalViews: data.reduce((sum, item) => sum + item.views, 0),
      totalReach: data.reduce((sum, item) => sum + item.reach, 0),
      totalEngagement: data.reduce((sum, item) => sum + item.likes + item.comments + item.shares + item.views + item.reach, 0),
    };
  }, [data]);

  const kpiCards = [
    { title: 'Total Videos', value: kpis.totalVideos, icon: LinkIcon, color: '#FF0000' },
    { title: 'Likes', value: kpis.totalLikes, icon: Heart, color: '#ef4444' },
    { title: 'Comments', value: kpis.totalComments, icon: MessageCircle, color: '#3b82f6' },
    { title: 'Shares', value: kpis.totalShares, icon: Share2, color: '#10b981' },
    { title: 'Views', value: kpis.totalViews, icon: Eye, color: '#8b5cf6' },
    { title: 'Reach', value: kpis.totalReach, icon: Users, color: '#06b6d4' },
    { title: 'Total Engagement', value: kpis.totalEngagement, icon: TrendingUp, color: '#ec4899' },
  ];

  const handleExport = (format: string) => {
    if (data.length === 0) {
      toast.error('No data to export');
      return;
    }
    toast.success(`Exporting YouTube data as ${format}...`);
  };

  if (!isConnected) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Box
          sx={{
            width: 120,
            height: 120,
            borderRadius: 3,
            bgcolor: '#FF000015',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 64,
            mx: 'auto',
            mb: 3,
          }}
        >
          📺
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
          Connect Your YouTube Account
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4, maxWidth: 500, mx: 'auto' }}>
          To start analyzing your YouTube engagement data, please connect your YouTube account first.
        </Typography>
        <Button variant="contained" size="large" onClick={handleConnect} sx={{ px: 6, py: 1.5, bgcolor: '#FF0000', '&:hover': { bgcolor: '#FF0000' } }}>
          Connect YouTube Account
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
        📺 YouTube Engagement Report
      </Typography>
      <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4 }}>
        Analyze and track your YouTube video performance
      </Typography>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
            Add YouTube Content
          </Typography>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 3 }}>
            <Tab label="Single Input" />
            <Tab label="Bulk Input" />
          </Tabs>

          {tabValue === 0 ? (
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                placeholder="https://youtube.com/watch?v=..."
                value={singleLink}
                onChange={(e) => setSingleLink(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddSingleLink()}
                InputProps={{
                  startAdornment: <LinkIcon size={20} style={{ marginRight: 8, color: '#9ca3af' }} />,
                }}
              />
              <Button variant="contained" onClick={handleAddSingleLink}>
                Add
              </Button>
            </Box>
          ) : (
            <Box>
              <TextField
                fullWidth
                multiline
                rows={6}
                placeholder="Paste YouTube URLs (separated by new lines, commas, or spaces)"
                value={bulkLinks}
                onChange={(e) => setBulkLinks(e.target.value)}
                sx={{ mb: 2 }}
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button variant="contained" onClick={handleAddBulkLinks} startIcon={<Upload size={18} />}>
                  Analyze Content
                </Button>
                <Button variant="outlined" onClick={() => setBulkLinks('')} startIcon={<Trash2 size={18} />}>
                  Clear
                </Button>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      <Grid container spacing={2} sx={{ mb: 4 }}>
        {kpiCards.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card sx={{ borderTop: `3px solid ${kpi.color}` }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: 13 }}>
                      {kpi.title}
                    </Typography>
                    <Avatar sx={{ bgcolor: `${kpi.color}20`, width: 32, height: 32 }}>
                      <Icon size={16} color={kpi.color} />
                    </Avatar>
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: kpi.color }}>
                    {kpi.value.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
            YouTube Report Table
          </Typography>
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
            <Table>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Thumbnail</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Video Title</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Video URL</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Likes</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Comments</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Shares</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Views</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Reach</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Total Engagement</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Upload Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 8 }}>
                      <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                        No YouTube videos analyzed yet. Add some URLs above to get started.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => {
                    const totalEngagement = row.likes + row.comments + row.shares + row.views + row.reach;
                    return (
                      <TableRow key={row.id} hover>
                        <TableCell>
                          <Avatar variant="rounded" src={row.thumbnail} sx={{ width: 50, height: 50 }} />
                        </TableCell>
                        <TableCell>{row.title}</TableCell>
                        <TableCell>
                          <a href={row.url} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb' }}>
                            View Video
                          </a>
                        </TableCell>
                        <TableCell align="right">{row.likes.toLocaleString()}</TableCell>
                        <TableCell align="right">{row.comments.toLocaleString()}</TableCell>
                        <TableCell align="right">{row.shares.toLocaleString()}</TableCell>
                        <TableCell align="right">{row.views.toLocaleString()}</TableCell>
                        <TableCell align="right">{row.reach.toLocaleString()}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, color: '#FF0000' }}>
                          {totalEngagement.toLocaleString()}
                        </TableCell>
                        <TableCell>{row.uploadDate}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
          {data.length > 0 && (
            <TablePagination
              component="div"
              count={data.length}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
            />
          )}
        </CardContent>
      </Card>

      {data.length > 0 && (
        <>
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                YouTube Analytics
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                    View Trend
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data.slice(0, 10).map((item, i) => ({ name: `Video ${i+1}`, views: item.views }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="views" fill="#FF0000" name="Views" />
                    </BarChart>
                  </ResponsiveContainer>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                    Engagement Trend
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={data.slice(0, 10).map((item, i) => ({ name: `Video ${i+1}`, engagement: item.likes + item.comments }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="engagement" stroke="#FF0000" strokeWidth={2} name="Engagement" />
                    </LineChart>
                  </ResponsiveContainer>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Export YouTube Report
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<Download size={18} />}
                    onClick={() => handleExport('Excel')}
                    sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#10b981' } }}
                  >
                    Export YouTube Excel
                  </Button>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<Download size={18} />}
                    onClick={() => handleExport('Spreadsheet')}
                    sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#3b82f6' } }}
                  >
                    Export YouTube Spreadsheet
                  </Button>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<Download size={18} />}
                    onClick={() => handleExport('Report')}
                    sx={{ bgcolor: '#f59e0b', '&:hover': { bgcolor: '#f59e0b' } }}
                  >
                    Download YouTube Report
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
}
