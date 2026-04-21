import { UIToSandboxMessage } from './sandbox/types';
import { discoverPages } from './sandbox/discovery';
import { runAllValidations } from './sandbox/validator';
import { runExtraction } from './sandbox/extractor';

// Show the plugin UI
figma.showUI(__html__, { width: 640, height: 520 });
console.log("WP Theme Builder Export: Plugin initialized");

// Cancellation flag
let cancelRequested = false;

// Handle messages from UI
figma.ui.onmessage = async (msg: UIToSandboxMessage) => {
  console.log("Sandbox received message:", msg.type);

  switch (msg.type) {
    case 'DISCOVER_PAGES': {
      try {
        const pages = discoverPages();
        console.log("Pages discovered:", pages.length);
        figma.ui.postMessage({ type: 'PAGES_DISCOVERED', pages });
      } catch (err) {
        console.error("Discovery error:", err);
        figma.ui.postMessage({ type: 'EXPORT_ERROR', error: String(err) });
      }
      break;
    }

    case 'VALIDATE': {
      try {
        const results = await runAllValidations(msg.frameIds);
        console.log("Validation complete:", results.length, "results");
        figma.ui.postMessage({
          type: 'VALIDATION_COMPLETE',
          results,
          frameIds: msg.frameIds,
        });
      } catch (err) {
        console.error("Validation error:", err);
        figma.ui.postMessage({
          type: 'EXPORT_ERROR',
          error: `Validation failed: ${err}`,
        });
      }
      break;
    }

    case 'START_EXPORT': {
      cancelRequested = false;
      try {
        await runExtraction(
          msg.frameIds,
          msg.responsivePairs,
          (message) => figma.ui.postMessage(message),
          () => cancelRequested,
        );
      } catch (err) {
        console.error("Export error:", err);
        figma.ui.postMessage({
          type: 'EXPORT_ERROR',
          error: `Export failed: ${err}`,
        });
      }
      break;
    }

    case 'CANCEL_EXPORT': {
      cancelRequested = true;
      console.log("Export cancelled by user");
      break;
    }
  }
};
