import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  MenuItem,
  IconButton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  LinearProgress,
  Alert,
} from "@mui/material";
import { Instagram, Plus, Trash2, BarChart3, LogIn } from "lucide-react";
import { toast } from "sonner";
import type { OutletContextType, InstagramPost } from "../types";
import { calculateTotalEngagement, parseContentUrls } from "../lib/content";
import {
  analyzePlatformContent,
  disconnectPlatform,
  getFriendlyErrorMessage,
  startPlatformConnection,
} from "../lib/platformApi";

import { toast } from "sonner";

const PLATFORM_COLOR = "#E1306C";
const PLATFORM_BG = "#fdf2f8";

export default function InstagramPage() {
  const {
    platformAuth,
    instagramPosts,
    platformConnections,
    refreshBootstrap,
  } = useOutletContext<OutletContextType>();

  const [urlInputs, setUrlInputs] = useState([
    { url: "", contentType: "Post" as InstagramPost["contentType"] },
  ]);
  const [analyzing, setAnalyzing] = useState(false);
  const [bulkInput, setBulkInput] = useState("");
  const [bulkMode, setBulkMode] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      await startPlatformConnection("instagram");
      await refreshBootstrap();
      toast.success("Connected to Instagram successfully.");
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error));
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectPlatform("instagram");
      await refreshBootstrap();
      toast.info("Disconnected from Instagram");
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error));
    }
  };

  const addUrlRow = () => {
    setUrlInputs([...urlInputs, { url: "", contentType: "Post" }]);
  };

  const removeUrlRow = (index: number) => {
    setUrlInputs(urlInputs.filter((_, i) => i !== index));
  };

  const updateUrlRow = (
    index: number,
    field: "url" | "contentType",
    value: string,
  ) => {
    const updated = [...urlInputs];
    (updated[index] as any)[field] = value;
    setUrlInputs(updated);
  };

  const parseUrls = (text: string): string[] => {
    return parseContentUrls(text);
  };

  const detectedUrls = parseUrls(bulkInput);

  const handleAnalyze = async () => {
    let validUrls: Array<{
      url: string;
      contentType: InstagramPost["contentType"];
    }> = [];

    if (bulkMode) {
      const urls = detectedUrls;
      if (!urls.length) {
        toast.error("Please enter at least one URL");
        return;
      }
      validUrls = urls.map((url) => ({
        url,
        contentType: "Post" as InstagramPost["contentType"],
      }));
    } else {
      validUrls = urlInputs.filter((r) => r.url.trim());
      if (!validUrls.length) {
        toast.error("Please enter at least one URL");
        return;
      }
    }

    setAnalyzing(true);
    try {
      const response = await analyzePlatformContent("instagram", validUrls);
      await refreshBootstrap();

      if (bulkMode) {
        setBulkInput("");
      } else {
        setUrlInputs([{ url: "", contentType: "Post" }]);
      }

      toast.success(response.message);
    } catch (error) {
      const message = getFriendlyErrorMessage(error);
      toast.error(message);
      if (message === "Session expired. Please reconnect your account.") {
        await refreshBootstrap();
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const totalEngagement = (post: InstagramPost) =>
    calculateTotalEngagement(post);

  const connectedAccount = platformConnections.instagram;

  // Phase 1: Fetch and display Instagram profile (login-success only)
  // We intentionally do NOT implement engagement/media analysis here.
  const [igProfile, setIgProfile] = useState<any>(null);
  const [igProfileLoading, setIgProfileLoading] = useState(false);

  React.useEffect(() => {
    if (!platformAuth.instagram) return;
    let cancelled = false;
    (async () => {
      try {
        setIgProfileLoading(true);
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL || ""}/api/instagram/profile`,
          {
            credentials: "include",
          },
        );
        const body = await res.json().catch(() => ({}));
        if (!res.ok)
          throw new Error(body?.error || "Unable to fetch Instagram profile.");
        if (!cancelled) setIgProfile(body.account);
      } catch (e: any) {
        if (!cancelled) {
          toast.error(e?.message || "Unable to fetch Instagram profile.");
        }
      } finally {
        if (!cancelled) setIgProfileLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [platformAuth.instagram]);

  if (!platformAuth.instagram) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <Card
          sx={{
            maxWidth: 420,
            width: "100%",
            textAlign: "center",
            border: `2px solid ${PLATFORM_COLOR}20`,
          }}
        >
          <CardContent sx={{ p: 5 }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: "20px",
                background:
                  "linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 3,
              }}
            >
              <Instagram size={40} color="white" />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
              Connect Instagram
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", mb: 4 }}>
              Connect an Instagram Business or Creator account to analyze real
              engagement metrics from the official Meta Graph API.
            </Typography>
            <Button
              variant="contained"
              size="large"
              fullWidth
              startIcon={<LogIn size={18} />}
              onClick={handleConnect}
              disabled={connecting}
              sx={{
                bgcolor: PLATFORM_COLOR,
                "&:hover": { bgcolor: "#c2185b" },
                py: 1.5,
              }}
            >
              {connecting ? "Connecting..." : "Connect Instagram"}
            </Button>
            <Typography
              variant="caption"
              sx={{ color: "text.secondary", display: "block", mt: 2 }}
            >
              Authentication is handled through OAuth and tokens are stored
              securely on the backend.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 4 }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: "12px",
            background:
              "linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Instagram size={28} color="white" />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Instagram Analysis
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {connectedAccount?.accountName || "Connected account"} &nbsp;
            <Chip
              label="Connected"
              size="small"
              sx={{ bgcolor: "#d1fae5", color: "#065f46" }}
            />
          </Typography>
        </Box>
        <Button
          variant="outlined"
          color="error"
          size="small"
          onClick={handleDisconnect}
        >
          Disconnect
        </Button>
      </Box>

      <Card
        sx={{
          mb: 3,
          border: `1px solid ${PLATFORM_COLOR}30`,
          bgcolor: PLATFORM_BG,
        }}
      >
        <CardContent>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 3,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Add Content to Analyze
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                size="small"
                variant={!bulkMode ? "contained" : "outlined"}
                onClick={() => setBulkMode(false)}
                sx={
                  !bulkMode
                    ? {
                        bgcolor: PLATFORM_COLOR,
                        "&:hover": { bgcolor: "#c2185b" },
                      }
                    : {}
                }
              >
                Single
              </Button>
              <Button
                size="small"
                variant={bulkMode ? "contained" : "outlined"}
                onClick={() => setBulkMode(true)}
                sx={
                  bulkMode
                    ? {
                        bgcolor: PLATFORM_COLOR,
                        "&:hover": { bgcolor: "#c2185b" },
                      }
                    : {}
                }
              >
                Bulk
              </Button>
            </Box>
          </Box>

          {bulkMode ? (
            <Box>
              <TextField
                multiline
                rows={6}
                fullWidth
                value={bulkInput}
                onChange={(e) => setBulkInput(e.target.value)}
                placeholder="Paste multiple Instagram URLs here, separated by space, comma, or new line&#10;&#10;Example:&#10;https://www.instagram.com/p/abc123&#10;https://www.instagram.com/reel/xyz456, https://www.instagram.com/p/def789"
                sx={{ mb: 2 }}
              />
              {detectedUrls.length > 0 && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Detected {detectedUrls.length} URL
                  {detectedUrls.length > 1 ? "s" : ""}
                </Alert>
              )}
            </Box>
          ) : (
            <>
              {urlInputs.map((row, i) => (
                <Box
                  key={i}
                  sx={{ display: "flex", gap: 2, mb: 2, alignItems: "center" }}
                >
                  <TextField
                    label={`Instagram URL ${i + 1}`}
                    value={row.url}
                    onChange={(e) => updateUrlRow(i, "url", e.target.value)}
                    placeholder="https://www.instagram.com/p/..."
                    sx={{ flex: 1 }}
                    size="small"
                  />
                  <TextField
                    select
                    label="Type"
                    value={row.contentType}
                    onChange={(e) =>
                      updateUrlRow(i, "contentType", e.target.value)
                    }
                    size="small"
                    sx={{ minWidth: 130 }}
                  >
                    {["Post", "Reel", "Story"].map((t) => (
                      <MenuItem key={t} value={t}>
                        {t}
                      </MenuItem>
                    ))}
                  </TextField>
                  <IconButton
                    color="error"
                    onClick={() => removeUrlRow(i)}
                    disabled={urlInputs.length === 1}
                  >
                    <Trash2 size={18} />
                  </IconButton>
                </Box>
              ))}
            </>
          )}

          <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
            {!bulkMode && (
              <Button
                startIcon={<Plus size={16} />}
                onClick={addUrlRow}
                size="small"
              >
                Add Another URL
              </Button>
            )}
            <Button
              variant="contained"
              startIcon={<BarChart3 size={16} />}
              onClick={handleAnalyze}
              disabled={analyzing}
              sx={{
                ml: "auto",
                bgcolor: PLATFORM_COLOR,
                "&:hover": { bgcolor: "#c2185b" },
              }}
            >
              {analyzing ? "Analyzing..." : "Analyze"}
            </Button>
          </Box>
          {analyzing && (
            <LinearProgress
              sx={{
                mt: 2,
                "& .MuiLinearProgress-bar": { bgcolor: PLATFORM_COLOR },
              }}
            />
          )}
        </CardContent>
      </Card>

      {instagramPosts.length > 0 ? (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Results ({instagramPosts.length} items)
            </Typography>
            <TableContainer
              component={Paper}
              elevation={0}
              sx={{ border: "1px solid", borderColor: "divider" }}
            >
              <Table size="small">
                <TableHead sx={{ bgcolor: "#f8fafc" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Thumbnail</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Link</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">
                      Likes
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">
                      Comments
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">
                      Saves
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">
                      Shares
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">
                      Reach
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">
                      Impressions
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">
                      Engagement
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {instagramPosts.map((post) => (
                    <TableRow key={post.id} hover>
                      <TableCell>
                        <Avatar
                          variant="rounded"
                          src={post.thumbnail}
                          sx={{ width: 40, height: 40 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={post.contentType}
                          size="small"
                          sx={{
                            bgcolor:
                              post.contentType === "Reel"
                                ? "#fce7f3"
                                : post.contentType === "Story"
                                  ? "#fef3c7"
                                  : "#f3e8ff",
                            color:
                              post.contentType === "Reel"
                                ? "#9d174d"
                                : post.contentType === "Story"
                                  ? "#92400e"
                                  : "#6b21a8",
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <a
                          href={post.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: PLATFORM_COLOR,
                            textDecoration: "none",
                            fontSize: 12,
                          }}
                        >
                          View
                        </a>
                      </TableCell>
                      <TableCell align="right">
                        {post.likes.toLocaleString()}
                      </TableCell>
                      <TableCell align="right">
                        {post.comments.toLocaleString()}
                      </TableCell>
                      <TableCell align="right">
                        {post.saves.toLocaleString()}
                      </TableCell>
                      <TableCell align="right">
                        {post.shares.toLocaleString()}
                      </TableCell>
                      <TableCell align="right">
                        {post.reach.toLocaleString()}
                      </TableCell>
                      <TableCell align="right">
                        {post.impressions.toLocaleString()}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ fontWeight: 600, color: PLATFORM_COLOR }}
                      >
                        {totalEngagement(post).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      ) : (
        <Alert severity="info" icon={<Instagram size={20} />}>
          No Instagram content analyzed yet. Enter URLs above and click Analyze
          to get started.
        </Alert>
      )}
    </Box>
  );
}
