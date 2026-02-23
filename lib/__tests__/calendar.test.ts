import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateICS, downloadICS } from '../calendar';

describe('generateICS', () => {
  it('generates valid ICS with 2 VEVENTs', () => {
    const ics = generateICS({
      teamName: 'Eagles',
      rink: { name: 'Ice Arena', city: 'Philadelphia', state: 'PA' },
      games: [
        { day: '2026-03-01', time: '10:00', opponent: 'Hawks', sheet: 'A' },
        { day: '2026-03-02', time: '14:30', opponent: 'Bears' },
      ],
    });

    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('END:VCALENDAR');
    const eventCount = (ics.match(/BEGIN:VEVENT/g) || []).length;
    expect(eventCount).toBe(2);

    // Check DTSTART/DTEND — 90 min duration
    expect(ics).toContain('DTSTART:20260301T100000');
    expect(ics).toContain('DTEND:20260301T113000');
    expect(ics).toContain('DTSTART:20260302T143000');
    expect(ics).toContain('DTEND:20260302T160000');

    // LOCATION and SUMMARY
    expect(ics).toContain('LOCATION:Ice Arena\\, Philadelphia\\, PA');
    expect(ics).toContain('SUMMARY:Eagles vs Hawks');
    expect(ics).toContain('SUMMARY:Eagles vs Bears');
  });

  it('returns empty string when day is missing', () => {
    const ics = generateICS({
      teamName: 'Eagles',
      rink: { name: 'Ice Arena', city: 'Philadelphia', state: 'PA' },
      games: [{ time: '10:00', opponent: 'Hawks' }],
    });
    expect(ics).toBe('');
  });

  it('returns empty string when time is missing', () => {
    const ics = generateICS({
      teamName: 'Eagles',
      rink: { name: 'Ice Arena', city: 'Philadelphia', state: 'PA' },
      games: [{ day: '2026-03-01', opponent: 'Hawks' }],
    });
    expect(ics).toBe('');
  });

  it('returns empty string for empty games array', () => {
    const ics = generateICS({
      teamName: 'Eagles',
      rink: { name: 'Ice Arena', city: 'Philadelphia', state: 'PA' },
      games: [],
    });
    expect(ics).toBe('');
  });

  it('returns empty string for undefined games', () => {
    const ics = generateICS({
      teamName: 'Eagles',
      rink: { name: 'Ice Arena', city: 'Philadelphia', state: 'PA' },
    });
    expect(ics).toBe('');
  });

  it('uses generic summary when no opponent provided', () => {
    const ics = generateICS({
      teamName: 'Eagles',
      rink: { name: 'Ice Arena', city: 'Philadelphia', state: 'PA' },
      games: [{ day: '2026-03-01', time: '10:00' }],
    });
    expect(ics).toContain('SUMMARY:Eagles game');
  });
});

describe('downloadICS', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('creates blob URL, appends/clicks/removes <a>, revokes URL', () => {
    const mockUrl = 'blob:http://localhost/fake';
    vi.spyOn(URL, 'createObjectURL').mockReturnValue(mockUrl);
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    const mockClick = vi.fn();
    const mockAppend = vi.fn();
    const mockRemove = vi.fn();

    vi.spyOn(document, 'createElement').mockReturnValue({
      href: '',
      download: '',
      click: mockClick,
    } as unknown as HTMLAnchorElement);
    vi.spyOn(document.body, 'appendChild').mockImplementation(mockAppend);
    vi.spyOn(document.body, 'removeChild').mockImplementation(mockRemove);

    downloadICS('schedule.ics', 'BEGIN:VCALENDAR\r\nEND:VCALENDAR');

    expect(URL.createObjectURL).toHaveBeenCalledOnce();
    expect(mockAppend).toHaveBeenCalledOnce();
    expect(mockClick).toHaveBeenCalledOnce();
    expect(mockRemove).toHaveBeenCalledOnce();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(mockUrl);
  });
});
