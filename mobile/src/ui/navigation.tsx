import { createContext, useContext } from 'react';
export type Tab = 'home'|'explore'|'activity'|'impact'|'profile';
export type Sheet = { kind: 'apply'|'log'|'export'|'editProfile'|'auth'|'privacy'|'terms'|'support'|'delete'|'review'|'resetDemo'|'password'|'publish'|'preferences'|'connections'|'insights'|'partner'|'outcome'; id?: string };
export const NavigationContext = createContext<{ tab: Tab; navigate: (tab: Tab, cause?: string) => void; detail: (id: string) => void; sheet: (value: Sheet) => void; close: () => void; notify: (message: string) => void }>({ tab: 'home', navigate: () => {}, detail: () => {}, sheet: () => {}, close: () => {}, notify: () => {} });
export const useNav = () => useContext(NavigationContext);
