import React, { useState, useEffect } from 'react';
import {
  Youtube,
  Play,
  ExternalLink,
  Plus,
  Search,
  Eye,
  Calendar,
  Clock,
  Sparkles,
  Share2,
  Trash2,
  Users,
  Video,
  Tv,
  CheckCircle2,
  X,
  Link as LinkIcon,
  AlertCircle,
  Cpu,
  Globe,
  Flame,
  Mic,
  Bot,
  Palette,
  Layout,
  Layers,
  TrendingUp,
  Award,
  Zap,
  Rocket,
} from 'lucide-react';

export interface YouTubeVideoItem {
  id: string;
  youtubeId?: string; // YouTube 11-char ID or undefined
  directUrl?: string; // Full YouTube URL
  title: string;
  category: 'Practical AI' | 'Tutorials' | 'Projects' | 'Masterclasses' | 'Announcements';
  duration: string;
  views: number;
  uploadedDate: string;
  description: string;
  artworkType:
    | 'india-china-ai'
    | 'moral-story'
    | 'notebooklm'
    | 'elevenlabs-voice'
    | 'gpt-astra'
    | 'leonardo-ai'
    | 'gamma-ai'
    | 'middle-class'
    | 'top-5-ai'
    | 'model-battle'
    | 'ai-agents'
    | 'viral-shorts'
    | 'cortexx-trailer';
}

interface YouTubeVideosViewProps {
  theme?: 'light' | 'dark';
}

// Banned external placeholder IDs (Rick Astley, pop music, etc.) that must NEVER be loaded
const BANNED_EXTERNAL_IDS = new Set([
  'dQw4w9WgXcQ', // Rick Astley
  '3JZ_D3ELwOQ',
  'L_LUpnjgPso',
  'kJQP7kiw5Fk',
  'fJ9rUzIMcZQ',
  'RgKAFK5djSk',
  '9bZkp7q19f0',
  'JGwWNGJdvx8',
  'OPf0YbXqDm0',
  '09R8_2nJtjg',
  'CevxZvSJLk8',
  'uelHwf8o7_U',
  'YQHsXMglC9A',
]);

// Exact 13 authentic videos from the user's channel: @CortexxWorld (Cortexx AI)
const AUTHENTIC_CORTEXX_VIDEOS: YouTubeVideoItem[] = [
  {
    id: 'cortexx-vid-1',
    title: 'Why Is India Behind China in AI? vs The Real Reason',
    category: 'Masterclasses',
    duration: '02:05',
    views: 211,
    uploadedDate: 'Oct 08, 2026',
    description: 'Detailed analysis of factors behind the AI gap between India and China: AI research & patents, private investment, compute power, and digital infrastructure.',
    directUrl: 'https://www.youtube.com/@CortexxWorld',
    artworkType: 'india-china-ai',
  },
  {
    id: 'cortexx-vid-2',
    title: 'Everyone Laughed at Him… Until He Proved Them Wrong! | Hindi Moral Story',
    category: 'Tutorials',
    duration: '04:15',
    views: 534,
    uploadedDate: 'Oct 16, 2026',
    description: 'An inspiring motivational story exploring resilience, purpose, and turning obstacles into breakthrough success.',
    directUrl: 'https://www.youtube.com/@CortexxWorld',
    artworkType: 'moral-story',
  },
  {
    id: 'cortexx-vid-3',
    title: 'Google NotebookLM Kya Hai? Complete Guide in Hindi | AI Research Assistant Explained',
    category: 'Tutorials',
    duration: '08:40',
    views: 68,
    uploadedDate: 'Aug 20, 2026',
    description: 'Complete beginner to advanced guide on using Google NotebookLM for students, teachers, researchers, and AI study notes.',
    directUrl: 'https://www.youtube.com/@CortexxWorld',
    artworkType: 'notebooklm',
  },
  {
    id: 'cortexx-vid-4',
    title: 'AI Voice Kaise Banaye? ElevenLabs Complete Guide in 2 Minutes',
    category: 'Practical AI',
    duration: '02:18',
    views: 41,
    uploadedDate: 'Sep 15, 2026',
    description: 'Step-by-step tutorial on generating realistic AI voices, cloning voice tones, and audio synthesis in just 2 minutes.',
    directUrl: 'https://www.youtube.com/@CortexxWorld',
    artworkType: 'elevenlabs-voice',
  },
  {
    id: 'cortexx-vid-5',
    title: 'GPT ASTRA: The Next AI Agent?',
    category: 'Practical AI',
    duration: '05:30',
    views: 71,
    uploadedDate: 'Sep 10, 2026',
    description: 'Analyzing Project Astra and multi-modal autonomous agent capabilities in real-time camera and conversational workflows.',
    directUrl: 'https://www.youtube.com/@CortexxWorld',
    artworkType: 'gpt-astra',
  },
  {
    id: 'cortexx-vid-6',
    title: 'Master Leonardo AI in Minutes! Free AI Image Generator | Cortexx AI',
    category: 'Tutorials',
    duration: '06:45',
    views: 69,
    uploadedDate: 'Jul 22, 2026',
    description: 'How to generate photorealistic art, game assets, and commercial visuals using Leonardo AI with prompt tricks.',
    directUrl: 'https://www.youtube.com/@CortexxWorld',
    artworkType: 'leonardo-ai',
  },
  {
    id: 'cortexx-vid-7',
    title: 'Gamma AI Complete Tutorial: Create Presentations & Webpages in Seconds | Cortexx AI',
    category: 'Practical AI',
    duration: '07:15',
    views: 65,
    uploadedDate: 'Jul 15, 2026',
    description: 'Generate professional presentation decks, websites, and documents in one click using AI-assisted design.',
    directUrl: 'https://www.youtube.com/@CortexxWorld',
    artworkType: 'gamma-ai',
  },
  {
    id: 'cortexx-vid-8',
    title: 'How the Middle Class Gets Trapped | Financial Reality Explained',
    category: 'Announcements',
    duration: '06:10',
    views: 78,
    uploadedDate: 'Aug 02, 2026',
    description: 'Understanding financial traps, wage inflation, and how modern tech & AI skills empower individuals in the new economy.',
    directUrl: 'https://www.youtube.com/@CortexxWorld',
    artworkType: 'middle-class',
  },
  {
    id: 'cortexx-vid-9',
    title: 'Top 5 Free AI Tools Every Student and Professional Must Use in 2026',
    category: 'Tutorials',
    duration: '09:20',
    views: 82,
    uploadedDate: 'Aug 10, 2026',
    description: 'Comprehensive review of the top 5 game-changing productivity and research AI utilities available today for free.',
    directUrl: 'https://www.youtube.com/@CortexxWorld',
    artworkType: 'top-5-ai',
  },
  {
    id: 'cortexx-vid-10',
    title: 'ChatGPT vs Claude vs Gemini: Which AI Model Is Best for You?',
    category: 'Masterclasses',
    duration: '11:35',
    views: 64,
    uploadedDate: 'Aug 28, 2026',
    description: 'Hands-on benchmark comparing ChatGPT, Claude, and Gemini across reasoning, coding, long context, and creativity.',
    directUrl: 'https://www.youtube.com/@CortexxWorld',
    artworkType: 'model-battle',
  },
  {
    id: 'cortexx-vid-11',
    title: 'Automate Your Work with AI Agents: Complete Beginner Guide',
    category: 'Practical AI',
    duration: '12:50',
    views: 48,
    uploadedDate: 'Sep 02, 2026',
    description: 'How autonomous AI task agents connect to tools, spreadsheets, and APIs to execute tasks without manual supervision.',
    directUrl: 'https://www.youtube.com/@CortexxWorld',
    artworkType: 'ai-agents',
  },
  {
    id: 'cortexx-vid-12',
    title: 'Create Viral AI Shorts in 5 Minutes Using Free AI Tools',
    category: 'Projects',
    duration: '05:10',
    views: 32,
    uploadedDate: 'Sep 20, 2026',
    description: 'Fast-paced workflow demonstrating script generation, AI voiceover, and automatic captioning for short-form video.',
    directUrl: 'https://www.youtube.com/@CortexxWorld',
    artworkType: 'viral-shorts',
  },
  {
    id: 'cortexx-vid-13',
    title: 'Welcome to Cortexx AI (@CortexxWorld) - Channel Trailer & Vision',
    category: 'Announcements',
    duration: '03:15',
    views: 25,
    uploadedDate: 'Jun 26, 2026',
    description: 'Official launch of Cortexx World (@CortexxWorld). Where Thinking Meets Technology. Dedicated to accessible AI education.',
    directUrl: 'https://www.youtube.com/@CortexxWorld',
    artworkType: 'cortexx-trailer',
  },
];

const STORAGE_KEY = 'cortexx_channel_videos_v4';

/**
 * High-definition visual artwork renderer for each video thumbnail
 */
const VideoThumbnailArtwork: React.FC<{
  video: YouTubeVideoItem;
  size?: 'sm' | 'md' | 'lg';
}> = ({ video, size = 'md' }) => {
  const artworkConfigs: Record<
    string,
    {
      gradient: string;
      badgeText: string;
      badgeBg: string;
      badgeColor: string;
      mainIcon: React.ReactNode;
      accentTitle: string;
      tagline: string;
      glowColor: string;
    }
  > = {
    'india-china-ai': {
      gradient: 'from-blue-950 via-slate-900 to-amber-950',
      badgeText: 'AI SUPERPOWERS',
      badgeBg: 'bg-blue-500/25 border-blue-500/50',
      badgeColor: 'text-blue-300',
      mainIcon: <Cpu className="w-8 h-8 text-amber-400" />,
      accentTitle: 'INDIA vs CHINA',
      tagline: 'Compute · Patents · Research',
      glowColor: 'bg-blue-500/20',
    },
    'moral-story': {
      gradient: 'from-amber-950 via-yellow-950 to-neutral-950',
      badgeText: 'HINDI MOTIVATION',
      badgeBg: 'bg-amber-500/25 border-amber-500/50',
      badgeColor: 'text-amber-300',
      mainIcon: <Flame className="w-8 h-8 text-yellow-400" />,
      accentTitle: 'THEY LAUGHED AT HIM',
      tagline: 'Until He Proved Them Wrong',
      glowColor: 'bg-amber-500/20',
    },
    notebooklm: {
      gradient: 'from-violet-950 via-purple-900 to-slate-950',
      badgeText: 'GOOGLE NOTEBOOKLM',
      badgeBg: 'bg-purple-500/25 border-purple-500/50',
      badgeColor: 'text-purple-300',
      mainIcon: <Bot className="w-8 h-8 text-fuchsia-400" />,
      accentTitle: 'NOTEBOOKLM IN HINDI',
      tagline: 'Research Assistant Complete Guide',
      glowColor: 'bg-purple-500/20',
    },
    'elevenlabs-voice': {
      gradient: 'from-cyan-950 via-blue-900 to-neutral-950',
      badgeText: 'AI AUDIO SYNTHESIS',
      badgeBg: 'bg-cyan-500/25 border-cyan-500/50',
      badgeColor: 'text-cyan-300',
      mainIcon: <Mic className="w-8 h-8 text-cyan-400" />,
      accentTitle: 'ELEVENLABS VOICE',
      tagline: 'Clone & Generate Voice in 2 Mins',
      glowColor: 'bg-cyan-500/20',
    },
    'gpt-astra': {
      gradient: 'from-emerald-950 via-teal-900 to-neutral-950',
      badgeText: 'PROJECT ASTRA',
      badgeBg: 'bg-emerald-500/25 border-emerald-500/50',
      badgeColor: 'text-emerald-300',
      mainIcon: <Zap className="w-8 h-8 text-emerald-400" />,
      accentTitle: 'GPT ASTRA: NEXT AGENT',
      tagline: 'Real-Time Multimodal Vision',
      glowColor: 'bg-emerald-500/20',
    },
    'leonardo-ai': {
      gradient: 'from-fuchsia-950 via-pink-900 to-purple-950',
      badgeText: 'FREE AI IMAGE GENERATOR',
      badgeBg: 'bg-pink-500/25 border-pink-500/50',
      badgeColor: 'text-pink-300',
      mainIcon: <Palette className="w-8 h-8 text-pink-400" />,
      accentTitle: 'MASTER LEONARDO AI',
      tagline: 'Photorealistic Visuals in Minutes',
      glowColor: 'bg-pink-500/20',
    },
    'gamma-ai': {
      gradient: 'from-indigo-950 via-violet-900 to-slate-950',
      badgeText: 'AI PRESENTATIONS & SITES',
      badgeBg: 'bg-indigo-500/25 border-indigo-500/50',
      badgeColor: 'text-indigo-300',
      mainIcon: <Layout className="w-8 h-8 text-indigo-400" />,
      accentTitle: 'GAMMA AI TUTORIAL',
      tagline: 'Generate Slidedecks in Seconds',
      glowColor: 'bg-indigo-500/20',
    },
    'middle-class': {
      gradient: 'from-rose-950 via-red-900 to-neutral-950',
      badgeText: 'FINANCIAL REALITY',
      badgeBg: 'bg-rose-500/25 border-rose-500/50',
      badgeColor: 'text-rose-300',
      mainIcon: <TrendingUp className="w-8 h-8 text-rose-400" />,
      accentTitle: 'MIDDLE CLASS TRAP',
      tagline: 'Inflation, Jobs & AI Wealth',
      glowColor: 'bg-rose-500/20',
    },
    'top-5-ai': {
      gradient: 'from-orange-950 via-amber-900 to-neutral-950',
      badgeText: 'STUDENT & PRO TOOLKIT',
      badgeBg: 'bg-orange-500/25 border-orange-500/50',
      badgeColor: 'text-orange-300',
      mainIcon: <Sparkles className="w-8 h-8 text-amber-400" />,
      accentTitle: 'TOP 5 FREE AI TOOLS',
      tagline: 'Every Student & Pro Must Use 2026',
      glowColor: 'bg-orange-500/20',
    },
    'model-battle': {
      gradient: 'from-slate-950 via-neutral-900 to-blue-950',
      badgeText: 'MODEL SHOWDOWN',
      badgeBg: 'bg-neutral-800 border-neutral-700',
      badgeColor: 'text-amber-300',
      mainIcon: <Layers className="w-8 h-8 text-emerald-400" />,
      accentTitle: 'CHATGPT vs CLAUDE vs GEMINI',
      tagline: 'Benchmarked for Reasoning & Code',
      glowColor: 'bg-blue-500/20',
    },
    'ai-agents': {
      gradient: 'from-teal-950 via-cyan-900 to-neutral-950',
      badgeText: 'AUTONOMOUS WORKFLOWS',
      badgeBg: 'bg-teal-500/25 border-teal-500/50',
      badgeColor: 'text-teal-300',
      mainIcon: <Bot className="w-8 h-8 text-teal-400" />,
      accentTitle: 'AUTOMATE WITH AI AGENTS',
      tagline: 'Hands-Off Automation Guide',
      glowColor: 'bg-teal-500/20',
    },
    'viral-shorts': {
      gradient: 'from-red-950 via-rose-900 to-amber-950',
      badgeText: 'SHORT-FORM VIRALITY',
      badgeBg: 'bg-red-500/25 border-red-500/50',
      badgeColor: 'text-red-300',
      mainIcon: <Rocket className="w-8 h-8 text-yellow-400" />,
      accentTitle: 'VIRAL AI SHORTS',
      tagline: 'Create in 5 Mins with Free Tools',
      glowColor: 'bg-red-500/20',
    },
    'cortexx-trailer': {
      gradient: 'from-neutral-950 via-orange-950 to-neutral-950',
      badgeText: 'OFFICIAL CHANNEL TRAILER',
      badgeBg: 'bg-orange-500/25 border-orange-500/50',
      badgeColor: 'text-orange-400',
      mainIcon: <Award className="w-8 h-8 text-orange-500" />,
      accentTitle: 'WELCOME TO CORTEXX AI',
      tagline: 'Where Thinking Meets Technology',
      glowColor: 'bg-orange-500/20',
    },
  };

  const config =
    artworkConfigs[video.artworkType] || artworkConfigs['cortexx-trailer'];

  return (
    <div
      className={`w-full h-full relative overflow-hidden bg-gradient-to-br ${config.gradient} flex flex-col justify-between p-3.5 sm:p-4 select-none`}
    >
      {/* Background Decorative Tech Grid */}
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:14px_14px]"></div>
      <div
        className={`absolute -top-10 -right-10 w-32 h-32 rounded-full ${config.glowColor} blur-2xl pointer-events-none`}
      ></div>

      {/* Top Bar: Topic Badge + Channel Tag */}
      <div className="relative z-10 flex items-center justify-between gap-2">
        <span
          className={`text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border backdrop-blur-md ${config.badgeBg} ${config.badgeColor}`}
        >
          {config.badgeText}
        </span>
        <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-black/60 border border-neutral-700/60 text-[9px] font-mono font-bold text-neutral-300">
          <Youtube className="w-3 h-3 text-red-500" />
          <span>@CortexxWorld</span>
        </div>
      </div>

      {/* Centerpiece: Distinct Graphic Icon + Bold Headline + Glowing Play Emblem */}
      <div className="relative z-10 my-auto flex flex-col items-center text-center px-2 py-1">
        <div className="relative mb-1.5 flex items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-black/50 border border-neutral-700/60 flex items-center justify-center shadow-lg backdrop-blur-sm group-hover:scale-110 transition-transform">
            {config.mainIcon}
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center shadow-md">
            <Play className="w-3 h-3 fill-white ml-0.5" />
          </div>
        </div>

        <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-tight line-clamp-1 drop-shadow-md">
          {config.accentTitle}
        </h3>
        <p className="text-[10px] font-bold text-neutral-300 line-clamp-1 mt-0.5">
          {config.tagline}
        </p>
      </div>

      {/* Bottom Bar: Category & Views */}
      <div className="relative z-10 flex items-center justify-between text-[10px] font-mono font-bold text-neutral-300 pt-1 border-t border-white/10">
        <span className="text-orange-400 font-sans uppercase font-black tracking-wider text-[9px]">
          {video.category}
        </span>
        <span className="bg-black/60 px-1.5 py-0.5 rounded text-neutral-200">
          {video.duration}
        </span>
      </div>
    </div>
  );
};

export const YouTubeVideosView: React.FC<YouTubeVideosViewProps> = ({
  theme = 'dark',
}) => {
  const isLight = theme === 'light';

  // Video State with strict cleanup of any legacy third-party video storage
  const [videos, setVideos] = useState<YouTubeVideoItem[]>(() => {
    try {
      localStorage.removeItem('cortexx_youtube_videos_v1');
      localStorage.removeItem('cortexx_youtube_videos_v2');
      localStorage.removeItem('cortexx_youtube_videos_v3');

      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const hasBanned = parsed.some(
            (v: YouTubeVideoItem) =>
              v.youtubeId && BANNED_EXTERNAL_IDS.has(v.youtubeId)
          );
          if (!hasBanned) {
            return parsed;
          }
        }
      }
    } catch {
      // Fallback
    }
    return AUTHENTIC_CORTEXX_VIDEOS;
  });

  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideoItem>(
    videos[0]
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<YouTubeVideoItem | null>(null);
  const [editUrlInput, setEditUrlInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // New Video Form state
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newCategory, setNewCategory] =
    useState<YouTubeVideoItem['category']>('Practical AI');
  const [newDuration, setNewDuration] = useState('05:00');
  const [newDescription, setNewDescription] = useState('');

  // Keep selectedVideo in sync if videos change
  useEffect(() => {
    if (!videos.find(v => v.id === selectedVideo.id)) {
      setSelectedVideo(videos[0] || AUTHENTIC_CORTEXX_VIDEOS[0]);
    }
  }, [videos, selectedVideo]);

  // Persist exclusively genuine videos
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(videos));
    } catch {
      // ignore
    }
  }, [videos]);

  // Channel details provided by user
  const channelDetails = {
    handle: '@CortexxWorld',
    channelUrl: 'https://www.youtube.com/@CortexxWorld',
    joinedDate: 'Jun 26, 2026',
    subscribersCount: 93,
    videosCount: videos.length,
    totalViews:
      1380 +
      Math.max(
        0,
        videos
          .slice(AUTHENTIC_CORTEXX_VIDEOS.length)
          .reduce((sum, v) => sum + v.views, 0)
      ),
  };

  // Helper to extract YouTube video ID from various URL formats
  const extractYouTubeId = (url: string): string | null => {
    const trimmed = url.trim();
    if (!trimmed.includes('/') && trimmed.length === 11) {
      if (BANNED_EXTERNAL_IDS.has(trimmed)) return null;
      return trimmed;
    }
    try {
      const parsed = new URL(trimmed);
      if (parsed.hostname.includes('youtube.com')) {
        const v = parsed.searchParams.get('v');
        if (v && !BANNED_EXTERNAL_IDS.has(v)) return v;
        const parts = parsed.pathname.split('/');
        const last = parts[parts.length - 1];
        if (last && last.length === 11 && !BANNED_EXTERNAL_IDS.has(last))
          return last;
      } else if (parsed.hostname.includes('youtu.be')) {
        const parts = parsed.pathname.split('/');
        const id = parts[parts.length - 1];
        if (id) {
          const cleanId = id.split('?')[0];
          if (!BANNED_EXTERNAL_IDS.has(cleanId)) return cleanId;
        }
      }
    } catch {
      // Return null if invalid
    }
    return null;
  };

  // Exclusively connect to @CortexxWorld on YouTube - NEVER connect to other channels or global results
  const getVideoWatchUrl = (vid: YouTubeVideoItem): string => {
    if (vid.youtubeId && !BANNED_EXTERNAL_IDS.has(vid.youtubeId)) {
      return `https://www.youtube.com/watch?v=${vid.youtubeId}`;
    }
    if (
      vid.directUrl &&
      vid.directUrl !== 'https://www.youtube.com/@CortexxWorld' &&
      (vid.directUrl.includes('watch?v=') || vid.directUrl.includes('youtu.be/'))
    ) {
      return vid.directUrl;
    }
    // Strict channel-only videos: NEVER open global youtube.com/results search
    return `https://www.youtube.com/@CortexxWorld/videos`;
  };

  const handleAddVideo = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!newTitle.trim()) return;

    let ytId: string | undefined = undefined;
    if (newUrl.trim()) {
      const extracted = extractYouTubeId(newUrl);
      if (
        newUrl.includes('dQw4w9WgXcQ') ||
        (extracted && BANNED_EXTERNAL_IDS.has(extracted))
      ) {
        setErrorMessage(
          'Cannot add external music/placeholder video. Please link only your @CortexxWorld videos.'
        );
        return;
      }
      ytId = extracted || undefined;
    }

    const newVid: YouTubeVideoItem = {
      id: `cortexx-user-${Date.now()}`,
      youtubeId: ytId,
      directUrl: newUrl.trim() || channelDetails.channelUrl,
      title: newTitle.trim(),
      category: newCategory,
      duration: newDuration.trim() || '05:00',
      views: 1,
      uploadedDate: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      description:
        newDescription.trim() ||
        'Educational video tutorial from Cortexx World (@CortexxWorld).',
      artworkType: 'cortexx-trailer',
    };

    const updated = [newVid, ...videos];
    setVideos(updated);
    setSelectedVideo(newVid);
    setIsAddModalOpen(false);
    setNewTitle('');
    setNewUrl('');
    setNewDescription('');
  };

  const handleSaveVideoUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVideo) return;
    setErrorMessage(null);

    const trimmed = editUrlInput.trim();
    if (trimmed.includes('dQw4w9WgXcQ')) {
      setErrorMessage(
        'Cannot link third-party music video. Please provide your @CortexxWorld video link.'
      );
      return;
    }

    const extracted = extractYouTubeId(trimmed);
    const updated = videos.map(v => {
      if (v.id === editingVideo.id) {
        return {
          ...v,
          youtubeId: extracted || undefined,
          directUrl: trimmed || channelDetails.channelUrl,
        };
      }
      return v;
    });

    setVideos(updated);
    if (selectedVideo.id === editingVideo.id) {
      setSelectedVideo({
        ...selectedVideo,
        youtubeId: extracted || undefined,
        directUrl: trimmed || channelDetails.channelUrl,
      });
    }
    setEditingVideo(null);
    setEditUrlInput('');
  };

  const handleDeleteVideo = (id: string) => {
    const updated = videos.filter(v => v.id !== id);
    setVideos(updated);
    if (selectedVideo.id === id && updated.length > 0) {
      setSelectedVideo(updated[0]);
    }
  };

  const handleShare = (video: YouTubeVideoItem) => {
    const url = getVideoWatchUrl(video);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedId(video.id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  // Filtered list
  const filteredVideos = videos.filter(v => {
    const matchesSearch =
      v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All' || v.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    'All',
    'Practical AI',
    'Tutorials',
    'Masterclasses',
    'Projects',
    'Announcements',
  ];

  // Shared KPI card classes matching Dashboard exactly
  const kpiCardClass = isLight
    ? 'dashboard-kpi-card bg-white border-2 border-neutral-200 border-t-4 border-t-orange-500 shadow-md hover:border-orange-500 text-black rounded-xl p-5 transition-all relative overflow-hidden'
    : 'dashboard-kpi-card bg-neutral-900/80 border border-neutral-800 border-t-4 border-t-orange-500 hover:border-neutral-700 text-neutral-100 rounded-xl p-5 transition-all relative overflow-hidden';

  const kpiTitleClass = isLight
    ? 'text-xs font-black tracking-wider uppercase text-black font-sans'
    : 'text-xs font-bold tracking-wider uppercase text-neutral-200 font-sans';

  const kpiNumberClass = isLight
    ? 'text-2xl sm:text-3xl font-black font-sans tabular-nums text-black tracking-tight'
    : 'text-2xl sm:text-3xl font-black font-sans tabular-nums text-white tracking-tight';

  const kpiSubtextClass = isLight
    ? 'mt-2.5 text-xs text-black font-extrabold font-sans'
    : 'mt-2.5 text-xs text-neutral-300 font-semibold font-sans';

  const kpiBadgeClass =
    'kpi-orange-badge text-[11px] uppercase font-black tracking-wider px-2.5 py-0.5 rounded-md bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30 font-sans shrink-0';

  const kpiIconBoxClass =
    'w-9 h-9 rounded-xl bg-orange-500/15 border border-orange-500/35 flex items-center justify-center text-orange-600 dark:text-orange-400 shadow-sm shrink-0';

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Hero Command Center Header - Exact Dashboard Appearance */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border transition-all ${
          isLight
            ? 'bg-gradient-to-r from-orange-50 via-white to-amber-50 border-neutral-200 shadow-sm'
            : 'bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 border-neutral-800'
        } flex flex-col md:flex-row md:items-center justify-between gap-4`}
      >
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-red-500/15 border-2 border-red-500/40 flex items-center justify-center text-red-600 dark:text-red-500 shrink-0 shadow-sm">
            <Youtube className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1
                className={`text-xl sm:text-2xl font-black tracking-tight ${
                  isLight ? 'text-black' : 'text-neutral-100'
                }`}
              >
                Cortexx World YouTube Hub
              </h1>
              <a
                href={channelDetails.channelUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30 hover:bg-red-500/25 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>{channelDetails.handle}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                Official Channel Only
              </span>
            </div>
            <p
              className={`text-xs sm:text-sm mt-0.5 font-bold ${
                isLight ? 'text-black' : 'text-neutral-300'
              }`}
            >
              Exclusive YouTube Channel Videos, AI Masterclasses, Emerging Tech &
              In-Depth Tutorials
            </p>
          </div>
        </div>

        {/* Action Buttons: Subscribe, Open Channel, & Add Video */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <a
            href="https://www.youtube.com/@CortexxWorld?sub_confirmation=1"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Youtube className="w-4 h-4" />
            <span>Subscribe ({channelDetails.subscribersCount})</span>
          </a>

          <a
            href={channelDetails.channelUrl}
            target="_blank"
            rel="noreferrer"
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
              isLight
                ? 'bg-white hover:bg-neutral-50 text-black border-neutral-300 shadow-xs'
                : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border-neutral-800'
            }`}
          >
            <ExternalLink className="w-3.5 h-3.5 text-orange-500" />
            <span>Open @CortexxWorld</span>
          </a>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-black text-xs rounded-xl shadow-md transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Channel Video</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Cards - Exact Dashboard Style & Channel Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Subscribers */}
        <div className={kpiCardClass}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="kpi-emoji text-lg select-none shrink-0"
                role="img"
                aria-label="Subscribers"
              >
                👥
              </span>
              <span className={kpiTitleClass}>Subscribers</span>
            </div>
            <div className={kpiIconBoxClass}>
              <Users className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between gap-2">
            <span className={kpiNumberClass}>
              {channelDetails.subscribersCount}
            </span>
            <span className={kpiBadgeClass}>Community</span>
          </div>
          <div className={kpiSubtextClass}>
            <span
              className={
                isLight ? 'text-black font-extrabold' : 'text-neutral-300'
              }
            >
              Active AI Learners & Subs
            </span>
          </div>
        </div>

        {/* KPI 2: Uploaded Videos */}
        <div className={kpiCardClass}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="kpi-emoji text-lg select-none shrink-0"
                role="img"
                aria-label="Uploaded Videos"
              >
                🎬
              </span>
              <span className={kpiTitleClass}>Uploaded Videos</span>
            </div>
            <div className={kpiIconBoxClass}>
              <Video className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between gap-2">
            <span className={kpiNumberClass}>
              {channelDetails.videosCount} Videos
            </span>
            <span className={kpiBadgeClass}>Official</span>
          </div>
          <div className={kpiSubtextClass}>
            <span
              className={
                isLight ? 'text-black font-extrabold' : 'text-neutral-300'
              }
            >
              Only @CortexxWorld Uploads
            </span>
          </div>
        </div>

        {/* KPI 3: Total Channel Views */}
        <div className={kpiCardClass}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="kpi-emoji text-lg select-none shrink-0"
                role="img"
                aria-label="Total Views"
              >
                👁️
              </span>
              <span className={kpiTitleClass}>Total Channel Views</span>
            </div>
            <div className={kpiIconBoxClass}>
              <Eye className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between gap-2">
            <span className={kpiNumberClass}>
              {channelDetails.totalViews.toLocaleString('en-IN')}
            </span>
            <span className={kpiBadgeClass}>Traffic</span>
          </div>
          <div className={kpiSubtextClass}>
            <span
              className={
                isLight ? 'text-black font-extrabold' : 'text-neutral-300'
              }
            >
              Watch Impressions & Traffic
            </span>
          </div>
        </div>

        {/* KPI 4: Joined Date & Status */}
        <div className={kpiCardClass}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="kpi-emoji text-lg select-none shrink-0"
                role="img"
                aria-label="Joined Date"
              >
                🌟
              </span>
              <span className={kpiTitleClass}>Channel Joined</span>
            </div>
            <div className={kpiIconBoxClass}>
              <Calendar className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between gap-2">
            <span
              className={`text-xl sm:text-2xl font-black font-sans tracking-tight ${
                isLight ? 'text-black' : 'text-white'
              }`}
            >
              {channelDetails.joinedDate}
            </span>
            <span className={kpiBadgeClass}>Verified</span>
          </div>
          <div className={kpiSubtextClass}>
            <span
              className={
                isLight ? 'text-black font-extrabold' : 'text-neutral-300'
              }
            >
              Cortexx World Official
            </span>
          </div>
        </div>
      </div>

      {/* Now Playing: BLOCK - Direct Connect with YouTube & Clear Visible Action Icons */}
      {selectedVideo && (
        <div
          className={`border rounded-2xl p-5 sm:p-6 shadow-md transition-all ${
            isLight
              ? 'bg-white border-2 border-neutral-200 text-black'
              : 'bg-neutral-900/80 border border-neutral-800 text-neutral-100'
          }`}
        >
          {/* Header Strip with High-Contrast Clear Icons */}
          <div
            className={`flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b gap-3 ${
              isLight ? 'border-neutral-200' : 'border-neutral-800'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Tv className="w-5 h-5 text-red-500 shrink-0" />
              <h2
                className={`text-base font-black tracking-tight ${
                  isLight ? 'text-black' : 'text-neutral-100'
                }`}
              >
                Now Playing:{' '}
                <span className="text-orange-600 dark:text-orange-400">
                  {selectedVideo.title}
                </span>
              </h2>
            </div>

            {/* Top Action Bar with Clearly Visible Colorful Badges & Icons */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* 1. Direct Connect With YouTube Channel Button */}
              <a
                href={getVideoWatchUrl(selectedVideo)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-black rounded-xl bg-red-600 hover:bg-red-700 text-white transition-all shadow-md hover:shadow-lg cursor-pointer transform hover:-translate-y-0.5"
                title="Direct connect with @CortexxWorld on YouTube"
              >
                <Youtube className="w-4 h-4 fill-white" />
                <span>Watch on @CortexxWorld</span>
              </a>

              {/* 2. Link URL Icon: Bold Sky-Blue Button with Clear Visible Icon */}
              <button
                onClick={() => {
                  setEditingVideo(selectedVideo);
                  setEditUrlInput(
                    selectedVideo.youtubeId
                      ? `https://www.youtube.com/watch?v=${selectedVideo.youtubeId}`
                      : selectedVideo.directUrl || ''
                  );
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md border-2 border-blue-400/60 transition-all cursor-pointer transform hover:-translate-y-0.5"
                title="Link or edit YouTube video URL for this video"
              >
                <LinkIcon className="w-4 h-4 text-white" />
                <span>Link URL</span>
              </button>

              {/* 3. Share Icon: Bold Emerald Green Button with Clear Visible Icon */}
              <button
                onClick={() => handleShare(selectedVideo)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-xs shadow-md transition-all cursor-pointer border-2 transform hover:-translate-y-0.5 ${
                  copiedId === selectedVideo.id
                    ? 'bg-emerald-600 text-white border-emerald-400'
                    : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/50 hover:bg-emerald-600 hover:text-white'
                }`}
                title="Copy direct video link to share"
              >
                {copiedId === selectedVideo.id ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 text-emerald-600 dark:text-emerald-300" />
                    <span>Share</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Player + Information Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-5">
            {/* Player Stage - Direct Interactive Embed or Branded Artwork Stage */}
            <div className="lg:col-span-2">
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden border-2 border-neutral-800 shadow-2xl bg-black flex flex-col items-center justify-center">
                {selectedVideo.youtubeId &&
                !BANNED_EXTERNAL_IDS.has(selectedVideo.youtubeId) ? (
                  <iframe
                    className="w-full h-full"
                    src={`https://www.youtube-nocookie.com/embed/${selectedVideo.youtubeId}?autoplay=0&rel=0`}
                    title={selectedVideo.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  ></iframe>
                ) : (
                  // Custom Cortexx World Branded Cinema Stage with Direct Connect Action
                  <div className="w-full h-full relative">
                    <VideoThumbnailArtwork
                      video={selectedVideo}
                      size="lg"
                    />

                    {/* Interactive Overlay to Direct Connect with YouTube */}
                    <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center">
                      <div className="max-w-md space-y-3">
                        <div className="flex items-center justify-center gap-2">
                          <span className="px-3 py-1 rounded-full bg-red-600 text-white text-xs font-black uppercase tracking-wider shadow-lg flex items-center gap-1.5">
                            <Youtube className="w-3.5 h-3.5 fill-white" />
                            <span>@CortexxWorld Channel Video</span>
                          </span>
                        </div>

                        <h3 className="text-lg sm:text-xl font-black text-white leading-tight drop-shadow-lg">
                          {selectedVideo.title}
                        </h3>

                        <p className="text-xs text-neutral-200 line-clamp-2 max-w-sm mx-auto">
                          {selectedVideo.description}
                        </p>

                        <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
                          {/* Direct Connect Button */}
                          <a
                            href={getVideoWatchUrl(selectedVideo)}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider shadow-xl transition-transform hover:scale-105 cursor-pointer"
                          >
                            <Play className="w-4 h-4 fill-white" />
                            <span>Watch on @CortexxWorld</span>
                          </a>

                          {/* Link URL Button */}
                          <button
                            onClick={() => {
                              setEditingVideo(selectedVideo);
                              setEditUrlInput(
                                selectedVideo.youtubeId
                                  ? `https://www.youtube.com/watch?v=${selectedVideo.youtubeId}`
                                  : selectedVideo.directUrl || ''
                              );
                            }}
                            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white border-2 border-blue-400 font-bold text-xs transition-colors cursor-pointer shadow-md"
                          >
                            <LinkIcon className="w-3.5 h-3.5 text-white" />
                            <span>Set Direct URL</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Video Meta & Description */}
            <div className="flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-black uppercase px-2.5 py-0.5 rounded-md bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30">
                    {selectedVideo.category}
                  </span>
                  <span
                    className={`text-xs font-mono font-bold flex items-center gap-1 ${
                      isLight ? 'text-black' : 'text-neutral-400'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5 text-neutral-500" />
                    {selectedVideo.duration}
                  </span>
                  <span
                    className={`text-xs font-mono font-bold flex items-center gap-1 ${
                      isLight ? 'text-black' : 'text-neutral-400'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5 text-neutral-500" />
                    {selectedVideo.views} views
                  </span>
                  <span
                    className={`text-xs font-mono font-bold flex items-center gap-1 ${
                      isLight ? 'text-black' : 'text-neutral-400'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                    {selectedVideo.uploadedDate}
                  </span>
                </div>

                <h3
                  className={`text-lg font-black leading-snug ${
                    isLight ? 'text-black' : 'text-neutral-100'
                  }`}
                >
                  {selectedVideo.title}
                </h3>

                <p
                  className={`text-xs leading-relaxed font-bold ${
                    isLight ? 'text-neutral-900' : 'text-neutral-300'
                  }`}
                >
                  {selectedVideo.description}
                </p>
              </div>

              {/* Official Channel Card with Subscribe Button */}
              <div
                className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                  isLight
                    ? 'bg-orange-50/70 border-orange-200 text-black'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-red-600 flex items-center justify-center text-white font-black text-xs shrink-0 shadow-sm">
                    C
                  </div>
                  <div>
                    <div className="font-black text-xs">
                      Cortexx AI (@CortexxWorld)
                    </div>
                    <div
                      className={`text-[10px] font-bold ${
                        isLight ? 'text-neutral-700' : 'text-neutral-400'
                      }`}
                    >
                      93 Subscribers · 13 Videos · 1,380 Views
                    </div>
                  </div>
                </div>
                <a
                  href="https://www.youtube.com/@CortexxWorld?sub_confirmation=1"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-lg transition-colors shrink-0 shadow-xs cursor-pointer"
                >
                  Subscribe
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video Section Controls: Filter & Search */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-orange-600 text-white shadow-sm'
                    : isLight
                    ? 'bg-white hover:bg-orange-50 text-black border border-neutral-300'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search
              className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${
                isLight ? 'text-neutral-500' : 'text-neutral-400'
              }`}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search @CortexxWorld videos..."
              className={`w-full pl-9 pr-3 py-2 border rounded-xl text-xs focus:outline-none focus:border-orange-500 transition-colors ${
                isLight
                  ? 'bg-white border-neutral-300 text-black placeholder-neutral-500 shadow-xs font-bold'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-200 placeholder-neutral-500 font-medium'
              }`}
            />
          </div>
        </div>

        {/* Video Section Grid - Authentic Thumbnails for Each Video with Direct Connect & High-Visibility Action Icons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredVideos.map(vid => {
            const isPlaying = selectedVideo?.id === vid.id;
            const watchUrl = getVideoWatchUrl(vid);

            return (
              <div
                key={vid.id}
                onClick={() => {
                  setSelectedVideo(vid);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`border rounded-2xl overflow-hidden transition-all group flex flex-col justify-between ${
                  isPlaying
                    ? 'border-2 border-orange-500 shadow-lg ring-2 ring-orange-500/20'
                    : isLight
                    ? 'bg-white border-2 border-neutral-200 shadow-sm hover:border-orange-400'
                    : 'bg-neutral-900/80 border border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div>
                  {/* Thumbnail Container: Clicking selects video to preview in Now Playing player */}
                  <div
                    onClick={() => {
                      setSelectedVideo(vid);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="relative aspect-video block bg-neutral-950 overflow-hidden cursor-pointer"
                    title={`Click to preview in player: ${vid.title}`}
                  >
                    {/* Visual Artwork Thumbnail */}
                    <VideoThumbnailArtwork video={vid} size="md" />

                    {/* Direct Connect Play Overlay on Hover */}
                    <div className="absolute inset-0 bg-black/25 group-hover:bg-black/45 transition-colors flex items-center justify-center opacity-90 group-hover:opacity-100">
                      <div className="w-13 h-13 rounded-full bg-red-600 text-white flex items-center justify-center shadow-2xl group-hover:scale-115 transition-transform duration-200 border-2 border-white/40">
                        <Play className="w-6 h-6 fill-white ml-0.5" />
                      </div>
                    </div>

                    {/* Channel Tag on Top Right */}
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-red-600 text-white text-[10px] font-black uppercase tracking-wider shadow-md flex items-center gap-1">
                      <Youtube className="w-3 h-3 fill-white" />
                      <span>@CortexxWorld</span>
                    </div>
                  </div>

                  {/* Body Content - High Contrast Black in Light Mode */}
                  <div className="p-4 space-y-2">
                    <h4
                      className={`text-sm font-black line-clamp-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors ${
                        isLight ? 'text-black' : 'text-neutral-100'
                      }`}
                    >
                      {vid.title}
                    </h4>

                    <p
                      className={`text-xs line-clamp-2 font-bold ${
                        isLight ? 'text-neutral-900' : 'text-neutral-300'
                      }`}
                    >
                      {vid.description}
                    </p>
                  </div>
                </div>

                {/* Footer Metrics & CLEARLY VISIBLE COLORFUL ACTION ICONS */}
                <div
                  className={`p-4 pt-3 border-t flex items-center justify-between text-xs font-mono font-bold ${
                    isLight
                      ? 'border-neutral-200 text-black'
                      : 'border-neutral-800 text-neutral-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{vid.views} views</span>
                    <span>·</span>
                    <span>{vid.uploadedDate}</span>
                  </div>

                  {/* Clearly Visible Action Buttons: Watch on YouTube, Link URL, Share */}
                  <div
                    className="flex items-center gap-1.5"
                    onClick={e => e.stopPropagation()}
                  >
                    {/* Direct Connect & Watch on @CortexxWorld Channel */}
                    <a
                      href={watchUrl}
                      target="_blank"
                      rel="noreferrer"
                      title="Open on @CortexxWorld channel"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-black text-xs shadow-sm transition-all cursor-pointer transform hover:scale-105"
                    >
                      <Youtube className="w-3.5 h-3.5 fill-white" />
                      <span>@CortexxWorld</span>
                    </a>

                    {/* Link URL Icon Button: High-Visibility Sky-Blue Button */}
                    <button
                      onClick={() => {
                        setEditingVideo(vid);
                        setEditUrlInput(
                          vid.youtubeId
                            ? `https://www.youtube.com/watch?v=${vid.youtubeId}`
                            : vid.directUrl || ''
                        );
                      }}
                      title="Link or edit YouTube URL"
                      className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm border border-blue-400 transition-all cursor-pointer transform hover:scale-110"
                    >
                      <LinkIcon className="w-4 h-4 text-white stroke-[2.5]" />
                    </button>

                    {/* Share Icon Button: High-Visibility Emerald Green Button */}
                    <button
                      onClick={() => handleShare(vid)}
                      title="Share / Copy Link"
                      className={`p-1.5 rounded-lg text-white shadow-sm transition-all cursor-pointer transform hover:scale-110 border ${
                        copiedId === vid.id
                          ? 'bg-emerald-600 border-emerald-400 ring-2 ring-emerald-400/40'
                          : 'bg-emerald-600 hover:bg-emerald-700 border-emerald-400'
                      }`}
                    >
                      {copiedId === vid.id ? (
                        <CheckCircle2 className="w-4 h-4 text-white stroke-[2.5]" />
                      ) : (
                        <Share2 className="w-4 h-4 text-white stroke-[2.5]" />
                      )}
                    </button>

                    {vid.id.startsWith('cortexx-user-') && (
                      <button
                        onClick={() => handleDeleteVideo(vid.id)}
                        title="Delete Video"
                        className="p-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-sm border border-rose-400 transition-all cursor-pointer transform hover:scale-110"
                      >
                        <Trash2 className="w-4 h-4 text-white stroke-[2.5]" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Video Link Modal */}
      {editingVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div
            className={`border rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 ${
              isLight
                ? 'bg-white border-neutral-300 text-black'
                : 'bg-neutral-900 border-neutral-800 text-neutral-100'
            }`}
          >
            <div
              className={`flex items-center justify-between pb-3 border-b ${
                isLight ? 'border-neutral-200' : 'border-neutral-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
                  <LinkIcon className="w-4 h-4 text-white" />
                </div>
                <h3
                  className={`text-base sm:text-lg font-black ${
                    isLight ? 'text-black' : 'text-neutral-100'
                  }`}
                >
                  Link YouTube Video from @CortexxWorld
                </h3>
              </div>
              <button
                onClick={() => {
                  setEditingVideo(null);
                  setErrorMessage(null);
                }}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-black uppercase text-blue-500">
                Selected Video
              </span>
              <p
                className={`text-sm font-bold ${
                  isLight ? 'text-black' : 'text-neutral-200'
                }`}
              >
                {editingVideo.title}
              </p>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSaveVideoUrl} className="space-y-4">
              <div>
                <label
                  className={`block text-xs font-black uppercase tracking-wider mb-1.5 ${
                    isLight ? 'text-black' : 'text-neutral-300'
                  }`}
                >
                  YouTube Video Watch URL or Video ID
                </label>
                <input
                  type="text"
                  value={editUrlInput}
                  onChange={e => {
                    setEditUrlInput(e.target.value);
                    setErrorMessage(null);
                  }}
                  placeholder="e.g. https://www.youtube.com/watch?v=... or youtu.be/..."
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono focus:outline-none focus:border-blue-500 ${
                    isLight
                      ? 'bg-neutral-50 border-neutral-300 text-black font-bold'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-100'
                  }`}
                />
                <p
                  className={`text-[11px] mt-1.5 ${
                    isLight
                      ? 'text-neutral-600 font-bold'
                      : 'text-neutral-400'
                  }`}
                >
                  Only paste videos from your official channel{' '}
                  <span className="font-bold text-orange-500">@CortexxWorld</span>.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingVideo(null);
                    setErrorMessage(null);
                  }}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    isLight
                      ? 'bg-neutral-100 hover:bg-neutral-200 text-black'
                      : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-md transition-colors cursor-pointer"
                >
                  Save URL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Custom Channel Video Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div
            className={`border rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 ${
              isLight
                ? 'bg-white border-neutral-300 text-black'
                : 'bg-neutral-900 border-neutral-800 text-neutral-100'
            }`}
          >
            <div
              className={`flex items-center justify-between pb-3 border-b ${
                isLight ? 'border-neutral-200' : 'border-neutral-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <Youtube className="w-5 h-5 text-red-500" />
                <h3
                  className={`text-lg font-black ${
                    isLight ? 'text-black' : 'text-neutral-100'
                  }`}
                >
                  Add @CortexxWorld Video
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setErrorMessage(null);
                }}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleAddVideo} className="space-y-4">
              <div>
                <label
                  className={`block text-xs font-black uppercase tracking-wider mb-1.5 ${
                    isLight ? 'text-black' : 'text-neutral-300'
                  }`}
                >
                  YouTube Video URL or ID
                </label>
                <input
                  type="text"
                  value={newUrl}
                  onChange={e => {
                    setNewUrl(e.target.value);
                    setErrorMessage(null);
                  }}
                  placeholder="https://www.youtube.com/watch?v=... or youtu.be/..."
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono focus:outline-none focus:border-orange-500 ${
                    isLight
                      ? 'bg-neutral-50 border-neutral-300 text-black font-bold'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-100'
                  }`}
                />
              </div>

              <div>
                <label
                  className={`block text-xs font-black uppercase tracking-wider mb-1.5 ${
                    isLight ? 'text-black' : 'text-neutral-300'
                  }`}
                >
                  Video Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Masterclass: Fine-Tuning Multi-Modal LLMs"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-orange-500 ${
                    isLight
                      ? 'bg-neutral-50 border-neutral-300 text-black font-bold'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-100'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    className={`block text-xs font-black uppercase tracking-wider mb-1.5 ${
                      isLight ? 'text-black' : 'text-neutral-300'
                    }`}
                  >
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={e =>
                      setNewCategory(
                        e.target.value as YouTubeVideoItem['category']
                      )
                    }
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-bold focus:outline-none focus:border-orange-500 cursor-pointer ${
                      isLight
                        ? 'bg-neutral-50 border-neutral-300 text-black'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-100'
                    }`}
                  >
                    <option value="Practical AI">Practical AI</option>
                    <option value="Tutorials">Tutorials</option>
                    <option value="Masterclasses">Masterclasses</option>
                    <option value="Projects">Projects</option>
                    <option value="Announcements">Announcements</option>
                  </select>
                </div>

                <div>
                  <label
                    className={`block text-xs font-black uppercase tracking-wider mb-1.5 ${
                      isLight ? 'text-black' : 'text-neutral-300'
                    }`}
                  >
                    Duration (mm:ss)
                  </label>
                  <input
                    type="text"
                    value={newDuration}
                    onChange={e => setNewDuration(e.target.value)}
                    placeholder="05:30"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono focus:outline-none focus:border-orange-500 ${
                      isLight
                        ? 'bg-neutral-50 border-neutral-300 text-black font-bold'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-100'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label
                  className={`block text-xs font-black uppercase tracking-wider mb-1.5 ${
                    isLight ? 'text-black' : 'text-neutral-300'
                  }`}
                >
                  Description
                </label>
                <textarea
                  rows={3}
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  placeholder="Summary of topics covered in this video..."
                  className={`w-full px-3.5 py-2 rounded-xl border text-sm focus:outline-none focus:border-orange-500 ${
                    isLight
                      ? 'bg-neutral-50 border-neutral-300 text-black font-bold'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-100'
                  }`}
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setErrorMessage(null);
                  }}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    isLight
                      ? 'bg-neutral-100 hover:bg-neutral-200 text-black'
                      : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl shadow-md transition-colors cursor-pointer"
                >
                  Save Video
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
