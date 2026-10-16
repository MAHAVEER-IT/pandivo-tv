import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  BackHandler,
  Animated,
  Easing,
  Image,
  LogBox,
} from 'react-native';
import { AppProviders, useTheme, useFavorites, usePlayback } from './src/context';
import { useNavigationController } from './src/hooks/useNavigationController';
import { useUsbStorage } from './src/hooks/useUsbStorage';
import { useFullscreenController } from './src/hooks/useFullscreenController';
import { useAiDjController } from './src/context/AiDjContext';
import { useTvRemoteRouter } from './src/hooks/useTvRemoteRouter';
import { TopHeaderBar } from './src/components/layout/TopHeaderBar';
import { CollapsibleNavRail } from './src/components/layout/CollapsibleNavRail';
import { ScreenSwitcher } from './src/components/layout/ScreenSwitcher';
import { GlobalMiniPlayer } from './src/components/GlobalMiniPlayer';
import { FullscreenPlayerContainer } from './src/components/fullscreen/FullscreenPlayerContainer';
import { AIDJProcessingOverlay } from './src/components/ai-dj';
import { UsbMessageOverlay } from './src/components/UsbMessageOverlay';
import { SonicIntroSequence } from './src/components/SonicIntroSequence';
import {
  AvatarSelectionScreen,
  AvatarSelectionScreenRef,
} from './src/components/AvatarSelectionScreen';
import { SearchScreenRef } from './src/components/SearchScreen';
import { SETTINGS_FOCUS_IDS } from './src/navigation/settingsNavGraph';
import { AvatarId } from './src/database';
import { appStyles as styles } from './src/styles/appStyles';

LogBox.ignoreAllLogs(true);

function AppShell() {
  // 1. Theme & User Preferences
  const theme = useTheme();
  const {
    currentTime,
    currentDate,
    selectedTimeOfDay,
    selectedTimeOfDayRef,
    currentTheme,
    handleCycleTheme,
    selectedBackgroundId,
    selectedBackgroundIdRef,
    handleSelectBackground,
    savedAvatarId,
    savedAvatarIdRef,
    setSavedAvatarId,
    isPreferenceHydrated,
    showAvatarSelection,
    setShowAvatarSelection,
    showAvatarSelectionRef,
  } = theme;

  // 2. Favorites & Database Entity Hydration
  const fav = useFavorites();
  const {
    songFavoriteMap,
    playlistLikedMap,
    recentlyPlayedTracks,
    recentlyPlayedTracksRef,
    userAiPlaylists,
    userAiPlaylistsRef,
    setUserAiPlaylists,
    likedSongsPlaylist,
    likedSongsPlaylistRef,
    likedPlaylists,
    likedPlaylistsRef,
    handleTogglePlaylistLike: favTogglePlaylistLike,
    handleToggleSongFavorite: favToggleSongFavorite,
  } = fav;

  // 3. Audio Playback Engine & Queue Management
  const playback = usePlayback();
  const {
    player,
    playerStatus,
    playerStatusRef,
    currentTrack,
    currentTrackRef,
    setCurrentTrack,
    activePlaybackPlaylist,
    activePlaybackPlaylistRef,
    isShuffleActive,
    isShuffleActiveRef,
    shuffledTrackIds,
    shuffledTrackIdsRef,
    setShuffledTrackIds,
    isRepeatActive,
    setIsRepeatActive,
    seekPreviewSeconds,
    handleSeekDelta,
    handlePlayTrack,
    handleTogglePlayPause,
    handlePlayPlaylistTrack,
    handlePlayPlaylist,
    handlePlayPlaylistFromLibrary,
    handleToggleShuffle,
    handlePlayNext,
    handlePlayPrev,
    pausePlaybackForVoice,
    resumePlaybackAfterVoice,
    wasPlayingBeforeVoiceRef,
    session,
    setSession,
  } = playback;

  // 4. Intro & Sonic Docking Choreography
  const [showIntro, setShowIntro] = useState<boolean>(false);
  const homeOpacity = useRef(new Animated.Value(1)).current;
  const homeTranslateY = useRef(new Animated.Value(0)).current;
  const hasCheckedOnboardingRef = useRef<boolean>(false);

  // Automatically trigger Sonic Intro on fresh install / Day-0 onboarding
  useEffect(() => {
    if (isPreferenceHydrated && !hasCheckedOnboardingRef.current) {
      hasCheckedOnboardingRef.current = true;
      if (!savedAvatarIdRef.current) {
        console.log('[App] No saved avatar found. Triggering first-launch Sonic Intro & Avatar Onboarding!');
        homeOpacity.setValue(0);
        homeTranslateY.setValue(-20);
        setShowIntro(true);
      }
    }
  }, [isPreferenceHydrated, homeOpacity, homeTranslateY, savedAvatarIdRef]);

  // Intro Docking choreography
  const handleDockStart = useCallback(() => {
    if (!savedAvatarIdRef.current) {
      return;
    }
    Animated.parallel([
      Animated.timing(homeOpacity, {
        toValue: 1,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(homeTranslateY, {
        toValue: 0,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [homeOpacity, homeTranslateY, savedAvatarIdRef]);

  const handleIntroComplete = useCallback(() => {
    setShowIntro(false);
    if (!savedAvatarIdRef.current) {
      setShowAvatarSelection(true);
    } else {
      homeOpacity.setValue(1);
      homeTranslateY.setValue(0);
      nav.setFocusedId('HERO_VOICE');
    }
  }, [homeOpacity, homeTranslateY, savedAvatarIdRef, setShowAvatarSelection]);

  const handleReplayIntro = useCallback(() => {
    homeOpacity.setValue(0);
    homeTranslateY.setValue(-20);
    setShowIntro(true);
  }, [homeOpacity, homeTranslateY]);

  // 5. Search Screen & Avatar Screen Refs
  const searchScreenRef = useRef<SearchScreenRef>(null);
  const avatarSelectionRef = useRef<AvatarSelectionScreenRef>(null);

  // 6. Navigation Controller
  const nav = useNavigationController({
    isShuffleActiveRef,
    currentTrackRef,
    shuffledTrackIdsRef,
    setShuffledTrackIds,
    recentlyPlayedTracksRef,
    likedSongsPlaylistRef,
    likedPlaylistsRef,
    handleClearPlaylistSearch: () => {},
    handleLaunchContextualAIDJ: (ctx) => aiDj.handleLaunchContextualAIDJ(ctx),
    selectedTimeOfDayRef,
    handleToggleVoice: () => aiDj.handleToggleVoice(),
    handlePlayTrack,
    handleReplayIntro,
    handleCycleTheme,
    handleSelectUsbCard: () => usb.handleSelectUsbCard(),
    handleCloseUsbModal: () => usb.handleCloseUsbModal(),
    setShowAvatarSelection,
  });

  const handleConfirmAvatar = useCallback(
    (avatarId: AvatarId) => {
      setSavedAvatarId(avatarId);
      setShowAvatarSelection(false);
      Animated.parallel([
        Animated.timing(homeOpacity, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(homeTranslateY, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
      if (nav.activeNavTabRef.current === 'settings') {
        nav.setFocusedId(SETTINGS_FOCUS_IDS.CHANGE_AVATAR);
      } else {
        nav.setFocusedId('HERO_VOICE');
      }
    },
    [setSavedAvatarId, setShowAvatarSelection, homeOpacity, homeTranslateY, nav.activeNavTabRef, nav.setFocusedId]
  );

  const handleTogglePlaylistLike = useCallback(
    (playlistId?: string) => {
      const targetId = playlistId || nav.selectedPlaylistRef.current?.id;
      if (targetId) {
        favTogglePlaylistLike(targetId);
      }
    },
    [favTogglePlaylistLike, nav.selectedPlaylistRef]
  );

  const handleToggleSongFavorite = useCallback(
    (trackId?: string) => {
      const targetId = trackId || currentTrackRef.current?.id;
      if (targetId) {
        favToggleSongFavorite(targetId);
      }
    },
    [favToggleSongFavorite, currentTrackRef]
  );

  // 7. USB Storage
  const usb = useUsbStorage({
    setFocusedId: nav.setFocusedId,
    handleSelectPlaylist: nav.handleSelectPlaylist,
    selectedPlaylistRef: nav.selectedPlaylistRef,
    setSelectedPlaylist: nav.setSelectedPlaylist,
  });

  // 8. Fullscreen Controller
  const fsController = useFullscreenController({
    selectedPlaylistRef: nav.selectedPlaylistRef,
    setSelectedPlaylist: nav.setSelectedPlaylist,
    currentTrackRef,
    currentTrack,
    setFocusedId: nav.setFocusedId,
    selectedBackgroundIdRef,
    handleSelectBackground,
    handleTogglePlayPause,
    handlePlayPrev,
    handlePlayNext,
    handleToggleSongFavorite,
    handleSeekDelta,
  });

  // 9. AI DJ Pipeline Controller
  const aiDj = useAiDjController({
    player,
    currentTrackRef,
    setCurrentTrack,
    session,
    setSession,
    pausePlaybackForVoice,
    resumePlaybackAfterVoice,
    wasPlayingBeforeVoiceRef,
    userAiPlaylistsRef,
    setUserAiPlaylists,
    activeNavTabRef: nav.activeNavTabRef,
    setActiveNavTab: nav.setActiveNavTab,
    selectedPlaylistRef: nav.selectedPlaylistRef,
    setSelectedPlaylist: nav.setSelectedPlaylist,
    setFocusedId: nav.setFocusedId,
    handleSelectPlaylist: nav.handleSelectPlaylist,
    searchScreenRef,
  });

  // 10. Mini-Player Visibility
  const isMiniPlayerVisible = useMemo(() => {
    if (!currentTrack) return false;
    if (showIntro) return false;
    if (showAvatarSelection) return false;
    if (fsController.isFullscreenPlayer) return false;
    if (nav.selectedPlaylist !== null) return false;
    if (nav.activeNavTab === 'search' && nav.searchSubScreen === 'results') return false;
    return true;
  }, [
    currentTrack,
    showIntro,
    showAvatarSelection,
    fsController.isFullscreenPlayer,
    nav.selectedPlaylist,
    nav.activeNavTab,
    nav.searchSubScreen,
  ]);
  const isMiniPlayerVisibleRef = useRef<boolean>(false);
  isMiniPlayerVisibleRef.current = isMiniPlayerVisible;

  // Auto-recover focus if mini-player unmounts while focused
  useEffect(() => {
    if (!isMiniPlayerVisible && nav.focusedId.startsWith('MINI_')) {
      const exitTarget = nav.getContentExitTarget();
      nav.setFocusedId(exitTarget);
    }
  }, [isMiniPlayerVisible, nav.focusedId, nav.getContentExitTarget, nav.setFocusedId]);

  // 11. Collapsible Sidebar Rail Animation
  const [isSidebarHovered, setIsSidebarHovered] = useState<boolean>(false);
  const isSidebarFocused = nav.focusedId.startsWith('NAV_');
  const isSidebarExpanded = isSidebarFocused || isSidebarHovered;

  const sidebarWidth = useRef(new Animated.Value(76)).current;
  const labelOpacity = useRef(new Animated.Value(0)).current;
  const labelTranslateX = useRef(new Animated.Value(-8)).current;

  useEffect(() => {
    if (isSidebarExpanded) {
      Animated.parallel([
        Animated.timing(sidebarWidth, {
          toValue: 188,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(labelOpacity, {
          toValue: 1,
          duration: 180,
          delay: 40,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(labelTranslateX, {
          toValue: 0,
          duration: 200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(sidebarWidth, {
          toValue: 76,
          duration: 200,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(labelOpacity, {
          toValue: 0,
          duration: 100,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(labelTranslateX, {
          toValue: -8,
          duration: 120,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isSidebarExpanded, sidebarWidth, labelOpacity, labelTranslateX]);

  // 12. Hardware Back Button Listener
  const lastBackTimeRef = useRef<number>(0);
  useEffect(() => {
    const onHardwareBack = () => {
      if (usb.usbModalStateRef.current.visible) {
        usb.handleCloseUsbModal();
        return true;
      }
      if (aiDj.isAiDjOverlayVisibleRef.current) {
        aiDj.handleCancelAiDjProcessing();
        return true;
      }
      const now = Date.now();
      if (now - lastBackTimeRef.current < 220) {
        return true;
      }
      lastBackTimeRef.current = now;

      if (aiDj.isListeningRef.current) {
        aiDj.handleCancelVoiceListening();
        return true;
      }

      if (aiDj.geminiDiagnosticRef.current !== null) {
        aiDj.setGeminiDiagnostic(null);
        return true;
      }

      if (fsController.isFullscreenPlayerRef.current) {
        if (fsController.isBackgroundOverlayOpenRef.current) {
          fsController.closeBackgroundOverlay();
        } else if (fsController.isAiOverlayOpenRef.current) {
          fsController.closeAiSongInfoOverlay();
        } else {
          fsController.exitFullscreenPlayer();
        }
        return true;
      }

      if (showAvatarSelectionRef.current) {
        if (savedAvatarIdRef.current) {
          setShowAvatarSelection(false);
          if (nav.activeNavTabRef.current === 'settings') {
            nav.setFocusedId(SETTINGS_FOCUS_IDS.CHANGE_AVATAR);
          } else {
            nav.setFocusedId('HERO_VOICE');
          }
        }
        return true;
      }

      if (nav.selectedPlaylistRef.current !== null) {
        nav.handleBackFromPlaylist();
        return true;
      }

      if (nav.activeNavTabRef.current === 'search') {
        const consumed = searchScreenRef.current?.handleBack();
        if (!consumed) {
          nav.handleBackToHome();
        }
        return true;
      }

      if (nav.activeNavTabRef.current !== 'home') {
        nav.handleBackToHome();
        return true;
      }

      // If focused inside the mini player, recover focus to the content area
      if (nav.focusedIdRef.current.startsWith('MINI_')) {
        const exitTarget = nav.getContentExitTarget();
        nav.setFocusedId(exitTarget);
        return true;
      }

      // If in Home tab but within content (not on the sidebar rail), redirect focus to NAV_HOME
      if (!nav.focusedIdRef.current.startsWith('NAV_')) {
        nav.setFocusedId('NAV_HOME');
        return true;
      }

      return false;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
    return () => sub.remove();
  }, [
    usb,
    aiDj,
    fsController,
    nav,
    savedAvatarIdRef,
    showAvatarSelectionRef,
    setShowAvatarSelection,
  ]);

  // 13. Centralized Deterministic TV Remote Event Router
  useTvRemoteRouter(
    {
      handleProceedToAiDjPlaylist: aiDj.handleProceedToAiDjPlaylistRef,
      handleCancelAiDjProcessing: aiDj.handleCancelAiDjProcessing,
      setOverlayFocusedBtn: aiDj.setOverlayFocusedBtn,
      handleRetryAiDjProcessing: aiDj.handleRetryAiDjProcessing,
      handleTogglePlayPause,
      handleFullscreenRemoteEvent: fsController.handleFullscreenRemoteEvent,
      handleReplayIntro,
      handleBackFromPlaylist: nav.handleBackFromPlaylist,
      handleBackToHome: nav.handleBackToHome,
      handleToggleShuffle,
      handleTogglePlaylistLike,
      handleToggleSongFavorite,
      handlePlayPrev,
      handlePlayNext,
      handleToggleFullscreen: fsController.handleToggleFullscreen,
      handlePlayPlaylistTrack,
      handlePlayPlaylist,
      handlePlayPlaylistFromLibrary,
      handleToggleVoice: aiDj.handleToggleVoice,
      handleCancelVoiceListening: aiDj.handleCancelVoiceListening,
      handleLaunchContextualAIDJ: aiDj.handleLaunchContextualAIDJ,
      handleRunDiagnosticTest: aiDj.handleRunDiagnosticTest,
      handleVoiceCommand: aiDj.handleVoiceCommand,
      handleSelectPlaylist: nav.handleSelectPlaylist,
      handleSeekDelta,
      setFocusedId: nav.setFocusedId,
      getHomeNextFocus: nav.getHomeNextFocus,
      handleOpenFullscreenFromMiniPlayer: fsController.handleOpenFullscreenFromMiniPlayer,
      getContentExitTarget: nav.getContentExitTarget,
      getSidebarNavForCurrentTab: nav.getSidebarNavForCurrentTab,
    },
    {
      showAvatarSelectionRef,
      avatarSelectionRef,
      isAiDjOverlayVisibleRef: aiDj.isAiDjOverlayVisibleRef,
      aiDjProcessingStageRef: aiDj.aiDjProcessingStageRef,
      overlayFocusedBtnRef: aiDj.overlayFocusedBtnRef,
      usbModalStateRef: usb.usbModalStateRef,
      geminiDiagnosticRef: aiDj.geminiDiagnosticRef,
      isFullscreenPlayerRef: fsController.isFullscreenPlayerRef,
      fullscreenFocusIdRef: fsController.fullscreenFocusIdRef,
      focusedIdRef: nav.focusedIdRef,
      activeNavTabRef: nav.activeNavTabRef,
      selectedPlaylistRef: nav.selectedPlaylistRef,
      activePlaybackPlaylistRef,
      playerStatusRef,
      currentTrackRef,
      playerOriginTrackIdRef: nav.playerOriginTrackIdRef,
      lastFocusedTrackIdRef: nav.lastFocusedTrackIdRef,
      lastContentFocusIdRef: nav.lastContentFocusIdRef,
      playlistOriginRef: nav.playlistOriginRef,
      userAiPlaylistsRef,
      likedPlaylistsRef,
      likedSongsPlaylistRef,
      isMiniPlayerVisibleRef,
      searchSubScreenRef: nav.searchSubScreenRef,
      searchScreenRef,
      isListeningRef: aiDj.isListeningRef,
      selectedTimeOfDayRef,
      handleCloseUsbModal: usb.handleCloseUsbModal,
      setGeminiDiagnostic: aiDj.setGeminiDiagnostic,
      setShowAvatarSelection,
      setActiveNavTab: nav.setActiveNavTab,
      setSelectedPlaylist: nav.setSelectedPlaylist,
      handleSelectUsbCard: usb.handleSelectUsbCard,
      handleDpadPressRef: nav.handleDpadPressRef,
      player,
    }
  );

  // Preference hydration barrier
  if (!isPreferenceHydrated) {
    return <View style={styles.container} />;
  }

  return (
    <View
      style={[
        styles.container,
        nav.activeNavTab === 'favorites' && { backgroundColor: '#FFFFFF' },
      ]}
      focusable={true}
      hasTVPreferredFocus={true}
    >
      {nav.activeNavTab === 'search' && (
        <Image
          source={require('./assets/ui/search_pastel_bg.png')}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
      )}

      <Animated.View
        style={[
          styles.mainContent,
          {
            opacity: homeOpacity,
            transform: [{ translateY: homeTranslateY }],
          },
          fsController.isFullscreenPlayer && { display: 'none' },
        ]}
      >
        <TopHeaderBar
          sidebarWidth={sidebarWidth}
          labelOpacity={labelOpacity}
          labelTranslateX={labelTranslateX}
          isSidebarHovered={isSidebarHovered}
          setIsSidebarHovered={setIsSidebarHovered}
          selectedPlaylist={nav.selectedPlaylist}
          activeNavTab={nav.activeNavTab}
          focusedId={nav.focusedId}
          currentTime={currentTime}
          currentDate={currentDate}
          savedAvatarId={savedAvatarId}
          currentTheme={currentTheme}
          handleBackFromPlaylist={nav.handleBackFromPlaylist}
          handleBackToHome={nav.handleBackToHome}
          handleCycleTheme={handleCycleTheme}
          handleReplayIntro={handleReplayIntro}
          isListening={aiDj.isListening}
        />

        {aiDj.voiceToast && (
          <View style={styles.voiceToast}>
            <Text style={styles.voiceToastText}>{aiDj.voiceToast}</Text>
          </View>
        )}

        <View style={styles.bodyGrid}>
          <CollapsibleNavRail
            sidebarWidth={sidebarWidth}
            labelOpacity={labelOpacity}
            labelTranslateX={labelTranslateX}
            activeNavTab={nav.activeNavTab}
            focusedId={nav.focusedId}
            setIsSidebarHovered={setIsSidebarHovered}
            onNavItemPress={nav.handleDpadPress}
          />

          <View style={styles.rightContentArea}>
            <View style={styles.screenContainer}>
              <ScreenSwitcher
                selectedPlaylist={nav.selectedPlaylist}
                activeNavTab={nav.activeNavTab}
                focusedId={nav.focusedId}
                setFocusedId={nav.setFocusedId}
                currentTrack={currentTrack}
                playerStatus={playerStatus}
                seekPreviewSeconds={seekPreviewSeconds}
                isShuffleActive={isShuffleActive}
                shuffledTrackIds={shuffledTrackIds}
                isRepeatActive={isRepeatActive}
                setIsRepeatActive={setIsRepeatActive}
                playlistLikedMap={playlistLikedMap}
                songFavoriteMap={songFavoriteMap}
                handlePlayPlaylistTrack={handlePlayPlaylistTrack}
                handleTogglePlayPause={handleTogglePlayPause}
                handleBackFromPlaylist={nav.handleBackFromPlaylist}
                handlePlayNext={handlePlayNext}
                handlePlayPrev={handlePlayPrev}
                handleToggleShuffle={handleToggleShuffle}
                handleSeekDelta={handleSeekDelta}
                handleToggleFullscreen={fsController.handleToggleFullscreen}
                handleTogglePlaylistLike={handleTogglePlaylistLike}
                handleToggleSongFavorite={handleToggleSongFavorite}
                handleToggleVoice={aiDj.handleToggleVoice}
                handleCancelVoiceListening={aiDj.handleCancelVoiceListening}
                handleSelectPlaylist={nav.handleSelectPlaylist}
                handlePlayPlaylist={handlePlayPlaylist}
                handlePlayPlaylistFromLibrary={handlePlayPlaylistFromLibrary}
                activePlaybackPlaylist={activePlaybackPlaylist}
                handleSelectUsbCard={usb.handleSelectUsbCard}
                usbStatus={usb.usbStatus}
                likedSongsPlaylist={likedSongsPlaylist}
                likedPlaylists={likedPlaylists}
                currentTime={currentTime}
                searchScreenRef={searchScreenRef}
                handleBackToHome={nav.handleBackToHome}
                wasPlayingBeforeVoiceRef={wasPlayingBeforeVoiceRef}
                setSearchSubScreen={nav.setSearchSubScreen}
                pausePlaybackForVoice={pausePlaybackForVoice}
                resumePlaybackAfterVoice={resumePlaybackAfterVoice}
                savedAvatarId={savedAvatarId}
                setShowAvatarSelection={setShowAvatarSelection}
                homeScrollViewRef={nav.homeScrollViewRef}
                recentlyPlayedScrollRef={nav.recentlyPlayedScrollRef}
                forYouScrollRef={nav.forYouScrollRef}
                currentTheme={currentTheme}
                selectedTimeOfDay={selectedTimeOfDay}
                recentlyPlayedTracks={recentlyPlayedTracks}
                handleDpadPress={nav.handleDpadPress}
                isListening={aiDj.isListening}
                isProcessing={aiDj.isProcessing}
                voiceTranscript={aiDj.voiceTranscript}
                geminiDiagnostic={aiDj.geminiDiagnostic}
                isAiDjOverlayVisible={aiDj.isAiDjOverlayVisible}
                handleVoiceCommand={aiDj.handleVoiceCommand}
                handleRunDiagnosticTest={aiDj.handleRunDiagnosticTest}
                setGeminiDiagnostic={aiDj.setGeminiDiagnostic}
                userAiPlaylists={userAiPlaylists}
                setActiveNavTab={nav.setActiveNavTab}
                activeNavTabRef={nav.activeNavTabRef}
              />
            </View>

            {isMiniPlayerVisible && (
              <GlobalMiniPlayer
                currentTrack={currentTrack}
                isPlaying={!!playerStatus?.playing}
                currentTimeSeconds={
                  seekPreviewSeconds !== null
                    ? seekPreviewSeconds
                    : playerStatus?.currentTime || 0
                }
                durationSeconds={playerStatus?.duration || currentTrack?.duration || 252}
                focusedId={nav.focusedId}
                onTogglePlayPause={handleTogglePlayPause}
                onPlayPrev={handlePlayPrev}
                onPlayNext={handlePlayNext}
                onOpenFullscreen={fsController.handleOpenFullscreenFromMiniPlayer}
              />
            )}
          </View>
        </View>
      </Animated.View>

      <FullscreenPlayerContainer
        isFullscreenPlayer={fsController.isFullscreenPlayer}
        currentTrack={currentTrack}
        currentTrackRef={currentTrackRef}
        activePlaybackPlaylistRef={activePlaybackPlaylistRef}
        selectedPlaylist={nav.selectedPlaylist}
        selectedPlaylistRef={nav.selectedPlaylistRef}
        playerStatus={playerStatus}
        seekPreviewSeconds={seekPreviewSeconds}
        songFavoriteMap={songFavoriteMap}
        isShuffleActive={isShuffleActive}
        shuffledTrackIds={shuffledTrackIds}
        fullscreenFocusId={fsController.fullscreenFocusId}
        isAiOverlayOpen={fsController.isAiOverlayOpen}
        aiOverlayStatus={fsController.aiOverlayStatus}
        aiSongInsight={fsController.aiSongInsight}
        aiErrorMessage={fsController.aiErrorMessage}
        selectedBackgroundId={selectedBackgroundId}
        isBackgroundOverlayOpen={fsController.isBackgroundOverlayOpen}
        openBackgroundOverlay={fsController.openBackgroundOverlay}
        closeBackgroundOverlay={fsController.closeBackgroundOverlay}
        handleSelectBackground={handleSelectBackground}
        exitFullscreenPlayer={fsController.exitFullscreenPlayer}
        handleTogglePlayPause={handleTogglePlayPause}
        handlePlayPrev={handlePlayPrev}
        handlePlayNext={handlePlayNext}
        handleToggleSongFavorite={handleToggleSongFavorite}
        openAiSongInfoOverlay={fsController.openAiSongInfoOverlay}
        closeAiSongInfoOverlay={fsController.closeAiSongInfoOverlay}
      />

      <AIDJProcessingOverlay
        visible={aiDj.isAiDjOverlayVisible}
        userRequest={aiDj.aiDjUserRequest}
        sessionTitle={aiDj.aiDjSessionTitle}
        stage={aiDj.aiDjProcessingStage}
        tracks={aiDj.aiDjPreviewTracks}
        revealedCount={aiDj.aiDjRevealedCount}
        sessionSummary={aiDj.aiDjSessionSummary}
        errorInfo={aiDj.aiDjError}
        errorMessage={aiDj.aiDjErrorMessage}
        onCancel={aiDj.handleCancelAiDjProcessing}
        onRetry={aiDj.handleRetryAiDjProcessing}
        onProceed={aiDj.handleProceedToAiDjPlaylist}
        focusedErrorButton={aiDj.overlayFocusedBtn}
        onFocusErrorButton={aiDj.setOverlayFocusedBtn}
      />

      <UsbMessageOverlay
        visible={usb.usbModalState.visible}
        type={usb.usbModalState.type}
        title={usb.usbModalState.title}
        message={usb.usbModalState.message}
        onClose={usb.handleCloseUsbModal}
        isFocused={nav.focusedId === 'USB_MODAL_BACK'}
      />

      {showIntro && (
        <SonicIntroSequence
          onDockStart={handleDockStart}
          onComplete={handleIntroComplete}
        />
      )}

      {showAvatarSelection && (
        <AvatarSelectionScreen
          ref={avatarSelectionRef}
          onConfirmAvatar={handleConfirmAvatar}
          onCancel={() => {
            if (!savedAvatarIdRef.current) {
              setSavedAvatarId('bamboo');
            }
            setShowAvatarSelection(false);
            homeOpacity.setValue(1);
            homeTranslateY.setValue(0);
            if (nav.activeNavTabRef.current === 'settings') {
              nav.setFocusedId(SETTINGS_FOCUS_IDS.CHANGE_AVATAR);
            } else {
              nav.setFocusedId('HERO_VOICE');
            }
          }}
          initialSelectedAvatarId={savedAvatarId || 'bamboo'}
        />
      )}
    </View>
  );
}

export default function App() {
  return (
    <AppProviders>
      <AppShell />
    </AppProviders>
  );
}
