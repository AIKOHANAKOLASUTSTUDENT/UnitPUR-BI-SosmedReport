import { useMemo } from "react";
import { useOutletContext } from "react-router";
import { Box, Card, CardContent, Typography, Grid, Chip } from "@mui/material";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { OutletContextType } from "../types";
import { calculateTotalEngagement } from "../lib/content";

const COLORS = ["#E1306C", "#fe2c55", "#FF0000", "#1877F2", "#8b5cf6"];
const PLATFORM_COLORS: Record<string, string> = {
  Instagram: "#E1306C",
  TikTok: "#fe2c55",
  YouTube: "#FF0000",
  Facebook: "#1877F2",
};

export default function AnalyticsPage() {
  const { instagramPosts, tiktokPosts, youtubePosts, facebookPosts } =
    useOutletContext<OutletContextType>();

  const analyzedContent = useMemo(
    () => [
      ...instagramPosts.map((p) => ({
        id: p.id,
        platform: "Instagram",
        title: p.caption,
        likes: p.likes,
        comments: p.comments,
        shares: p.shares,
        saves: p.saves,
        views: p.impressions,
        reach: p.reach,
      })),
      ...tiktokPosts.map((p) => ({
        id: p.id,
        platform: "TikTok",
        title: p.title,
        likes: p.likes,
        comments: p.comments,
        shares: p.shares,
        saves: p.saves,
        views: p.views,
        reach: p.views,
      })),
      ...youtubePosts.map((p) => ({
        id: p.id,
        platform: "YouTube",
        title: p.title,
        likes: p.likes,
        comments: p.comments,
        shares: p.shares,
        saves: 0,
        views: p.views,
        reach: p.views,
      })),
      ...facebookPosts.map((p) => ({
        id: p.id,
        platform: "Facebook",
        title: p.caption,
        likes: p.likes,
        comments: p.comments,
        shares: p.shares,
        saves: 0,
        views: p.impressions,
        reach: p.reach,
      })),
    ],
    [instagramPosts, tiktokPosts, youtubePosts, facebookPosts],
  );

  const engagementByPlatform = useMemo(() => {
    const platformMap: { [key: string]: number } = {};
    analyzedContent.forEach((item) => {
      platformMap[item.platform] =
        (platformMap[item.platform] || 0) + calculateTotalEngagement(item);
    });
    return Object.entries(platformMap).map(([name, value]) => ({
      name,
      value,
    }));
  }, [analyzedContent]);

  const engagementDistribution = useMemo(() => {
    const total = analyzedContent.reduce(
      (acc, item) => ({
        likes: acc.likes + item.likes,
        comments: acc.comments + item.comments,
        shares: acc.shares + item.shares,
        saves: acc.saves + item.saves,
        views: acc.views + item.views,
      }),
      { likes: 0, comments: 0, shares: 0, saves: 0, views: 0 },
    );
    return [
      { name: "Likes", value: total.likes },
      { name: "Comments", value: total.comments },
      { name: "Shares", value: total.shares },
      { name: "Saves", value: total.saves },
      { name: "Views", value: total.views },
    ];
  }, [analyzedContent]);

  const viewsVsReach = useMemo(
    () =>
      analyzedContent.map((item, index) => ({
        name: `#${index + 1}`,
        views: item.views,
        reach: item.reach,
      })),
    [analyzedContent],
  );

  const topPerforming = useMemo(
    () =>
      [...analyzedContent]
        .sort(
          (a, b) => calculateTotalEngagement(b) - calculateTotalEngagement(a),
        )
        .slice(0, 10),
    [analyzedContent],
  );

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 4 }}>
        Analytics Visualization
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Engagement by Platform
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={engagementByPlatform}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#3b82f6" name="Total Engagement" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Engagement Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={engagementDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {engagementDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Views vs Reach
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={viewsVsReach}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="views"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Views"
                  />
                  <Line
                    type="monotone"
                    dataKey="reach"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Reach"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Top 10 Performing Content
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {topPerforming.map((item, index) => {
                  const totalEngagement = calculateTotalEngagement(item);
                  return (
                    <Box
                      key={item.id}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        p: 2,
                        borderRadius: 2,
                        bgcolor: index < 3 ? "#f0f9ff" : "#f8fafc",
                        border: "1px solid",
                        borderColor: index < 3 ? "#3b82f6" : "#e2e8f0",
                      }}
                    >
                      <Typography
                        variant="h5"
                        sx={{
                          fontWeight: 700,
                          color: index < 3 ? "primary.main" : "text.secondary",
                          minWidth: 40,
                        }}
                      >
                        #{index + 1}
                      </Typography>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {item.title}
                        </Typography>
                        <Chip
                          label={item.platform}
                          size="small"
                          sx={{
                            bgcolor: `${PLATFORM_COLORS[item.platform]}20`,
                            color: PLATFORM_COLORS[item.platform],
                            mt: 0.5,
                          }}
                        />
                      </Box>
                      <Box sx={{ textAlign: "right" }}>
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 700, color: "primary.main" }}
                        >
                          {totalEngagement.toLocaleString()}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: "text.secondary" }}
                        >
                          Total Engagement
                        </Typography>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
