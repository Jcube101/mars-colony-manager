/**
 * Versioned JSON save format (placeholder — Phase 5).
 * format: "mars-colony-manager-save"
 */

export const SAVE_FORMAT = 'mars-colony-manager-save' as const;
export const SAVE_FORMAT_VERSION = 1;

export function serializePlaceholder(): string {
  return JSON.stringify({
    format: SAVE_FORMAT,
    formatVersion: SAVE_FORMAT_VERSION,
  });
}
