import React, { useEffect, useRef, useState } from 'react';
import AgoraRTC, { IAgoraRTCClient, ICameraVideoTrack, IMicrophoneAudioTrack, IAgoraRTCRemoteUser } from 'agora-rtc-sdk-ng';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Users } from 'lucide-react';
import { cn } from '../lib/utils';

interface AgoraVideoCallProps {
  appId: string;
  channel: string;
  token?: string | null;
  uid?: string | number | null;
  onClose: () => void;
}

export const AgoraVideoCall: React.FC<AgoraVideoCallProps> = ({ appId, channel, token, uid, onClose }) => {
  const [client, setClient] = useState<IAgoraRTCClient | null>(null);
  const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [isJoined, setIsJoined] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);

  const localVideoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
      const agoraClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      setClient(agoraClient);

      agoraClient.on('user-published', async (user, mediaType) => {
        await agoraClient.subscribe(user, mediaType);
        if (mediaType === 'video') {
          setRemoteUsers(prev => [...prev.filter(u => u.uid !== user.uid), user]);
        }
        if (mediaType === 'audio') {
          user.audioTrack?.play();
        }
      });

      agoraClient.on('user-unpublished', (user) => {
        setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
      });

      agoraClient.on('user-left', (user) => {
        setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
      });

      try {
        await agoraClient.join(appId, channel, token || null, uid || null);
        
        const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        const videoTrack = await AgoraRTC.createCameraVideoTrack();
        
        setLocalAudioTrack(audioTrack);
        setLocalVideoTrack(videoTrack);
        
        if (localVideoRef.current) {
          videoTrack.play(localVideoRef.current);
        }

        await agoraClient.publish([audioTrack, videoTrack]);
        setIsJoined(true);
      } catch (error) {
        console.error('Agora join failed:', error);
      }
    };

    init();

    return () => {
      localAudioTrack?.close();
      localVideoTrack?.close();
      client?.leave();
    };
  }, [appId, channel, token, uid]);

  const toggleMic = async () => {
    if (localAudioTrack) {
      await localAudioTrack.setEnabled(!micOn);
      setMicOn(!micOn);
    }
  };

  const toggleVideo = async () => {
    if (localVideoTrack) {
      await localVideoTrack.setEnabled(!videoOn);
      setVideoOn(!videoOn);
    }
  };

  const handleLeave = async () => {
    await client?.leave();
    localAudioTrack?.close();
    localVideoTrack?.close();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black z-[100] flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center justify-between bg-zinc-900/50 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-white font-bold">{channel}</h2>
            <p className="text-zinc-400 text-xs">{remoteUsers.length + 1} Participants</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 bg-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-wider rounded-full border border-red-500/50 animate-pulse">
            Live
          </div>
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto">
        {/* Local Video */}
        <div className="relative aspect-video bg-zinc-800 rounded-2xl overflow-hidden border border-white/5 group">
          <div ref={localVideoRef} className="w-full h-full" />
          <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-black/50 backdrop-blur-md rounded-lg border border-white/10">
            <div className="w-2 h-2 bg-emerald-500 rounded-full" />
            <span className="text-white text-xs font-medium">You (Teacher)</span>
          </div>
          {!videoOn && (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
              <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center">
                <User className="w-10 h-10 text-zinc-600" />
              </div>
            </div>
          )}
        </div>

        {/* Remote Videos */}
        {remoteUsers.map(user => (
          <div key={user.uid}>
            <RemoteVideoPlayer user={user} />
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="p-6 bg-zinc-900/80 backdrop-blur-xl border-t border-white/10 flex items-center justify-center gap-4">
        <button 
          onClick={toggleMic}
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center transition-all",
            micOn ? "bg-zinc-800 text-white hover:bg-zinc-700" : "bg-red-500 text-white hover:bg-red-600"
          )}
        >
          {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>
        
        <button 
          onClick={toggleVideo}
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center transition-all",
            videoOn ? "bg-zinc-800 text-white hover:bg-zinc-700" : "bg-red-500 text-white hover:bg-red-600"
          )}
        >
          {videoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>

        <button 
          onClick={handleLeave}
          className="w-16 h-12 bg-red-600 hover:bg-red-700 text-white rounded-2xl flex items-center justify-center transition-all shadow-lg shadow-red-600/20"
        >
          <PhoneOff className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

const RemoteVideoPlayer = ({ user }: { user: IAgoraRTCRemoteUser }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      user.videoTrack?.play(ref.current);
    }
  }, [user.videoTrack]);

  return (
    <div className="relative aspect-video bg-zinc-800 rounded-2xl overflow-hidden border border-white/5">
      <div ref={ref} className="w-full h-full" />
      <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-black/50 backdrop-blur-md rounded-lg border border-white/10">
        <span className="text-white text-xs font-medium">Student {user.uid}</span>
      </div>
    </div>
  );
};

const User = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);
