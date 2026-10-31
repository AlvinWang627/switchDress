import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ApiKeyInput } from '@/options/components/ApiKeyInput';
import { ModelSelector } from '@/options/components/ModelSelector';

describe('ApiKeyInput', () => {
  it('預設以密碼欄位遮蔽', () => {
    render(<ApiKeyInput value="secret" onChange={() => {}} />);
    expect(screen.getByLabelText('API Key')).toHaveAttribute('type', 'password');
    expect(screen.getByLabelText('API Key')).toHaveValue('secret');
  });

  it('點擊切換鈕可顯示 / 隱藏，並更新 aria-label 與圖示', () => {
    render(<ApiKeyInput value="secret" onChange={() => {}} />);
    const input = screen.getByLabelText('API Key');

    fireEvent.click(screen.getByLabelText('顯示 API Key'));
    expect(input).toHaveAttribute('type', 'text');
    expect(screen.getByTestId('icon')).toHaveAttribute('data-icon', 'mdi:eye-off');

    fireEvent.click(screen.getByLabelText('隱藏 API Key'));
    expect(input).toHaveAttribute('type', 'password');
    expect(screen.getByTestId('icon')).toHaveAttribute('data-icon', 'mdi:eye');
  });

  it('輸入時回報新的值', () => {
    const onChange = vi.fn();
    render(<ApiKeyInput value="" onChange={onChange} />);

    fireEvent.change(screen.getByLabelText('API Key'), { target: { value: 'abc' } });

    expect(onChange).toHaveBeenCalledWith('abc');
  });

  it('disabled 時輸入框與切換鈕都停用', () => {
    render(<ApiKeyInput value="" onChange={() => {}} disabled />);
    expect(screen.getByLabelText('API Key')).toBeDisabled();
    expect(screen.getByLabelText('顯示 API Key')).toBeDisabled();
  });
});

describe('ModelSelector', () => {
  it('顯示目前選擇的模型與可用選項', () => {
    render(<ModelSelector value="gemini-3.1-flash-image-preview" onChange={() => {}} />);
    const select = screen.getByLabelText('模型');
    expect(select).toHaveValue('gemini-3.1-flash-image-preview');
    expect(screen.getByRole('option', { name: 'gemini-3.1-flash-image-preview' })).toBeInTheDocument();
  });

  it('提供兩個模型選項', () => {
    render(<ModelSelector value="gemini-3.1-flash-image-preview" onChange={() => {}} />);
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual([
      'gemini-3.1-flash-image-preview',
      'gemini-2.5-flash-image',
    ]);
  });

  it('變更選項時回報新的模型', () => {
    const onChange = vi.fn();
    render(<ModelSelector value="gemini-3.1-flash-image-preview" onChange={onChange} />);

    fireEvent.change(screen.getByLabelText('模型'), { target: { value: 'gemini-2.5-flash-image' } });

    expect(onChange).toHaveBeenCalledWith('gemini-2.5-flash-image');
  });

  it('disabled 時停用選單', () => {
    render(<ModelSelector value="gemini-3.1-flash-image-preview" onChange={() => {}} disabled />);
    expect(screen.getByLabelText('模型')).toBeDisabled();
  });
});
