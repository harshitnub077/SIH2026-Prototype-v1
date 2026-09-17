/**
 * Triggers hardware haptic feedback on supported mobile devices (PWA/Android).
 * iOS Safari currently restricts navigator.vibrate, but it works flawlessly on Android PWAs.
 * 
 * @param {'light' | 'medium' | 'heavy' | 'success' | 'error'} type 
 */
export const triggerHaptic = (type = 'light') => {
  if (typeof window === 'undefined' || !navigator.vibrate) return;

  try {
    switch (type) {
      case 'light':
        navigator.vibrate(20);
        break;
      case 'medium':
        navigator.vibrate(40);
        break;
      case 'heavy':
        navigator.vibrate(70);
        break;
      case 'success':
        navigator.vibrate([30, 50, 30]); // double tap
        break;
      case 'error':
        navigator.vibrate([50, 100, 50, 100, 50]); // heavy triple buzz
        break;
      default:
        navigator.vibrate(30);
    }
  } catch (e) {
    // Ignore errors on unsupported environments
  }
};