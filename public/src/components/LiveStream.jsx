import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import styled from "styled-components";

const socket = io("http://localhost:5001");

const LiveStream = ({ isStreamer, streamerId }) => {
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const peerConnections = useRef(new Map());
  const [error, setError] = useState(null);

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
    };

    initWebRTC();

    return () => {
      socket.off("request-offer");
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
      peerConnections.current.forEach((pc) => pc.close());
      peerConnections.current.clear();
      if (localVideoRef.current && localVideoRef.current.srcObject) {
        localVideoRef.current.srcObject
          .getTracks()
          .forEach((track) => track.stop());
      }
    };
  }, [isStreamer, streamerId]);

  return (
    <VideoWrapper>
      {error && <ErrorMessage>{error}</ErrorMessage>}
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
`;

export default LiveStream;
