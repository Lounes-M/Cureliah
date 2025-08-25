import React, { useState } from "react";
import { X } from "lucide-react";

const VIDEO_URL = "https://rlfghipdzxfnwijsylac.supabase.co/storage/v1/object/public/Intro%20video/Intro.mp4";

const VideoIntroPopup: React.FC = () => {
  const [minimized, setMinimized] = useState(false);
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: minimized ? "auto" : 0,
        left: minimized ? "auto" : 0,
        right: minimized ? 20 : 0,
        bottom: minimized ? 20 : "auto",
        zIndex: 9999,
        width: minimized ? 320 : "100vw",
        height: minimized ? 180 : "100vh",
        background: minimized ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.85)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: minimized ? 16 : 0,
        boxShadow: minimized ? "0 4px 24px rgba(0,0,0,0.2)" : undefined,
        transition: "all 0.4s cubic-bezier(.4,2,.3,1)",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: minimized ? 8 : 32,
          right: minimized ? 8 : 32,
          zIndex: 10001,
          cursor: "pointer",
          background: "rgba(255,255,255,0.8)",
          borderRadius: 999,
          padding: 4,
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
        onClick={() => minimized ? setVisible(false) : setMinimized(true)}
        title={minimized ? "Fermer" : "Réduire"}
      >
        <X size={minimized ? 18 : 32} color="#333" />
      </div>
      <video
        src={VIDEO_URL}
        autoPlay
        loop
        controls
        style={{
          width: minimized ? 320 : "60vw",
          height: minimized ? 180 : "auto",
          borderRadius: minimized ? 16 : 24,
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
          background: "#000",
          transition: "all 0.4s cubic-bezier(.4,2,.3,1)",
        }}
      />
    </div>
  );
};

export default VideoIntroPopup;
