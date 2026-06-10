import { useState } from 'react';
import { useOutletContext } from 'react-router';
import {
  Box, Card, CardContent, Typography, Button, Tabs, Tab,
  Paper, Checkbox, List, ListItem, ListItemIcon, ListItemText,
  Divider, Alert, Chip,
} from '@mui/material';
import { FileSpreadsheet, Table, Download, Instagram, Music2, Youtube, Facebook } from 'lucide-react';
import { toast } from 'sonner';
import type { OutletContextType } from '../types';
import { exportPlatformData, getFriendlyErrorMessage } from '../lib/platformApi';

const platforms = [
  {
    key: 'instagram',
    label: 'Instagram',
    icon: Instagram,
    color: '#E1306C',
    fields: ['link', 'contentType', 'caption', 'likes', 'comments', 'shares', 'saves', 'views', 'reach', 'totalEngagement', 'analyzedAt'],
    fieldLabels: {
      link: 'Link', contentType: 'Content Type', caption: 'Caption',
      likes: 'Likes', comments: 'Comments', saves: 'Saves',
      shares: 'Shares', views: 'Views', reach: 'Reach', totalEngagement: 'Total Engagement', analyzedAt: 'Date Generated',
    },
  },
  {
    key: 'tiktok',
    label: 'TikTok',
    icon: Music2,
    color: '#fe2c55',
    fields: ['link', 'title', 'likes', 'comments', 'shares', 'saves', 'views', 'reach', 'totalEngagement', 'analyzedAt'],
    fieldLabels: {
      link: 'Link', title: 'Title', views: 'Views',
      likes: 'Likes', comments: 'Comments', shares: 'Shares', saves: 'Favorites', reach: 'Reach', totalEngagement: 'Total Engagement', analyzedAt: 'Date Generated',
    },
  },
  {
    key: 'youtube',
    label: 'YouTube',
    icon: Youtube,
    color: '#FF0000',
    fields: ['link', 'contentType', 'title', 'likes', 'comments', 'shares', 'views', 'reach', 'totalEngagement', 'analyzedAt'],
    fieldLabels: {
      link: 'Link', contentType: 'Content Type', title: 'Title',
      likes: 'Likes', comments: 'Comments', shares: 'Shares', views: 'Views', reach: 'Reach', totalEngagement: 'Total Engagement', analyzedAt: 'Date Generated',
    },
  },
  {
    key: 'facebook',
    label: 'Facebook',
    icon: Facebook,
    color: '#1877F2',
    fields: ['link', 'contentType', 'caption', 'likes', 'comments', 'shares', 'saves', 'views', 'reach', 'totalEngagement', 'analyzedAt'],
    fieldLabels: {
      link: 'Link', contentType: 'Content Type', caption: 'Caption',
      likes: 'Likes', comments: 'Comments', shares: 'Shares', saves: 'Saves', views: 'Views', reach: 'Reach', totalEngagement: 'Total Engagement', analyzedAt: 'Date Generated',
    },
  },
] as const;

export default function ExportCenterPage() {
  const ctx = useOutletContext<OutletContextType>();
  const [activeTab, setActiveTab] = useState(0);

  const platform = platforms[activeTab];
  const data =
    platform.key === 'instagram' ? ctx.instagramPosts
    : platform.key === 'tiktok' ? ctx.tiktokPosts
    : platform.key === 'youtube' ? ctx.youtubePosts
    : ctx.facebookPosts;

  const [selectedFields, setSelectedFields] = useState<Record<string, string[]>>({
    instagram: [...platforms[0].fields],
    tiktok: [...platforms[1].fields],
    youtube: [...platforms[2].fields],
    facebook: [...platforms[3].fields],
  });

  const currentSelected = selectedFields[platform.key];

  const toggleField = (field: string) => {
    setSelectedFields((prev) => ({
      ...prev,
      [platform.key]: prev[platform.key].includes(field)
        ? prev[platform.key].filter((f) => f !== field)
        : [...prev[platform.key], field],
    }));
  };

  const prepareExportData = () => {
    return data.map((item: any) => {
      const row: any = {};
      currentSelected.forEach((field) => {
        const label = (platform.fieldLabels as any)[field] || field;
        row[label] = item[field] !== undefined ? item[field] : '';
      });
      return row;
    });
  };

  const downloadFile = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleExport = async (format: 'csv' | 'xlsx') => {
    if (data.length === 0) {
      toast.error(`No ${platform.label} data to export. Please analyze some content first.`);
      return;
    }

    if (currentSelected.length === 0) {
      toast.error('Please select at least one field to export');
      return;
    }

    try {
      const blob = await exportPlatformData(platform.key, format, currentSelected);
      const timestamp = new Date().toISOString().split('T')[0];
      downloadFile(blob, `${platform.label}_Export_${timestamp}.${format}`);
      toast.success(`Downloaded ${platform.label} data as ${format.toUpperCase()} (${data.length} records)`);
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error));
    }
  };

  const exportOptions = [
    { title: 'Export to XLSX', description: 'Download as Excel spreadsheet (.xlsx)', icon: FileSpreadsheet, color: '#10b981', format: 'xlsx' as const },
    { title: 'Download CSV', description: 'Export as CSV for any data tool', icon: Download, color: '#f59e0b', format: 'csv' as const },
  ];

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>Export Center</Typography>
      <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>
        Export engagement data per platform in your preferred format
      </Typography>

      <Tabs
        value={activeTab}
        onChange={(_, v) => setActiveTab(v)}
        sx={{ mb: 3, '& .MuiTabs-indicator': { bgcolor: platforms[activeTab].color } }}
      >
        {platforms.map((p, i) => {
          const Icon = p.icon;
          const count = (
            p.key === 'instagram' ? ctx.instagramPosts
            : p.key === 'tiktok' ? ctx.tiktokPosts
            : p.key === 'youtube' ? ctx.youtubePosts
            : ctx.facebookPosts
          ).length;
          return (
            <Tab
              key={p.key}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Icon size={16} color={activeTab === i ? p.color : undefined} />
                  {p.label}
                  {count > 0 && <Chip label={count} size="small" sx={{ height: 18, fontSize: 10, bgcolor: `${p.color}20`, color: p.color }} />}
                </Box>
              }
              sx={{ textTransform: 'none', fontWeight: activeTab === i ? 600 : 400 }}
            />
          );
        })}
      </Tabs>

      {data.length === 0 ? (
        <Alert severity="warning" sx={{ mb: 3 }}>
          No {platform.label} data available. Go to the {platform.label} menu to connect your account and analyze content first.
        </Alert>
      ) : (
        <Alert severity="success" sx={{ mb: 3 }}>
          {data.length} {platform.label} item(s) ready to export.
        </Alert>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 3 }}>
        <Box>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>Export Options</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                {exportOptions.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <Paper
                      key={opt.format}
                      elevation={0}
                      sx={{
                        p: 3, textAlign: 'center', border: '2px solid', borderColor: 'divider', borderRadius: 2,
                        transition: 'all 0.2s', cursor: 'pointer',
                        '&:hover': { borderColor: opt.color, transform: 'translateY(-2px)', boxShadow: 3 },
                      }}
                    >
                      <Box sx={{ width: 52, height: 52, borderRadius: '50%', bgcolor: `${opt.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                        <Icon size={26} color={opt.color} />
                      </Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>{opt.title}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>{opt.description}</Typography>
                      <Button
                        variant="contained" fullWidth size="small"
                        onClick={() => handleExport(opt.format)}
                        sx={{ bgcolor: opt.color, '&:hover': { bgcolor: opt.color } }}
                      >
                        Export
                      </Button>
                    </Paper>
                  );
                })}
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Export Summary</Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                <Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>Total Records</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>{data.length}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>Selected Fields</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>{currentSelected.length}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>Platform</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: platform.color }}>{platform.label}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Card sx={{ height: 'fit-content' }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>Select Fields</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
              Choose which {platform.label} fields to include in the export
            </Typography>
            <Divider sx={{ mb: 1 }} />
            <List dense>
              {platform.fields.map((field) => (
                <ListItem key={field} disablePadding>
                  <ListItemIcon>
                    <Checkbox
                      edge="start"
                      checked={currentSelected.includes(field)}
                      onChange={() => toggleField(field)}
                      size="small"
                      sx={{ '&.Mui-checked': { color: platform.color } }}
                    />
                  </ListItemIcon>
                  <ListItemText primary={(platform.fieldLabels as any)[field]} />
                </ListItem>
              ))}
            </List>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="outlined" size="small" fullWidth onClick={() => setSelectedFields((p) => ({ ...p, [platform.key]: [...platform.fields] }))}>
                All
              </Button>
              <Button variant="outlined" size="small" fullWidth onClick={() => setSelectedFields((p) => ({ ...p, [platform.key]: [] }))}>
                Clear
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
