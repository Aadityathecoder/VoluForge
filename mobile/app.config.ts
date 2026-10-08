import type { ExpoConfig } from 'expo/config';
const config: ExpoConfig = {
  name: 'VoluForge', slug: 'voluforge', version: '1.0.0', scheme: 'voluforge',
  orientation: 'portrait', userInterfaceStyle: 'light', icon: './assets/icon.png',
  ios: {
    supportsTablet: false, bundleIdentifier: process.env.IOS_BUNDLE_IDENTIFIER || 'com.aadityamitra.voluforge',
    infoPlist: { ITSAppUsesNonExemptEncryption: false },
    privacyManifests: { NSPrivacyTracking: false, NSPrivacyAccessedAPITypes: [{ NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryUserDefaults', NSPrivacyAccessedAPITypeReasons: ['CA92.1'] }] },
  },
  android: { package: 'com.aadityamitra.voluforge', adaptiveIcon: { foregroundImage: './assets/icon.png', backgroundColor: '#F8F5ED' } },
  web: { favicon: './assets/favicon.png', name: 'VoluForge', description: 'A little time. A lot of good.' },
  experiments: { baseUrl: process.env.VOLUFORGE_WEBSITE_BUILD ? '/voluforge' : '' },
  plugins: ['expo-secure-store'],
  extra: process.env.EAS_PROJECT_ID ? { eas: { projectId: process.env.EAS_PROJECT_ID } } : {},
};
export default config;
