import React, { useEffect, useRef } from 'react';
import { StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { WebView } from 'react-native-webview';
import { Pedometer } from 'expo-sensors';

let htmlBundle = '';
try {
  htmlBundle = require('./bundleHtml');
} catch (e) {
  htmlBundle = '<!DOCTYPE html><html><body><h3>Building Ayu...</h3></body></html>';
}

export default function App() {
  const webViewRef = useRef(null);
  const lastStepCountRef = useRef(0);

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
});
