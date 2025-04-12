import React, { useEffect, useRef } from "react";
import io from "socket.io-client";
import styled from 'styled-components';

const socket = io("http://localhost:3000"); // Adjust to your server URL

const LiveStream = ({ isStreamer }) => {
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  let peerConnection;

  useEffect(() => {
    const initWebRTC = async () => {
      peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }], // Free STUN server
      });

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("ice-candidate", event.candidate);
        }
      };

      peerConnection.ontrack = (event) => {
        remoteVideoRef.current.srcObject = event.streams[0];
      };

      if (isStreamer) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        localVideoRef.current.srcObject = stream;
        stream
          .getTracks()
          .forEach((track) => peerConnection.addTrack(track, stream));

        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socket.emit("offer", offer);
      }

      socket.on("offer", async (offer) => {
        if (!isStreamer) {
          await peerConnection.setRemoteDescription(
            new RTCSessionDescription(offer)
          );
          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);
          socket.emit("answer", answer);
        }
      });

      socket.on("answer", (answer) => {
        peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      });

      socket.on("ice-candidate", (candidate) => {
        peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      });
    };

    initWebRTC();
    return () => socket.off(); // Cleanup
  }, [isStreamer]);

  return (
    <div className="video-wrapper">
    <video
      ref={isStreamer ? localVideoRef : remoteVideoRef}
      autoPlay
      muted={isStreamer} // Streamer tắt tiếng chính mình
      className="live-video"
    />
  </div>
  );
};

const VideoBoard = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  background-color: #000;
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


export default LiveStream;
