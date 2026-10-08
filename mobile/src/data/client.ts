import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const websiteConfig = Platform.OS === 'web' && typeof window !== 'undefined'
  ? (window as unknown as { __VOLUFORGE_CONFIG__?: { url?: string; key?: string } }).__VOLUFORGE_CONFIG__ : undefined;
const url = (websiteConfig?.url ?? process.env.EXPO_PUBLIC_SUPABASE_URL)?.trim();
const key = (websiteConfig?.key ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY)?.trim();
export const supabaseURL = url;
export const isConfigured = Boolean(url && key && /^https:\/\//.test(url));

// Native auth secrets are encrypted by the OS. Web sessions are limited to the
// current tab; neither platform stores live credentials in AsyncStorage.
const authStorage = {
  async getItem(name: string): Promise<string | null> {
    if (Platform.OS === 'web') return typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(name) : null;
    const count = await SecureStore.getItemAsync(`${name}.parts`);
    if (!count) return null;
    const parts = await Promise.all(Array.from({ length: Number(count) }, (_, i) => SecureStore.getItemAsync(`${name}.${i}`)));
    return parts.every(part => part !== null) ? parts.join('') : null;
  },
  async setItem(name: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(name, value);
      return;
    }
    // Chunk JWT sessions because some native keychains limit individual values.
    const oldCount = Number(await SecureStore.getItemAsync(`${name}.parts`) || 0);
    const chunks = value.match(/[\s\S]{1,1800}/g) || [''];
    for (let i = 0; i < chunks.length; i++) await SecureStore.setItemAsync(`${name}.${i}`, chunks[i], { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
    await SecureStore.setItemAsync(`${name}.parts`, String(chunks.length), { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
    for (let i = chunks.length; i < oldCount; i++) await SecureStore.deleteItemAsync(`${name}.${i}`);
  },
  async removeItem(name: string): Promise<void> {
    if (Platform.OS === 'web') {
      if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(name);
      return;
    }
    const count = Number(await SecureStore.getItemAsync(`${name}.parts`) || 0);
    await SecureStore.deleteItemAsync(`${name}.parts`);
    await Promise.all(Array.from({ length: count }, (_, i) => SecureStore.deleteItemAsync(`${name}.${i}`)));
  },
};

export const supabase = isConfigured
  ? createClient(url!, key!, { auth: { storage: authStorage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, flowType: 'pkce' } })
  : null;

export function requireClient() {
  if (!supabase) throw new Error('Live accounts are not connected yet. Configure the Supabase URL and public key to enable them.');
  return supabase;
}
