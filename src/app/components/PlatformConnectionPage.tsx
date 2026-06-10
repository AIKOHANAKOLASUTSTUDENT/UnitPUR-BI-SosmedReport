import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, Button, Box, Typography, Container, Switch } from '@mui/material';
import { CheckCircle, Circle } from 'lucide-react';
import { toast } from 'sonner';

interface Platform {
  id: string;
  name: string;
  icon: string;
  color: string;
}

const platforms: Platform[] = [
  { id: 'instagram', name: 'Instagram', icon: '📷', color: '#E4405F' },
  { id: 'tiktok', name: 'TikTok', icon: '🎵', color: '#000000' },
  { id: 'youtube', name: 'YouTube', icon: '📺', color: '#FF0000' },
  { id: 'facebook', name: 'Facebook', icon: '📘', color: '#1877F2' },
];

interface Props {
  connectedPlatforms: string[];
  setConnectedPlatforms: (platforms: string[]) => void;
}

export default function PlatformConnectionPage({ connectedPlatforms, setConnectedPlatforms }: Props) {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);

  const handleConnect = (platformId: string) => {
    if (connectedPlatforms.includes(platformId)) {
      setConnectedPlatforms(connectedPlatforms.filter(p => p !== platformId));
      toast.error(`Disconnected from ${platforms.find(p => p.id === platformId)?.name}`);
    } else {
      setConnectedPlatforms([...connectedPlatforms, platformId]);
      toast.success(`Connected to ${platforms.find(p => p.id === platformId)?.name}`);
    }
  };

  const handleContinue = () => {
    if (connectedPlatforms.length === 0) {
      toast.error('Please connect at least one platform to continue');
      return;
    }
    navigate('/content-monitoring');
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 8 }}>
      <Container maxWidth="lg">
        <Box sx={{ position: 'absolute', top: 20, right: 20, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2">Dark Mode</Typography>
          <Switch checked={darkMode} onChange={(e) => setDarkMode(e.target.checked)} />
        </Box>

        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main', mb: 2 }}>
            Social Media Engagement Report Generator
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
            Connect Your Social Media Accounts
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 600, mx: 'auto' }}>
            To retrieve engagement and insight data, we need access to your social media accounts.
            Select the platforms you want to monitor below.
          </Typography>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 3, mb: 6 }}>
          {platforms.map((platform) => {
            const isConnected = connectedPlatforms.includes(platform.id);
            return (
              <Card
                key={platform.id}
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  border: isConnected ? '2px solid' : '2px solid transparent',
                  borderColor: isConnected ? 'primary.main' : 'transparent',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  },
                }}
              >
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                  <Box sx={{ fontSize: 48, mb: 2 }}>{platform.icon}</Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    {platform.name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 2 }}>
                    {isConnected ? (
                      <>
                        <CheckCircle size={20} color="#10b981" />
                        <Typography variant="body2" sx={{ color: '#10b981', fontWeight: 600 }}>
                          Connected
                        </Typography>
                      </>
                    ) : (
                      <>
                        <Circle size={20} color="#9ca3af" />
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          Not Connected
                        </Typography>
                      </>
                    )}
                  </Box>
                  <Button
                    variant={isConnected ? 'outlined' : 'contained'}
                    onClick={() => handleConnect(platform.id)}
                    fullWidth
                  >
                    {isConnected ? 'Disconnect' : 'Connect'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </Box>

        <Box sx={{ textAlign: 'center' }}>
          <Button
            variant="contained"
            size="large"
            onClick={handleContinue}
            disabled={connectedPlatforms.length === 0}
            sx={{ px: 6, py: 1.5 }}
          >
            Continue to Dashboard
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
