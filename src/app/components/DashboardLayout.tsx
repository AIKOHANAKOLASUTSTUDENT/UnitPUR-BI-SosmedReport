import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router";
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Switch,
  Divider,
  Tooltip,
} from "@mui/material";
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  Download,
  Settings,
  Bell,
  LogOut,
  Instagram,
  Music2,
  Youtube,
  Facebook,
} from "lucide-react";
import type { OutletContextType } from "../types";

const drawerWidth = 260;

interface Props {
  outletContext: OutletContextType;
}

const platformItems = [
  {
    path: "/dashboard/instagram",
    label: "Instagram",
    icon: Instagram,
    color: "#E1306C",
    key: "instagram" as const,
  },
  {
    path: "/dashboard/tiktok",
    label: "TikTok",
    icon: Music2,
    color: "#fe2c55",
    key: "tiktok" as const,
  },
  {
    path: "/dashboard/youtube",
    label: "YouTube",
    icon: Youtube,
    color: "#FF0000",
    key: "youtube" as const,
  },
  {
    path: "/dashboard/facebook",
    label: "Facebook",
    icon: Facebook,
    color: "#1877F2",
    key: "facebook" as const,
  },
];

const reportItems = [
  { path: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { path: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { path: "/dashboard/reports", label: "Reports", icon: FileText },
  { path: "/dashboard/export", label: "Export Center", icon: Download },
];

export default function DashboardLayout({ outletContext }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [darkMode, setDarkMode] = useState(false);

  const { platformAuth } = outletContext;

  const isActive = (path: string) =>
    path === "/dashboard"
      ? location.pathname === "/dashboard"
      : location.pathname.startsWith(path);

  const totalConnected = Object.values(platformAuth || {}).filter(
    Boolean,
  ).length;
  const totalContent =
    outletContext.instagramPosts.length +
    outletContext.tiktokPosts.length +
    outletContext.youtubePosts.length +
    outletContext.facebookPosts.length;

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <AppBar
        position="fixed"
        sx={{
          width: `calc(100% - ${drawerWidth}px)`,
          ml: `${drawerWidth}px`,
          bgcolor: "white",
          color: "text.primary",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}
      >
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
            Social Media Engagement Report
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography
              variant="caption"
              sx={{ color: "text.secondary", mr: 1 }}
            >
              {totalConnected} platform{totalConnected !== 1 ? "s" : ""}{" "}
              connected · {totalContent} items analyzed
            </Typography>
            <IconButton>
              <Badge badgeContent={3} color="error">
                <Bell size={20} />
              </Badge>
            </IconButton>
            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main" }}>
                U
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
            >
              <MenuItem>
                <Settings size={18} style={{ marginRight: 8 }} />
                Account Settings
              </MenuItem>
              <MenuItem>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  Dark Mode
                  <Switch
                    checked={darkMode}
                    onChange={(e) => setDarkMode(e.target.checked)}
                    size="small"
                  />
                </Box>
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setAnchorEl(null);
                  navigate("/");
                }}
              >
                <LogOut size={18} style={{ marginRight: 8 }} />
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        anchor="left"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            bgcolor: "#1e293b",
            color: "white",
            borderRight: "none",
          },
        }}
      >
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: "white" }}>
            📊 Analytics Hub
          </Typography>
        </Box>

        <List sx={{ px: 2 }}>
          <Typography
            variant="overline"
            sx={{ color: "#64748b", px: 1, fontSize: 10, letterSpacing: 1.5 }}
          >
            REPORTS
          </Typography>
          {reportItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => navigate(item.path)}
                  sx={{
                    borderRadius: 2,
                    bgcolor: active ? "rgba(59,130,246,0.2)" : "transparent",
                    "&:hover": {
                      bgcolor: active
                        ? "rgba(59,130,246,0.3)"
                        : "rgba(255,255,255,0.08)",
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{ minWidth: 36, color: active ? "#60a5fa" : "#94a3b8" }}
                  >
                    <Icon size={18} />
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontSize: 14,
                      fontWeight: active ? 600 : 400,
                      color: active ? "white" : "#cbd5e1",
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", mx: 2, my: 1 }} />

        <List sx={{ px: 2 }}>
          <Typography
            variant="overline"
            sx={{ color: "#64748b", px: 1, fontSize: 10, letterSpacing: 1.5 }}
          >
            PLATFORMS
          </Typography>
          {platformItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            const connected = platformAuth[item.key];
            return (
              <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => navigate(item.path)}
                  sx={{
                    borderRadius: 2,
                    bgcolor: active ? `${item.color}25` : "transparent",
                    "&:hover": {
                      bgcolor: active
                        ? `${item.color}35`
                        : "rgba(255,255,255,0.08)",
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 36,
                      color: active ? item.color : "#94a3b8",
                    }}
                  >
                    <Icon size={18} />
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontSize: 14,
                      fontWeight: active ? 600 : 400,
                      color: active ? "white" : "#cbd5e1",
                    }}
                  />
                  {connected && (
                    <Tooltip title="Connected">
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          bgcolor: "#22c55e",
                        }}
                      />
                    </Tooltip>
                  )}
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>

        <Box
          sx={{
            mt: "auto",
            p: 3,
            borderTop: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <Typography variant="caption" sx={{ color: "#64748b" }}>
            Last updated: {new Date().toLocaleTimeString()}
          </Typography>
        </Box>
      </Drawer>

      <Box
        component="main"
        sx={{ flexGrow: 1, bgcolor: "background.default", p: 3, mt: 8 }}
      >
        <Outlet context={outletContext} />
      </Box>
    </Box>
  );
}
