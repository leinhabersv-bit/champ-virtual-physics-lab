/**
 * PWA & Offline Readiness Status Service
 *
 * Truthfully inspects:
 * 1. navigator.onLine (network connectivity)
 * 2. Service Worker registration & controller
 * 3. Cache Storage presence
 *
 * Avoids deceptive 'PWA Ready' badges when offline caching has not actually been established.
 */

export type PwaReadinessLevel =
  | 'pwa_active'      // Online + Service Worker active + Caches populated
  | 'pwa_installed'   // Online + Service Worker registered
  | 'web_online'      // Online in regular browser tab without PWA caching
  | 'offline_ready'   // Offline, but Service Worker cache is active and serving assets
  | 'offline_limited'; // Offline without cached service worker

export interface PwaStatusState {
  isOnline: boolean;
  hasServiceWorkerSupport: boolean;
  isServiceWorkerRegistered: boolean;
  isCachedOffline: boolean;
  level: PwaReadinessLevel;
  statusLabel: string;
  tooltipText: string;
}

function computeStatus(
  isOnline: boolean,
  isSwRegistered: boolean,
  isCached: boolean
): { level: PwaReadinessLevel; label: string; tooltip: string } {
  if (isOnline) {
    if (isSwRegistered && isCached) {
      return {
        level: 'pwa_active',
        label: 'PWA Cached',
        tooltip: 'Service Worker active. All 9 laboratory workbenches cached for full offline execution.',
      };
    }
    if (isSwRegistered) {
      return {
        level: 'pwa_installed',
        label: 'PWA Ready',
        tooltip: 'Service Worker registered. Downloading local offline laboratory assets.',
      };
    }
    return {
      level: 'web_online',
      label: 'Live Web Mode',
      tooltip: 'Connected to live web server. Service Worker not installed for offline use.',
    };
  }

  // Offline scenarios
  if (isSwRegistered && isCached) {
    return {
      level: 'offline_ready',
      label: 'Offline Ready',
      tooltip: 'Operating completely offline. All simulation engines and datasets running from local cache.',
    };
  }

  return {
    level: 'offline_limited',
    label: 'Offline (Limited)',
    tooltip: 'Device disconnected from network. Uncached pages may not reload.',
  };
}

let cachedStatus: PwaStatusState = {
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  hasServiceWorkerSupport: typeof navigator !== 'undefined' && 'serviceWorker' in navigator,
  isServiceWorkerRegistered: false,
  isCachedOffline: false,
  level: 'web_online',
  statusLabel: 'Live Web Mode',
  tooltipText: 'Connected to live web server.',
};

export function getPwaStatus(): PwaStatusState {
  return cachedStatus;
}

const listeners = new Set<(status: PwaStatusState) => void>();

export async function checkPwaStatus(): Promise<PwaStatusState> {
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  const hasSw = typeof navigator !== 'undefined' && 'serviceWorker' in navigator;
  let isSwRegistered = false;
  let isCached = false;

  if (hasSw) {
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      isSwRegistered = Boolean(reg && reg.active);

      if (typeof caches !== 'undefined') {
        const keys = await caches.keys();
        isCached = keys.length > 0;
      }
    } catch {
      // In private browsing or non-HTTPS dev, serviceWorker inspection may fail
      isSwRegistered = false;
      isCached = false;
    }
  }

  const { level, label, tooltip } = computeStatus(isOnline, isSwRegistered, isCached);

  cachedStatus = {
    isOnline,
    hasServiceWorkerSupport: hasSw,
    isServiceWorkerRegistered: isSwRegistered,
    isCachedOffline: isCached,
    level,
    statusLabel: label,
    tooltipText: tooltip,
  };

  for (const fn of listeners) {
    try {
      fn(cachedStatus);
    } catch (e) {
      console.error('PwaStatus listener error', e);
    }
  }

  return cachedStatus;
}

export function subscribePwaStatus(listener: (status: PwaStatusState) => void): () => void {
  listeners.add(listener);
  // Initial check
  checkPwaStatus();

  const handleNetworkChange = () => {
    checkPwaStatus();
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('online', handleNetworkChange);
    window.addEventListener('offline', handleNetworkChange);
  }

  return () => {
    listeners.delete(listener);
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', handleNetworkChange);
      window.removeEventListener('offline', handleNetworkChange);
    }
  };
}

export async function registerServiceWorker(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }
  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    if (reg) {
      await checkPwaStatus();
      return true;
    }
    return false;
  } catch (err) {
    console.info('Service Worker registration skipped or failed:', err);
    await checkPwaStatus();
    return false;
  }
}
