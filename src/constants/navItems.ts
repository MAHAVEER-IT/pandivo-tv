// Left Navigation Rail Items Configuration (Using New 3D Holographic Glass Drawer Icons)
export interface NavItemConfig {
  id: string;
  tab: string;
  label: string;
  icon: any;
}

export const NAV_ITEMS: NavItemConfig[] = [
  { id: 'NAV_HOME', tab: 'home', label: 'Home', icon: require('../../assets/drawer/HOME.png') },
  { id: 'NAV_SEARCH', tab: 'search', label: 'Search', icon: require('../../assets/drawer/SEARCH.png') },
  { id: 'NAV_DJ', tab: 'ai_dj', label: 'AI DJ', icon: require('../../assets/drawer/AI_DJ.png') },
  { id: 'NAV_LIBRARY', tab: 'library', label: 'Your Library', icon: require('../../assets/drawer/LIB.png') },
  { id: 'NAV_FAV', tab: 'favorites', label: 'Favorites', icon: require('../../assets/drawer/FAV.png') },
  { id: 'NAV_SETTINGS', tab: 'settings', label: 'Settings', icon: require('../../assets/drawer/SETTING.png') },
];
