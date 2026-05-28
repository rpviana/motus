import { describe, it, expect } from 'vitest';
import { classifyMobilityLabel } from './mobilityLabels.js';

describe('classifyMobilityLabel', () => {
  it('classifies wheelchair labels', () => {
    expect(classifyMobilityLabel('Wheelchair')).toBe('wheelchair');
    expect(classifyMobilityLabel('cadeira de rodas')).toBe('wheelchair');
  });

  it('classifies crutches labels', () => {
    expect(classifyMobilityLabel('muleta')).toBe('crutches');
  });

  it('returns null for unknown labels', () => {
    expect(classifyMobilityLabel('something else')).toBeNull();
  });

  it('rejects human labels', () => {
    expect(classifyMobilityLabel('person')).toBeNull();
    expect(classifyMobilityLabel('person with crutches')).toBeNull();
    expect(classifyMobilityLabel('adult')).toBeNull();
  });
});
