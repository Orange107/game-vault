import { create } from 'zustand';
import { PLATFORMS, type Game, type Tag } from './types';

const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';

interface RemoteStatePayload {
  tags: Tag[];
  games: Game[];
  customPlatforms: string[];
  deletedPlatforms: string[];
}

interface GameStore {
  tags: Tag[];
  games: Game[];
  selectedTagId: string | null;
  searchQuery: string;
  selectedPlatform: string | null;
  leftDrawerOpen: boolean;
  rightDrawerOpen: boolean;
  editingTagId: string | null;
  editingGameId: string | null;
  platformDrawerOpen: boolean;
  customPlatforms: string[];
  deletedPlatforms: string[];
  loading: boolean;
  error: string | null;
  initialized: boolean;

  initialize: () => Promise<void>;
  refreshData: () => Promise<void>;

  selectPlatform: (platform: string | null) => void;

  openPlatformDrawer: () => void;
  closePlatformDrawer: () => void;
  addPlatform: (name: string) => Promise<void>;
  deletePlatform: (name: string) => Promise<void>;
  updatePlatform: (oldName: string, newName: string) => Promise<void>;

  getAvailablePlatforms: () => string[];

  addTag: (name: string, description: string) => Promise<void>;
  updateTag: (id: string, name: string, description: string) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;
  deleteTags: (ids: string[]) => Promise<void>;
  selectTag: (id: string | null) => void;

  addGame: (game: Omit<Game, 'id' | 'implementations'>) => Promise<void>;
  updateGame: (id: string, updates: Partial<Game>) => Promise<void>;
  updateImplementation: (gameId: string, tagId: string, content: string) => Promise<void>;
  deleteGame: (id: string) => Promise<void>;

  openLeftDrawer: (tagId: string) => void;
  closeLeftDrawer: () => void;
  openRightDrawer: (gameId: string) => void;
  closeRightDrawer: () => void;

  setSearchQuery: (query: string) => void;
  getFilteredGames: () => Game[];
}

const apiRequest = async <T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> => {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    let errorMessage = `请求失败 (${response.status})`;
    try {
      const payload = await response.json();
      if (payload?.error) {
        errorMessage = String(payload.error);
      }
    } catch {
      // ignore non-json error body
    }
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
};

const ensureArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item || '').trim())
    .filter((item) => item.length > 0);
};

const ensurePlatformArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return ensureArray(value);
  }

  const single = String(value || '').trim();
  if (!single) return [];
  if (single.includes(',') || single.includes('，')) {
    return ensureArray(single.split(/[，,]/g).map((item) => item.trim()));
  }
  return [single];
};

const sanitizeGame = (game: Game): Game => {
  const thumbnails = ensureArray(game.thumbnails ?? []);
  const thumbnail = String(game.thumbnail ?? '').trim();
  const platform = ensurePlatformArray(game.platform);
  const aliases = ensureArray(game.aliases);
  return {
    ...game,
    aliases,
    platform: platform.length > 0 ? platform : ['PC'],
    thumbnail,
    thumbnails: thumbnails.length > 0 ? thumbnails : (thumbnail ? [thumbnail] : []),
    tags: ensureArray(game.tags),
    implementations:
      game.implementations && typeof game.implementations === 'object'
        ? game.implementations
        : {},
  };
};

const applyRemoteState = (
  previousState: GameStore,
  payload: RemoteStatePayload,
) => {
  const games = payload.games.map(sanitizeGame);
  const tags = payload.tags;
  const customPlatforms = ensureArray(payload.customPlatforms);
  const deletedPlatforms = ensureArray(payload.deletedPlatforms);
  const availableBuiltIns = PLATFORMS.filter((platform) => !deletedPlatforms.includes(platform));
  const allPlatforms = [...availableBuiltIns, ...customPlatforms];

  const nextSelectedPlatform =
    previousState.selectedPlatform && allPlatforms.includes(previousState.selectedPlatform)
      ? previousState.selectedPlatform
      : null;

  const nextSelectedTagId =
    previousState.selectedTagId && tags.some((tag) => tag.id === previousState.selectedTagId)
      ? previousState.selectedTagId
      : null;

  const nextEditingTagId =
    previousState.editingTagId && tags.some((tag) => tag.id === previousState.editingTagId)
      ? previousState.editingTagId
      : null;

  const nextEditingGameId =
    previousState.editingGameId && games.some((game) => game.id === previousState.editingGameId)
      ? previousState.editingGameId
      : null;

  return {
    tags,
    games,
    customPlatforms,
    deletedPlatforms,
    selectedPlatform: nextSelectedPlatform,
    selectedTagId: nextSelectedTagId,
    editingTagId: nextEditingTagId,
    editingGameId: nextEditingGameId,
    leftDrawerOpen: previousState.leftDrawerOpen && !!nextEditingTagId,
    rightDrawerOpen: previousState.rightDrawerOpen && !!nextEditingGameId,
  };
};

export const useGameStore = create<GameStore>()((set, get) => ({
  tags: [],
  games: [],
  selectedTagId: null,
  selectedPlatform: null,
  searchQuery: '',
  leftDrawerOpen: false,
  rightDrawerOpen: false,
  editingTagId: null,
  editingGameId: null,
  platformDrawerOpen: false,
  customPlatforms: [],
  deletedPlatforms: [],
  loading: false,
  error: null,
  initialized: false,

  initialize: async () => {
    if (get().initialized || get().loading) return;
    try {
      await get().refreshData();
      set({ initialized: true });
    } catch (error) {
      set({ initialized: false });
      throw error;
    }
  },

  refreshData: async () => {
    set({ loading: true, error: null });
    try {
      const payload = await apiRequest<RemoteStatePayload>('/state');
      set((state) => ({
        ...applyRemoteState(state, payload),
        loading: false,
        error: null,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '数据加载失败';
      set({ loading: false, error: errorMessage });
      throw error;
    }
  },

  addTag: async (name, description) => {
    await apiRequest('/tags', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });
    await get().refreshData();
  },

  updateTag: async (id, name, description) => {
    await apiRequest(`/tags/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify({ name, description }),
    });
    await get().refreshData();
  },

  deleteTag: async (id) => {
    await apiRequest(`/tags/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    await get().refreshData();
  },

  deleteTags: async (ids) => {
    await apiRequest('/tags/batch-delete', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
    await get().refreshData();
  },

  selectTag: (id) => {
    set({ selectedTagId: id });
  },

  selectPlatform: (platform) => {
    set({ selectedPlatform: platform });
  },

  addGame: async (game) => {
    await apiRequest('/games', {
      method: 'POST',
      body: JSON.stringify(game),
    });
    await get().refreshData();
  },

  updateGame: async (id, updates) => {
    await apiRequest(`/games/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    await get().refreshData();
  },

  updateImplementation: async (gameId, tagId, content) => {
    await apiRequest(`/games/${encodeURIComponent(gameId)}/implementation`, {
      method: 'PATCH',
      body: JSON.stringify({ tagId, content }),
    });
    await get().refreshData();
  },

  deleteGame: async (id) => {
    await apiRequest(`/games/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    await get().refreshData();
  },

  openLeftDrawer: (tagId) => {
    set({ leftDrawerOpen: true, editingTagId: tagId });
  },

  closeLeftDrawer: () => {
    set({ leftDrawerOpen: false, editingTagId: null });
  },

  openPlatformDrawer: () => {
    set({ platformDrawerOpen: true });
  },

  closePlatformDrawer: () => {
    set({ platformDrawerOpen: false });
  },

  addPlatform: async (name) => {
    await apiRequest('/platforms', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
    await get().refreshData();
  },

  deletePlatform: async (name) => {
    await apiRequest(`/platforms/${encodeURIComponent(name)}`, {
      method: 'DELETE',
    });
    await get().refreshData();
  },

  updatePlatform: async (oldName, newName) => {
    await apiRequest(`/platforms/${encodeURIComponent(oldName)}`, {
      method: 'PUT',
      body: JSON.stringify({ newName }),
    });
    await get().refreshData();
  },

  getAvailablePlatforms: () => {
    const { customPlatforms, deletedPlatforms } = get();
    const availableBuiltIns = PLATFORMS.filter((platform) => !deletedPlatforms.includes(platform));
    return [...availableBuiltIns, ...customPlatforms];
  },

  openRightDrawer: (gameId) => {
    set({ rightDrawerOpen: true, editingGameId: gameId });
  },

  closeRightDrawer: () => {
    set({ rightDrawerOpen: false, editingGameId: null });
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  getFilteredGames: () => {
    const { games, selectedTagId, searchQuery, selectedPlatform } = get();
    let filteredGames = games;

    if (selectedTagId) {
      filteredGames = filteredGames.filter((game) => game.tags.includes(selectedTagId));
    }

    if (selectedPlatform) {
      filteredGames = filteredGames.filter((game) => game.platform.includes(selectedPlatform));
    }

    if (searchQuery) {
      const keyword = searchQuery.toLowerCase();
      filteredGames = filteredGames.filter((game) => {
        if (game.name.toLowerCase().includes(keyword)) {
          return true;
        }
        return game.aliases.some((alias) => alias.toLowerCase().includes(keyword));
      });
    }

    return filteredGames;
  },
}));
