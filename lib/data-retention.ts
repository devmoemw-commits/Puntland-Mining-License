/**
 * Permanent row deletion is disabled for audit and data-retention requirements.
 * Server actions that historically deleted rows must return this instead.
 */
export const DATA_DELETION_FORBIDDEN_MESSAGE =
  "Deleting records is disabled to preserve audit history. Use status changes, corrections, or archiving workflows instead.";

export function dataDeletionBlockedResult(): { error: string } {
  return { error: DATA_DELETION_FORBIDDEN_MESSAGE };
}
