import React from 'react';
import { PlaylistData, PlaylistTrack } from '../../data/playlistData';
import { MusicTrack } from '../../services/musicCatalog';
import { TimeContext, TimeTheme } from '../../constants/timeThemes';
import { RecentlyPlayedTrackItem } from '../../constants/recentlyPlayed';
import { PlaylistScreen } from '../PlaylistScreen';
import { AiDjScreen, GeminiDiagnosticInfo } from '../AiDjScreen';
import { LibraryScreen } from '../LibraryScreen';
import { FavoritesScreen } from '../FavoritesScreen';
import { SearchScreen, SearchScreenRef } from '../SearchScreen';
import { SettingsScreen } from '../SettingsScreen';
import { HomeScreen } from '../home/HomeScreen';
import { LIBRARY_CARD_IDS } from '../../navigation/libraryNavGraph';
import { AvatarId } from '../../database';
import { UsbStatus } from '../../services/usbStorageService';

export interface ScreenSwitcherProps {
  selectedPlaylist: PlaylistData | null;
  activeNavTab: string;
  focusedId: string;
  setFocusedId: (updater: string | ((prev: string) => string)) => void;
  currentTrack: MusicTrack;
  playerStatus: any;
  seekPreviewSeconds: number | null;
  isShuffleActive: boolean;
  shuffledTrackIds: string[];
  isRepeatActive: boolean;
  setIsRepeatActive: React.Dispatch<React.SetStateAction<boolean>>;
  playlistLikedMap: Record<string, boolean>;
  songFavoriteMap: Record<string, boolean>;
  handlePlayPlaylistTrack: (track: PlaylistTrack, preserveExistingShuffleQueue?: boolean) => void;
  handleTogglePlayPause: () => void;
  handleBackFromPlaylist: () => void;
  handlePlayNext: () => void;
  handlePlayPrev: () => void;
  handleToggleShuffle: () => void;
  handleSeekDelta: (delta: number) => void;
  handleToggleFullscreen: () => void;
  handleTogglePlaylistLike: (id?: string) => void;
  handleToggleSongFavorite: (id?: string) => void;
  handleToggleVoice: () => Promise<void>;
  handleCancelVoiceListening: () => void;
  handleSelectPlaylist: (playlist: PlaylistData, origin?: 'library' | 'home' | 'ai_dj' | 'favorites') => void;
  handlePlayPlaylistFromLibrary: (playlist: PlaylistData) => void;
  activePlaybackPlaylist: PlaylistData | null;
  handleSelectUsbCard: () => Promise<void>;
  usbStatus: UsbStatus;
  likedSongsPlaylist: PlaylistData;
  likedPlaylists: PlaylistData[];
  currentTime: string;
  searchScreenRef: React.RefObject<SearchScreenRef | null>;
  handleBackToHome: () => void;
  wasPlayingBeforeVoiceRef: React.MutableRefObject<boolean>;
  setSearchSubScreen: (sub: 'landing' | 'results') => void;
  pausePlaybackForVoice: () => void;
  resumePlaybackAfterVoice: () => void;
  savedAvatarId: AvatarId | null;
  setShowAvatarSelection: (show: boolean) => void;
  homeScrollViewRef: React.RefObject<any>;
  recentlyPlayedScrollRef: React.RefObject<any>;
  forYouScrollRef: React.RefObject<any>;
  currentTheme: TimeTheme;
  selectedTimeOfDay: TimeContext;
  recentlyPlayedTracks: RecentlyPlayedTrackItem[];
  handleDpadPress: (id: string) => void;
  isListening: boolean;
  isProcessing: boolean;
  voiceTranscript: string;
  geminiDiagnostic: GeminiDiagnosticInfo | null;
  isAiDjOverlayVisible: boolean;
  handleVoiceCommand: (text: string) => void;
  handleRunDiagnosticTest: () => Promise<void>;
  setGeminiDiagnostic: (diag: GeminiDiagnosticInfo | null) => void;
  userAiPlaylists: PlaylistData[];
  setActiveNavTab: (tab: string) => void;
  activeNavTabRef: React.MutableRefObject<string>;
}

export const ScreenSwitcher: React.FC<ScreenSwitcherProps> = ({
  selectedPlaylist,
  activeNavTab,
  focusedId,
  setFocusedId,
  currentTrack,
  playerStatus,
  seekPreviewSeconds,
  isShuffleActive,
  shuffledTrackIds,
  isRepeatActive,
  setIsRepeatActive,
  playlistLikedMap,
  songFavoriteMap,
  handlePlayPlaylistTrack,
  handleTogglePlayPause,
  handleBackFromPlaylist,
  handlePlayNext,
  handlePlayPrev,
  handleToggleShuffle,
  handleSeekDelta,
  handleToggleFullscreen,
  handleTogglePlaylistLike,
  handleToggleSongFavorite,
  handleToggleVoice,
  handleCancelVoiceListening,
  handleSelectPlaylist,
  handlePlayPlaylistFromLibrary,
  activePlaybackPlaylist,
  handleSelectUsbCard,
  usbStatus,
  likedSongsPlaylist,
  likedPlaylists,
  currentTime,
  searchScreenRef,
  handleBackToHome,
  wasPlayingBeforeVoiceRef,
  setSearchSubScreen,
  pausePlaybackForVoice,
  resumePlaybackAfterVoice,
  savedAvatarId,
  setShowAvatarSelection,
  homeScrollViewRef,
  recentlyPlayedScrollRef,
  forYouScrollRef,
  currentTheme,
  selectedTimeOfDay,
  recentlyPlayedTracks,
  handleDpadPress,
  isListening,
  isProcessing,
  voiceTranscript,
  geminiDiagnostic,
  isAiDjOverlayVisible,
  handleVoiceCommand,
  handleRunDiagnosticTest,
  setGeminiDiagnostic,
  userAiPlaylists,
  setActiveNavTab,
  activeNavTabRef,
}) => {
  if (selectedPlaylist) {
    return (
      <PlaylistScreen
        playlist={selectedPlaylist}
        currentTrackId={currentTrack?.id}
        currentPlayingTrack={currentTrack}
        isPlaying={!!playerStatus?.playing}
        currentTimeMs={
          seekPreviewSeconds !== null
            ? seekPreviewSeconds * 1000
            : (playerStatus?.currentTime || 0) * 1000
        }
        durationMs={(playerStatus?.duration || (currentTrack?.duration || 252)) * 1000}
        onPlayTrack={handlePlayPlaylistTrack}
        onTogglePlayPause={handleTogglePlayPause}
        onBackToHome={handleBackFromPlaylist}
        focusedId={focusedId}
        setFocusedId={setFocusedId}
        onPlayNext={handlePlayNext}
        onPlayPrev={handlePlayPrev}
        isShuffleActive={isShuffleActive}
        shuffledTrackIds={shuffledTrackIds}
        onToggleShuffle={handleToggleShuffle}
        isRepeatActive={isRepeatActive}
        onToggleRepeat={() => setIsRepeatActive((prev) => !prev)}
        onSeekDelta={handleSeekDelta}
        onToggleFullscreen={handleToggleFullscreen}
        isPlaylistLiked={!!playlistLikedMap[selectedPlaylist.id]}
        onTogglePlaylistLike={() => handleTogglePlaylistLike(selectedPlaylist.id)}
        favoriteMap={songFavoriteMap}
        onToggleSongFavorite={handleToggleSongFavorite}
      />
    );
  }

  if (activeNavTab === 'ai_dj') {
    return (
      <AiDjScreen
        focusedId={focusedId}
        setFocusedId={setFocusedId}
        onPressMic={handleToggleVoice}
        onCancelMic={handleCancelVoiceListening}
        onSelectHistoryPlaylist={(pl) => handleSelectPlaylist(pl, 'ai_dj')}
        onPressViewAll={() => {
          activeNavTabRef.current = 'library';
          setActiveNavTab('library');
          setFocusedId(LIBRARY_CARD_IDS.CHILL);
        }}
        isListening={isListening}
        isProcessing={isProcessing}
        voiceTranscript={voiceTranscript}
        geminiDiagnostic={isAiDjOverlayVisible ? null : geminiDiagnostic}
        onTriggerTestPrompt={(prompt) => {
          handleVoiceCommand(prompt);
        }}
        onRunDiagnosticTest={handleRunDiagnosticTest}
        onCloseDiagnosticModal={() => setGeminiDiagnostic(null)}
        userPlaylists={userAiPlaylists}
        playlistLikedMap={playlistLikedMap}
        onTogglePlaylistLike={handleTogglePlaylistLike}
      />
    );
  }

  if (activeNavTab === 'library') {
    return (
      <LibraryScreen
        onSelectPlaylist={handleSelectPlaylist}
        onPlayPlaylist={handlePlayPlaylistFromLibrary}
        activePlayingPlaylistId={activePlaybackPlaylist?.id}
        isPlaying={!!playerStatus?.playing}
        focusedId={focusedId}
        setFocusedId={setFocusedId}
        playlistLikedMap={playlistLikedMap}
        onTogglePlaylistLike={handleTogglePlaylistLike}
        onSelectUsbCard={handleSelectUsbCard}
        usbStatus={usbStatus}
      />
    );
  }

  if (activeNavTab === 'favorites') {
    return (
      <FavoritesScreen
        likedSongsPlaylist={likedSongsPlaylist}
        likedPlaylists={likedPlaylists}
        focusedId={focusedId}
        setFocusedId={setFocusedId}
        onSelectPlaylist={(pl) => handleSelectPlaylist(pl, 'favorites')}
        onTogglePlaylistLike={handleTogglePlaylistLike}
        currentTime={currentTime}
      />
    );
  }

  if (activeNavTab === 'search') {
    return (
      <SearchScreen
        ref={searchScreenRef}
        focusedId={focusedId}
        setFocusedId={setFocusedId}
        onBackToHome={handleBackToHome}
        onPlayTrack={(track) => {
          wasPlayingBeforeVoiceRef.current = false;
          handlePlayPlaylistTrack(track);
        }}
        onTogglePlayPause={handleTogglePlayPause}
        currentPlayingTrackId={currentTrack?.id}
        isPlaying={!!playerStatus?.playing}
        songFavoriteMap={songFavoriteMap}
        onToggleSongFavorite={handleToggleSongFavorite}
        onSubScreenChange={setSearchSubScreen}
        onVoiceStateChange={(listening) => {
          if (listening) {
            pausePlaybackForVoice();
          } else {
            resumePlaybackAfterVoice();
          }
        }}
      />
    );
  }

  if (activeNavTab === 'settings') {
    return (
      <SettingsScreen
        savedAvatarId={savedAvatarId}
        focusedId={focusedId}
        setFocusedId={setFocusedId}
        onChangeAvatar={() => setShowAvatarSelection(true)}
      />
    );
  }

  return (
    <HomeScreen
      homeScrollViewRef={homeScrollViewRef}
      recentlyPlayedScrollRef={recentlyPlayedScrollRef}
      forYouScrollRef={forYouScrollRef}
      currentTheme={currentTheme}
      selectedTimeOfDay={selectedTimeOfDay}
      focusedId={focusedId}
      currentTrack={currentTrack}
      isPlaying={!!playerStatus?.playing}
      recentlyPlayedTracks={recentlyPlayedTracks}
      onDpadPress={handleDpadPress}
    />
  );
};
