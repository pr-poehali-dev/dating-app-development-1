import Icon from "@/components/ui/icon";
import { type CallState } from "./constants";

interface Props {
  callState: CallState;
  micOn: boolean;
  camOn: boolean;
  switchingCam: boolean;
  handleClose: () => void;
  acceptCall: () => void;
  toggleMic: () => void;
  toggleCam: () => void;
  switchCamera: () => void;
}

export function VideoCallControls({
  callState,
  micOn,
  camOn,
  switchingCam,
  handleClose,
  acceptCall,
  toggleMic,
  toggleCam,
  switchCamera,
}: Props) {
  return (
    <div className="pb-12 pt-6 flex items-center justify-center gap-6"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(20px)" }}>
      {callState === "incoming" ? (
        <>
          <button onClick={handleClose}
            className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90"
            style={{ background: "#ef4444" }}>
            <Icon name="PhoneOff" size={26} className="text-white" />
          </button>
          <button onClick={acceptCall}
            className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90"
            style={{ background: "#22c55e" }}>
            <Icon name="Video" size={26} className="text-white" />
          </button>
        </>
      ) : (
        <>
          <button onClick={toggleMic}
            className="w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90"
            style={{ background: micOn ? "rgba(255,255,255,0.15)" : "rgba(255,45,120,0.4)" }}>
            <Icon name={micOn ? "Mic" : "MicOff"} size={22} className="text-white" />
          </button>
          <button onClick={handleClose}
            className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90"
            style={{ background: "#ef4444" }}>
            <Icon name="PhoneOff" size={26} className="text-white" />
          </button>
          <button onClick={toggleCam}
            className="w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90"
            style={{ background: camOn ? "rgba(255,255,255,0.15)" : "rgba(255,45,120,0.4)" }}>
            <Icon name={camOn ? "Video" : "VideoOff"} size={22} className="text-white" />
          </button>
          <button onClick={switchCamera} disabled={switchingCam}
            className="w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90 disabled:opacity-50"
            style={{ background: "rgba(255,255,255,0.15)" }}>
            <Icon name={switchingCam ? "Loader" : "SwitchCamera"} size={22}
              className={`text-white ${switchingCam ? "animate-spin" : ""}`} />
          </button>
        </>
      )}
    </div>
  );
}

export default VideoCallControls;
