"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useClients } from "@/lib/ClientsContext";
import { dateKey } from "@/lib/week";

export default function NewSchedulePage() {
  const { currentClientId, loading: clientsLoading } = useClients();
  const router = useRouter();
  const [scheduledDate, setScheduledDate] = useState(dateKey(new Date()));
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onFileChange = (file: File | null) => {
    setImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : null);
  };

  const submit = async () => {
    setError("");
    if (!content.trim()) {
      setError("投稿本文を入力してください。");
      return;
    }
    setSaving(true);
    try {
      const form = new FormData();
      form.append("clientId", currentClientId ?? "");
      form.append("scheduledDate", scheduledDate);
      form.append("content", content);
      if (imageFile) form.append("image", imageFile);

      const res = await fetch("/api/schedule", { method: "POST", body: form });
      if (!res.ok) throw new Error("failed");
      router.push("/schedule");
    } catch {
      setError("登録に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setSaving(false);
    }
  };

  if (clientsLoading) return null;

  if (!currentClientId) {
    return (
      <>
        <h1 className="page-title">投稿予定を登録</h1>
        <div className="empty-state">
          <h2>まずはクライアントを登録してください</h2>
        </div>
      </>
    );
  }

  return (
    <>
      <h1 className="page-title">投稿予定を登録</h1>
      <section>
        <div className="form-col" style={{ maxWidth: 480 }}>
          <label className="field-label">投稿予定日</label>
          <input
            type="date"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
          />
          <label className="field-label">投稿本文</label>
          <textarea
            rows={8}
            placeholder="クライアントに確認してもらう投稿文を入力"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <label className="field-label">画像（任意）</label>
          <div className="image-drop" onClick={() => fileInputRef.current?.click()}>
            {imagePreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="image-preview" src={imagePreview} alt="プレビュー" />
            ) : (
              "クリックして画像を選択（JPEG/PNG/GIF/WebP, 5MBまで）"
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            style={{ display: "none" }}
            onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
          />
          <div className="error-text">{error}</div>
          <button className="btn" disabled={saving} onClick={submit}>
            {saving ? "登録中…" : "登録する"}
          </button>
        </div>
      </section>
    </>
  );
}
