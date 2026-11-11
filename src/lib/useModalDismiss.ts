import { useEffect } from 'react';

/**
 * Dismiss a floating UI on Escape or outside click.
 * By default this does NOT lock body scroll — pass `lockScroll: true`
 * only for true full-screen modals where the page behind must not move.
 */
export function useModalDismiss(
  onClose: () => void,
  enabled: boolean,
  options: { lockScroll?: boolean } = {},
) {
  const { lockScroll = false } = options;

  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);

    let previousOverflow = '';
    if (lockScroll) {
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (lockScroll) {
        document.body.style.overflow = previousOverflow;
      }
    };
  }, [enabled, onClose, lockScroll]);
}
