import { type VideoCallProps } from "./videocall/constants";
import { useVideoCall } from "./videocall/useVideoCall";
import { VideoCallStage } from "./videocall/VideoCallStage";
import { VideoCallControls } from "./videocall/VideoCallControls";

export default function VideoCall(props: VideoCallProps) {
  const { partnerName, partnerPhoto } = props;
  const {
    callState,
    micOn,
    camOn,
    duration,
    mediaError,
    switchingCam,
    localVideoRef,
    remoteVideoRef,
    remoteAudioRef,
    handleClose,
    acceptCall,
    toggleMic,
    toggleCam,
    switchCamera,
  } = useVideoCall(props);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col" style={{ background: "#0d0b14" }}>
      <VideoCallStage
        callState={callState}
        partnerName={partnerName}
        partnerPhoto={partnerPhoto}
        duration={duration}
        camOn={camOn}
        mediaError={mediaError}
        remoteVideoRef={remoteVideoRef}
        remoteAudioRef={remoteAudioRef}
        localVideoRef={localVideoRef}
      />

      <VideoCallControls
        callState={callState}
        micOn={micOn}
        camOn={camOn}
        switchingCam={switchingCam}
        handleClose={handleClose}
        acceptCall={acceptCall}
        toggleMic={toggleMic}
        toggleCam={toggleCam}
        switchCamera={switchCamera}
      />
    </div>
  );
}
