import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/icon";

interface Props {
  url: string;
  out: boolean;
}

const BARS = 28;

function formatTime(s: number) {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}

function generateWaveform(seed: string): number[] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  const out: number[] = [];
  for (let i = 0; i < BARS; i++) {
    hash = (hash * 1664525 + 1013904223) >>> 0;
    const v = (hash & 0xffff) / 0xffff;
    const middleBoost = 1 - Math.abs(i - BARS / 2) / (BARS / 2);
    out.push(0.2 + v * 0.5 + middleBoost * 0.3);
  }
  return out;
}

export default function VoiceMessage({ url, out }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [speed, setSpeed] = useState<1 | 1.5 | 2>(1);
  const [played, setPlayed] = useState(false);
  const bars = useRef(generateWaveform(url));

  useEffect(() => {
    const a = new Audio(url);
    a.preload = "metadata";
    audioRef.current = a;

    const onMeta = () => { setDuration(a.duration); setLoaded(true); };
    const onTime = () => setCurrent(a.currentTime);
    const onEnd = () => { setPlaying(false); setCurrent(0); a.currentTime = 0; };

    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("durationchange", onMeta);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("ended", onEnd);

    return () => {
      a.pause();
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("durationchange", onMeta);
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("ended", onEnd);
      audioRef.current = null;
    };
  }, [url]);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause(); setPlaying(false);
    } else {
      a.playbackRate = speed;
      a.play().then(() => { setPlaying(true); setPlayed(true); }).catch(() => {});
    }
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = audioRef.current;
    if (!a || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    a.currentTime = ratio * duration;
    setCurrent(a.currentTime);
  };

  const changeSpeed = () => {
    const next: 1 | 1.5 | 2 = speed === 1 ? 1.5 : speed === 1.5 ? 2 : 1;
    setSpeed(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  };

  const progress = duration ? current / duration : 0;
  const shownTime = playing || current > 0 ? current : duration;

  const activeColor = out ? "rgba(255,255,255,0.9)" : "#FF2D78";
  const inactiveColor = out ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.22)";

  return (
    <div className="flex items-center gap-3" style={{ minWidth: 210, maxWidth: 250 }}>
      {/* Play/Pause */}
      <button
        onClick={toggle}
        disabled={!loaded}
        className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-transform disabled:opacity-40"
        style={{
          background: out
            ? "rgba(255,255,255,0.22)"
            : "linear-gradient(135deg,#FF2D78,#9B59B6)",
          boxShadow: out ? "none" : "0 3px 10px rgba(255,45,120,0.4)",
        }}>
        {!loaded
          ? <Icon name="Loader2" size={15} className="text-white animate-spin" />
          : <Icon name={playing ? "Pause" : "Play"} size={15} className="text-white" style={{ marginLeft: playing ? 0 : 2 }} />
        }
      </button>

      {/* Waveform + meta */}
      <div className="flex-1 flex flex-col gap-1.5 min-w-0">
        {/* Bars */}
        <div className="flex items-end gap-[2.5px] h-6 cursor-pointer" onClick={seek}>
          {bars.current.map((h, i) => {
            const active = (i + 1) / BARS <= progress;
            return (
              <div key={i} className="flex-1 rounded-full transition-colors duration-75"
                style={{
                  height: `${Math.round(Math.max(20, h * 100))}%`,
                  background: active ? activeColor : inactiveColor,
                  minWidth: 2,
                }} />
            );
          })}
        </div>

        {/* Bottom row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {!played && !out && (
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: "#FF2D78", boxShadow: "0 0 4px #FF2D78" }} />
            )}
            <span className="text-[11px] font-mono tabular-nums"
              style={{ color: out ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.55)" }}>
              {formatTime(shownTime)}
            </span>
          </div>
          {(playing || current > 0) && (
            <button onClick={changeSpeed}
              className="px-1.5 py-0.5 rounded-md text-[10px] font-bold transition-opacity active:opacity-60"
              style={{
                background: out ? "rgba(255,255,255,0.18)" : "rgba(255,45,120,0.2)",
                color: out ? "rgba(255,255,255,0.8)" : "#FF2D78",
              }}>
              {speed}×
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
