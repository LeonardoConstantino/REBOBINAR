/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * Cross-browser Fullscreen API wrapper
 */
export const isFullscreenSupported = (): boolean => {
  if (typeof document === 'undefined') return false;
  const doc = document as any;
  return Boolean(
    doc.fullscreenEnabled ||
    doc.webkitFullscreenEnabled ||
    doc.mozFullScreenEnabled ||
    doc.msFullscreenEnabled
  );
};

export const getIsFullscreen = (): boolean => {
  if (typeof document === 'undefined') return false;
  const doc = document as any;
  return Boolean(
    doc.fullscreenElement ||
    doc.webkitFullscreenElement ||
    doc.mozFullScreenElement ||
    doc.msFullscreenElement
  );
};

export const toggleFullscreen = async (): Promise<boolean> => {
  if (typeof document === 'undefined') return false;
  const doc = document as any;
  const docEl = document.documentElement as any;

  try {
    if (!getIsFullscreen()) {
      if (docEl.requestFullscreen) {
        await docEl.requestFullscreen();
      } else if (docEl.webkitRequestFullscreen) {
        await docEl.webkitRequestFullscreen();
      } else if (docEl.mozRequestFullScreen) {
        await docEl.mozRequestFullScreen();
      } else if (docEl.msRequestFullscreen) {
        await docEl.msRequestFullscreen();
      }
      return true;
    } else {
      if (doc.exitFullscreen) {
        await doc.exitFullscreen();
      } else if (doc.webkitExitFullscreen) {
        await doc.webkitExitFullscreen();
      } else if (doc.mozCancelFullScreen) {
        await doc.mozCancelFullScreen();
      } else if (doc.msExitFullscreen) {
        await doc.msExitFullscreen();
      }
      return false;
    }
  } catch (err) {
    console.warn('Falha ao alternar tela cheia (requer interação do usuário):', err);
    return getIsFullscreen();
  }
};

/**
 * React hook to track and toggle fullscreen state
 */
export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() => getIsFullscreen());
  const [supported, setSupported] = useState<boolean>(true);

  useEffect(() => {
    setSupported(isFullscreenSupported());

    const updateState = () => {
      setIsFullscreen(getIsFullscreen());
    };

    document.addEventListener('fullscreenchange', updateState);
    document.addEventListener('webkitfullscreenchange', updateState);
    document.addEventListener('mozfullscreenchange', updateState);
    document.addEventListener('MSFullscreenChange', updateState);

    return () => {
      document.removeEventListener('fullscreenchange', updateState);
      document.removeEventListener('webkitfullscreenchange', updateState);
      document.removeEventListener('mozfullscreenchange', updateState);
      document.removeEventListener('MSFullscreenChange', updateState);
    };
  }, []);

  const toggle = useCallback(async () => {
    const next = await toggleFullscreen();
    setIsFullscreen(next);
  }, []);

  return { isFullscreen, supported, toggle };
}
