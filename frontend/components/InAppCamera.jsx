'use client';
import { useRef, useEffect, useState, useCallback } from 'react';

export default function InAppCamera({ onCapture, onCancel }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [hasPermission, setHasPermission] = useState(null);
  const [stream, setStream] = useState(null);

  useEffect(() => {
    let activeStream = null;
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } } 
        });
        activeStream = mediaStream;
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        setHasPermission(true);
      } catch (err) {
        console.error("Camera error:", err);
        setHasPermission(false);
      }
    };
    startCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const captureFrame = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          // Convert blob to File object to match file input behavior
          const file = new File([blob], `scan_${Date.now()}.jpg`, { type: 'image/jpeg' });
          
          if (typeof window !== "undefined" && navigator.vibrate) {
            navigator.vibrate(50); // Shutter haptic
          }
          
          onCapture(file);
        }
      }, 'image/jpeg', 0.9);
    }
  }, [onCapture]);

  if (hasPermission === false) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-black rounded-2xl p-6 text-center border border-border">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-red-500 mb-3" strokeWidth="1.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
        <p className="text-white text-sm mb-4">Camera access denied.</p>
        <button onClick={onCancel} className="mello-btn-secondary !text-white !border-white/20">Use File Gallery Instead</button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[350px] bg-black rounded-2xl overflow-hidden shadow-2xl flex flex-col group border border-border">
      {/* Live Video Feed */}
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />
      
      <canvas ref={canvasRef} className="hidden" />

      {/* Viewfinder Overlay */}
      <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-[280px] aspect-[3/4] md:aspect-[4/3] border-2 border-white/40 rounded-xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
           {/* Corner brackets */}
           <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-accent rounded-tl-xl -mt-[2px] -ml-[2px]"></div>
           <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-accent rounded-tr-xl -mt-[2px] -mr-[2px]"></div>
           <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-accent rounded-bl-xl -mb-[2px] -ml-[2px]"></div>
           <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-accent rounded-br-xl -mb-[2px] -mr-[2px]"></div>
           
           {/* Scanning Laser */}
           <div className="absolute top-0 left-0 w-full h-0.5 bg-accent shadow-[0_0_8px_#3b82f6] animate-[scanDrop_2s_ease-in-out_infinite_alternate]"></div>
        </div>
        <div className="absolute top-6 left-0 w-full text-center">
           <span className="bg-black/60 backdrop-blur text-white text-[11px] font-mono tracking-widest px-3 py-1.5 rounded-full">ALIGN MRP & INGREDIENTS</span>
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 w-full p-6 flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent">
        <button onClick={onCancel} className="w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white active:scale-90 transition-transform">
           <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        
        {/* Shutter Button */}
        <button onClick={captureFrame} className="w-16 h-16 rounded-full border-4 border-white/50 flex items-center justify-center active:scale-95 transition-transform group">
           <div className="w-12 h-12 rounded-full bg-white group-active:bg-gray-300 transition-colors"></div>
        </button>
        
        <div className="w-10 h-10"></div> {/* spacer */}
      </div>
    </div>
  );
}
