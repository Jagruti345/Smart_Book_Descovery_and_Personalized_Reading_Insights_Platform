const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("bookapp_token");
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem("bookapp_token", token);
  else localStorage.removeItem("bookapp_token");
}

interface RequestOptions extends RequestInit {
  auth?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { auth = true, headers, ...rest } = options;
  const finalHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(headers as Record<string, string>),
  };
  if (auth) {
    const token = getToken();
    if (token) finalHeaders["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...rest, headers: finalHeaders });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch {
      /* no-op */
    }
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  // auth
  register: (data: { name: string; email: string; password: string }) =>
    request<{ access_token: string }>("/api/auth/register", { method: "POST", body: JSON.stringify(data), auth: false }),
  login: (data: { email: string; password: string }) =>
    request<{ access_token: string }>("/api/auth/login", { method: "POST", body: JSON.stringify(data), auth: false }),
  me: () => request("/api/auth/me"),

  // books
  listBooks: (params: Record<string, string> = {}) =>
    request(`/api/books?${new URLSearchParams(params).toString()}`, { auth: false }),
  trendingBooks: (limit = 10) => request(`/api/books/trending?limit=${limit}`, { auth: false }),
  getBook: (id: number) => request(`/api/books/${id}`, { auth: false }),
  getBookChapters: (id: number) => request<import("@/types").Chapter[]>(`/api/books/${id}/chapters`, { auth: false }),
  getGutenbergText: (gutenbergId: string) => request<{ gutenberg_id: string; text: string; has_more: boolean }>(`/api/books/gutenberg/text/${gutenbergId}`, { auth: false }),
  searchOpenLibrary: (q: string, limit = 20) =>
    request<import("@/types").OpenLibraryBook[]>(`/api/books/open-library/search?q=${encodeURIComponent(q)}&limit=${limit}`, { auth: false }),
  getBookSummary: (id: number) => request(`/api/books/${id}/summary`, { auth: false }),
  getPrices: (id: number) => request(`/api/books/${id}/prices`, { auth: false }),
  toggleWishlist: (book_id: number) =>
    request<{ wishlisted: boolean }>("/api/books/wishlist/toggle", { method: "POST", body: JSON.stringify({ book_id }) }),
  myWishlist: () => request("/api/books/wishlist/mine"),

  // recommendations
  personalized: (limit = 12) => request(`/api/recommendations/personalized?limit=${limit}`),
  trendingRecs: (limit = 10) => request(`/api/recommendations/trending?limit=${limit}`, { auth: false }),

  // chatbot
  onboardingQuestions: () => request("/api/chatbot/onboarding/questions", { auth: false }),
  submitOnboarding: (payload: unknown) =>
    request("/api/chatbot/onboarding/submit", { method: "POST", body: JSON.stringify(payload) }),
  discover: (message: string, history: Array<{ role: string; content: string }> = []) =>
    request("/api/chatbot/discover", { method: "POST", body: JSON.stringify({ message, history }) }),

  // reading
  logSession: (payload: { book_id: number; minutes: number; mode: string; progress_percent?: number }) =>
    request("/api/reading/session", { method: "POST", body: JSON.stringify(payload) }),
  readingHistory: () => request("/api/reading/history"),

  // audiobooks
  listAudiobooks: () => request("/api/audiobooks", { auth: false }),
  audioLanguages: () => request("/api/audiobooks/languages", { auth: false }),
  streamInfo: (id: number) => request(`/api/audiobooks/${id}/stream-info`, { auth: false }),

  // reviews
  createReview: (payload: { book_id: number; stars: number; text: string }) =>
    request("/api/reviews", { method: "POST", body: JSON.stringify(payload) }),
  bookReviews: (bookId: number) => request(`/api/reviews/book/${bookId}`, { auth: false }),

  // analytics
  analyticsSummary: () => request<import("@/types").AnalyticsSummary>("/api/analytics/summary"),
  communityStats: () => request("/api/analytics/community-stats", { auth: false }),

  // admin
  adminUsers: () => request("/api/admin/users"),
  adminStats: () => request("/api/admin/stats"),
  moderationQueue: () => request("/api/admin/moderation/queue"),
  approveReview: (id: number) => request(`/api/admin/moderation/${id}/approve`, { method: "POST" }),
  deleteReview: (id: number) => request(`/api/admin/moderation/${id}`, { method: "DELETE" }),
  updateUserStatus: (id: number, is_active: boolean) =>
    request(`/api/admin/users/${id}/status?is_active=${is_active}`, { method: "PATCH" }),
  updateUserRole: (id: number, role: string) =>
    request(`/api/admin/users/${id}/role?role=${role}`, { method: "PATCH" }),
};
