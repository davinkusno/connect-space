/**
 * Utility functions for handling report-related data
 */

export const REPORT_REASON_LABELS: Record<string, string> = {
  violence_hate_harassment: "Violence, Hate Speech, or Harassment",
  nudity_inappropriate: "Nudity or Inappropriate Sexual Content",
  spam_poor_quality: "Spam or Poor Quality Content",
  fraud_scam: "Fraud or Scam",
  copyright_violation: "Intellectual Property or Copyright Violation",
  other: "Other",
};

/**
 * Get the human-readable label for a report reason
 * @param reason The reason value from the database
 * @returns The formatted label
 */
export function getReportReasonLabel(reason: string): string {
  return REPORT_REASON_LABELS[reason] || reason;
}

