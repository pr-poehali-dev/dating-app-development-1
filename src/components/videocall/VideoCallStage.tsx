import Icon from "@/components/ui/icon";
import { formatDuration, type CallState } from "./constants";

interface Props {
  callState: CallState;
  partnerName: string;
  partnerPhoto: string;
  duration: number;
  camOn: boolean;
  mediaError: string | null;
  remoteVideoRef: React.RefObject<HTMLVideoElement>;
  remoteAudioRef: React.RefObject<HTMLAudioElement>;
  localVideoRef: React.RefObject<HTMLVideoElement>;
}

export function VideoCallStage({
  callState,
  partnerName,
  partnerPhoto,
  duration,
  camOn,
  mediaError,
  remoteVideoRef,
  remoteAudioRef,
  localVideoRef,
}: Props) {
  return (
    <div className="flex-1 relative overflow-hidden">
      {/* Remote video — всегда в DOM чтобы srcObject успел установиться */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
        style={{ display: callState === "connected" ? "block" : "none" }}
      />
      {/* Звук собеседника — только здесь, чтобы не было эха */}
      <audio ref={remoteAudioRef} autoPlay />

      {/* Экран ожидания */}
      {callState !== "connected" && (
        <div className="w-full h-full flex flex-col items-center justify-center gap-4 px-6">
          <img src={partnerPhoto} className="w-28 h-28 rounded-full object-cover border-4 border-white/20" />
          <p className="text-white text-xl font-semibold">{partnerName}</p>
          <p className="text-white/50 text-sm animate-pulse">
            {callState === "calling" && "Вызов..."}
            {callState === "incoming" && "Входящий видеозвонок"}
            {callState === "ended" && "Звонок завершён"}
          </p>
          {mediaError && (
            <div className="mt-2 px-4 py-3 rounded-2xl text-center max-w-xs"
              style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }}>
              <p className="text-red-300 text-sm leading-relaxed">{mediaError}</p>
              <p className="text-white/30 text-xs mt-1">Проверь разрешения в браузере и попробуй снова</p>
            </div>
          )}
        </div>
      )}

      {callState === "connected" && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-white text-sm font-mono"
          style={{ background: "rgba(0,0,0,0.4)" }}>
          {formatDuration(duration)}
        </div>
      )}

      {/* Своё видео — всегда в DOM */}
      <div className="absolute bottom-4 right-4 w-24 h-32 rounded-2xl overflow-hidden border-2 border-white/20 shadow-xl">
        <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        {!camOn && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)" }}>
            <Icon name="VideoOff" size={20} className="text-white/50" />
          </div>
        )}
      </div>
    </div>
  );
}

export default VideoCallStage;
