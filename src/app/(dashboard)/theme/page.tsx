"use client";

import { useEffect, useRef, useState } from "react";
import { useClients } from "@/lib/ClientsContext";
import { ImageGalleryModal } from "@/components/ImageGalleryModal";

type Theme = {
  id: string;
  context: string;
  elements: string;
  output: string;
  createdAt: string;
};

type ReferenceMaterial = { id: string; imagePath: string; createdAt: string };

const HOW_TO_FIND_THEME = `10アカウントを同じジャンル・伸びてる人を探す。
（大手垢のフォロー欄を見る、Google trendでキーワード調べて、そのワードで探す）
↓
見つけたら、合計10アカウントをリストに入れる。

リストのつくり方は、
もっと見る→リスト→右上の「新しいリスト」を押す→非公開にチェックを入れて、名前を決めてリストの作成を完了させる。

リストの入れ方は、
各10アカウントにいって、フォローボタンの左側の3つの点のボタンを押して、「リストに追加/削除」でリスト追加できる。

モデリングの人＋最低100いいね以上で検索
（美容系なら、600いいね以上）
コマンド：list:（リストの数字） min_faves:600
↓
"テーマ"と"型"を抽出
テーマ：ハンカチ
型：実際のハンカチの写真
フック：こういう○○っぽい○○…○○にこだわらない感じが愛おしすぎる。。
（フックもできれば抽出）`;

export default function ThemePage() {
  const { currentClientId, loading: clientsLoading } = useClients();
  const [history, setHistory] = useState<Theme[]>([]);
  const [context, setContext] = useState("");
  const [elements, setElements] = useState("");
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const [materials, setMaterials] = useState<ReferenceMaterial[]>([]);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [materialsOpen, setMaterialsOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!currentClientId) {
      setHistory([]);
      return;
    }
    fetch(`/api/themes?clientId=${currentClientId}`)
      .then((r) => r.json())
      .then(setHistory);
  }, [currentClientId]);

  useEffect(() => {
    fetch("/api/reference-materials")
      .then((r) => r.json())
      .then(setMaterials);
  }, []);

  const generate = async () => {
    setError("");
    if (!context.trim() && !elements.trim()) {
      setError("コンテキストか要素のどちらかは入力してください。");
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch("/api/themes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: currentClientId, context, elements }),
      });
      if (!res.ok) throw new Error("failed");
      const theme: Theme = await res.json();
      setHistory((prev) => [theme, ...prev]);
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

  const uploadMaterial = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("image", file);
      const res = await fetch("/api/reference-materials", { method: "POST", body: form });
      if (!res.ok) throw new Error("failed");
      const material: ReferenceMaterial = await res.json();
      setMaterials((prev) => [...prev, material]);
    } finally {
      setUploading(false);
    }
  };

  const removeMaterial = async (id: string) => {
    if (!confirm("この参考資料を削除しますか？")) return;
    await fetch(`/api/reference-materials/${id}`, { method: "DELETE" });
    setMaterials((prev) => prev.filter((m) => m.id !== id));
  };

  if (clientsLoading) return null;

  if (!currentClientId) {
    return (
      <>
        <h1 className="page-title">テーマ作成</h1>
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
      <h1 className="page-title">テーマ作成</h1>

      <div className="howto-block">
        <div className="howto-block-title">テーマの探し方</div>
        {HOW_TO_FIND_THEME}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: ".8rem", marginBottom: "1.4rem" }}>
        <button className="link-btn" style={{ fontSize: ".8rem" }} onClick={() => setGalleryOpen(true)}>
          参考資料も見る
        </button>
        <button
          className="link-btn"
          style={{ fontSize: ".8rem" }}
          onClick={() => setMaterialsOpen((v) => !v)}
        >
          {materialsOpen ? "参考資料の管理を閉じる" : "参考資料を管理"}
        </button>
      </div>

      {materialsOpen && (
        <div className="settings-block" style={{ marginBottom: "1.4rem" }}>
          <div className="settings-row-title">参考資料の画像</div>
          <div className="settings-row-desc">
            「テーマの探し方」の補足になる画像（スクショなど）を登録できます。一覧には表示されず、「参考資料も見る」から確認できます。
          </div>
          <div className="reference-materials-admin">
            {materials.map((m) => (
              <div className="thumb-wrap" key={m.id}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.imagePath} alt="" />
                <button className="thumb-remove" onClick={() => removeMaterial(m.id)}>
                  ×
                </button>
              </div>
            ))}
          </div>
          <button
            className="btn-ghost small"
            style={{ marginTop: ".8rem" }}
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? "アップロード中…" : "+ 画像を追加"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            style={{ display: "none" }}
            onChange={(e) => uploadMaterial(e.target.files?.[0] ?? null)}
          />
        </div>
      )}

      <section>
        <div className="workbench">
          <div className="form-col">
            <label className="field-label">コンテキスト</label>
            <textarea
              rows={6}
              placeholder="題材のもとになる情報や気づき、時事ネタなど"
              value={context}
              onChange={(e) => setContext(e.target.value)}
            />
            <label className="field-label">使えそうな要素</label>
            <textarea
              rows={4}
              placeholder="使えそうなキーワードや切り口など"
              value={elements}
              onChange={(e) => setElements(e.target.value)}
            />
            <div className="error-text">{error}</div>
            <button className="btn" disabled={generating} onClick={generate}>
              {generating ? "生成中…" : "テーマを生成する"}
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
              <div className="result-card result-empty">生成されたテーマ案がここに表示されます。</div>
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

      {galleryOpen && (
        <ImageGalleryModal
          images={materials.map((m) => m.imagePath)}
          onClose={() => setGalleryOpen(false)}
        />
      )}
    </>
  );
}
