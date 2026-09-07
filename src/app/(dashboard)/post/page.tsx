"use client";

import { useEffect, useState } from "react";
import { useClients } from "@/lib/ClientsContext";
import { XPostPreviewModal } from "@/components/XPostPreviewModal";
import { EyeIcon } from "@/components/icons";

type Post = {
  id: string;
  theme: string;
  reference: string;
  notes: string | null;
  output: string;
  createdAt: string;
};

export default function PostPage() {
  const { currentClientId, currentClient, loading: clientsLoading } = useClients();
  const [history, setHistory] = useState<Post[]>([]);
  const [reference, setReference] = useState("");
  const [theme, setTheme] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    if (!currentClientId) {
      setHistory([]);
      return;
    }
    fetch(`/api/posts?clientId=${currentClientId}`)
      .then((r) => r.json())
      .then((data) => setHistory(data));
  }, [currentClientId]);

  const generate = async () => {
    setError("");
    if (!reference.trim() || !theme.trim()) {
      setError("参考ポストとテーマの両方を入力してください。");
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch("/api/posts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: currentClientId, reference, theme, notes }),
      });
      if (!res.ok) throw new Error("failed");
      const post: Post = await res.json();
      setHistory((prev) => [post, ...prev]);
    } catch {
      setError("生成に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setGenerating(false);
    }
  };

  const copy = () => {
    if (!history[0]) return;
    navigator.clipboard.writeText(history[0].output).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  if (clientsLoading) return null;

  if (!currentClientId) {
    return (
      <>
        <h1 className="page-title">投稿を作成</h1>
        <div className="empty-state">
          <h2>まずはクライアントを登録してください</h2>
          <p>
            画面上部のクライアント切り替えから、クライアント名を追加すると、投稿作成・コンテキストまとめ・ヒアリングAIが使えるようになります。
          </p>
        </div>
      </>
    );
  }

  const latest = history[0];

  return (
    <>
      <h1 className="page-title">投稿を作成</h1>
      <section>
        <div className="workbench">
          <div className="form-col">
            <label className="field-label">参考ポスト（型にしたい投稿）</label>
            <textarea
              rows={8}
              placeholder="お手本にしたい投稿の全文を貼り付けてください"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
            <label className="field-label">今回のテーマ</label>
            <textarea
              rows={3}
              placeholder="何について投稿したいか（例：新機能のお知らせ、失敗談から学んだこと 等）"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
            />
            <label className="field-label">トーンや条件の補足（任意）</label>
            <input
              type="text"
              placeholder="例：絵文字は使わない、150字以内 など"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <div className="error-text">{error}</div>
            <button className="btn" disabled={generating} onClick={generate}>
              {generating ? "生成中…" : "投稿を生成する"}
            </button>
          </div>
          <div className="output-col">
            {latest ? (
              <>
                <div className="result-card">
                  <div className="result-meta">
                    {latest.theme} ・ {new Date(latest.createdAt).toLocaleString("ja-JP")}
                  </div>
                  <div>{latest.output}</div>
                </div>
                <div style={{ display: "flex", gap: ".5rem" }}>
                  <button className="btn-ghost small" onClick={copy}>
                    {copied ? "コピーしました" : "コピー"}
                  </button>
                  <button className="btn-ghost small" onClick={() => setPreviewOpen(true)}>
                    <EyeIcon size={14} /> プレビュー
                  </button>
                </div>
              </>
            ) : (
              <div className="result-card result-empty">生成された投稿がここに表示されます。</div>
            )}
            {history.length > 1 && (
              <div className="history-list">
                <div className="dropdown-section-label">これまでの生成</div>
                {history.slice(1, 6).map((h) => (
                  <div className="history-item" key={h.id}>
                    <div className="history-meta">
                      {h.theme} ・ {new Date(h.createdAt).toLocaleString("ja-JP")}
                    </div>
                    <div className="history-snippet">
                      {h.output.slice(0, 60)}
                      {h.output.length > 60 ? "…" : ""}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {previewOpen && latest && (
        <XPostPreviewModal
          authorName={currentClient?.name ?? ""}
          handle={currentClient?.xHandle ?? ""}
          avatarPath={currentClient?.avatarPath}
          content={latest.output}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </>
  );
}
