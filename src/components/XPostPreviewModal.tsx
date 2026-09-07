"use client";

import { avatarColor } from "@/lib/avatarColor";
import { ReplyIcon, RetweetIcon, LikeIcon, ViewsIcon, ShareIcon } from "@/components/icons";

export function XPostPreviewModal({
  authorName,
  handle,
  avatarPath,
  content,
  imagePath,
  onClose,
}: {
  authorName: string;
  handle: string;
  avatarPath?: string | null;
  content: string;
  imagePath?: string | null;
  onClose: () => void;
}) {
  const initial = authorName.trim().charAt(0) || "?";
  const cleanHandle = handle.trim().replace(/^@/, "") || "your_account";

  return (
    <div className="detail-overlay" onClick={onClose}>
      <div className="x-preview-wrap" onClick={(e) => e.stopPropagation()}>
        <div className="x-preview-titlebar">
          <span>Xでのプレビュー</span>
          <button className="detail-panel-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="x-preview-card">
          <div
            className="x-preview-avatar"
            style={avatarPath ? undefined : { background: avatarColor(authorName || "x") }}
          >
            {avatarPath ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarPath} alt="" className="x-preview-avatar-img" />
            ) : (
              initial
            )}
          </div>
          <div className="x-preview-body">
            <div className="x-preview-header">
              <span className="x-preview-name">{authorName || "アカウント名"}</span>
              <span className="x-preview-handle">@{cleanHandle}</span>
              <span className="x-preview-dot">·</span>
              <span className="x-preview-time">たった今</span>
            </div>
            <div className="x-preview-text">{content}</div>
            {imagePath && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imagePath} alt="" className="x-preview-image" />
            )}
            <div className="x-preview-actions">
              <span className="x-preview-action">
                <ReplyIcon size={16} /> 0
              </span>
              <span className="x-preview-action">
                <RetweetIcon size={16} /> 0
              </span>
              <span className="x-preview-action">
                <LikeIcon size={16} /> 0
              </span>
              <span className="x-preview-action">
                <ViewsIcon size={16} /> 0
              </span>
              <span className="x-preview-action">
                <ShareIcon size={16} />
              </span>
            </div>
          </div>
        </div>
        <p className="x-preview-note">※ 実際の投稿ではありません。見え方の確認用プレビューです。</p>
      </div>
    </div>
  );
}
