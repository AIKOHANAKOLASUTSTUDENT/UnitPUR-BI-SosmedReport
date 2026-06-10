import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { useEffect, useState } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { Toaster } from "sonner";
import DashboardLayout from "./components/DashboardLayout";
import MainDashboard from "./components/MainDashboard";
import ReportsPage from "./components/ReportsPage";
import AnalyticsPage from "./components/AnalyticsPage";
import ExportCenterPage from "./components/ExportCenterPage";
import InstagramPage from "./components/InstagramPage";
import TikTokPage from "./components/TikTokPage";
import YouTubePage from "./components/YouTubePage";
import FacebookPage from "./components/FacebookPage";
import { loadBootstrap } from "./lib/platformApi";
import type {
  PlatformAuth,
  PlatformConnections,
  InstagramPost,
  TikTokPost,
  YouTubePost,
  FacebookPost,
} from "./types";

const theme = createTheme({
  palette: {
    primary: { main: "#2563eb" },
    background: { default: "#f8fafc", paper: "#ffffff" },
  },
});

export default function App() {
  const [platformAuth, setPlatformAuth] = useState<PlatformAuth>({
    instagram: false,
    tiktok: false,
    youtube: false,
    facebook: false,
  });
  const [platformConnections, setPlatformConnections] =
    useState<PlatformConnections>({
      instagram: null,
      tiktok: null,
      youtube: null,
      facebook: null,
    });
  const [instagramPosts, setInstagramPosts] = useState<InstagramPost[]>([]);
  const [tiktokPosts, setTiktokPosts] = useState<TikTokPost[]>([]);
  const [youtubePosts, setYoutubePosts] = useState<YouTubePost[]>([]);
  const [facebookPosts, setFacebookPosts] = useState<FacebookPost[]>([]);

  const refreshBootstrap = async () => {
    const bootstrap = await loadBootstrap();
    setPlatformAuth(bootstrap.platformAuth);
    setPlatformConnections(
      bootstrap.platformConnections as PlatformConnections,
    );
    setInstagramPosts(bootstrap.instagramPosts as InstagramPost[]);
    setTiktokPosts(bootstrap.tiktokPosts as TikTokPost[]);
    setYoutubePosts(bootstrap.youtubePosts as YouTubePost[]);
    setFacebookPosts(bootstrap.facebookPosts as FacebookPost[]);
  };

  useEffect(() => {
    refreshBootstrap().catch((error) => {
      console.error("Failed to bootstrap dashboard state", error);
    });
  }, []);

  const outletContext = {
    platformAuth,
    setPlatformAuth,
    platformConnections,
    setPlatformConnections,
    instagramPosts,
    setInstagramPosts,
    tiktokPosts,
    setTiktokPosts,
    youtubePosts,
    setYoutubePosts,
    facebookPosts,
    setFacebookPosts,
    refreshBootstrap,
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Toaster position="top-right" richColors />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/dashboard"
            element={<DashboardLayout outletContext={outletContext} />}
          >
            <Route index element={<MainDashboard />} />
            <Route path="instagram" element={<InstagramPage />} />
            <Route path="tiktok" element={<TikTokPage />} />
            <Route path="youtube" element={<YouTubePage />} />
            <Route path="facebook" element={<FacebookPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="export" element={<ExportCenterPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
