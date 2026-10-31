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
    render(<ModelSelector value="nano-banana2" onChange={() => {}} />);
    const select = screen.getByLabelText('模型');
    expect(select).toHaveValue('nano-banana2');
    expect(screen.getByRole('option', { name: 'Nano banana2' })).toBeInTheDocument();
  });

  it('目前只提供一個模型選項', () => {
    render(<ModelSelector value="nano-banana2" onChange={() => {}} />);
    expect(screen.getAllByRole('option')).toHaveLength(1);
  });

  it('disabled 時停用選單', () => {
    render(<ModelSelector value="nano-banana2" onChange={() => {}} disabled />);
    expect(screen.getByLabelText('模型')).toBeDisabled();
  });
});
