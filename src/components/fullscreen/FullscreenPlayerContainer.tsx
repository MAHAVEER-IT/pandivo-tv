import React from 'react';
import { PlaylistData, PlaylistTrack, PLAYLISTS } from '../../data/playlistData';
import { MusicTrack } from '../../services/musicCatalog';
import { formatTime } from '../../services/recommendationEngine';
import { FullscreenPlayerScreen } from '../FullscreenPlayerScreen';
import { AiOverlayStatus } from '../../hooks/useFullscreenController';
import { SongAiInsight } from '../../services/geminiSongInfoService';

export interface FullscreenPlayerContainerProps {
  isFullscreenPlayer: boolean;
  currentTrack: MusicTrack;
  currentTrackRef: React.MutableRefObject<MusicTrack>;
  activePlaybackPlaylistRef: React.MutableRefObject<PlaylistData | null>;
  selectedPlaylist: PlaylistData | null;
  selectedPlaylistRef: React.MutableRefObject<PlaylistData | null>;
  playerStatus: any;
  seekPreviewSeconds: number | null;
  songFavoriteMap: Record<string, boolean>;
  isShuffleActive: boolean;
  shuffledTrackIds: string[];
  fullscreenFocusId: string;
  isAiOverlayOpen: boolean;
  aiOverlayStatus: AiOverlayStatus;
  aiSongInsight: SongAiInsight | null;
  aiErrorMessage: string | null;
  selectedBackgroundId: string | null;
  isBackgroundOverlayOpen: boolean;
  openBackgroundOverlay: () => void;
  closeBackgroundOverlay: () => void;
  handleSelectBackground: (id: string) => Promise<void>;
  exitFullscreenPlayer: () => void;
  handleTogglePlayPause: () => void;
  handlePlayPrev: () => void;
  handlePlayNext: () => void;
  handleToggleSongFavorite: (id?: string) => void;
  openAiSongInfoOverlay: () => Promise<void>;
  closeAiSongInfoOverlay: () => void;
}

export const FullscreenPlayerContainer: React.FC<FullscreenPlayerContainerProps> = ({
  isFullscreenPlayer,
  currentTrack,
  currentTrackRef,
  activePlaybackPlaylistRef,
  selectedPlaylist,
  selectedPlaylistRef,
  playerStatus,
  seekPreviewSeconds,
  songFavoriteMap,
  isShuffleActive,
  shuffledTrackIds,
  fullscreenFocusId,
  isAiOverlayOpen,
  aiOverlayStatus,
  aiSongInsight,
  aiErrorMessage,
  selectedBackgroundId,
  isBackgroundOverlayOpen,
  openBackgroundOverlay,
  closeBackgroundOverlay,
  handleSelectBackground,
  exitFullscreenPlayer,
  handleTogglePlayPause,
  handlePlayPrev,
  handlePlayNext,
  handleToggleSongFavorite,
  openAiSongInfoOverlay,
  closeAiSongInfoOverlay,
}) => {
  if (!isFullscreenPlayer) return null;

  const curId = currentTrackRef.current?.id || currentTrack?.id;
  let playingPl = activePlaybackPlaylistRef.current;
  if (!playingPl || !playingPl.tracks.some((t) => t.id === curId)) {
    for (const pl of Object.values(PLAYLISTS)) {
      if (pl.tracks.some((t) => t.id === curId)) {
        playingPl = pl;
        break;
      }
    }
  }
  if (!playingPl) {
    playingPl = selectedPlaylist || selectedPlaylistRef.current || PLAYLISTS.chill_vibes;
  }

  const matchedTrack = playingPl.tracks.find((t) => t.id === curId);
  const activeFsTrack: PlaylistTrack = matchedTrack || {
    id: currentTrack?.id || 'none',
    title: currentTrack?.title || 'Unknown Title',
    artist: currentTrack?.artist || 'Unknown Artist',
    album: currentTrack?.album || '',
    duration: formatTime(Math.floor(playerStatus?.duration || currentTrack?.duration || 252)),
    durationSeconds: playerStatus?.duration || currentTrack?.duration || 252,
    audioUrl: currentTrack?.audioUrl || '',
    artwork:
      (currentTrack as any)?.artwork ||
      (currentTrack as any)?.localArtwork ||
      require('../../../assets/ui/rec_0_until_found_clean.png'),
    trackNumber: 1,
  };
  const fsCurrentTimeSeconds =
    seekPreviewSeconds !== null
      ? seekPreviewSeconds
      : playerStatus?.currentTime || 0;
  const fsDurationSeconds =
    playerStatus?.duration || activeFsTrack?.durationSeconds || 252;

  return (
    <FullscreenPlayerScreen
      playlist={playingPl}
      playingTrack={activeFsTrack}
      isPlaying={!!playerStatus?.playing}
      currentTimeSeconds={fsCurrentTimeSeconds}
      durationSeconds={fsDurationSeconds}
      isSongLiked={!!songFavoriteMap[activeFsTrack.id]}
      isShuffleActive={isShuffleActive}
      shuffledTrackIds={shuffledTrackIds}
      fullscreenFocusId={fullscreenFocusId}
      isAiOverlayOpen={isAiOverlayOpen}
      aiOverlayStatus={aiOverlayStatus}
      aiSongInsight={aiSongInsight}
      aiErrorMessage={aiErrorMessage}
      selectedBackgroundId={selectedBackgroundId}
      isBackgroundOverlayOpen={isBackgroundOverlayOpen}
      onOpenBackgroundOverlay={openBackgroundOverlay}
      onCloseBackgroundOverlay={closeBackgroundOverlay}
      onSelectBackground={handleSelectBackground}
      onExitFullscreen={exitFullscreenPlayer}
      onTogglePlayPause={handleTogglePlayPause}
      onPlayPrev={handlePlayPrev}
      onPlayNext={handlePlayNext}
      onToggleSongLike={handleToggleSongFavorite}
      onOpenAiOverlay={openAiSongInfoOverlay}
      onCloseAiOverlay={closeAiSongInfoOverlay}
      isUsbTrack={
        activeFsTrack?.id?.startsWith('usb_') ||
        playingPl.id === 'usb_storage'
      }
    />
  );
};
