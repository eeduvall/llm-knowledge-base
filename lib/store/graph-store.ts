// Zustand store for the 3-D Knowledge Graph Explorer.
// Manages UI state only — model data lives in TanStack Query cache.

import { create } from 'zustand';
import type { ClusterMode } from '@/lib/graph-layout';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type GraphStoreState = {
  /** Id of the currently selected node (opens NodePanel). */
  selectedId: string | null;
  /** Id of the currently hovered node (synapse-fire effect). */
  hoveredId: string | null;
  /** Active provider filter (null = all providers). */
  filterProvider: string | null;
  /** Active capability filters (all must match). */
  activeCapabilities: string[];
  /** Active modality filters (all must match). */
  activeModalities: string[];
  /** Active license filters. */
  activeLicenses: string[];
  /** Clustering axis for edge generation. */
  clusterMode: ClusterMode;
  /** Current search query string. */
  searchQuery: string;
  /** Node id to highlight on mount (from ?highlight query param). */
  highlightId: string | null;

  // Actions
  setSelectedId: (id: string | null) => void;
  setHoveredId: (id: string | null) => void;
  setFilterProvider: (provider: string | null) => void;
  toggleCapability: (cap: string) => void;
  toggleModality: (mod: string) => void;
  toggleLicense: (lic: string) => void;
  setClusterMode: (mode: ClusterMode) => void;
  setSearchQuery: (query: string) => void;
  setHighlightId: (id: string | null) => void;
  clearAllFilters: () => void;
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useGraphStore = create<GraphStoreState>()((set) => ({
  selectedId: null,
  hoveredId: null,
  filterProvider: null,
  activeCapabilities: [],
  activeModalities: [],
  activeLicenses: [],
  clusterMode: 'family',
  searchQuery: '',
  highlightId: null,

  setSelectedId: (id) => set({ selectedId: id }),
  setHoveredId: (id) => set({ hoveredId: id }),
  setFilterProvider: (provider) => set({ filterProvider: provider }),

  toggleCapability: (cap) =>
    set((state) => ({
      activeCapabilities: state.activeCapabilities.includes(cap)
        ? state.activeCapabilities.filter((c) => c !== cap)
        : [...state.activeCapabilities, cap],
    })),

  toggleModality: (mod) =>
    set((state) => ({
      activeModalities: state.activeModalities.includes(mod)
        ? state.activeModalities.filter((m) => m !== mod)
        : [...state.activeModalities, mod],
    })),

  toggleLicense: (lic) =>
    set((state) => ({
      activeLicenses: state.activeLicenses.includes(lic)
        ? state.activeLicenses.filter((l) => l !== lic)
        : [...state.activeLicenses, lic],
    })),

  setClusterMode: (mode) => set({ clusterMode: mode }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setHighlightId: (id) => set({ highlightId: id }),

  clearAllFilters: () =>
    set({
      filterProvider: null,
      activeCapabilities: [],
      activeModalities: [],
      activeLicenses: [],
    }),
}));
