import { useEffect } from "react";
import { getGameChannel } from "../sockets/channels/game-channel";
import { getEcho } from "../sockets/echo";

type EventMap = Record<string, (data: never) => void>;

/**
 * Subscribes to a game WebSocket channel and registers event listeners.
 * Automatically cleans up on unmount or when gameId changes.
 *
 * @param gameId  - The game to subscribe to (subscription skipped if falsy)
 * @param events  - Map of event name → handler, e.g. { ".question.started": handler }
 */
export function useGameSocket(gameId: number | null | undefined, events: EventMap) {
  useEffect(() => {
    if (!gameId) return;

    const channel = getGameChannel(String(gameId));
    if (!channel) return;

    for (const [event, handler] of Object.entries(events)) {
      channel.listen(event, handler as (data: unknown) => void);
    }

    return () => {
      getEcho()?.leave(`game.${gameId}`);
    };
    // events object identity changes every render — only re-subscribe when gameId changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId]);
}
