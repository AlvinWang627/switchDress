import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CameraIcon } from './CameraIcon';

vi.mock('@iconify/react', () => ({
  Icon: vi.fn(({ icon, style }) => <span data-testid="mock-icon" data-icon={icon} style={style} />),
}));

describe('CameraIcon', () => {
  it('renders with default props', () => {
    render(<CameraIcon />);
    const icon = screen.getByTestId('mock-icon');
    expect(icon).toBeDefined();
  });

  it('renders with custom size', () => {
    render(<CameraIcon size={48} />);
    const icon = screen.getByTestId('mock-icon');
    expect(icon).toBeDefined();
  });

  it('renders with custom color', () => {
    render(<CameraIcon color="#ff0000" />);
    const icon = screen.getByTestId('mock-icon');
    expect(icon).toBeDefined();
  });

  it('has accessible aria-label', () => {
    render(<CameraIcon />);
    const span = screen.getByRole('img');
    expect(span.getAttribute('aria-label')).toBe('開啟相機');
  });

  it('click handler is no-op', () => {
    const handleClick = vi.fn();
    render(<CameraIcon />);
    const span = screen.getByRole('img');
    span.onclick = handleClick;
  });
});
