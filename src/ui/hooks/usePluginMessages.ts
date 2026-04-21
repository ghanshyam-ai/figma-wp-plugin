import { useEffect, useCallback } from 'preact/hooks';

/**
 * Send a message from the UI to the Figma plugin sandbox.
 */
export function sendToPlugin(msg: any): void {
  parent.postMessage({ pluginMessage: msg }, '*');
}

/**
 * Hook to listen for messages from the Figma plugin sandbox.
 */
export function usePluginMessages(handler: (msg: any) => void): void {
  const stableHandler = useCallback(handler, [handler]);

  useEffect(() => {
    const listener = (event: MessageEvent) => {
      if (event.data.pluginMessage) {
        stableHandler(event.data.pluginMessage);
      }
    };
    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, [stableHandler]);
}
