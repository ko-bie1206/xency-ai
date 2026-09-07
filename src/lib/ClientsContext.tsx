"use client";

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";

export type ClientRecord = {
  id: string;
  name: string;
  createdAt: string;
  reviewToken: string;
  xHandle: string | null;
  avatarPath: string | null;
};

type Ctx = {
  clients: ClientRecord[];
  currentClientId: string | null;
  currentClient: ClientRecord | null;
  loading: boolean;
  selectClient: (id: string) => void;
  addClient: (name: string) => Promise<void>;
  removeClient: (id: string) => Promise<void>;
  updateXHandle: (id: string, xHandle: string) => Promise<void>;
  uploadAvatar: (id: string, file: File) => Promise<void>;
  removeAvatar: (id: string) => Promise<void>;
};

const ClientsContext = createContext<Ctx | null>(null);

const STORAGE_KEY = "xency:currentClientId";

export function ClientsProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [currentClientId, setCurrentClientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/clients");
      const data: ClientRecord[] = await res.json();
      setClients(data);
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved && data.some((c) => c.id === saved)) {
        setCurrentClientId(saved);
      } else if (data.length) {
        setCurrentClientId(data[0].id);
      }
      setLoading(false);
    })();
  }, []);

  const selectClient = useCallback((id: string) => {
    setCurrentClientId(id);
    window.localStorage.setItem(STORAGE_KEY, id);
  }, []);

  const addClient = useCallback(
    async (name: string) => {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("failed to create client");
      const client: ClientRecord = await res.json();
      setClients((prev) => [...prev, client]);
      selectClient(client.id);
    },
    [selectClient]
  );

  const removeClient = useCallback(
    async (id: string) => {
      await fetch(`/api/clients/${id}`, { method: "DELETE" });
      setClients((prev) => {
        const remaining = prev.filter((c) => c.id !== id);
        if (currentClientId === id) {
          const next = remaining[0]?.id ?? null;
          setCurrentClientId(next);
          if (next) window.localStorage.setItem(STORAGE_KEY, next);
          else window.localStorage.removeItem(STORAGE_KEY);
        }
        return remaining;
      });
    },
    [currentClientId]
  );

  const updateXHandle = useCallback(async (id: string, xHandle: string) => {
    const res = await fetch(`/api/clients/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ xHandle }),
    });
    if (!res.ok) throw new Error("failed to update client");
    const updated: ClientRecord = await res.json();
    setClients((prev) => prev.map((c) => (c.id === id ? updated : c)));
  }, []);

  const uploadAvatar = useCallback(async (id: string, file: File) => {
    const form = new FormData();
    form.append("image", file);
    const res = await fetch(`/api/clients/${id}/avatar`, { method: "POST", body: form });
    if (!res.ok) throw new Error("failed to upload avatar");
    const updated: ClientRecord = await res.json();
    setClients((prev) => prev.map((c) => (c.id === id ? updated : c)));
  }, []);

  const removeAvatar = useCallback(async (id: string) => {
    const res = await fetch(`/api/clients/${id}/avatar`, { method: "DELETE" });
    if (!res.ok) throw new Error("failed to remove avatar");
    const updated: ClientRecord = await res.json();
    setClients((prev) => prev.map((c) => (c.id === id ? updated : c)));
  }, []);

  const currentClient = clients.find((c) => c.id === currentClientId) ?? null;

  return (
    <ClientsContext.Provider
      value={{
        clients,
        currentClientId,
        currentClient,
        loading,
        selectClient,
        addClient,
        removeClient,
        updateXHandle,
        uploadAvatar,
        removeAvatar,
      }}
    >
      {children}
    </ClientsContext.Provider>
  );
}

export function useClients() {
  const ctx = useContext(ClientsContext);
  if (!ctx) throw new Error("useClients must be used within ClientsProvider");
  return ctx;
}
