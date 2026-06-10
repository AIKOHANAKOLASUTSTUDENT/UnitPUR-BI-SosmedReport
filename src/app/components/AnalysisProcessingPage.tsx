import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Box, Container, Typography, LinearProgress, Paper } from '@mui/material';
import { motion } from 'motion/react';
import { Database, TrendingUp, BarChart3, FileCheck } from 'lucide-react';

const steps = [
  { icon: Database, label: 'Retrieving content data...', duration: 1500 },
  { icon: TrendingUp, label: 'Fetching engagement metrics...', duration: 1500 },
  { icon: BarChart3, label: 'Calculating total engagement...', duration: 1500 },
  { icon: FileCheck, label: 'Preparing report...', duration: 1500 },
];

export default function AnalysisProcessingPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 1500);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          clearInterval(stepInterval);
          setTimeout(() => navigate('/dashboard'), 500);
          return 100;
        }
        return prev + 2;
      });
    }, 120);

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
    };
  }, [navigate]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Container maxWidth="md">
        <Paper
          elevation={0}
          sx={{
            p: 6,
            textAlign: 'center',
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Box sx={{ mb: 4 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
                Analyzing Your Content
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                Please wait while we process your engagement data
              </Typography>
            </Box>

            <Box sx={{ mb: 4 }}>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  mb: 1,
                }}
              />
              <Typography variant="h6" sx={{ color: 'primary.main' }}>
                {progress}%
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;

                return (
                  <motion.div
                    key={index}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{
                      x: 0,
                      opacity: isActive || isCompleted ? 1 : 0.3,
                    }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        p: 2,
                        borderRadius: 2,
                        bgcolor: isActive ? 'primary.main' : isCompleted ? '#e0f2fe' : 'transparent',
                        color: isActive ? 'white' : 'text.primary',
                        transition: 'all 0.3s',
                      }}
                    >
                      <Icon
                        size={24}
                        color={isActive ? 'white' : isCompleted ? '#2563eb' : '#94a3b8'}
                      />
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: isActive ? 600 : 400,
                        }}
                      >
                        {step.label}
                      </Typography>
                    </Box>
                  </motion.div>
                );
              })}
            </Box>
          </motion.div>
        </Paper>
      </Container>
    </Box>
  );
}
