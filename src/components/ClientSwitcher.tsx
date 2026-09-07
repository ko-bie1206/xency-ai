"use client";

import { useRef, useState } from "react";
import { useClients } from "@/lib/ClientsContext";
import { useClickOutside } from "@/lib/useClickOutside";
import { ChevronDownIcon, CheckIcon, PlusIcon } from "@/components/icons";
import { ClientAvatar } from "@/components/ClientAvatar";

export function ClientSwitcher({ panelPosition = "down" }: { panelPosition?: "down" | "up" }) {
  const { clients, currentClient, currentClientId, selectClient, addClient, removeClient } = useClients();
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [addError, setAddError] = useState("");
  const [adding, setAdding] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useClickOutside(wrapRef, () => setOpen(false), open);

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    setAddError("");
    setAdding(true);
    try {
      await addClient(name);
      setNewName("");
      setOpen(false);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "追加に失敗しました。");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="dropdown-wrap" ref={wrapRef}>
      <button className="switcher-btn" onClick={() => setOpen((v) => !v)}>
        <ClientAvatar
          name={currentClient?.name ?? "?"}
          avatarPath={currentClient?.avatarPath}
          seed={currentClient?.id ?? "x"}
        />
        <span className="switcher-label">{currentClient ? currentClient.name : "クライアント未選択"}</span>
        <ChevronDownIcon />
      </button>
      {open && (
        <div className={`dropdown-panel${panelPosition === "up" ? " dropdown-panel-up" : ""}`}>
          <div className="dropdown-section-label">クライアント</div>
          {clients.length === 0 && <div className="dropdown-empty">クライアント未登録</div>}
          {clients.map((c) => (
            <div className="dropdown-row-wrap" key={c.id}>
              <button
                className="dropdown-row"
                onClick={() => {
                  selectClient(c.id);
                  setOpen(false);
                }}
              >
                <ClientAvatar name={c.name} avatarPath={c.avatarPath} size={20} seed={c.id} />
                <span>{c.name}</span>
                {c.id === currentClientId && (
                  <span className="row-check">
                    <CheckIcon />
                  </span>
                )}
              </button>
              <button
                className="row-remove"
                title="削除"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm("このクライアントを削除しますか？関連データも削除されます。")) {
                    removeClient(c.id);
                  }
                }}
              >
                ×
              </button>
            </div>
          ))}
          <div className="dropdown-divider" />
          <div className="add-client-row">
            <input
              type="text"
              placeholder="クライアント名"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.nativeEvent.isComposing) handleAdd();
              }}
            />
            <button
              className="icon-btn"
              style={{ width: 30, height: 30 }}
              disabled={adding}
              onClick={handleAdd}
            >
              <PlusIcon />
            </button>
          </div>
          {addError && (
            <div className="error-text" style={{ padding: "0 0.2rem" }}>
              {addError}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
