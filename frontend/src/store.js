import { create } from 'zustand';

// ============================================
// AUTH STORE
// ============================================
export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isLoading: false,
  error: null,

  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  logout: () => set({ user: null, token: null, error: null }),

  // Initialize from localStorage
  hydrate: () => {
    try {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      if (token && user) {
        set({ token, user: JSON.parse(user) });
      }
    } catch (error) {
      console.error('Hydrate error:', error);
    }
  }
}));

// ============================================
// QUOTE STORE
// ============================================
export const useQuoteStore = create((set) => ({
  quotes: [],
  currentQuote: null,
  favorites: [],
  categories: [],
  isLoading: false,
  selectedCategory: null,

  setQuotes: (quotes) => set({ quotes }),
  setCurrentQuote: (quote) => set({ currentQuote: quote }),
  setFavorites: (favorites) => set({ favorites }),
  setCategories: (categories) => set({ categories }),
  setLoading: (isLoading) => set({ isLoading }),
  setSelectedCategory: (category) => set({ selectedCategory: category }),

  addFavorite: (quote) => set((state) => ({
    favorites: [...state.favorites, quote]
  })),

  removeFavorite: (quoteId) => set((state) => ({
    favorites: state.favorites.filter(q => q.id !== quoteId)
  })),

  isFavorited: (quoteId) => {
    const state = useQuoteStore.getState();
    return state.favorites.some(q => q.id === quoteId);
  }
}));

// ============================================
// AUDIO STORE
// ============================================
export const useAudioStore = create((set) => ({
  audioLibrary: {
    solfeggio: [],
    nature: []
  },
  currentAudio: null,
  isPlaying: false,
  volume: 0.7,
  stats: {
    totalSessions: 0,
    totalMinutes: 0,
    avgDuration: 0,
    lastSession: null
  },
  achievements: [],

  setAudioLibrary: (library) => set({ audioLibrary: library }),
  setCurrentAudio: (audio) => set({ currentAudio: audio }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)) }),
  setStats: (stats) => set({ stats }),
  setAchievements: (achievements) => set({ achievements }),

  togglePlayPause: () => set((state) => ({
    isPlaying: !state.isPlaying
  }))
}));

// ============================================
// SUBSCRIPTION STORE
// ============================================
export const useSubscriptionStore = create((set) => ({
  plans: [],
  currentSubscription: null,
  isPremium: false,
  isLoading: false,

  setPlans: (plans) => set({ plans }),
  setCurrentSubscription: (subscription) => set({ currentSubscription: subscription }),
  setIsPremium: (isPremium) => set({ isPremium }),
  setLoading: (isLoading) => set({ isLoading })
}));

// ============================================
// APP STORE (General app state)
// ============================================
export const useAppStore = create((set) => ({
  theme: 'light',
  sidebarOpen: true,
  notifications: [],
  isLoading: false,

  setTheme: (theme) => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
    set({ theme });
  },

  toggleTheme: () => {
    set((state) => {
      const newTheme = state.theme === 'light' ? 'dark' : 'light';
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('theme', newTheme);
      return { theme: newTheme };
    });
  },

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  addNotification: (notification) => set((state) => ({
    notifications: [...state.notifications, { ...notification, id: Date.now() }]
  })),

  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter(n => n.id !== id)
  })),

  setLoading: (isLoading) => set({ isLoading }),

  // Initialize theme from localStorage
  hydrateTheme: () => {
    try {
      const theme = localStorage.getItem('theme') || 'light';
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      }
      set({ theme });
    } catch (error) {
      console.error('Hydrate theme error:', error);
    }
  }
}));