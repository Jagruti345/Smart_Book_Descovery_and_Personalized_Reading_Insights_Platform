export interface AccessibilitySettings {
  fontSize: number;
  theme: "light" | "sepia" | "dark" | "max-contrast" | "high-contrast";
  dyslexicFont: boolean;
  ttsSpeed: number;
}

export interface UserPreferences {
  reading_frequency?: string;
  daily_minutes_goal?: number;
  favorite_genres?: string[];
  loved_books_or_authors?: string[];
  preferred_format?: string;
  primary_purpose?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: "user" | "admin";
  onboarding_complete: boolean;
  preferences: UserPreferences;
  accessibility_settings: AccessibilitySettings;
  current_streak: number;
  longest_streak: number;
  total_minutes_read: number;
}

export interface Book {
  id: number;
  title: string;
  author: string;
  genres: string[];
  tags: string[];
  synopsis: string;
  cover_url: string;
  published_year: number;
  avg_rating: number;
  ratings_count: number;
  page_count: number;
  is_public_domain: boolean;
  gutenberg_id: string;
  librivox_url: string;
  mood: string;
  pacing: string;
}

export interface BookDetail extends Book {
  full_text_excerpt: string;
  isbn: string;
}

export interface RecommendedBook extends Book {
  score: number;
  reason: string;
  match_percentage?: number;
  synergy_tags?: string[];
  why_matched?: string;
}

export interface Chapter {
  index: number;
  title: string;
  content: string;
  word_count: number;
  estimated_minutes: number;
}

export interface OpenLibraryBook {
  key: string;
  title: string;
  author: string;
  first_publish_year?: number;
  cover_url: string;
  edition_count: number;
  has_fulltext: boolean;
  subjects: string[];
  ratings_average?: number;
  ia_id?: string;
  read_url?: string;
}

export interface PriceQuote {
  retailer: string;
  price: string;
  url: string;
}

export interface OnboardingQuestion {
  key: string;
  prompt: string;
  type: "single_choice" | "multi_choice" | "free_text_list" | "accessibility_picker";
  options?: Array<{ value: string; label: string } | string>;
}

export interface DiscoveryResponse {
  reply: string;
  books: RecommendedBook[];
  extracted: Record<string, unknown>;
}

export interface Review {
  id: number;
  user_id: number;
  user_name?: string;
  book_id: number;
  stars: number;
  text: string;
  is_flagged: boolean;
}

export interface WeeklyStat {
  date: string;
  minutes: number;
}

export interface GenreStat {
  genre: string;
  minutes: number;
}

export interface Badge {
  code: string;
  emoji: string;
  name: string;
  desc: string;
  earned: boolean;
}

export interface ReaderDnaProfile {
  archetype: string;
  archetype_tagline: string;
  dominant_vibe: string;
  pacing_affinity: string;
  reading_velocity_mins_per_day: number;
  focus_window: string;
  mood_distribution: Array<{ mood: string; percentage: number }>;
  pacing_distribution: { fast: number; medium: number; slow: number };
  format_split: { text_percent: number; audio_percent: number };
  next_milestone: {
    title: string;
    progress: number;
    target: number;
    unit: string;
    reward_emoji: string;
  };
  pattern_insights: string[];
  goal_completion_rate: number;
}

export interface AnalyticsSummary {
  current_streak: number;
  longest_streak: number;
  total_minutes_read: number;
  weekly: WeeklyStat[];
  genre_breakdown: GenreStat[];
  badges: Badge[];
  community_reading_now: number;
  reader_dna?: ReaderDnaProfile;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
}

export interface AdminStats {
  total_users: number;
  total_books: number;
  total_reviews: number;
  flagged_reviews: number;
  total_reading_minutes: number;
  top_books: Array<{ id: number; title: string; avg_rating: number; ratings_count: number }>;
}
