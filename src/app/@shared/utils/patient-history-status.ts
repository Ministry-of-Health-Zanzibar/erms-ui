// Display names only: API status codes still control permissions and actions.
export const PATIENT_HISTORY_STATUS_LABELS: Readonly<Record<string, string>> = {
  reviewed: 'Awaiting Medical Board',
  assigned: 'Assigned to Board Meeting',
  requested: 'Awaiting DCS Approval',
  approved: 'Approved by DCS',
  confirmed: 'Confirmed',
  rejected: 'Rejected',
  boarded_out: 'Boarded Out',
  pending: 'Legacy submission',
};

export function patientHistoryStatusLabel(status: string | null | undefined, fallback?: string): string {
  const value = status?.trim() || '';
  return PATIENT_HISTORY_STATUS_LABELS[value.toLowerCase()] ?? fallback ?? (value || 'N/A');
}
