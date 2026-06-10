import { useState, useMemo } from "react";
import { useOutletContext, useNavigate } from "react-router";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  MenuItem,
  Button,
  Chip,
  TablePagination,
  Avatar,
} from "@mui/material";
import {
  FileText,
  Heart,
  Eye,
  Share2,
  TrendingUp,
  Instagram,
  Music2,
  Youtube,
  Facebook,
} from "lucide-react";
import type { OutletContextType } from "../types";
import { calculateTotalEngagement } from "../lib/content";

const PLATFORM_META: Record<
  string,
  { color: string; emoji: string; icon: React.ElementType }
> = {
  Instagram: { color: "#E1306C", emoji: "📷", icon: Instagram },
  TikTok: { color: "#fe2c55", emoji: "🎵", icon: Music2 },
  YouTube: { color: "#FF0000", emoji: "📺", icon: Youtube },
  Facebook: { color: "#1877F2", emoji: "📘", icon: Facebook },
};

type UnifiedRow = {
  id: number;
  platform: string;
  link: string;
  thumbnail: string;
  label: string;
  contentType: string;
  engagement: number;
  views: number;
  reach: number;
  analyzedAt: string;
};

export default function MainDashboard() {
  const {
    instagramPosts,
    tiktokPosts,
    youtubePosts,
    facebookPosts,
    platformAuth,
  } = useOutletContext<OutletContextType>();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState("All");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const allData = useMemo<UnifiedRow[]>(() => {
    const rows: UnifiedRow[] = [];
    instagramPosts.forEach((p) =>
      rows.push({
        id: p.id,
        platform: "Instagram",
        link: p.link,
        thumbnail: p.thumbnail,
        label: p.caption,
        contentType: p.contentType,
        engagement: calculateTotalEngagement(p),
        views: p.impressions,
        reach: p.reach,
        analyzedAt: p.analyzedAt,
      }),
    );
    tiktokPosts.forEach((p) =>
      rows.push({
        id: p.id,
        platform: "TikTok",
        link: p.link,
        thumbnail: p.thumbnail,
        label: p.title,
        contentType: "Video",
        engagement: calculateTotalEngagement(p),
        views: p.views,
        reach: p.views,
        analyzedAt: p.analyzedAt,
      }),
    );
    youtubePosts.forEach((p) =>
      rows.push({
        id: p.id,
        platform: "YouTube",
        link: p.link,
        thumbnail: p.thumbnail,
        label: p.title,
        contentType: p.contentType,
        engagement: calculateTotalEngagement(p),
        views: p.views,
        reach: p.views,
        analyzedAt: p.analyzedAt,
      }),
    );
    facebookPosts.forEach((p) =>
      rows.push({
        id: p.id,
        platform: "Facebook",
        link: p.link,
        thumbnail: p.thumbnail,
        label: p.caption,
        contentType: p.contentType,
        engagement: calculateTotalEngagement(p),
        views: p.impressions,
        reach: p.reach,
        analyzedAt: p.analyzedAt,
      }),
    );
    return rows.sort(
      (a, b) =>
        new Date(b.analyzedAt).getTime() - new Date(a.analyzedAt).getTime(),
    );
  }, [instagramPosts, tiktokPosts, youtubePosts, facebookPosts]);

  const kpis = useMemo(
    () => ({
      totalPosts: allData.length,
      totalEngagement: allData.reduce((s, r) => s + r.engagement, 0),
      totalViews: allData.reduce((s, r) => s + r.views, 0),
      totalReach: allData.reduce((s, r) => s + r.reach, 0),
      avgEngagement: allData.length
        ? Math.round(
            allData.reduce((s, r) => s + r.engagement, 0) / allData.length,
          )
        : 0,
    }),
    [allData],
  );

  const filtered = useMemo(
    () =>
      allData.filter((r) => {
        const matchSearch =
          r.label.toLowerCase().includes(search.toLowerCase()) ||
          r.platform.toLowerCase().includes(search.toLowerCase());
        const matchPlatform =
          platformFilter === "All" || r.platform === platformFilter;
        return matchSearch && matchPlatform;
      }),
    [allData, search, platformFilter],
  );

  const kpiCards = [
    {
      title: "Total Posts Analyzed",
      value: kpis.totalPosts.toLocaleString(),
      icon: FileText,
      color: "#3b82f6",
    },
    {
      title: "Total Engagement",
      value: kpis.totalEngagement.toLocaleString(),
      icon: Heart,
      color: "#ef4444",
    },
    {
      title: "Total Views / Impressions",
      value: kpis.totalViews.toLocaleString(),
      icon: Eye,
      color: "#8b5cf6",
    },
    {
      title: "Total Reach",
      value: kpis.totalReach.toLocaleString(),
      icon: Share2,
      color: "#10b981",
    },
    {
      title: "Avg Engagement / Post",
      value: kpis.avgEngagement.toLocaleString(),
      icon: TrendingUp,
      color: "#f59e0b",
    },
  ];

  const connectedCount = Object.values(platformAuth).filter(Boolean).length;

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
        Engagement Dashboard
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary", mb: 4 }}>
        Overview across all connected platforms · {connectedCount} platform
        {connectedCount !== 1 ? "s" : ""} connected
      </Typography>

      {allData.length === 0 && (
        <Card sx={{ mb: 4, border: "2px dashed #e2e8f0", bgcolor: "#f8fafc" }}>
          <CardContent sx={{ textAlign: "center", py: 5 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              No data yet
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
              Connect a platform and analyze content to see your engagement
              metrics here.
            </Typography>
            <Box
              sx={{
                display: "flex",
                gap: 2,
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              {(["Instagram", "TikTok", "YouTube", "Facebook"] as const).map(
                (p) => {
                  const meta = PLATFORM_META[p];
                  const Icon = meta.icon;
                  return (
                    <Button
                      key={p}
                      variant="outlined"
                      startIcon={<Icon size={16} />}
                      onClick={() => navigate(`/dashboard/${p.toLowerCase()}`)}
                      sx={{
                        borderColor: meta.color,
                        color: meta.color,
                        "&:hover": {
                          borderColor: meta.color,
                          bgcolor: `${meta.color}10`,
                        },
                      }}
                    >
                      {p}
                    </Button>
                  );
                },
              )}
            </Box>
          </CardContent>
        </Card>
      )}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "1fr 1fr",
            lg: "repeat(5, 1fr)",
          },
          gap: 3,
          mb: 4,
        }}
      >
        {kpiCards.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <Card key={i} sx={{ borderTop: `4px solid ${kpi.color}` }}>
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    mb: 2,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{ color: "text.secondary", fontSize: 12 }}
                  >
                    {kpi.title}
                  </Typography>
                  <Avatar
                    sx={{ bgcolor: `${kpi.color}20`, width: 36, height: 36 }}
                  >
                    <Icon size={18} color={kpi.color} />
                  </Avatar>
                </Box>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 700, color: kpi.color }}
                >
                  {kpi.value}
                </Typography>
              </CardContent>
            </Card>
          );
        })}
      </Box>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
            All Content — Engagement Data
          </Typography>
          <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
            <TextField
              placeholder="Search by title or platform..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="small"
              sx={{ flexGrow: 1, minWidth: 200 }}
            />
            <TextField
              select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              size="small"
              sx={{ minWidth: 150 }}
            >
              {["All", "Instagram", "TikTok", "YouTube", "Facebook"].map(
                (p) => (
                  <MenuItem key={p} value={p}>
                    {p}
                  </MenuItem>
                ),
              )}
            </TextField>
          </Box>

          <TableContainer
            component={Paper}
            elevation={0}
            sx={{ border: "1px solid", borderColor: "divider" }}
          >
            <Table size="small">
              <TableHead sx={{ bgcolor: "#f8fafc" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Platform</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Thumbnail</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Content</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Link</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">
                    Views / Impressions
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">
                    Reach
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">
                    Engagement
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Analyzed</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      align="center"
                      sx={{ py: 8, color: "text.secondary" }}
                    >
                      {allData.length === 0
                        ? "No content analyzed yet — go to a platform to get started"
                        : "No results match your filter"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((row) => {
                      const meta = PLATFORM_META[row.platform];
                      return (
                        <TableRow key={`${row.platform}-${row.id}`} hover>
                          <TableCell>
                            <Chip
                              label={row.platform}
                              size="small"
                              sx={{
                                bgcolor: `${meta.color}15`,
                                color: meta.color,
                                fontWeight: 600,
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Avatar
                              variant="rounded"
                              src={row.thumbnail}
                              sx={{ width: 36, height: 36 }}
                            />
                          </TableCell>
                          <TableCell
                            sx={{
                              maxWidth: 200,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {row.label}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={row.contentType}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: 11 }}
                            />
                          </TableCell>
                          <TableCell>
                            <a
                              href={row.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                color: meta.color,
                                textDecoration: "none",
                                fontSize: 12,
                              }}
                            >
                              View
                            </a>
                          </TableCell>
                          <TableCell align="right">
                            {row.views.toLocaleString()}
                          </TableCell>
                          <TableCell align="right">
                            {row.reach.toLocaleString()}
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{ fontWeight: 700, color: meta.color }}
                          >
                            {row.engagement.toLocaleString()}
                          </TableCell>
                          <TableCell
                            sx={{ fontSize: 11, color: "text.secondary" }}
                          >
                            {new Date(row.analyzedAt).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      );
                    })
                )}
              </TableBody>
            </Table>
          </TableContainer>
          {filtered.length > 0 && (
            <TablePagination
              component="div"
              count={filtered.length}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
            />
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
