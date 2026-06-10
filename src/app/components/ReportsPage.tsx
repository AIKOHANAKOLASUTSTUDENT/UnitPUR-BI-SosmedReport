import { Box, Card, CardContent, Typography, Grid, Chip, Button } from '@mui/material';
import { FileText, Calendar, TrendingUp, Download } from 'lucide-react';

export default function ReportsPage() {
  const reports = [
    {
      title: 'Weekly Engagement Report',
      date: 'June 1-7, 2026',
      status: 'Ready',
      color: '#10b981',
    },
    {
      title: 'Monthly Performance Summary',
      date: 'May 2026',
      status: 'Ready',
      color: '#3b82f6',
    },
    {
      title: 'Platform Comparison Report',
      date: 'Last 30 Days',
      status: 'Ready',
      color: '#f59e0b',
    },
    {
      title: 'Top Content Analysis',
      date: 'Last Quarter',
      status: 'Pending',
      color: '#8b5cf6',
    },
  ];

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
        Reports
      </Typography>
      <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4 }}>
        View and download your engagement reports
      </Typography>

      <Grid container spacing={3}>
        {reports.map((report, index) => (
          <Grid item xs={12} md={6} key={index}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      bgcolor: `${report.color}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FileText size={24} color={report.color} />
                  </Box>
                  <Chip
                    label={report.status}
                    size="small"
                    color={report.status === 'Ready' ? 'success' : 'warning'}
                  />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  {report.title}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Calendar size={16} color="#94a3b8" />
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {report.date}
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  startIcon={<Download size={18} />}
                  disabled={report.status === 'Pending'}
                  fullWidth
                >
                  Download Report
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <TrendingUp size={24} color="#3b82f6" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Report Insights
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            Your engagement has increased by 23% compared to last month. Instagram and TikTok are your
            top-performing platforms.
          </Typography>
          <Button variant="outlined">View Detailed Insights</Button>
        </CardContent>
      </Card>
    </Box>
  );
}
