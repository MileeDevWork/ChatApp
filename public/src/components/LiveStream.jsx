import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";

const LiveStream = ({ isStreamer, streamerId, socket }) => {
  const navigate = useNavigate();
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const peerConnections = useRef(new Map());
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const initWebRTC = async () => {
      if (isStreamer) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
          socket.on("request-offer", async ({ from }) => {
            const pc = new RTCPeerConnection({
              iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
            });
            peerConnections.current.set(from, pc);
            pc.onicecandidate = (event) => {
              if (event.candidate) {
                socket.emit("ice-candidate", {
                  candidate: event.candidate,
                  to: from,
                });
              }
            };
            stream.getTracks().forEach((track) => pc.addTrack(track, stream));
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit("offer", { offer, to: from });
            pc.onconnectionstatechange = () => {
              console.log(`Connection state: ${pc.connectionState}`);
              if (pc.connectionState === "failed") {
                setError("Failed to connect to viewer");
              }
            };
          });
        } catch (error) {
          console.error("Media access failed:", error);
          setError("Could not access camera/microphone.");
        }
      } else if (!isStreamer && streamerId) {
        const pc = new RTCPeerConnection({
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });
        peerConnections.current.set(streamerId, pc);
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit("ice-candidate", {
              candidate: event.candidate,
              to: streamerId,
            });
          }
        };
        pc.ontrack = (event) => {
          console.log("Received remote stream:", event.streams[0]);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
          } else {
            console.error("remoteVideoRef is not set");
          }
        };
        pc.onconnectionstatechange = () => {
          console.log(`Connection state: ${pc.connectionState}`);
          if (pc.connectionState === "failed") {
            setError("Failed to connect to stream.");
          }
        };
        socket.emit("request-offer", { streamerId });
      }

      socket.on("offer", async ({ offer, from }) => {
        if (!isStreamer && from === streamerId) {
          const pc = peerConnections.current.get(streamerId);
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit("answer", { answer, to: from });
        }
      });

      socket.on("answer", ({ answer, from }) => {
        if (isStreamer) {
          const pc = peerConnections.current.get(from);
          if (pc) {
            pc.setRemoteDescription(new RTCSessionDescription(answer));
          }
        }
      });

      socket.on("ice-candidate", ({ candidate, from }) => {
        const pc = isStreamer
          ? peerConnections.current.get(from)
          : peerConnections.current.get(streamerId);
        if (pc && candidate) {
          pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
      });

      socket.on("error", ({ message }) => {
        setError(message);
      });

      // Listen for new stream notifications
      socket.on("new-stream-notification", (streamData) => {
        console.log("New stream notification received:", streamData);
        // Show notification (avoid notifying the streamer themselves)
        if (isStreamer && streamData.streamerId === socket.id) {
          return; // Skip if the user is the streamer of this stream
        }
        // Option 1: Use toast notification
        const notificationId = Date.now();
        setNotifications(prev => [
          ...prev,
          { id: notificationId, streamData }
        ]);
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== notificationId));
        }, 5000);
        // Option 2: Fallback to alert (uncomment to use)
        // alert(`New live stream by ${streamData.username} on channel ${streamData.channelId}!`);
      });

    };

    initWebRTC();

    return () => {
      socket.off("request-offer");
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
      socket.off("error");
      socket.off("new-stream-notification");
      peerConnections.current.forEach((pc) => pc.close());
      peerConnections.current.clear();
      if (localVideoRef.current && localVideoRef.current.srcObject) {
        localVideoRef.current.srcObject
          .getTracks()
          .forEach((track) => track.stop());
      }
    };
  }, [isStreamer, streamerId, socket]);

  const joinStream = (streamerId) => {
    navigate(`/live?streamerId=${streamerId}`);
  };

  const dismissNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  return (
    <VideoWrapper>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      <NotificationContainer>
        {notifications.map(({ id, streamData }) => (
          <Toast key={id}>
            <ToastMessage>
              New stream by {streamData.username} on {streamData.channelId}!
            </ToastMessage>
            <ToastButton onClick={() => joinStream(streamData.streamerId)}>
              Join
            </ToastButton>
            <ToastButton onClick={() => dismissNotification(id)}>
              Close
            </ToastButton>
          </Toast>
        ))}
      </NotificationContainer>
      <video
        ref={isStreamer ? localVideoRef : remoteVideoRef}
        autoPlay
        muted={isStreamer}
        className="live-video"
      />
    </VideoWrapper>
  );
};

const VideoWrapper = styled.div`
  width: 100%;
  height: 100%;
  background-color: #000;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;

  .live-video {
    width: 100%;
    height: auto;
    max-height: 100%;
    object-fit: contain;
    background-color: #000;
  }
`;

const ErrorMessage = styled.p`
  color: red;
  text-align: center;
  padding: 0.5rem 1rem;
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.7);
  border-radius: 5px;
`;

const NotificationContainer = styled.div`
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 1000;
`;

const Toast = styled.div`
  background-color: #333;
  color: #fff;
  padding: 10px 15px;
  border-radius: 5px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  animation: slideIn 0.3s ease-out;

  @keyframes slideIn {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
  }
`;

const ToastMessage = styled.span`
  flex: 1;
`;

const ToastButton = styled.button`
  background-color: #555;
  color: #fff;
  border: none;
  padding: 5px 10px;
  border-radius: 3px;
  cursor: pointer;
  &:hover {
    background-color: #666;
  }
`;

export default LiveStream;
