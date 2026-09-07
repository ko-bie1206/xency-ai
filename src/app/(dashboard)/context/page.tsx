"use client";

import { useEffect, useState } from "react";
import { useClients } from "@/lib/ClientsContext";

type ContextSummary = {
  youtube: string | null;
  sns: string | null;
  other: string | null;
  summary: string | null;
  updatedAt: string;
} | null;

export default function ContextPage() {
  const { currentClientId, loading: clientsLoading } = useClients();
  const [youtube, setYoutube] = useState("");
  const [sns, setSns] = useState("");
  const [other, setOther] = useState("");
  const [summary, setSummary] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!currentClientId) {
      setYoutube("");
      setSns("");
      setOther("");
      setSummary(null);
      return;
    }
    fetch(`/api/context?clientId=${currentClientId}`)
      .then((r) => r.json())
      .then((data: ContextSummary) => {
        setYoutube(data?.youtube ?? "");
        setSns(data?.sns ?? "");
        setOther(data?.other ?? "");
        setSummary(data?.summary ?? null);
        setUpdatedAt(data?.updatedAt ?? null);
      });
  }, [currentClientId]);

  const generate = async () => {
    setError("");
    if (!youtube.trim() && !sns.trim() && !other.trim()) {
      setError("いずれか1つ以上の発信内容を入力してください。");
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch("/api/context/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: currentClientId, youtube, sns, other }),
      });
      if (!res.ok) throw new Error("failed");
      const data = await res.json();
      setSummary(data.summary);
      setUpdatedAt(data.updatedAt);
    } catch {
      setError("まとめの生成に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setGenerating(false);
    }
  };

  const copy = () => {
    if (!summary) return;
    navigator.clipboard.writeText(summary).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  if (clientsLoading) return null;

  if (!currentClientId) {
    return (
      <>
        <h1 className="page-title">コンテキストをまとめる</h1>
        <div className="empty-state">
          <h2>まずはクライアントを登録してください</h2>
          <p>画面上部のクライアント切り替えから、クライアント名を追加すると使えるようになります。</p>
        </div>
      </>
    );
  }

  return (
    <>
      <h1 className="page-title">コンテキストをまとめる</h1>
      <section>
        <div className="workbench">
          <div className="form-col">
            <label className="field-label">YouTubeでの発信（文字起こし・要約の貼り付け）</label>
            <textarea
              rows={6}
              placeholder="動画の文字起こしや要約を貼り付け"
              value={youtube}
              onChange={(e) => setYoutube(e.target.value)}
            />
            <label className="field-label">他SNSでの発信</label>
            <textarea
              rows={6}
              placeholder="Instagram、note、ブログ等の投稿を貼り付け"
              value={sns}
              onChange={(e) => setSns(e.target.value)}
            />
            <label className="field-label">その他メモ</label>
            <textarea
              rows={4}
              placeholder="打ち合わせ議事録や本人の口癖など"
              value={other}
              onChange={(e) => setOther(e.target.value)}
            />
            <div className="error-text">{error}</div>
            <button className="btn" disabled={generating} onClick={generate}>
              {generating ? "まとめ中…" : "まとめる"}
            </button>
          </div>
          <div className="output-col">
            {summary ? (
              <>
                <div className="result-card">
                  <div className="result-meta">
                    最終更新：{updatedAt ? new Date(updatedAt).toLocaleString("ja-JP") : ""}
                  </div>
                  <div>{summary}</div>
                </div>
                <button className="btn-ghost small" onClick={copy}>
                  {copied ? "コピーしました" : "コピー"}
                </button>
                <p className="hint-text">このまとめは投稿作成ページでも自動的に参照されます。</p>
              </>
            ) : (
              <div className="result-card result-empty">まとめ結果がここに表示されます。</div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
