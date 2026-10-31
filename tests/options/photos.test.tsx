import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PhotoSlot } from '@/options/components/PhotoSlot';
import { PhotoUploader } from '@/options/components/PhotoUploader';
import type { PersonalPhoto } from '@/types';

const photo = (overrides: Partial<PersonalPhoto> = {}): PersonalPhoto => ({
  id: 'p1',
  blob: new Blob(['x'], { type: 'image/png' }),
  name: 'me.png',
  type: 'image/png',
  uploadedAt: 1,
  ...overrides,
});

describe('PhotoSlot', () => {
  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => 'blob:slot');
  });

  it('沒有照片時顯示空白插槽（無圖片、無刪除鈕）', () => {
    render(<PhotoSlot />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('刪除照片')).not.toBeInTheDocument();
    expect(screen.getByTestId('icon')).toHaveAttribute('data-icon', 'mdi:image-plus');
  });

  it('有照片時顯示圖片，alt 為檔名', () => {
    const p = photo();
    render(<PhotoSlot photo={p} />);

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('alt', 'me.png');
    expect(img).toHaveAttribute('src', 'blob:slot');
    expect(URL.createObjectURL).toHaveBeenCalledWith(p.blob);
  });

  it('檔名為空時 alt 使用預設文字', () => {
    render(<PhotoSlot photo={photo({ name: '' })} />);
    expect(screen.getByRole('img')).toHaveAttribute('alt', '個人照片');
  });

  it('有 onDelete 時顯示刪除鈕，點擊帶入照片 id', () => {
    const onDelete = vi.fn();
    render(<PhotoSlot photo={photo({ id: 'abc' })} onDelete={onDelete} />);

    fireEvent.click(screen.getByLabelText('刪除照片'));

    expect(onDelete).toHaveBeenCalledWith('abc');
  });

  it('沒有 onDelete 時不顯示刪除鈕', () => {
    render(<PhotoSlot photo={photo()} />);
    expect(screen.queryByLabelText('刪除照片')).not.toBeInTheDocument();
  });

  it('disabled 時刪除鈕停用', () => {
    render(<PhotoSlot photo={photo()} onDelete={() => {}} disabled />);
    expect(screen.getByLabelText('刪除照片')).toBeDisabled();
  });
});

describe('PhotoUploader', () => {
  it('預設只接受 JPEG 與 PNG', () => {
    render(<PhotoUploader onFileSelect={() => {}} />);
    expect(screen.getByLabelText('上傳照片')).toHaveAttribute('accept', 'image/jpeg,image/png');
  });

  it('可自訂 accept', () => {
    render(<PhotoUploader onFileSelect={() => {}} accept="image/webp" />);
    expect(screen.getByLabelText('上傳照片')).toHaveAttribute('accept', 'image/webp');
  });

  it('點擊按鈕會開啟檔案選擇器', () => {
    render(<PhotoUploader onFileSelect={() => {}} />);
    const input = screen.getByLabelText('上傳照片') as HTMLInputElement;
    const clickSpy = vi.spyOn(input, 'click');

    fireEvent.click(screen.getByRole('button', { name: /上傳照片/ }));

    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it('選擇檔案後回報該檔案並重設 input', () => {
    const onFileSelect = vi.fn();
    render(<PhotoUploader onFileSelect={onFileSelect} />);
    const input = screen.getByLabelText('上傳照片') as HTMLInputElement;
    const file = new File(['x'], 'a.png', { type: 'image/png' });

    fireEvent.change(input, { target: { files: [file] } });

    expect(onFileSelect).toHaveBeenCalledWith(file);
    expect(input.value).toBe('');
  });

  it('沒有選擇檔案時不回報', () => {
    const onFileSelect = vi.fn();
    render(<PhotoUploader onFileSelect={onFileSelect} />);

    fireEvent.change(screen.getByLabelText('上傳照片'), { target: { files: [] } });

    expect(onFileSelect).not.toHaveBeenCalled();
  });

  it('disabled 時按鈕與 input 都停用', () => {
    render(<PhotoUploader onFileSelect={() => {}} disabled />);
    expect(screen.getByRole('button', { name: /上傳照片/ })).toBeDisabled();
    expect(screen.getByLabelText('上傳照片')).toBeDisabled();
  });
});
