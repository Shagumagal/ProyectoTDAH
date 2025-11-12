import React, { useEffect, useState } from "react";
import { API_URL, authHeaders } from "../../lib/http";

const GAME_URL = import.meta.env.VITE_GAME_URL ?? "http://localhost:53036/"; // p.ej. https://tu-juego.vercel.app

export default function PlayGamePage() {
  const [url, setUrl] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!GAME_URL) { setErr("Configura VITE_GAME_URL"); return; }
      try {
        const r = await fetch(`${API_URL}/game/start`, { method:"POST", headers: authHeaders() });
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
        const full = `${GAME_URL}?code=${encodeURIComponent(j.code)}`;
        setUrl(full);
      } catch (e:any) {
        setErr(e.message || "Error iniciando sesión de juego");
      }
    })();
  }, []);

  if (err) return <div className="p-6 text-red-400">{err}</div>;
  if (!url) return <div className="p-6">Preparando juego…</div>;

  return (
    <iframe
      src={url}
      className="w-full h-[calc(100vh-80px)] border-0"
      allow="fullscreen; autoplay"
      title="Juego TDAH"
    />
  );
}
