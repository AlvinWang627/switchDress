import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SizeIndicator from '@/components/ScreenshotOverlay/SizeIndicator';

describe('SizeIndicator', () => {
  it('顯示 寬 × 高', () => {
    render(<SizeIndicator width={320} height={240} />);
    expect(screen.getByText('320 × 240')).toBeInTheDocument();
  });

  it('小數會四捨五入', () => {
    render(<SizeIndicator width={100.4} height={99.5} />);
    expect(screen.getByText('100 × 100')).toBeInTheDocument();
  });
});
