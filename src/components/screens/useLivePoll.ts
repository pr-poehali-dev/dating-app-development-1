import { useEffect, useRef } from "react";
import { liveApi, type LiveStream, type LiveMessage } from "@/lib/api";

interface UseLivePollParams {
  activeStream: LiveStream | null;
  isStreamingRef: React.MutableRefObject<boolean>;
  lastMsgIdRef: React.MutableRefObject<number>;
  lastHeartsCountRef: React.MutableRefObject<number>;
  setActiveStream: React.Dispatch<React.SetStateAction<LiveStream | null>>;
  setChatMsgs: React.Dispatch<React.SetStateAction<LiveMessage[]>>;
  setLastMsgId: React.Dispatch<React.SetStateAction<number>>;
  setHeartsAnim: React.Dispatch<React.SetStateAction<number[]>>;
  stopAllPeers: () => void;
  loadStreams: () => void;
}

export function useLivePoll({
  activeStream,
  isStreamingRef,
  lastMsgIdRef,
  lastHeartsCountRef,
  setActiveStream,
  setChatMsgs,
  setLastMsgId,
  setHeartsAnim,
  stopAllPeers,
  loadStreams,
}: UseLivePollParams) {
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!activeStream) { if (pollRef.current) clearInterval(pollRef.current); return; }
    const poll = async () => {
      try {
        const res = await liveApi.poll(activeStream.id, lastMsgIdRef.current);
        if (res.stream.status === "ended" && !isStreamingRef.current) {
          setActiveStream(null); setChatMsgs([]); setLastMsgId(0); lastMsgIdRef.current = 0;
          stopAllPeers(); loadStreams(); return;
        }
        setActiveStream((prev) => prev ? { ...prev, viewers_count: res.stream.viewers_count, hearts_count: res.stream.hearts_count } : prev);
        if (res.stream.hearts_count > lastHeartsCountRef.current) {
          const diff = res.stream.hearts_count - lastHeartsCountRef.current;
          for (let i = 0; i < Math.min(diff, 5); i++) {
            const id = Date.now() + i;
            setHeartsAnim((prev) => [...prev, id]);
            setTimeout(() => setHeartsAnim((prev) => prev.filter((x) => x !== id)), 1500);
          }
        }
        lastHeartsCountRef.current = res.stream.hearts_count;
        if (res.messages.length > 0) {
          const newId = res.messages[res.messages.length - 1].id;
          lastMsgIdRef.current = newId;
          setLastMsgId(newId);
          setChatMsgs((prev) => {
            const existingIds = new Set(prev.map((m) => m.id));
            const fresh = res.messages.filter((m: LiveMessage) => !existingIds.has(m.id));
            return fresh.length > 0 ? [...prev, ...fresh] : prev;
          });
        }
      } catch (e: unknown) { void e; }
    };
    poll();
    pollRef.current = setInterval(poll, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStream?.id, stopAllPeers]);

  return { pollRef };
}