import { useEffect, useRef, useState, useCallback } from "react";
import { messagesApi } from "@/lib/api";

export interface IncomingCall {
  matchId: number;
  fromUserId: number;
  offer: string;
  earlyIce: string[];
  callerName: string;
  callerPhoto: string;
}

/**
 * Глобальный слушатель входящих видеозвонков. Работает на любой вкладке
 * приложения: раз в 3 секунды спрашивает сервер, нет ли входящего звонка,
 * и если есть — отдаёт данные, чтобы показать экран входящего звонка поверх
 * всего приложения.
 *
 * @param enabled — включён ли поллинг (только для авторизованного пользователя)
 * @param suppress — не показывать, если звонок уже открыт вручную (например из чата)
 */
export function useIncomingCall(enabled: boolean, suppress: boolean): {
  incoming: IncomingCall | null;
  dismiss: () => void;
} {
  const [incoming, setIncoming] = useState<IncomingCall | null>(null);
  // Матчи, чей звонок пользователь уже отклонил/закрыл — не показываем повторно
  const dismissedRef = useRef<Set<number>>(new Set());
  const activeRef = useRef(false);
  activeRef.current = !!incoming || suppress;

  const dismiss = useCallback(() => {
    if (incoming) dismissedRef.current.add(incoming.matchId);
    setIncoming(null);
  }, [incoming]);

  useEffect(() => {
    if (!enabled) return;
    let stopped = false;
    const poll = async () => {
      if (stopped || activeRef.current || !navigator.onLine) return;
      try {
        const { call } = await messagesApi.incomingCall();
        if (stopped || !call) return;
        if (dismissedRef.current.has(call.match_id)) return;
        if (activeRef.current) return;
        setIncoming({
          matchId: call.match_id,
          fromUserId: call.from_user_id,
          offer: call.offer,
          earlyIce: call.early_ice || [],
          callerName: call.caller_name,
          callerPhoto: call.caller_photo,
        });
      } catch { /* ignore */ }
    };
    const interval = setInterval(poll, 3000);
    poll();
    return () => { stopped = true; clearInterval(interval); };
  }, [enabled]);

  // Периодически очищаем список отклонённых, чтобы новый звонок с того же
  // матча позже снова показался.
  useEffect(() => {
    const t = setInterval(() => dismissedRef.current.clear(), 60_000);
    return () => clearInterval(t);
  }, []);

  return { incoming, dismiss };
}

export default useIncomingCall;
