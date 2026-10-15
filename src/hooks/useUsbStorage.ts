import { useState, useEffect, useRef, useCallback } from 'react';
import {
  UsbStatus,
  getUsbStatus,
  scanUsbTracks,
  subscribeToUsbStatus,
} from '../services/usbStorageService';
import { PlaylistData, PlaylistTrack } from '../data/playlistData';
import { LIBRARY_CARD_IDS } from '../navigation/libraryNavGraph';
import { formatTotalPlaylistDuration } from '../utils/aiDjPlaylistAdapter';

export interface UsbModalState {
  visible: boolean;
  type: 'NOT_CONNECTED' | 'NO_SONGS';
  title?: string;
  message?: string;
}

export interface UseUsbStorageParams {
  setFocusedId: (id: string) => void;
  handleSelectPlaylist: (playlist: PlaylistData, origin?: 'library' | 'home' | 'ai_dj' | 'favorites') => void;
  selectedPlaylistRef: React.MutableRefObject<PlaylistData | null>;
  setSelectedPlaylist: (pl: PlaylistData | null) => void;
}

export function useUsbStorage({
  setFocusedId,
  handleSelectPlaylist,
  selectedPlaylistRef,
  setSelectedPlaylist,
}: UseUsbStorageParams) {
  const [usbStatus, setUsbStatus] = useState<UsbStatus>({
    isConnected: false,
    volumePath: null,
    driveName: null,
    totalSpaceBytes: 0,
    freeSpaceBytes: 0,
  });
  const usbStatusRef = useRef<UsbStatus>(usbStatus);
  usbStatusRef.current = usbStatus;

  const [usbTracks, setUsbTracks] = useState<PlaylistTrack[]>([]);
  const usbTracksRef = useRef<PlaylistTrack[]>([]);
  usbTracksRef.current = usbTracks;

  const [usbModalState, setUsbModalState] = useState<UsbModalState>({
    visible: false,
    type: 'NOT_CONNECTED',
  });
  const usbModalStateRef = useRef<UsbModalState>(usbModalState);
  usbModalStateRef.current = usbModalState;

  const handleCloseUsbModal = useCallback(() => {
    setUsbModalState((prev) => ({ ...prev, visible: false }));
    setFocusedId(LIBRARY_CARD_IDS.USB);
  }, [setFocusedId]);

  const loadUsbTracksInternal = useCallback(async (): Promise<PlaylistTrack[]> => {
    try {
      const rawTracks = await scanUsbTracks();
      const mapped: PlaylistTrack[] = rawTracks.map((t, idx) => {
        const totalSec = t.duration || 180;
        const mins = Math.floor(totalSec / 60);
        const secs = Math.floor(totalSec % 60);
        const durStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
        return {
          id: t.id || `usb_track_${idx}`,
          trackNumber: idx + 1,
          title: t.title || 'Unknown Track',
          artist: t.artist || 'Unknown Artist',
          album: t.album || 'USB Storage',
          duration: durStr,
          durationSeconds: totalSec,
          audioUrl: t.audioUrl,
          artwork: t.artworkUrl
            ? { uri: t.artworkUrl }
            : require('../../assets/playlists/banner_usb_drive.png'),
        };
      });
      setUsbTracks(mapped);
      setUsbStatus((prev) => ({ ...prev, songCount: mapped.length }));
      return mapped;
    } catch (e) {
      console.warn('[Usb] loadUsbTracksInternal failed:', e);
      return [];
    }
  }, []);

  useEffect(() => {
    getUsbStatus().then((status) => {
      setUsbStatus(status);
      if (status.isConnected) {
        loadUsbTracksInternal();
      }
    });

    const unsubscribe = subscribeToUsbStatus((status) => {
      setUsbStatus(status);
      if (status.isConnected) {
        loadUsbTracksInternal();
      } else {
        setUsbTracks([]);
        if (selectedPlaylistRef.current?.id === 'usb_storage') {
          selectedPlaylistRef.current = null;
          setSelectedPlaylist(null);
          setFocusedId(LIBRARY_CARD_IDS.USB);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [loadUsbTracksInternal, setFocusedId, selectedPlaylistRef, setSelectedPlaylist]);

  const handleSelectUsbCard = useCallback(async () => {
    const status = await getUsbStatus();
    setUsbStatus(status);

    if (!status.isConnected) {
      setUsbModalState({
        visible: true,
        type: 'NOT_CONNECTED',
        title: 'No USB Drive Connected',
        message:
          'Please insert a USB flash drive (FAT32 or exFAT) into your TV or OTG adapter. Your offline audio will be loaded automatically.',
      });
      setFocusedId('USB_MODAL_BACK');
      return;
    }

    const tracks = await loadUsbTracksInternal();

    if (tracks.length === 0) {
      setUsbModalState({
        visible: true,
        type: 'NO_SONGS',
        title: 'No Songs Found on USB',
        message:
          'Your USB drive is connected, but no supported audio files (.mp3, .flac, .m4a, .wav, .aac) were found. Copy your music files to the drive and try again.',
      });
      setFocusedId('USB_MODAL_BACK');
      return;
    }

    const usbPlaylist: PlaylistData = {
      id: 'usb_storage',
      title: status.driveName ? `USB: ${status.driveName}` : 'USB Music Library',
      tagline: `Removable Storage • ${tracks.length} tracks`,
      creator: 'USB Drive',
      creatorAvatar: require('../../assets/avatars/avatar_bamboo.webp'),
      songsCount: `${tracks.length} ${tracks.length === 1 ? 'song' : 'songs'}`,
      totalDuration: formatTotalPlaylistDuration(tracks),
      description:
        'Audio tracks loaded directly from your connected USB storage drive. Offline local playback with full queue and playback controls.',
      coverImage: require('../../assets/playlists/banner_usb_drive.png'),
      bannerAccentColor: '#0284C7',
      badgeText: 'USB AUDIO',
      quoteText: 'Offline Local Music',
      tracks: tracks,
    };

    handleSelectPlaylist(usbPlaylist, 'library');
  }, [loadUsbTracksInternal, handleSelectPlaylist, setFocusedId]);

  return {
    usbStatus,
    usbStatusRef,
    usbTracks,
    usbTracksRef,
    usbModalState,
    usbModalStateRef,
    setUsbModalState,
    handleCloseUsbModal,
    loadUsbTracksInternal,
    handleSelectUsbCard,
  };
}
