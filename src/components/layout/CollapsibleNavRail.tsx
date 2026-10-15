import React from 'react';
import {
  View,
  Text,
  Pressable,
  Image,
  Animated,
} from 'react-native';
import { NAV_ITEMS } from '../../constants/navItems';
import { appStyles as styles } from '../../styles/appStyles';

export interface CollapsibleNavRailProps {
  sidebarWidth: Animated.Value;
  labelOpacity: Animated.AnimatedInterpolation<number | string>;
  labelTranslateX: Animated.AnimatedInterpolation<number | string>;
  activeNavTab: string;
  focusedId: string;
  setIsSidebarHovered: React.Dispatch<React.SetStateAction<boolean>>;
  onNavItemPress: (id: string) => void;
}

export const CollapsibleNavRail: React.FC<CollapsibleNavRailProps> = ({
  sidebarWidth,
  labelOpacity,
  labelTranslateX,
  activeNavTab,
  focusedId,
  setIsSidebarHovered,
  onNavItemPress,
}) => {
  return (
    <Animated.View
      style={[
        styles.leftNavRail,
        {
          width: sidebarWidth.interpolate({
            inputRange: [76, 188],
            outputRange: [104, 216],
          }),
        },
      ]}
    >
      {NAV_ITEMS.map((item) => {
        const isActive = activeNavTab === item.tab;
        const isItemFocused = focusedId === item.id;
        return (
          <Pressable
            key={item.id}
            focusable={false}
            onHoverIn={() => setIsSidebarHovered(true)}
            onHoverOut={() => setIsSidebarHovered(false)}
            onPress={() => onNavItemPress(item.id)}
            style={({ pressed }) => [
              styles.navItem,
              isActive && styles.navItemActive,
              isItemFocused && styles.navItemFocused,
              isActive && isItemFocused && styles.navItemActiveFocused,
              pressed && styles.btnPressed,
            ]}
          >
            <View style={styles.navIconBox}>
              <Image
                source={item.icon}
                style={[
                  styles.navIconImage,
                  (isActive || isItemFocused)
                    ? styles.navIconImageActive
                    : styles.navIconImageInactive,
                ]}
                resizeMode="contain"
              />
            </View>
            <Animated.View
              style={[
                styles.navLabelWrapper,
                {
                  opacity: labelOpacity,
                  transform: [{ translateX: labelTranslateX }],
                },
              ]}
            >
              <Text
                numberOfLines={1}
                style={[styles.navLabel, isActive && styles.navLabelActive]}
              >
                {item.label}
              </Text>
            </Animated.View>
          </Pressable>
        );
      })}
    </Animated.View>
  );
};
