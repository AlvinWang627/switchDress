import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '@/components/App';

describe('App', () => {
  it('顯示標題與說明文字', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: 'switch-dress' })).toBeInTheDocument();
    expect(screen.getByText(/Chrome Extension with React/)).toBeInTheDocument();
  });

  it('顯示 rocket 圖示與就緒狀態', () => {
    render(<App />);
    expect(screen.getByTestId('icon')).toHaveAttribute('data-icon', 'mdi:rocket');
    expect(screen.getByText('Infrastructure Ready')).toBeInTheDocument();
  });
});
