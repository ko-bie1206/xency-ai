"use client";

import { useEffect, useRef, useState } from "react";
import { useClients } from "@/lib/ClientsContext";
import { ImageIcon } from "@/components/icons";

type ThreadItemData = {
  id: string | null;
  order: number;
  referenceText: string;
  imageFile: File | null;
  imagePreview: string | null;
  instruction: string;
  output: string | null;
  generating: boolean;
  copied: boolean;
  error: string;
};

type ServerThreadItem = {
  id: string;
  order: number;
  referenceText: string | null;
  referenceImagePath: string | null;
  instruction: string | null;
  output: string | null;
};

function emptySlot(order: number): ThreadItemData {
  return {
    id: null,
    order,
    referenceText: "",
    imageFile: null,
    imagePreview: null,
    instruction: "",
    output: null,
    generating: false,
    copied: false,
    error: "",
  };
}

function fromServerItem(item: ServerThreadItem): ThreadItemData {
  return {
    id: item.id,
    order: item.order,
    referenceText: item.referenceText ?? "",
    imageFile: null,
    imagePreview: item.referenceImagePath,
    instruction: item.instruction ?? "",
    output: item.output,
    generating: false,
    copied: false,
    error: "",
  };
}

export default function ThreadPage() {
  const { currentClientId, loading: clientsLoading } = useClients();
  const [slots, setSlots] = useState<ThreadItemData[]>([emptySlot(0)]);
  const [loaded, setLoaded] = useState(false);
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  useEffect(() => {
    if (!currentClientId) {
      setSlots([emptySlot(0)]);
      setLoaded(true);
      return;
    }
    setLoaded(false);
    fetch(`/api/thread?clientId=${currentClientId}`)
      .then((r) => r.json())
      .then((thread: { items: ServerThreadItem[] } | null) => {
        if (thread && thread.items.length > 0) {
          setSlots(thread.items.map(fromServerItem));
        } else {
          setSlots([emptySlot(0)]);
        }
        setLoaded(true);
      });
  }, [currentClientId]);

  const updateSlot = (index: number, patch: Partial<ThreadItemData>) => {
    setSlots((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };

  const addSlot = () => {
    setSlots((prev) => [...prev, emptySlot(prev.length)]);
  };

  const removeLastSlot = async () => {
    const last = slots[slots.length - 1];
    if (slots.length <= 1) return;
    if (last.id) {
      await fetch(`/api/thread/items/${last.id}`, { method: "DELETE" });
    }
    setSlots((prev) => prev.slice(0, -1));
  };

  const resetThread = async () => {
    if (!currentClientId) return;
    if (!confirm("このクライアントのスレッドをすべて削除して最初からやり直しますか？")) return;
    await fetch(`/api/thread?clientId=${currentClientId}`, { method: "DELETE" });
    setSlots([emptySlot(0)]);
  };

  const handleImageSelect = (index: number, file: File | null) => {
    updateSlot(index, {
      imageFile: file,
      imagePreview: file ? URL.createObjectURL(file) : null,
    });
  };

  const generateSlot = async (index: number) => {
    const slot = slots[index];
    if (!slot.instruction.trim()) {
      updateSlot(index, { error: "AIへの指示を入力してください。" });
      return;
    }
    updateSlot(index, { generating: true, error: "" });
    try {
      const form = new FormData();
      form.append("clientId", currentClientId ?? "");
      if (slot.id) form.append("itemId", slot.id);
      form.append("order", String(slot.order));
      form.append("referenceText", slot.referenceText);
      form.append("instruction", slot.instruction);
      if (slot.imageFile) form.append("image", slot.imageFile);

      const res = await fetch("/api/thread/items/generate", { method: "POST", body: form });
      if (!res.ok) throw new Error("failed");
      const item: ServerThreadItem = await res.json();
      updateSlot(index, {
        id: item.id,
        output: item.output,
        imageFile: null,
        imagePreview: item.referenceImagePath,
        generating: false,
      });
    } catch {
      updateSlot(index, {
        error: "生成に失敗しました。時間をおいて再度お試しください。",
        generating: false,
      });
    }
  };

  const copyOutput = (index: number) => {
    const slot = slots[index];
    if (!slot.output) return;
    navigator.clipboard.writeText(slot.output).then(() => {
      updateSlot(index, { copied: true });
      setTimeout(() => updateSlot(index, { copied: false }), 1500);
    });
  };

  if (clientsLoading || !loaded) return null;

  if (!currentClientId) {
    return (
      <>
        <h1 className="page-title">スレッド作成</h1>
        <div className="empty-state">
          <h2>まずはクライアントを登録してください</h2>
          <p>画面上部のクライアント切り替えから、クライアント名を追加すると使えるようになります。</p>
        </div>
      </>
    );
  }

  return (
    <>
      <h1 className="page-title">スレッド作成</h1>
      <div className="week-nav">
        <button className="btn" onClick={addSlot}>
          + ツリーを追加
        </button>
        {slots.length > 1 && (
          <button className="btn-ghost small" onClick={removeLastSlot}>
            最後のツリーを削除
          </button>
        )}
        <span className="week-nav-spacer" />
        <button className="btn-ghost small" onClick={resetThread}>
          スレッドをリセット
        </button>
      </div>

      {slots.map((slot, index) => (
        <section className="thread-slot" key={index}>
          <div className="thread-slot-header">
            {index === 0 ? "元ポスト" : `ツリー${slot.order}`}
          </div>
          <div className="workbench">
            <div className="form-col">
              <label className="field-label">参考ポスト（任意・文章）</label>
              <textarea
                rows={5}
                placeholder="お手本にしたい投稿文を貼り付け（任意）"
                value={slot.referenceText}
                onChange={(e) => updateSlot(index, { referenceText: e.target.value })}
              />
              <label className="field-label">参考ポスト（任意・画像）</label>
              <div
                className="image-drop"
                onClick={() => fileInputRefs.current[index]?.click()}
              >
                {slot.imagePreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="image-preview" src={slot.imagePreview} alt="プレビュー" />
                ) : (
                  <>
                    <ImageIcon size={18} /> クリックして参考画像を選択（任意）
                  </>
                )}
              </div>
              <input
                ref={(el) => {
                  fileInputRefs.current[index] = el;
                }}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                style={{ display: "none" }}
                onChange={(e) => handleImageSelect(index, e.target.files?.[0] ?? null)}
              />
              <label className="field-label">AIへの指示（このツリーの内容）</label>
              <textarea
                rows={4}
                placeholder="このポストで何を伝えたいか（参考ポストの内容を再現する必要はありません）"
                value={slot.instruction}
                onChange={(e) => updateSlot(index, { instruction: e.target.value })}
              />
              <div className="error-text">{slot.error}</div>
              <button className="btn" disabled={slot.generating} onClick={() => generateSlot(index)}>
                {slot.generating ? "生成中…" : slot.output ? "再生成する" : "生成する"}
              </button>
            </div>
            <div className="output-col">
              {slot.output ? (
                <>
                  <div className="result-card">{slot.output}</div>
                  <button className="btn-ghost small" onClick={() => copyOutput(index)}>
                    {slot.copied ? "コピーしました" : "コピー"}
                  </button>
                </>
              ) : (
                <div className="result-card result-empty">生成された投稿がここに表示されます。</div>
              )}
            </div>
          </div>
        </section>
      ))}
    </>
  );
}
