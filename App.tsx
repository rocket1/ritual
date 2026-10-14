// Import single weights by subpath so the bundle doesn't ship every weight.
import { IBMPlexMono_400Regular } from '@expo-google-fonts/ibm-plex-mono/400Regular';
import { IBMPlexMono_500Medium } from '@expo-google-fonts/ibm-plex-mono/500Medium';
import { Marcellus_400Regular } from '@expo-google-fonts/marcellus/400Regular';
import { Spectral_400Regular } from '@expo-google-fonts/spectral/400Regular';
import { Spectral_400Regular_Italic } from '@expo-google-fonts/spectral/400Regular_Italic';
import { Spectral_600SemiBold } from '@expo-google-fonts/spectral/600SemiBold';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import React, { useSyncExternalStore } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useGame } from './src/game/store';
import { CreateGod } from './src/screens/CreateGod';
import { Shell } from './src/Shell';
import { C, currentTheme, subscribeTheme, themeVersion } from './src/theme';

export default function App() {
  const [loaded] = useFonts({
    Marcellus_400Regular,
    Spectral_400Regular,
    Spectral_400Regular_Italic,
    Spectral_600SemiBold,
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
  });
  const game = useGame();
  // Re-render everything when the theme or text size changes.
  useSyncExternalStore(subscribeTheme, themeVersion, themeVersion);

  return (
    <SafeAreaProvider>
      <StatusBar style={currentTheme().dark ? 'light' : 'dark'} />
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        {!loaded ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={C.gold} />
          </View>
        ) : game ? (
          <Shell />
        ) : (
          <CreateGod />
        )}
      </View>
    </SafeAreaProvider>
  );
}
