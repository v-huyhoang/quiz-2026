import { useEffect, useRef } from "react";
import { Outlet } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { getPlayerEcho, resetPlayerEcho } from "../../sockets/echo";

export default function PlayerLayout() {
  const { token, gameId } = useAuthStore();
  const sentLeaveRef = useRef(false);

  // ── Presence channel (fallback for network drops ~15s) ─────────────────────
  useEffect(() => {
    if (!token || !gameId) return;

    sentLeaveRef.current = false;
    getPlayerEcho(token)?.join(`presence-game.${gameId}`);

    return () => {
      getPlayerEcho(token)?.leave(`presence-game.${gameId}`);
      resetPlayerEcho();
    };
  }, [token, gameId]);

  // ── Announce presence on every mount (initial join + reload + re-access) ───
  // This fires TeamJoined so the stage picks up reconnects.
  useEffect(() => {
    if (!token || !gameId) return;

    fetch(`${import.meta.env.VITE_API_BASE_URL}/games/${gameId}/announce`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  }, [token, gameId]);

  // ── Notify server immediately on browser close / hard refresh ─────────────
  useEffect(() => {
    if (!token || !gameId) return;

    const sendLeave = () => {
      if (sentLeaveRef.current) return;
      sentLeaveRef.current = true;
      fetch(`${import.meta.env.VITE_API_BASE_URL}/games/${gameId}/leave`, {
        method: "POST",
        keepalive: true,
        headers: { Authorization: `Bearer ${token}` },
      });
    };

    window.addEventListener("beforeunload", sendLeave);
    return () => window.removeEventListener("beforeunload", sendLeave);
  }, [token, gameId]);

  return (
    <div>
      <Outlet />
    </div>
  );
}
