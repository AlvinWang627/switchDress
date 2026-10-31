import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import GalleryItem from '@/components/GalleryItem';
import MasonryGallery from '@/components/MasonryGallery';
import type { ImageRecord } from '@/types/popup';

const image = (id: string, isFavorite = false): ImageRecord => ({
  id,
  blob: new Blob([id], { type: 'image/png' }),
  timestamp: 1,
  isFavorite,
});

beforeEach(() => {
  URL.createObjectURL = vi.fn(() => 'blob:gallery');
});

describe('GalleryItem', () => {
  it('以圖片 blob 建立網址並顯示', () => {
    const img = image('a');
    render(<GalleryItem image={img} onDelete={() => {}} onToggleFavorite={() => {}} />);

    expect(URL.createObjectURL).toHaveBeenCalledWith(img.blob);
    expect(screen.getByAltText('Gallery item')).toHaveAttribute('src', 'blob:gallery');
  });

  it('未加最愛：顯示「標記最愛」與空心星星', () => {
    render(<GalleryItem image={image('a', false)} onDelete={() => {}} onToggleFavorite={() => {}} />);

    const button = screen.getByLabelText('標記最愛');
    expect(button.querySelector('[data-icon="mdi:star-outline"]')).toBeInTheDocument();
  });

  it('已加最愛：顯示「取消最愛」與實心星星', () => {
    render(<GalleryItem image={image('a', true)} onDelete={() => {}} onToggleFavorite={() => {}} />);

    const button = screen.getByLabelText('取消最愛');
    expect(button.querySelector('[data-icon="mdi:star"]')).toBeInTheDocument();
  });

  it('isFavorite 未定義時視為未加最愛', () => {
    const img: ImageRecord = { id: 'a', blob: new Blob(['a']), timestamp: 1 };
    render(<GalleryItem image={img} onDelete={() => {}} onToggleFavorite={() => {}} />);

    expect(screen.getByLabelText('標記最愛')).toBeInTheDocument();
  });

  it('點擊最愛與刪除按鈕各自觸發對應的回呼', () => {
    const onDelete = vi.fn();
    const onToggleFavorite = vi.fn();
    render(<GalleryItem image={image('a')} onDelete={onDelete} onToggleFavorite={onToggleFavorite} />);

    fireEvent.click(screen.getByLabelText('標記最愛'));
    expect(onToggleFavorite).toHaveBeenCalledTimes(1);
    expect(onDelete).not.toHaveBeenCalled();

    fireEvent.click(screen.getByLabelText('刪除'));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});

describe('MasonryGallery', () => {
  it('沒有圖片時顯示空狀態提示', () => {
    render(<MasonryGallery images={[]} onDelete={() => {}} onToggleFavorite={() => {}} />);

    expect(screen.getByText('尚無合成照片')).toBeInTheDocument();
    expect(screen.getByText('在 Popup 頁面選擇照片進行 AI 合成')).toBeInTheDocument();
    expect(screen.queryByAltText('Gallery item')).not.toBeInTheDocument();
  });

  it('列出所有圖片', () => {
    render(
      <MasonryGallery images={[image('a'), image('b'), image('c')]} onDelete={() => {}} onToggleFavorite={() => {}} />
    );

    expect(screen.getAllByAltText('Gallery item')).toHaveLength(3);
    expect(screen.queryByText('尚無合成照片')).not.toBeInTheDocument();
  });

  it('刪除與最愛回呼會帶入該張圖片的 id', () => {
    const onDelete = vi.fn();
    const onToggleFavorite = vi.fn();
    render(
      <MasonryGallery
        images={[image('a'), image('b', true)]}
        onDelete={onDelete}
        onToggleFavorite={onToggleFavorite}
      />
    );

    fireEvent.click(screen.getAllByLabelText('刪除')[1]);
    fireEvent.click(screen.getByLabelText('標記最愛')); // 只有 a 尚未加最愛
    fireEvent.click(screen.getByLabelText('取消最愛')); // 只有 b 已加最愛

    expect(onDelete).toHaveBeenCalledWith('b');
    expect(onToggleFavorite).toHaveBeenNthCalledWith(1, 'a');
    expect(onToggleFavorite).toHaveBeenNthCalledWith(2, 'b');
  });
});
