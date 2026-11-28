import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, SafeAreaView, StatusBar, Animated, Image, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { Pedometer } from 'expo-sensors';

const yogiImage = require('./assets/InShot_20261128_153518789.png');

let htmlBundle = '';
try {
  htmlBundle = require('./bundleHtml');
} catch (e) {
  htmlBundle = '<!DOCTYPE html><html><body><h3>Building Ayu...</h3></body></html>';
}

export default function App() {
  const webViewRef = useRef(null);
  const lastStepCountRef = useRef(0);
  const [splashHidden, setSplashHidden] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const dismissedRef = useRef(false);

  const dismissSplash = () => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => setSplashHidden(true));
  };

  useEffect(() => {
    // Safety fallback in case onLoadEnd is delayed
    const safetyTimer = setTimeout(dismissSplash, 2500);
    return () => clearTimeout(safetyTimer);
  }, []);

  useEffect(() => {
    let subscription = null;

    async function startPedometer() {
      try {
        const available = await Pedometer.isAvailableAsync();
        if (!available) return;

        const { status } = await Pedometer.requestPermissionsAsync();
        if (status !== 'granted') return;

        lastStepCountRef.current = 0;
        subscription = Pedometer.watchStepCount((result) => {
          const total = result?.steps || 0;
          const delta = total - lastStepCountRef.current;
          lastStepCountRef.current = total;
          if (delta > 0 && webViewRef.current) {
            const payload = JSON.stringify({ type: 'AYU_PHONE_STEPS_DELTA', delta });
            webViewRef.current.injectJavaScript(
              `window.dispatchEvent(new MessageEvent('message', { data: ${JSON.stringify(payload)} })); true;`
            );
          }
        });
      } catch (_err) {
        // Ignore on unsupported simulators/devices
      }
    }

    startPedometer();
    return () => {
      if (subscription) subscription.remove();
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF9F3" translucent={false} />
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: htmlBundle, baseUrl: 'https://ayu.local' }}
        onLoadEnd={dismissSplash}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowFileAccess={true}
        allowFileAccessFromFileURLs={true}
        allowUniversalAccessFromFileURLs={true}
        scalesPageToFit={true}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        style={styles.webview}
      />
      {!splashHidden && (
        <Animated.View pointerEvents="none" style={[styles.splashOverlay, { opacity: fadeAnim }]}>
          <Image source={yogiImage} style={styles.splashImg} resizeMode="contain" />
          <Text style={styles.splashTitle}>Ayu</Text>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9F3',
  },
  webview: {
    flex: 1,
    backgroundColor: '#FFF9F3',
  },
  splashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFF9F3',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  splashImg: {
    width: 140,
    height: 140,
  },
  splashTitle: {
    marginTop: 8,
    fontSize: 26,
    fontWeight: '800',
    color: '#1A1033',
    letterSpacing: -0.5,
  },
});
