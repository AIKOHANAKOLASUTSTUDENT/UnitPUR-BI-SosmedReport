export interface InstagramPost {
  id: number;
  contentType: "Post" | "Reel" | "Story";
  link: string;
  thumbnail: string;
  caption: string;
  likes: number;
  comments: number;
  saves: number;
  shares: number;
  reach: number;
  impressions: number;
  analyzedAt: string;
  totalEngagement?: number;
}

export interface TikTokPost {
  id: number;
  link: string;
  thumbnail: string;
  title: string;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  saves: number;
  analyzedAt: string;
}

export interface YouTubePost {
  id: number;
  favorites?: number;
  contentType: "Video" | "Short";
  link: string;
  thumbnail: string;
  title: string;
  likes: number;
  comments: number;
  views: number;
  shares: number;
  watchTimeHours: number;
  subscribersGained: number;
  analyzedAt: string;
}

export interface FacebookPost {
  id: number;
  contentType: "Post" | "Video" | "Reel" | "Story";
  totalEngagement?: number;
  link: string;
  thumbnail: string;
  caption: string;
  likes: number;
  comments: number;
  shares: number;
  reactions: number;
  reach: number;
  impressions: number;
  analyzedAt: string;
}

export interface PlatformAuth {
  instagram: boolean;
  tiktok: boolean;
  totalEngagement?: number;
  youtube: boolean;
  facebook: boolean;
}

export type PlatformKey = keyof PlatformAuth;

export interface PlatformConnection {
  platform: PlatformKey;
  connected: boolean;
  verified: boolean;
  accountId: string;
  accountName: string;
  accountType: string;
  scopes: string[];
  expiresAt: string | null;
  updatedAt: string;
}

export interface PlatformConnections {
  instagram: PlatformConnection | null;
  tiktok: PlatformConnection | null;
  youtube: PlatformConnection | null;
  facebook: PlatformConnection | null;
}

export interface OutletContextType {
  platformAuth: PlatformAuth;
  setPlatformAuth: React.Dispatch<React.SetStateAction<PlatformAuth>>;
  platformConnections: PlatformConnections;
  setPlatformConnections: React.Dispatch<
    React.SetStateAction<PlatformConnections>
  >;
  instagramPosts: InstagramPost[];
  setInstagramPosts: React.Dispatch<React.SetStateAction<InstagramPost[]>>;
  tiktokPosts: TikTokPost[];
  setTiktokPosts: React.Dispatch<React.SetStateAction<TikTokPost[]>>;
  youtubePosts: YouTubePost[];
  setYoutubePosts: React.Dispatch<React.SetStateAction<YouTubePost[]>>;
  facebookPosts: FacebookPost[];
  setFacebookPosts: React.Dispatch<React.SetStateAction<FacebookPost[]>>;
  refreshBootstrap: () => Promise<void>;
}




