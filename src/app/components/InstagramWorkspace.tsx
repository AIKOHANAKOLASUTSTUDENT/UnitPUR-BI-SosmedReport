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
  Chip,
} from '@mui/material';
import { Link as LinkIcon, Upload, Trash2, Heart, MessageCircle, Share2, Bookmark, Eye, Users, TrendingUp, Download } from 'lucide-react';
import { toast } from 'sonner';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Props {
  data: any[];
  setData: (data: any[]) => void;
  isConnected: boolean;
  onConnect: () => void;
}

export default function InstagramWorkspace({ data, setData, isConnected, onConnect }: Props) {
  const [tabValue, setTabValue] = useState(0);
  const [singleLink, setSingleLink] = useState('');
  const [bulkLinks, setBulkLinks] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleConnect = () => {
    onConnect();
    toast.success('Instagram account connected successfully!');
  };

  const handleAddSingleLink = () => {
    if (!singleLink.trim()) {
      toast.error('Please enter a valid Instagram URL');
      return;
    }
    if (!singleLink.includes('instagram.com')) {
      toast.error('Please enter a valid Instagram URL');
      return;
    }
    analyzeSingleLink(singleLink);
    setSingleLink('');
  };

  const handleAddBulkLinks = () => {
    if (!bulkLinks.trim()) {
      toast.error('Please paste some Instagram URLs');
      return;
    }
    const urls = bulkLinks.split(/[\n,\s]+/).filter(url => url.includes('instagram.com'));
    if (urls.length === 0) {
      toast.error('No valid Instagram URLs found');
      return;
    }
    analyzeMultipleLinks(urls);
    setBulkLinks('');
  };

  const analyzeSingleLink = (url: string) => {
    const newPost = {
      id: data.length + 1,
      thumbnail: `https://images.unsplash.com/photo-${1600000000000 + data.length}?w=100&h=100&fit=crop`,
      url: url,
      postType: Math.random() > 0.5 ? 'Post' : 'Reel',
      likes: Math.floor(Math.random() * 50000) + 500,
      comments: Math.floor(Math.random() * 5000) + 50,
      shares: Math.floor(Math.random() * 1000) + 10,
      saves: Math.floor(Math.random() * 3000) + 20,
      views: Math.floor(Math.random() * 200000) + 2000,
      reach: Math.floor(Math.random() * 150000) + 1500,
      datePublished: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    };
    setData([...data, newPost]);
    toast.success('Instagram content analyzed!');
  };

  const analyzeMultipleLinks = (urls: string[]) => {
    const newPosts = urls.map((url, index) => ({
      id: data.length + index + 1,
      thumbnail: `https://images.unsplash.com/photo-${1600000000000 + data.length + index}?w=100&h=100&fit=crop`,
      url: url,
      postType: Math.random() > 0.5 ? 'Post' : 'Reel',
      likes: Math.floor(Math.random() * 50000) + 500,
      comments: Math.floor(Math.random() * 5000) + 50,
      shares: Math.floor(Math.random() * 1000) + 10,
      saves: Math.floor(Math.random() * 3000) + 20,
      views: Math.floor(Math.random() * 200000) + 2000,
      reach: Math.floor(Math.random() * 150000) + 1500,
      datePublished: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    }));
    setData([...data, ...newPosts]);
    toast.success(`${urls.length} Instagram posts analyzed!`);
  };

  const kpis = useMemo(() => {
    return {
      totalPosts: data.length,
      totalLikes: data.reduce((sum, item) => sum + item.likes, 0),
      totalComments: data.reduce((sum, item) => sum + item.comments, 0),
      totalShares: data.reduce((sum, item) => sum + item.shares, 0),
      totalSaves: data.reduce((sum, item) => sum + item.saves, 0),
      totalViews: data.reduce((sum, item) => sum + item.views, 0),
      totalReach: data.reduce((sum, item) => sum + item.reach, 0),
      totalEngagement: data.reduce((sum, item) => sum + item.likes + item.comments + item.shares + item.saves + item.views + item.reach, 0),
    };
  }, [data]);

  const kpiCards = [
    { title: 'Total Posts', value: kpis.totalPosts, icon: LinkIcon, color: '#E4405F' },
    { title: 'Total Likes', value: kpis.totalLikes, icon: Heart, color: '#ef4444' },
    { title: 'Total Comments', value: kpis.totalComments, icon: MessageCircle, color: '#3b82f6' },
    { title: 'Total Shares', value: kpis.totalShares, icon: Share2, color: '#10b981' },
    { title: 'Total Saves', value: kpis.totalSaves, icon: Bookmark, color: '#f59e0b' },
    { title: 'Total Views', value: kpis.totalViews, icon: Eye, color: '#8b5cf6' },
    { title: 'Total Reach', value: kpis.totalReach, icon: Users, color: '#06b6d4' },
    { title: 'Total Engagement', value: kpis.totalEngagement, icon: TrendingUp, color: '#ec4899' },
  ];

  const engagementTrend = useMemo(() => {
    return data.slice(0, 10).map((item, index) => ({
      name: `Post ${index + 1}`,
      engagement: item.likes + item.comments + item.shares + item.saves,
    }));
  }, [data]);

  const handleExport = (format: string) => {
    if (data.length === 0) {
      toast.error('No data to export');
      return;
    }
    toast.success(`Exporting Instagram data as ${format}...`);
  };

  if (!isConnected) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Box
          sx={{
            width: 120,
            height: 120,
            borderRadius: 3,
            bgcolor: '#E4405F15',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 64,
            mx: 'auto',
            mb: 3,
          }}
        >
          📷
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
          Connect Your Instagram Account
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4, maxWidth: 500, mx: 'auto' }}>
          To start analyzing your Instagram engagement data, please connect your Instagram account first.
        </Typography>
        <Button variant="contained" size="large" onClick={handleConnect} sx={{ px: 6, py: 1.5, bgcolor: '#E4405F', '&:hover': { bgcolor: '#E4405F' } }}>
          Connect Instagram Account
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
        📷 Instagram Engagement Report
      </Typography>
      <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4 }}>
        Analyze and track your Instagram content performance
      </Typography>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
            Add Instagram Content
          </Typography>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 3 }}>
            <Tab label="Single Input" />
            <Tab label="Bulk Input" />
          </Tabs>

          {tabValue === 0 ? (
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                placeholder="https://instagram.com/p/..."
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
                placeholder="Paste Instagram URLs (separated by new lines, commas, or spaces)"
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
            Instagram Report Table
          </Typography>
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
            <Table>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Thumbnail</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Content URL</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Post Type</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Likes</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Comments</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Shares</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Saves</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Views</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Reach</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Total Engagement</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Date Published</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} align="center" sx={{ py: 8 }}>
                      <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                        No Instagram posts analyzed yet. Add some URLs above to get started.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => {
                    const totalEngagement = row.likes + row.comments + row.shares + row.saves + row.views + row.reach;
                    return (
                      <TableRow key={row.id} hover>
                        <TableCell>
                          <Avatar variant="rounded" src={row.thumbnail} sx={{ width: 50, height: 50 }} />
                        </TableCell>
                        <TableCell>
                          <a href={row.url} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb' }}>
                            View Post
                          </a>
                        </TableCell>
                        <TableCell>
                          <Chip label={row.postType} size="small" color="primary" variant="outlined" />
                        </TableCell>
                        <TableCell align="right">{row.likes.toLocaleString()}</TableCell>
                        <TableCell align="right">{row.comments.toLocaleString()}</TableCell>
                        <TableCell align="right">{row.shares.toLocaleString()}</TableCell>
                        <TableCell align="right">{row.saves.toLocaleString()}</TableCell>
                        <TableCell align="right">{row.views.toLocaleString()}</TableCell>
                        <TableCell align="right">{row.reach.toLocaleString()}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, color: '#E4405F' }}>
                          {totalEngagement.toLocaleString()}
                        </TableCell>
                        <TableCell>{row.datePublished}</TableCell>
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
                Instagram Analytics
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                    Engagement Trend
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={engagementTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="engagement" fill="#E4405F" name="Total Engagement" />
                    </BarChart>
                  </ResponsiveContainer>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                    Reach Trend
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={data.slice(0, 10).map((item, i) => ({ name: `Post ${i+1}`, reach: item.reach }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="reach" stroke="#E4405F" strokeWidth={2} name="Reach" />
                    </LineChart>
                  </ResponsiveContainer>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Export Instagram Report
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
                    Export Instagram Excel
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
                    Export Instagram Spreadsheet
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
                    Download Instagram Report
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
