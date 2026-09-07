"use client";

import { useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";

export function ImageGalleryModal({
  images,
  onClose,
}: {
  images: string[];
  onClose: () => void;
}) {
  const [index, setIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="detail-overlay" onClick={onClose}>
        <div className="detail-panel" onClick={(e) => e.stopPropagation()}>
          <div className="detail-panel-header">
            <span>参考資料</span>
            <button className="detail-panel-close" onClick={onClose}>
              ×
            </button>
          </div>
          <p className="hint-text">まだ参考資料が登録されていません。</p>
        </div>
      </div>
    );
  }

  const prev = () => setIndex((i) => (i - 1 + images.length) % images.length);
  const next = () => setIndex((i) => (i + 1) % images.length);

  return (
    <div className="detail-overlay" onClick={onClose}>
      <div className="gallery-panel" onClick={(e) => e.stopPropagation()}>
        <div className="detail-panel-header">
          <span>
            参考資料（{index + 1} / {images.length}）
          </span>
          <button className="detail-panel-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="gallery-body">
          {images.length > 1 && (
            <button className="icon-btn gallery-nav" onClick={prev} title="前へ">
              <ChevronLeftIcon />
            </button>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="gallery-image" src={images[index]} alt={`参考資料 ${index + 1}`} />
          {images.length > 1 && (
            <button className="icon-btn gallery-nav" onClick={next} title="次へ">
              <ChevronRightIcon />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
