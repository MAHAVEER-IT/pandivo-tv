import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { PlaylistData, PlaylistTrack, PLAYLISTS } from '../data/playlistData';
import { TRACK_CATALOG, MusicTrack } from '../services/musicCatalog';
import { DEMO_EXTRA_TRACKS } from '../data/searchCatalog';
import { RecentlyPlayedTrackItem, resolveRecentlyPlayedTrack } from '../constants/recentlyPlayed';
import {
  initDatabase,
  getRecentlyPlayedTrackIds,
  recordTrackPlay,
  getLikedSongIds,
  setSongLike,
  getLikedPlaylistIds,
  setPlaylistLike,
  getAiDjPlaylists,
  ensureDefaultFavoritesUnliked,
  ensureDefaultSearchHistoryCleaned,
  ensureDefaultPlaybackHistoryCleaned,
  dumpDatabaseState,
} from '../database';
import {
  convertStoredAiDjToPlaylist,
  formatTotalPlaylistDuration,
  formatTrackDuration,
} from '../utils/aiDjPlaylistAdapter';
import { subscribeToCloudRestore } from '../services/awsCloudSyncManager';

export interface FavoritesContextType {
  songFavoriteMap: Record<string, boolean>;
  playlistLikedMap: Record<string, boolean>;
  setSongFavoriteMap: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setPlaylistLikedMap: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  handleTogglePlaylistLike: (playlistId?: string) => void;
  handleToggleSongFavorite: (trackId?: string) => void;
  recentlyPlayedTracks: RecentlyPlayedTrackItem[];
  setRecentlyPlayedTracks: React.Dispatch<React.SetStateAction<RecentlyPlayedTrackItem[]>>;
  recentlyPlayedTracksRef: React.MutableRefObject<RecentlyPlayedTrackItem[]>;
  addRecentlyPlayedTrack: (track: MusicTrack | PlaylistTrack) => void;
  recordTrackPlayHistory: (trackId: string) => Promise<void>;
  userAiPlaylists: PlaylistData[];
  setUserAiPlaylists: React.Dispatch<React.SetStateAction<PlaylistData[]>>;
  userAiPlaylistsRef: React.MutableRefObject<PlaylistData[]>;
  resolveTrackById: (trackId: string) => PlaylistTrack | null;
  likedSongsPlaylist: PlaylistData;
  likedSongsPlaylistRef: React.MutableRefObject<PlaylistData>;
  likedPlaylists: PlaylistData[];
  likedPlaylistsRef: React.MutableRefObject<PlaylistData[]>;
}

const FavoritesContext = createContext<FavoritesContextType | null>(null);

export interface FavoritesProviderProps {
  children: React.ReactNode;
  getCurrentTrackId?: () => string | undefined;
  getSelectedPlaylist?: () => PlaylistData | null;
}

export const FavoritesProvider: React.FC<FavoritesProviderProps> = ({
  children,
  getCurrentTrackId,
  getSelectedPlaylist,
}) => {
  const [playlistLikedMap, setPlaylistLikedMap] = useState<Record<string, boolean>>({});
  const [songFavoriteMap, setSongFavoriteMap] = useState<Record<string, boolean>>({});

  // Dynamic Recently Played Tracks State (strictly dynamic plays, zero static padding)
  const [recentlyPlayedTracks, setRecentlyPlayedTracks] = useState<RecentlyPlayedTrackItem[]>([]);
  const recentlyPlayedTracksRef = useRef<RecentlyPlayedTrackItem[]>([]);
  recentlyPlayedTracksRef.current = recentlyPlayedTracks;

  // Dynamic User-Generated AI Playlists for AI DJ Landing Screen
  const [userAiPlaylists, setUserAiPlaylists] = useState<PlaylistData[]>([]);
  const userAiPlaylistsRef = useRef<PlaylistData[]>([]);
  userAiPlaylistsRef.current = userAiPlaylists;

  const handleTogglePlaylistLike = useCallback((playlistId?: string) => {
    const targetId = playlistId || getSelectedPlaylist?.()?.id;
    if (!targetId || targetId === 'usb_storage') return;
    setPlaylistLikedMap((prev) => {
      const nextVal = !prev[targetId];
      setPlaylistLike(targetId, nextVal).catch((err) =>
        console.error('[FavoritesContext] Failed to persist playlist like to SQLite:', err)
      );
      return {
        ...prev,
        [targetId]: nextVal,
      };
    });
  }, [getSelectedPlaylist]);

  const handleToggleSongFavorite = useCallback((trackId?: string) => {
    const pl = getSelectedPlaylist?.();
    const curTrkId = getCurrentTrackId?.();
    const activeId =
      trackId ||
      (pl?.tracks.find((t) => t.id === curTrkId) || pl?.tracks[0])?.id ||
      curTrkId;
    if (!activeId || activeId.startsWith('usb_') || pl?.id === 'usb_storage') return;
    setSongFavoriteMap((prev) => {
      const nextVal = !prev[activeId];
      setSongLike(activeId, nextVal).catch((err) =>
        console.error('[FavoritesContext] Failed to persist song like to SQLite:', err)
      );
      return {
        ...prev,
        [activeId]: nextVal,
      };
    });
  }, [getCurrentTrackId, getSelectedPlaylist]);

  // Immediately promote played track to Recently Played & persist in background SQLite
  const addRecentlyPlayedTrack = useCallback((track: MusicTrack | PlaylistTrack) => {
    if (!track || !track.id) return;
    setRecentlyPlayedTracks((prev) => {
      const item: RecentlyPlayedTrackItem = {
        ...track,
        displayTitle: (track as any).displayTitle || track.title,
        displayArtist: (track as any).displayArtist || track.artist,
        localArtwork:
          (track as any).localArtwork ||
          (track as any).artwork ||
          ((track as any).artworkUrl && (track as any).artworkUrl.startsWith('http')
            ? { uri: (track as any).artworkUrl }
            : require('../../assets/ui/rec_0_until_found_clean.png')),
      } as any;
      const filtered = prev.filter((t) => t.id !== track.id);
      return [item, ...filtered].slice(0, 10);
    });

    recordTrackPlay(track.id).catch((err) => {
      console.error('[FavoritesContext] Failed to record track play in SQLite:', err);
    });
  }, []);

  const recordTrackPlayHistory = useCallback(async (trackId: string) => {
    try {
      await recordTrackPlay(trackId);
      const dbRecentTrackIds = await getRecentlyPlayedTrackIds(10);
      if (dbRecentTrackIds.length > 0) {
        const hydratedRecentTracks: RecentlyPlayedTrackItem[] = [];
        for (const id of dbRecentTrackIds) {
          const trackItem = resolveRecentlyPlayedTrack(id);
          if (trackItem) {
            hydratedRecentTracks.push(trackItem);
          }
        }
        setRecentlyPlayedTracks(hydratedRecentTracks);
      }
    } catch (e) {
      console.log('[FavoritesContext] Failed to record track play:', e);
    }
  }, []);

  // Resolves full track data from built-in playlists, user AI DJ sessions, search catalog, or global catalog
  const resolveTrackById = useCallback((trackId: string): PlaylistTrack | null => {
    // 1. Check in all built-in playlists
    for (const pl of Object.values(PLAYLISTS)) {
      const match = pl.tracks.find((t) => t.id === trackId);
      if (match) return match;
    }
    // 2. Check in user AI DJ playlists
    for (const pl of userAiPlaylistsRef.current) {
      const match = pl.tracks.find((t) => t.id === trackId);
      if (match) return match;
    }
    // 3. Check in demo search catalog
    const demoMatch = DEMO_EXTRA_TRACKS.find((t) => t.id === trackId);
    if (demoMatch) {
      return {
        ...demoMatch,
        isFavorite: true,
      };
    }
    // 4. Check in global TRACK_CATALOG
    const catalogMatch = TRACK_CATALOG.find((t) => t.id === trackId);
    if (catalogMatch) {
      return {
        id: catalogMatch.id,
        trackNumber: 1,
        title: catalogMatch.title,
        artist: catalogMatch.artist,
        album: catalogMatch.album || 'Pandivo Single',
        duration: formatTrackDuration(catalogMatch.duration || 210),
        durationSeconds: catalogMatch.duration || 210,
        audioUrl: catalogMatch.audioUrl,
        artwork:
          catalogMatch.artworkUrl && catalogMatch.artworkUrl.startsWith('http')
            ? { uri: catalogMatch.artworkUrl }
            : (catalogMatch as any).artwork || require('../../assets/ui/rec_0_until_found_clean.png'),
        isFavorite: true,
      };
    }
    return null;
  }, []);

  // Dynamically synthesized "Liked Songs" master playlist
  const likedSongsPlaylist: PlaylistData = useMemo(() => {
    const uniqueTracks: PlaylistTrack[] = [];
    const seenIds = new Set<string>();

    Object.entries(songFavoriteMap).forEach(([trackId, isLiked]) => {
      if (isLiked && !seenIds.has(trackId)) {
        seenIds.add(trackId);
        const resolved = resolveTrackById(trackId);
        if (resolved) {
          uniqueTracks.push({
            ...resolved,
            trackNumber: uniqueTracks.length + 1,
            isFavorite: true,
          });
        }
      }
    });

    return {
      id: 'liked_songs',
      title: 'Liked Songs',
      tagline: 'Your personal collection of favorite tracks',
      creator: 'You',
      creatorAvatar: require('../../assets/avatars/avatar_bamboo.webp'),
      songsCount: `${uniqueTracks.length} songs`,
      totalDuration: formatTotalPlaylistDuration(uniqueTracks),
      description:
        'Every song you like across Search, AI DJ, and Playlists is gathered here into your personal soundtrack.',
      coverImage: require('../../assets/ui/liked_songs_heart_3d.webp'),
      isHeartCover: true,
      bannerAccentColor: '#EC4899',
      badgeText: 'FAVORITES',
      quoteText: 'Made with love\nJust for you ♥',
      tracks: uniqueTracks,
    };
  }, [songFavoriteMap, resolveTrackById]);

  // Dynamically filtered liked playlists (Built-in + AI DJ)
  const likedPlaylists: PlaylistData[] = useMemo(() => {
    const allPlaylists: PlaylistData[] = [
      ...Object.values(PLAYLISTS),
      ...userAiPlaylists,
    ];
    return allPlaylists.filter((pl) => !!playlistLikedMap[pl.id]);
  }, [playlistLikedMap, userAiPlaylists]);

  const likedSongsPlaylistRef = useRef<PlaylistData>(likedSongsPlaylist);
  likedSongsPlaylistRef.current = likedSongsPlaylist;
  const likedPlaylistsRef = useRef<PlaylistData[]>(likedPlaylists);
  likedPlaylistsRef.current = likedPlaylists;

  // Initialize local SQLite database and hydrate persisted entities on startup
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        console.log('[FavoritesContext] Initializing SQLite database and hydrating state...');
        await initDatabase();
        await ensureDefaultFavoritesUnliked();
        await ensureDefaultSearchHistoryCleaned();
        await ensureDefaultPlaybackHistoryCleaned();

        // 1. Hydrate Liked Songs
        const dbLikedSongs = await getLikedSongIds();
        if (isMounted) {
          const map: Record<string, boolean> = {};
          dbLikedSongs.forEach((id) => {
            map[id] = true;
          });
          setSongFavoriteMap(map);
        }

        // 2. Hydrate Liked Playlists
        const dbLikedPlaylists = await getLikedPlaylistIds();
        if (isMounted) {
          const plMap: Record<string, boolean> = {};
          dbLikedPlaylists.forEach((id) => {
            plMap[id] = true;
          });
          setPlaylistLikedMap(plMap);
        }

        // 3. Hydrate Recently Played Tracks
        const dbRecentTrackIds = await getRecentlyPlayedTrackIds(10);
        if (isMounted && dbRecentTrackIds.length > 0) {
          const hydratedRecentTracks: RecentlyPlayedTrackItem[] = [];
          for (const trackId of dbRecentTrackIds) {
            const trackItem = resolveRecentlyPlayedTrack(trackId);
            if (trackItem) {
              hydratedRecentTracks.push(trackItem);
            }
          }
          setRecentlyPlayedTracks(hydratedRecentTracks);
        } else if (isMounted) {
          setRecentlyPlayedTracks([]);
        }

        // 4. Hydrate AI DJ Playlists
        const dbAiPlaylists = await getAiDjPlaylists(30);
        if (isMounted && dbAiPlaylists.length > 0) {
          const hydrated = dbAiPlaylists.map(convertStoredAiDjToPlaylist);
          setUserAiPlaylists(hydrated);
        }

        console.log('[FavoritesContext] SQLite database hydrated successfully.');
        await dumpDatabaseState();
      } catch (err) {
        console.error('[FavoritesContext] SQLite initialization error:', err);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Listen for background DynamoDB cloud restore on cold boot
  useEffect(() => {
    const unsubscribe = subscribeToCloudRestore((restored) => {
      if (restored.favorites && restored.favorites.length > 0) {
        console.log('[FavoritesContext] Applying cloud-restored favorites count:', restored.favorites.length);
        setSongFavoriteMap((prev) => {
          const updated = { ...prev };
          restored.favorites!.forEach((id) => {
            updated[id] = true;
          });
          return updated;
        });
      }

      if (restored.likedPlaylists && restored.likedPlaylists.length > 0) {
        console.log('[FavoritesContext] Applying cloud-restored liked playlists count:', restored.likedPlaylists.length);
        setPlaylistLikedMap((prev) => {
          const updated = { ...prev };
          restored.likedPlaylists!.forEach((id) => {
            updated[id] = true;
          });
          return updated;
        });
      }

      if (restored.playlists && restored.playlists.length > 0) {
        console.log('[FavoritesContext] Applying cloud-restored AI playlists count:', restored.playlists.length);
        const hydrated = restored.playlists.map(convertStoredAiDjToPlaylist);
        setUserAiPlaylists(hydrated);
      }
    });
    return unsubscribe;
  }, []);

  const value: FavoritesContextType = {
    songFavoriteMap,
    playlistLikedMap,
    setSongFavoriteMap,
    setPlaylistLikedMap,
    handleTogglePlaylistLike,
    handleToggleSongFavorite,
    recentlyPlayedTracks,
    setRecentlyPlayedTracks,
    recentlyPlayedTracksRef,
    addRecentlyPlayedTrack,
    recordTrackPlayHistory,
    userAiPlaylists,
    setUserAiPlaylists,
    userAiPlaylistsRef,
    resolveTrackById,
    likedSongsPlaylist,
    likedSongsPlaylistRef,
    likedPlaylists,
    likedPlaylistsRef,
  };

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
};

export const useFavorites = (): FavoritesContextType => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};
