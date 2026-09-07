"use client";

import { useEffect, useState } from "react";
import { useClients } from "@/lib/ClientsContext";

type Hook = {
  id: string;
  references: string;
  elements: string;
  output: string;
  createdAt: string;
};

export default function HookPage() {
  const { currentClientId, loading: clientsLoading } = useClients();
  const [history, setHistory] = useState<Hook[]>([]);
  const [references, setReferences] = useState<string[]>([""]);
  const [elements, setElements] = useState("");
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!currentClientId) {
      setHistory([]);
      return;
    }
    fetch(`/api/hooks?clientId=${currentClientId}`)
      .then((r) => r.json())
      .then(setHistory);
  }, [currentClientId]);

  const updateReference = (index: number, value: string) => {
    setReferences((prev) => prev.map((r, i) => (i === index ? value : r)));
  };

  const addReference = () => setReferences((prev) => [...prev, ""]);

  const removeReference = (index: number) => {
    setReferences((prev) => prev.filter((_, i) => i !== index));
  };

  const generate = async () => {
    setError("");
    const filled = references.map((r) => r.trim()).filter(Boolean);
    if (filled.length === 0 || !elements.trim()) {
      setError("参考フックを1つ以上と、盛り込みたい要素を入力してください。");
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch("/api/hooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: currentClientId, references: filled, elements }),
      });
      if (!res.ok) throw new Error("failed");
      const hook: Hook = await res.json();
      setHistory((prev) => [hook, ...prev]);
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
        <h1 className="page-title">フック作成</h1>
        <div className="empty-state">
          <h2>まずはクライアントを登録してください</h2>
          <p>画面上部のクライアント切り替えから、クライアント名を追加すると使えるようになります。</p>
        </div>
      </>
    );
  }

  const latest = history[0];

  return (
    <>
      <h1 className="page-title">フック作成</h1>
      <section>
        <div className="workbench">
          <div className="form-col">
            <label className="field-label">参考フック（複数追加できます）</label>
            {references.map((r, i) => (
              <div key={i} style={{ display: "flex", gap: ".4rem", alignItems: "flex-start" }}>
                <textarea
                  rows={3}
                  placeholder={`参考フック ${i + 1}`}
                  value={r}
                  onChange={(e) => updateReference(i, e.target.value)}
                  style={{ flex: 1 }}
                />
                {references.length > 1 && (
                  <button
                    className="row-remove"
                    style={{ visibility: "visible" }}
                    title="削除"
                    onClick={() => removeReference(i)}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <button className="btn-ghost small" style={{ alignSelf: "flex-start" }} onClick={addReference}>
              + 参考フックを追加
            </button>

            <label className="field-label">フックに入れたい言葉や要素</label>
            <textarea
              rows={3}
              placeholder="例：実績や数字、テーマなど"
              value={elements}
              onChange={(e) => setElements(e.target.value)}
            />
            <div className="error-text">{error}</div>
            <button className="btn" disabled={generating} onClick={generate}>
              {generating ? "生成中…" : "フックを生成する"}
            </button>
          </div>
          <div className="output-col">
            {latest ? (
              <>
                <div className="result-card">
                  <div className="result-meta">{new Date(latest.createdAt).toLocaleString("ja-JP")}</div>
                  <div>{latest.output}</div>
                </div>
                <button className="btn-ghost small" onClick={copy}>
                  {copied ? "コピーしました" : "コピー"}
                </button>
              </>
            ) : (
              <div className="result-card result-empty">生成されたフックがここに表示されます。</div>
            )}
            {history.length > 1 && (
              <div className="history-list">
                <div className="dropdown-section-label">これまでの生成</div>
                {history.slice(1, 6).map((h) => (
                  <div className="history-item" key={h.id}>
                    <div className="history-meta">{new Date(h.createdAt).toLocaleString("ja-JP")}</div>
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
    </>
  );
}
