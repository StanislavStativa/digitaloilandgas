import '@testing-library/jest-dom';
import { act, render } from '@testing-library/react';
import { CountUp } from '../../../components/company-statistics/CountUp';

let intersect: (isIntersecting: boolean) => void;
let reducedMotion = false;

beforeEach(() => {
  jest.useFakeTimers();
  reducedMotion = false;
  window.matchMedia = jest.fn().mockImplementation(() => ({ matches: reducedMotion }));
  window.IntersectionObserver = jest.fn().mockImplementation((callback: IntersectionObserverCallback) => {
    const observer = { observe: jest.fn(), disconnect: jest.fn(), unobserve: jest.fn(), takeRecords: jest.fn() };
    intersect = (isIntersecting) => callback([{ isIntersecting } as IntersectionObserverEntry], observer as unknown as IntersectionObserver);
    return observer;
  }) as unknown as typeof IntersectionObserver;
});

afterEach(() => jest.useRealTimers());

const value = (container: HTMLElement) => container.querySelector('.count-up__value')?.textContent;

describe('CountUp', () => {
  it('starts at 0 right after mount, even when already in view, and never flashes the final value first', () => {
    const { container } = render(<CountUp end={4.4} decimals={2} duration={1000} />);
    expect(value(container)).toBe('0.00');

    act(() => intersect(true));
    expect(value(container)).toBe('0.00');

    act(() => jest.advanceTimersByTime(500));
    const midway = Number(value(container));
    expect(midway).toBeGreaterThan(0);
    expect(midway).toBeLessThan(4.4);

    act(() => jest.advanceTimersByTime(600));
    expect(value(container)).toBe('4.40');
  });

  it('waits at 0 while off-screen', () => {
    const { container } = render(<CountUp end={120} decimals={0} duration={1000} />);
    act(() => intersect(false));
    act(() => jest.advanceTimersByTime(2000));
    expect(value(container)).toBe('0');
  });

  it('keeps the final value with reduced motion, and labels the final value for screen readers', () => {
    reducedMotion = true;
    const { container } = render(<CountUp end={1234.5} decimals={1} />);
    expect(value(container)).toBe('1,234.5');
    expect(container.querySelector('.count-up')).toHaveAttribute('aria-label', '1,234.5');
  });
});
