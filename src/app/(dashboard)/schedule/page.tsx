"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useClients } from "@/lib/ClientsContext";
import { WeekCalendar, ScheduledPostLike } from "@/components/WeekCalendar";
import { WeekNav } from "@/components/WeekNav";
import { startOfWeek, addDays, dateKey } from "@/lib/week";
import { XPostPreviewModal } from "@/components/XPostPreviewModal";
import { EyeIcon } from "@/components/icons";

const STATUS_LABEL: Record<string, string> = {
  pending: "確認待ち",
  approved: "承認済み",
  rejected: "却下",
};

export default function SchedulePage() {
  const { currentClientId, currentClient, loading: clientsLoading } = useClients();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [posts, setPosts] = useState<ScheduledPostLike[]>([]);
  const [selected, setSelected] = useState<ScheduledPostLike | null>(null);
  const [copied, setCopied] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    if (!currentClientId) {
      setPosts([]);
      return;
    }
    const from = dateKey(weekStart);
    const to = dateKey(addDays(weekStart, 7));
    fetch(`/api/schedule?clientId=${currentClientId}&from=${from}&to=${to}`)
      .then((r) => r.json())
      .then(setPosts);
  }, [currentClientId, weekStart]);

  const removePost = async (id: string) => {
    if (!confirm("この投稿予定を削除しますか？")) return;
    await fetch(`/api/schedule/${id}`, { method: "DELETE" });
    setPosts((prev) => prev.filter((p) => p.id !== id));
    setSelected(null);
  };

  const copyReviewLink = () => {
    if (!currentClient) return;
    const url = `${window.location.origin}/review/${currentClient.reviewToken}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  if (clientsLoading) return null;

  if (!currentClientId) {
    return (
      <>
        <h1 className="page-title">投稿予定</h1>
        <div className="empty-state">
          <h2>まずはクライアントを登録してください</h2>
          <p>画面上部のクライアント切り替えから、クライアント名を追加すると使えるようになります。</p>
        </div>
      </>
    );
  }

  return (
    <>
      <h1 className="page-title">
        投稿予定
        {currentClient && <span className="page-title-sub">{currentClient.name}</span>}
      </h1>

      <WeekNav
        weekStart={weekStart}
        onPrev={() => setWeekStart((d) => addDays(d, -7))}
        onNext={() => setWeekStart((d) => addDays(d, 7))}
        onToday={() => setWeekStart(startOfWeek(new Date()))}
      >
        <button className="btn-ghost small" onClick={copyReviewLink}>
          {copied ? "コピーしました" : "確認用リンクをコピー"}
        </button>
        <Link className="btn" href="/schedule/new" style={{ marginLeft: "0.6rem" }}>
          + 新規登録
        </Link>
      </WeekNav>

      <WeekCalendar
        weekStart={weekStart}
        posts={posts}
        onSelectPost={(p) => {
          setSelected(p);
          setPreviewOpen(false);
        }}
      />

      {selected && (
        <div className="detail-overlay" onClick={() => setSelected(null)}>
          <div className="detail-panel" onClick={(e) => e.stopPropagation()}>
            <div className="detail-panel-header">
              <div className="detail-panel-date">
                {new Date(selected.scheduledDate).toLocaleDateString("ja-JP", {
                  month: "long",
                  day: "numeric",
                  weekday: "short",
                })}
                　{STATUS_LABEL[selected.status] ?? selected.status}
              </div>
              <button className="detail-panel-close" onClick={() => setSelected(null)}>
                ×
              </button>
            </div>
            {selected.imagePath && (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="detail-panel-image" src={selected.imagePath} alt="投稿画像" />
            )}
            <div className="detail-panel-content">{selected.content}</div>
            {selected.status === "rejected" && selected.reviewNote && (
              <div className="status-banner rejected">却下理由：{selected.reviewNote}</div>
            )}
            <div style={{ display: "flex", gap: ".5rem" }}>
              <button className="btn-ghost small" onClick={() => setPreviewOpen(true)}>
                <EyeIcon size={14} /> プレビュー
              </button>
              <button className="btn-danger" onClick={() => removePost(selected.id)}>
                この投稿予定を削除
              </button>
            </div>
          </div>
        </div>
      )}

      {previewOpen && selected && (
        <XPostPreviewModal
          authorName={currentClient?.name ?? ""}
          handle={currentClient?.xHandle ?? ""}
          avatarPath={currentClient?.avatarPath}
          content={selected.content}
          imagePath={selected.imagePath}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </>
  );
}
