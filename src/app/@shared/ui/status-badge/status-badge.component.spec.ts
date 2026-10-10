import { StatusBadgeComponent } from './status-badge.component';

describe('StatusBadgeComponent workflow labels', () => {
  it('does not rename referral or payment statuses', () => {
    const badge = new StatusBadgeComponent();
    badge.status = 'Pending';
    expect(badge.label).toBe('Pending');
    expect(badge.resolvedTone).toBe('warning');
    badge.status = 'Confirmed';
    expect(badge.label).toBe('Confirmed');
  });

  it('shows DCS approval without changing its success tone or stored code', () => {
    const badge = new StatusBadgeComponent();
    badge.context = 'patient-history';
    badge.status = 'approved';
    expect(badge.label).toBe('Approved by DCS');
    expect(badge.resolvedTone).toBe('success');
    expect(badge.status).toBe('approved');
  });

  it('uses the Medical Board label and preserves legacy submissions', () => {
    const badge = new StatusBadgeComponent();
    badge.context = 'patient-history';
    badge.status = 'reviewed';
    expect(badge.label).toBe('Awaiting Medical Board');
    expect(badge.resolvedTone).toBe('warning');
    badge.status = 'pending';
    expect(badge.label).toBe('Legacy submission');
    expect(badge.resolvedTone).toBe('warning');
  });
});
