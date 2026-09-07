"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/lib/ThemeContext";
import { useClients } from "@/lib/ClientsContext";
import { ClientAvatar } from "@/components/ClientAvatar";

type AllowedEmail = { id: string; email: string; createdAt: string };

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { currentClient, currentClientId, updateXHandle, uploadAvatar, removeAvatar } = useClients();
  const [copied, setCopied] = useState(false);
  const [xHandle, setXHandle] = useState("");
  const [savingHandle, setSavingHandle] = useState(false);
  const [handleSaved, setHandleSaved] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [allowedEmails, setAllowedEmails] = useState<AllowedEmail[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [addingEmail, setAddingEmail] = useState(false);

  useEffect(() => {
    setXHandle(currentClient?.xHandle ?? "");
  }, [currentClient]);

  useEffect(() => {
    fetch("/api/allowed-emails")
      .then((r) => r.json())
      .then(setAllowedEmails);
  }, []);

  const addAllowedEmail = async () => {
    const email = newEmail.trim();
    if (!email) return;
    setEmailError("");
    setAddingEmail(true);
    try {
      const res = await fetch("/api/allowed-emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || "追加に失敗しました");
      setAllowedEmails((prev) => [...prev, body]);
      setNewEmail("");
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : "追加に失敗しました");
    } finally {
      setAddingEmail(false);
    }
  };

  const removeAllowedEmail = async (id: string) => {
    if (!confirm("このアカウントのログイン許可を削除しますか？")) return;
    await fetch(`/api/allowed-emails/${id}`, { method: "DELETE" });
    setAllowedEmails((prev) => prev.filter((e) => e.id !== id));
  };

  const saveXHandle = async () => {
    if (!currentClientId) return;
    setSavingHandle(true);
    try {
      await updateXHandle(currentClientId, xHandle);
      setHandleSaved(true);
      setTimeout(() => setHandleSaved(false), 1500);
    } finally {
      setSavingHandle(false);
    }
  };

  const handleAvatarSelect = async (file: File | null) => {
    if (!file || !currentClientId) return;
    setAvatarError("");
    setAvatarUploading(true);
    try {
      await uploadAvatar(currentClientId, file);
    } catch {
      setAvatarError("アップロードに失敗しました。JPEG/PNG/GIF/WebPの5MB以下の画像をお試しください。");
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleAvatarRemove = async () => {
    if (!currentClientId) return;
    await removeAvatar(currentClientId);
  };

  const copyReviewLink = () => {
    if (!currentClient) return;
    const url = `${window.location.origin}/review/${currentClient.reviewToken}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const resetData = async () => {
    if (!currentClientId) return;
    if (
      !confirm(
        "このクライアントの生成データ（投稿履歴・コンテキスト・ヒアリング）をすべて削除します。よろしいですか？"
      )
    )
      return;
    await fetch(`/api/clients/${currentClientId}/reset`, { method: "POST" });
    alert("削除しました。");
  };

  return (
    <>
      <h1 className="page-title">設定</h1>
      <section>
        <div className="settings-block">
          <div className="settings-row">
            <div>
              <div className="settings-row-title">ダークモード</div>
              <div className="settings-row-desc">背景を黒・紺色ベースに切り替えます</div>
            </div>
            <button
              className="toggle-switch theme-toggle"
              onClick={toggleTheme}
              aria-pressed={theme === "dark"}
            >
              <span className="toggle-knob" />
            </button>
          </div>
        </div>
        <div className="settings-block">
          <div className="settings-row-title" style={{ marginBottom: ".6rem" }}>
            連携状況
          </div>
          <div className="status-row">
            <span className="status-dot ok" />
            AI生成（投稿作成・コンテキストまとめ・ヒアリング）
            <span className="status-tag ok">稼働中</span>
          </div>
          <div className="status-row">
            <span className="status-dot pending" />
            Xアカウント連携（自動投稿・数値取得）
            <span className="status-tag pending">未実装</span>
          </div>
        </div>
        <div className="settings-block">
          <div className="settings-row-title">ログインを許可するGoogleアカウント</div>
          <div className="settings-row-desc">
            ここに追加したメールアドレスのGoogleアカウントだけが、スタッフダッシュボードにログインできます。
          </div>
          <div className="history-list" style={{ marginTop: ".6rem" }}>
            {allowedEmails.length === 0 && (
              <div className="dropdown-empty" style={{ padding: ".4rem 0" }}>
                まだ追加されていません
              </div>
            )}
            {allowedEmails.map((e) => (
              <div
                key={e.id}
                className="status-row"
                style={{ borderTop: "1px solid var(--border)", padding: ".5rem 0" }}
              >
                {e.email}
                <button
                  className="row-remove"
                  style={{ visibility: "visible", marginLeft: "auto" }}
                  title="削除"
                  onClick={() => removeAllowedEmail(e.id)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: ".5rem", marginTop: ".8rem", alignItems: "center" }}>
            <input
              type="text"
              placeholder="example@gmail.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.nativeEvent.isComposing) addAllowedEmail();
              }}
              style={{ maxWidth: 280 }}
            />
            <button className="btn-ghost small" disabled={addingEmail} onClick={addAllowedEmail}>
              {addingEmail ? "追加中…" : "追加"}
            </button>
          </div>
          {emailError && <div className="error-text">{emailError}</div>}
        </div>
        {currentClient && (
          <div className="settings-block">
            <div className="settings-row-title">プレビュー用アイコン画像</div>
            <div className="settings-row-desc">
              投稿プレビューやクライアント切替に表示するアイコンです。未設定の場合は頭文字が表示されます。
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: ".6rem" }}>
              <ClientAvatar
                name={currentClient.name}
                avatarPath={currentClient.avatarPath}
                seed={currentClient.id}
                size={48}
              />
              <div style={{ display: "flex", gap: ".5rem" }}>
                <button
                  className="btn-ghost small"
                  disabled={avatarUploading}
                  onClick={() => avatarInputRef.current?.click()}
                >
                  {avatarUploading ? "アップロード中…" : "画像を選ぶ"}
                </button>
                {currentClient.avatarPath && (
                  <button className="btn-ghost small" onClick={handleAvatarRemove}>
                    削除
                  </button>
                )}
              </div>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                style={{ display: "none" }}
                onChange={(e) => handleAvatarSelect(e.target.files?.[0] ?? null)}
              />
            </div>
            {avatarError && <div className="error-text">{avatarError}</div>}
          </div>
        )}
        {currentClient && (
          <div className="settings-block">
            <div className="settings-row-title">Xのユーザー名（プレビュー表示用）</div>
            <div className="settings-row-desc">
              投稿作成のプレビュー画面に表示する@ユーザー名です。実際の投稿・連携には使われません。
            </div>
            <div style={{ display: "flex", gap: ".5rem", marginTop: ".6rem", alignItems: "center" }}>
              <input
                type="text"
                placeholder="例：xency_ai"
                value={xHandle}
                onChange={(e) => setXHandle(e.target.value)}
                style={{ maxWidth: 220 }}
              />
              <button className="btn-ghost small" disabled={savingHandle} onClick={saveXHandle}>
                {handleSaved ? "保存しました" : savingHandle ? "保存中…" : "保存"}
              </button>
            </div>
          </div>
        )}
        {currentClient && (
          <div className="settings-block">
            <div className="settings-row-title">投稿予定の確認用リンク</div>
            <div className="settings-row-desc">
              ログイン不要でクライアントに送れる専用リンクです。このリンク経由で今週の投稿予定を確認・承認/却下してもらえます。
            </div>
            <button className="btn-ghost small" style={{ marginTop: ".6rem" }} onClick={copyReviewLink}>
              {copied ? "コピーしました" : "リンクをコピー"}
            </button>
          </div>
        )}
        {currentClient && (
          <div className="settings-block danger-block">
            <div className="settings-row-title">{currentClient.name} のデータ</div>
            <div className="settings-row-desc">
              投稿履歴・コンテキストまとめ・ヒアリング結果・投稿予定をすべて削除します。この操作は取り消せません。
            </div>
            <button className="btn-danger" onClick={resetData}>
              このクライアントの生成データをリセット
            </button>
          </div>
        )}
      </section>
    </>
  );
}
