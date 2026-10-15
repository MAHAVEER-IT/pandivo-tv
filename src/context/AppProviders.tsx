import React, { useEffect } from 'react';
import { ThemeProvider } from './ThemeContext';
import { FavoritesProvider } from './FavoritesContext';
import { PlaybackProvider } from './PlaybackContext';
import { initializeCloudSyncOnBoot } from '../services/awsCloudSyncManager';

export interface AppProvidersProps {
  children: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  useEffect(() => {
    initializeCloudSyncOnBoot().catch((err) => {
      console.warn('[AppProviders] Background cloud sync initialized with notice:', err);
    });
  }, []);

  return (
    <ThemeProvider>
      <FavoritesProvider>
        <PlaybackProvider>
          {children}
        </PlaybackProvider>
      </FavoritesProvider>
    </ThemeProvider>
  );
};
