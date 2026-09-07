"use client";

import { use, useEffect, useState } from "react";
import { useTheme } from "@/lib/ThemeContext";
import { WeekCalendar, ScheduledPostLike } from "@/components/WeekCalendar";
import { WeekNav } from "@/components/WeekNav";
import { startOfWeek, addDays, dateKey } from "@/lib/week";
import { SunIcon, MoonIcon, EyeIcon } from "@/components/icons";
import { BrandLogo } from "@/components/BrandLogo";
import { XPostPreviewModal } from "@/components/XPostPreviewModal";

export default function ReviewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const { theme, toggleTheme } = useTheme();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [clientName, setClientName] = useState("");
  const [xHandle, setXHandle] = useState<string | null>(null);
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [posts, setPosts] = useState<ScheduledPostLike[]>([]);
  const [selected, setSelected] = useState<ScheduledPostLike | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [reasonOpen, setReasonOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [actionInFlight, setActionInFlight] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    const from = dateKey(weekStart);
    const to = dateKey(addDays(weekStart, 7));
    fetch(`/api/review/${token}?from=${from}&to=${to}`)
      .then((r) => {
        if (!r.ok) throw new Error("not_found");
        return r.json();
      })
      .then((data) => {
        setClientName(data.clientName);
        setXHandle(data.xHandle);
        setAvatarPath(data.avatarPath);
        setPosts(data.posts);
      })
      .catch(() => setNotFound(true));
  }, [token, weekStart]);

  const openPost = (post: ScheduledPostLike) => {
    setSelected(post);
    setReasonOpen(false);
    setReason("");
    setError("");
    setPreviewOpen(false);
  };

  const approve = async () => {
    if (!selected) return;
    setActionInFlight("approve");
    setError("");
    try {
      const res = await fetch(`/api/review/${token}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: selected.id, decision: "approved" }),
      });
      if (!res.ok) throw new Error("failed");
      const updated = await res.json();
      setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setSelected(updated);
    } catch {
      setError("送信に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setActionInFlight(null);
    }
  };

  const submitRejection = async () => {
    if (!selected) return;
    if (!reason.trim()) {
      setError("却下の理由を入力してください。");
      return;
    }
    setActionInFlight("reject");
    setError("");
    try {
      const res = await fetch(`/api/review/${token}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: selected.id, decision: "rejected", reason }),
      });
      if (!res.ok) throw new Error("failed");
      const updated = await res.json();
      setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setSelected(updated);
      setReasonOpen(false);
    } catch {
      setError("送信に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setActionInFlight(null);
    }
  };

  if (notFound) {
    return (
      <div className="review-page">
        <div className="review-content">
          <p>このリンクは無効です。担当者にご確認ください。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="review-page">
      <div className="review-topbar">
        <div className="brand">
          <BrandLogo />
        </div>
        <button className="icon-btn" title="表示切替" onClick={toggleTheme}>
          {theme === "light" ? <MoonIcon /> : <SunIcon />}
        </button>
      </div>
      <div className="review-content">
        <h1 className="page-title">
          投稿予定の確認
          {clientName && <span className="page-title-sub">{clientName}</span>}
        </h1>
        <WeekNav
          weekStart={weekStart}
          onPrev={() => setWeekStart((d) => addDays(d, -7))}
          onNext={() => setWeekStart((d) => addDays(d, 7))}
          onToday={() => setWeekStart(startOfWeek(new Date()))}
        />
        <WeekCalendar weekStart={weekStart} posts={posts} onSelectPost={openPost} />
      </div>

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

            <button className="btn-ghost small" style={{ marginBottom: "1rem" }} onClick={() => setPreviewOpen(true)}>
              <EyeIcon size={14} /> Xでのプレビュー
            </button>

            {selected.status === "pending" && (
              <>
                {!reasonOpen && (
                  <div className="decision-row">
                    <button
                      className="decision-btn approve"
                      disabled={actionInFlight !== null}
                      onClick={approve}
                    >
                      {actionInFlight === "approve" ? "送信中…" : "✓ 承認する"}
                    </button>
                    <button
                      className="decision-btn reject"
                      disabled={actionInFlight !== null}
                      onClick={() => setReasonOpen(true)}
                    >
                      ✗ 却下する
                    </button>
                  </div>
                )}
                <div className={`reason-box${reasonOpen ? " open" : ""}`}>
                  <label className="field-label">却下の理由</label>
                  <textarea
                    rows={4}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="修正してほしい点を書いてください"
                  />
                  <div className="error-text">{error}</div>
                  <button className="btn" disabled={actionInFlight !== null} onClick={submitRejection}>
                    {actionInFlight === "reject" ? "送信中…" : "この理由で却下する"}
                  </button>
                  <button
                    className="link-btn"
                    onClick={() => {
                      setReasonOpen(false);
                      setError("");
                    }}
                  >
                    キャンセル
                  </button>
                </div>
              </>
            )}

            {selected.status === "approved" && (
              <div className="status-banner approved">承認済みです。ご確認ありがとうございます。</div>
            )}
            {selected.status === "rejected" && (
              <div className="status-banner rejected">却下理由：{selected.reviewNote}</div>
            )}
          </div>
        </div>
      )}

      {previewOpen && selected && (
        <XPostPreviewModal
          authorName={clientName}
          handle={xHandle ?? ""}
          avatarPath={avatarPath}
          content={selected.content}
          imagePath={selected.imagePath}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </div>
  );
}
