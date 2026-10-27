from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field


# ---------- Auth ----------
class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=6)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    onboarding_complete: bool
    preferences: Dict[str, Any] = {}
    accessibility_settings: Dict[str, Any] = {}
    current_streak: int
    longest_streak: int
    total_minutes_read: int

    class Config:
        from_attributes = True


# ---------- Books ----------
class BookOut(BaseModel):
    id: int
    title: str
    author: str
    genres: List[str]
    tags: List[str]
    synopsis: str
    cover_url: str
    published_year: int
    avg_rating: float
    ratings_count: int
    page_count: int
    is_public_domain: bool
    gutenberg_id: str
    librivox_url: str
    mood: str
    pacing: str

    class Config:
        from_attributes = True


class BookDetailOut(BookOut):
    full_text_excerpt: str
    isbn: str


class PriceQuote(BaseModel):
    retailer: str
    price: str
    url: str


class RecommendedBookOut(BookOut):
    score: float
    reason: str
    match_percentage: int = 90
    synergy_tags: List[str] = []
    why_matched: str = ""


class ChapterOut(BaseModel):
    index: int
    title: str
    content: str
    word_count: int
    estimated_minutes: int


class OpenLibraryBookOut(BaseModel):
    key: str
    title: str
    author: str
    first_publish_year: Optional[int] = None
    cover_url: str
    edition_count: int = 1
    has_fulltext: bool = False
    subjects: List[str] = []
    ratings_average: Optional[float] = None
    ia_id: Optional[str] = None
    read_url: Optional[str] = None


# ---------- Onboarding / Chatbot ----------
class OnboardingAnswers(BaseModel):
    reading_frequency: str        # "casual" | "regular" | "bookworm"
    daily_minutes_goal: int = 15
    favorite_genres: List[str] = []
    loved_books_or_authors: List[str] = []
    preferred_format: str = "text"   # "text" | "audio" | "both"
    primary_purpose: str = "pleasure"  # "pleasure" | "self_improvement" | "academic"
    accessibility: Dict[str, Any] = {}


class DiscoveryQuery(BaseModel):
    message: str
    history: List[Dict[str, str]] = []  # [{"role": "user"/"assistant", "content": "..."}]


class DiscoveryResponse(BaseModel):
    reply: str
    books: List[RecommendedBookOut] = []
    extracted: Dict[str, Any] = {}


# ---------- Reviews ----------
class ReviewCreate(BaseModel):
    book_id: int
    stars: float = Field(ge=1, le=5)
    text: str = ""


class ReviewOut(BaseModel):
    id: int
    user_id: int
    user_name: Optional[str] = None
    book_id: int
    stars: float
    text: str
    is_flagged: bool

    class Config:
        from_attributes = True


# ---------- Reading / Analytics ----------
class ReadingSessionCreate(BaseModel):
    book_id: int
    minutes: int = Field(ge=1, le=600)
    mode: str = "text"
    progress_percent: float = 0.0
    started_at_hour: Optional[int] = None


class ReadingSessionOut(BaseModel):
    id: int
    book_id: int
    minutes: int
    mode: str
    progress_percent: float
    session_date: str

    class Config:
        from_attributes = True


class StreakUpdateResult(BaseModel):
    current_streak: int
    longest_streak: int
    total_minutes_read: int
    new_badges: List[str] = []


class WeeklyStat(BaseModel):
    date: str
    minutes: int


class GenreStat(BaseModel):
    genre: str
    minutes: int


class BadgeOut(BaseModel):
    code: str
    emoji: str
    name: str
    desc: str
    earned: bool


class MoodDistributionItem(BaseModel):
    mood: str
    percentage: int


class PacingDistribution(BaseModel):
    fast: int = 35
    medium: int = 50
    slow: int = 15


class FormatSplit(BaseModel):
    text_percent: int = 70
    audio_percent: int = 30


class NextMilestone(BaseModel):
    title: str
    progress: int
    target: int
    unit: str
    reward_emoji: str


class ReaderDnaProfile(BaseModel):
    archetype: str
    archetype_tagline: str
    dominant_vibe: str
    pacing_affinity: str
    reading_velocity_mins_per_day: int
    focus_window: str
    mood_distribution: List[MoodDistributionItem]
    pacing_distribution: PacingDistribution
    format_split: FormatSplit
    next_milestone: NextMilestone
    pattern_insights: List[str]
    goal_completion_rate: int


class AnalyticsSummary(BaseModel):
    current_streak: int
    longest_streak: int
    total_minutes_read: int
    weekly: List[WeeklyStat]
    genre_breakdown: List[GenreStat]
    badges: List[BadgeOut]
    community_reading_now: int
    reader_dna: Optional[ReaderDnaProfile] = None


# ---------- Wishlist ----------
class WishlistToggle(BaseModel):
    book_id: int


# ---------- Admin ----------
class AdminUserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    is_active: bool

    class Config:
        from_attributes = True


class AdminStats(BaseModel):
    total_users: int
    total_books: int
    total_reviews: int
    flagged_reviews: int
    total_reading_minutes: int
    top_books: List[Dict[str, Any]]
