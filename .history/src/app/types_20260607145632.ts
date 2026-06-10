export interface InstagramPost {
  id: number;
  contentType: 'Post' | 'Reel' | 'Story';
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
  contentType: 'Video' | 'Short';
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
  contentType: 'Post' | 'Video' | 'Reel' | 'Story';
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
  setPlatformConnections: React.Dispatch<React.SetStateAction<PlatformConnections>>;
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

export function generateInstagramMock(link: string, contentType: InstagramPost['contentType']): InstagramPost {
  const isReel = contentType === 'Reel';
  const isStory = contentType === 'Story';
  const multiplier = isReel ? 8 : isStory ? 0.3 : 1;
  const rand = (min: number, max: number) => Math.floor((Math.random() * (max - min) + min) * multiplier);
  const seed = Math.floor(Math.random() * 1000);
  return {
    id: Date.now() + Math.random(),
    contentType,
    link,
    thumbnail: `https://picsum.photos/seed/${seed}/80/80`,
    caption: `Instagram ${contentType} content from analyzed link`,
    likes: rand(500, 10000),
    comments: rand(20, 500),
    saves: rand(100, 2000),
    shares: rand(50, 1000),
    reach: rand(2000, 50000),
    impressions: rand(3000, 80000),
    analyzedAt: new Date().toISOString(),
  };
}

export function generateTikTokMock(link: string): TikTokPost {
  const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min) + min);
  const seed = Math.floor(Math.random() * 1000);
  return {
    id: Date.now() + Math.random(),
    link,
    thumbnail: `https://picsum.photos/seed/${seed}/80/80`,
    title: `TikTok video content from analyzed link`,
    likes: rand(500, 100000),
    comments: rand(50, 5000),
    shares: rand(100, 20000),
    views: rand(1000, 500000),
    saves: rand(50, 10000),
    analyzedAt: new Date().toISOString(),
  };
}

export function generateYouTubeMock(link: string, contentType: YouTubePost['contentType']): YouTubePost {
  const isShort = contentType === 'Short';
  const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min) + min);
  const seed = Math.floor(Math.random() * 1000);
  return {
    id: Date.now() + Math.random(),
    contentType,
    link,
    thumbnail: `https://picsum.photos/seed/${seed}/80/80`,
    title: `YouTube ${contentType} content from analyzed link`,
    likes: rand(100, isShort ? 50000 : 20000),
    comments: rand(20, isShort ? 3000 : 2000),
    views: rand(1000, isShort ? 2000000 : 500000),
    shares: rand(50, 5000),
    watchTimeHours: rand(50, isShort ? 2000 : 30000),
    subscribersGained: rand(5, isShort ? 1000 : 2000),
    analyzedAt: new Date().toISOString(),
  };
}

export function generateFacebookMock(link: string, contentType: FacebookPost['contentType']): FacebookPost {
  const isVideo = contentType === 'Video';
  const isReel = contentType === 'Reel';
  const multiplier = isReel ? 5 : isVideo ? 2.5 : 1;
  const rand = (min: number, max: number) => Math.floor((Math.random() * (max - min) + min) * multiplier);
  const seed = Math.floor(Math.random() * 1000);
  return {
    id: Date.now() + Math.random(),
    contentType,
    link,
    thumbnail: `https://picsum.photos/seed/${seed}/80/80`,
    caption: `Facebook ${contentType} content from analyzed link`,
    likes: rand(50, 5000),
    comments: rand(20, 500),
    shares: rand(10, 1000),
    reactions: rand(80, 8000),
    reach: rand(500, 50000),
    impressions: rand(800, 80000),
    analyzedAt: new Date().toISOString(),
  };
}
