'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface BrowserViewerProps {
  wsUrl: string;
  onConfirm: () => void;
  loading?: boolean;
}

/**
 * BrowserViewer — Affiche un navigateur distant via WebSocket + canvas.
 * Remplace l'iframe (bloquée par X-Frame-Options sur Indeed, LinkedIn, etc.)
 * par un flux de captures JPEG transmises depuis le microservice Railway.
 */
export function BrowserViewer({ wsUrl, onConfirm, loading }: BrowserViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    ws.binaryType = 'arraybuffer';

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setError('Connexion au navigateur perdue. Réessayez.');

    ws.onmessage = (event) => {
      const blob = new Blob([event.data], { type: 'image/jpeg' });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
      };
      img.src = url;
    };

    return () => ws.close();
  }, [wsUrl]);

  // Transmettre les clics au navigateur distant
  function handleClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    const rect = canvas.getBoundingClientRect();
    wsRef.current.send(JSON.stringify({
      type: 'click',
      x: (e.clientX - rect.left) * (1280 / rect.width),
      y: (e.clientY - rect.top)  * (720  / rect.height),
    }));
  }

  // Transmettre la frappe clavier
  function handleKeyDown(e: React.KeyboardEvent) {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    e.preventDefault();
    // Caractères imprimables → type, touches spéciales → key
    if (e.key.length === 1) {
      wsRef.current.send(JSON.stringify({ type: 'type', text: e.key }));
    } else {
      wsRef.current.send(JSON.stringify({ type: 'key', key: e.key }));
    }
  }

  // Transmettre le scroll
  function handleWheel(e: React.WheelEvent) {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: 'scroll', delta: e.deltaY }));
  }

  return (
    <div className="space-y-3">
      {/* Fenêtre navigateur */}
      <div
        className="relative rounded-xl overflow-hidden border border-white/10 bg-black"
        style={{ aspectRatio: '16/9' }}
      >
        {!connected && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-gray-400 text-sm">
            <Loader2 size={24} className="animate-spin text-cyan-400" />
            <span>Connexion au navigateur…</span>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center text-red-400 text-sm px-4 text-center">
            {error}
          </div>
        )}
        <canvas
          ref={canvasRef}
          width={1280}
          height={720}
          className="w-full h-full cursor-pointer focus:outline-none"
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          onWheel={handleWheel}
          tabIndex={0}
          aria-label="Navigateur distant"
        />
      </div>

      <p className="text-xs text-gray-500 text-center">
        Cliquez dans la fenêtre pour interagir · Connectez-vous normalement à votre compte
      </p>

      <button
        onClick={onConfirm}
        disabled={loading}
        className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        {loading
          ? <><Loader2 size={16} className="animate-spin" /> Vérification…</>
          : "✅ J'ai fini, je suis connecté"}
      </button>
    </div>
  );
}
