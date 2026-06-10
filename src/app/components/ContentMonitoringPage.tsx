import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Box, Container, Typography, TextField, Button, Card, CardContent, Chip, Tabs, Tab } from '@mui/material';
import { Link as LinkIcon, Upload, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  setAnalyzedContent: (content: any[]) => void;
  setIsAnalyzing: (analyzing: boolean) => void;
}

export default function ContentMonitoringPage({ setAnalyzedContent, setIsAnalyzing }: Props) {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [singleLink, setSingleLink] = useState('');
  const [bulkLinks, setBulkLinks] = useState('');
  const [detectedLinks, setDetectedLinks] = useState<Array<{ url: string; platform: string }>>([]);

  const detectPlatform = (url: string): string => {
    if (url.includes('instagram.com')) return 'Instagram';
    if (url.includes('tiktok.com')) return 'TikTok';
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube';
    if (url.includes('facebook.com')) return 'Facebook';
    return 'Unknown';
  };

  const parseBulkLinks = (text: string) => {
    const separators = /[\n,\s]+/;
    const urls = text.split(separators).filter(url => url.trim().length > 0 && url.includes('http'));
    return urls.map(url => ({
      url: url.trim(),
      platform: detectPlatform(url.trim()),
    }));
  };

  const handleAddSingleLink = () => {
    if (!singleLink.trim()) {
      toast.error('Please enter a valid URL');
      return;
    }
    const platform = detectPlatform(singleLink);
    if (platform === 'Unknown') {
      toast.error('Unsupported platform. Please use Instagram, TikTok, YouTube, or Facebook links.');
      return;
    }
    setDetectedLinks([...detectedLinks, { url: singleLink, platform }]);
    setSingleLink('');
    toast.success(`Added ${platform} link`);
  };

  const handleParseBulkLinks = () => {
    if (!bulkLinks.trim()) {
      toast.error('Please paste some URLs');
      return;
    }
    const parsed = parseBulkLinks(bulkLinks);
    if (parsed.length === 0) {
      toast.error('No valid URLs found');
      return;
    }
    setDetectedLinks([...detectedLinks, ...parsed]);
    setBulkLinks('');
    toast.success(`Added ${parsed.length} links`);
  };

  const handleAnalyze = () => {
    if (detectedLinks.length === 0) {
      toast.error('Please add at least one link to analyze');
      return;
    }

    const mockData = detectedLinks.map((link, index) => ({
      id: index + 1,
      platform: link.platform,
      thumbnail: `https://images.unsplash.com/photo-${1600000000000 + index}?w=200&h=200&fit=crop`,
      title: `${link.platform} Post ${index + 1}`,
      link: link.url,
      likes: Math.floor(Math.random() * 10000) + 100,
      comments: Math.floor(Math.random() * 1000) + 10,
      shares: Math.floor(Math.random() * 500) + 5,
      reposts: Math.floor(Math.random() * 300) + 2,
      saves: Math.floor(Math.random() * 800) + 10,
      views: Math.floor(Math.random() * 100000) + 1000,
      reach: Math.floor(Math.random() * 80000) + 800,
    }));

    setAnalyzedContent(mockData);
    setIsAnalyzing(true);
    navigate('/analyzing');
  };

  const handleClearAll = () => {
    setDetectedLinks([]);
    setSingleLink('');
    setBulkLinks('');
    toast.info('All links cleared');
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 6 }}>
      <Container maxWidth="lg">
        <Box sx={{ mb: 6 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
            Add Content to Monitor
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Add social media content URLs to analyze engagement metrics across platforms
          </Typography>
        </Box>

        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 3 }}>
              <Tab label="Single Link Input" />
              <Tab label="Bulk Link Input" />
            </Tabs>

            {tabValue === 0 ? (
              <Box>
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <TextField
                    fullWidth
                    placeholder="https://instagram.com/post/..."
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
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Paste a single content URL from Instagram, TikTok, YouTube, or Facebook
                </Typography>
              </Box>
            ) : (
              <Box>
                <TextField
                  fullWidth
                  multiline
                  rows={8}
                  placeholder="Paste multiple URLs here (separated by new lines, commas, or spaces)&#10;&#10;https://instagram.com/post1&#10;https://tiktok.com/video1&#10;https://youtube.com/watch1"
                  value={bulkLinks}
                  onChange={(e) => setBulkLinks(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button variant="contained" onClick={handleParseBulkLinks} startIcon={<Upload size={18} />}>
                    Parse Links
                  </Button>
                  <Typography variant="caption" sx={{ color: 'text.secondary', alignSelf: 'center' }}>
                    Supports separators: Enter, Comma (,), Space
                  </Typography>
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>

        {detectedLinks.length > 0 && (
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Detected Links ({detectedLinks.length})
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                {detectedLinks.map((link, index) => (
                  <Chip
                    key={index}
                    label={`${link.platform}: ${link.url.substring(0, 40)}...`}
                    onDelete={() => setDetectedLinks(detectedLinks.filter((_, i) => i !== index))}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button variant="contained" size="large" onClick={handleAnalyze}>
                  Analyze Engagement
                </Button>
                <Button variant="outlined" size="large" onClick={handleClearAll} startIcon={<Trash2 size={18} />}>
                  Clear All
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}

        {detectedLinks.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <LinkIcon size={64} color="#cbd5e1" />
            <Typography variant="h6" sx={{ mt: 2, color: 'text.secondary' }}>
              No links added yet
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Add some content URLs to get started
            </Typography>
          </Box>
        )}
      </Container>
    </Box>
  );
}
