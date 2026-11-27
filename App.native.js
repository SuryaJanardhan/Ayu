import React from 'react';
import { StyleSheet, SafeAreaView, StatusBar, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

let htmlBundle = '';
try {
  htmlBundle = require('./bundleHtml');
} catch (e) {
  htmlBundle = '<!DOCTYPE html><html><body><h3>Building Ayu...</h3></body></html>';
}

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF9F3" translucent={false} />
      <WebView
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
