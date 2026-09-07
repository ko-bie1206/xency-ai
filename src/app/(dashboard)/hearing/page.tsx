"use client";

import { useEffect, useState } from "react";
import { useClients } from "@/lib/ClientsContext";

type QA = { id: string; question: string; answer: string; order: number };
type Session = {
  id: string;
  pendingQuestion: string | null;
  finished: boolean;
  summary: string | null;
  qas: QA[];
} | null;

const MAX_HEARING_STEPS = 6;

export default function HearingPage() {
  const { currentClientId, currentClient, loading: clientsLoading } = useClients();
  const [session, setSession] = useState<Session>(null);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!currentClientId) {
      setSession(null);
      return;
    }
    fetch(`/api/hearing?clientId=${currentClientId}`)
      .then((r) => r.json())
      .then(setSession);
  }, [currentClientId]);

  const submit = async () => {
    setError("");
    if (!answer.trim()) {
      setError("回答を入力してください。");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/hearing/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: currentClientId, answer }),
      });
      if (!res.ok) throw new Error("failed");
      setSession(await res.json());
      setAnswer("");
    } catch {
      setError("質問の生成に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setSubmitting(false);
    }
  };

  const finishNow = async () => {
    if (!session || session.qas.length === 0) {
      setError("まだ1問も回答がありません。");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/hearing/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: currentClientId }),
      });
      if (!res.ok) throw new Error("failed");
      setSession(await res.json());
    } catch {
      setError("まとめの生成に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setSubmitting(false);
    }
  };

  const restart = async () => {
    if (!currentClientId) return;
    const res = await fetch("/api/hearing/restart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: currentClientId }),
    });
    setSession(await res.json());
  };

  const copy = () => {
    if (!session?.summary) return;
    navigator.clipboard.writeText(session.summary).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  if (clientsLoading) return null;

  if (!currentClientId) {
    return (
      <>
        <h1 className="page-title">ヒアリングAI</h1>
        <div className="empty-state">
          <h2>まずはクライアントを登録してください</h2>
          <p>画面上部のクライアント切り替えから、クライアント名を追加すると使えるようになります。</p>
        </div>
      </>
    );
  }

  if (!session) return null;

  return (
    <>
      <h1 className="page-title">
        ヒアリングAI
        {currentClient && <span className="page-title-sub">{currentClient.name}</span>}
      </h1>
      <section>
        {session.finished ? (
          <div className="workbench">
            <div className="form-col">
              <p className="hint-text">ヒアリングは完了しています（全{session.qas.length}問）。</p>
              <button className="btn-ghost small" onClick={restart}>
                もう一度ヒアリングする
              </button>
            </div>
            <div className="output-col">
              <div className="result-card">
                <div className="result-meta">ヒアリングシート</div>
                <div>{session.summary}</div>
              </div>
              <button className="btn-ghost small" onClick={copy}>
                {copied ? "コピーしました" : "コピー"}
              </button>
            </div>
          </div>
        ) : (
          <div className="workbench">
            <div className="form-col">
              <div className="progress-text">
                質問 {session.qas.length + 1} / {MAX_HEARING_STEPS}目安
              </div>
              <div className="hearing-question">{session.pendingQuestion}</div>
              <textarea
                rows={5}
                placeholder="回答を入力してください"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
              />
              <div className="error-text">{error}</div>
              <button className="btn" disabled={submitting} onClick={submit}>
                {submitting ? "送信中…" : "回答して次へ"}
              </button>
              {session.qas.length >= 2 && (
                <button className="btn-ghost small" disabled={submitting} onClick={finishNow}>
                  ここで終了してまとめる
                </button>
              )}
            </div>
            <div className="output-col">
              {session.qas.length > 0 ? (
                <div className="qa-history">
                  <div className="dropdown-section-label">回答済み</div>
                  {session.qas.map((qa, i) => (
                    <div className="qa-item" key={qa.id}>
                      <div className="qa-q">
                        Q{i + 1}. {qa.question}
                      </div>
                      <div className="qa-a">{qa.answer}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="result-card result-empty">回答が進むとここに履歴が表示されます。</div>
              )}
            </div>
          </div>
        )}
      </section>
    </>
  );
}
