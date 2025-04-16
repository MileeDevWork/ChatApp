import React, { useState, useEffect } from "react";
import styled from "styled-components";
import LiveStream from "../components/LiveStream";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";

const socket = io("http://localhost:5001", {
  transports: ["websocket"],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

export default function LiveStreamingPage() {
  const [isStreamer, setIsStreamer] = useState(false);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);
  const [streamers, setStreamers] = useState([]);
  const [selectedStreamer, setSelectedStreamer] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    socket.on("connect", () => {
      console.log("Connected to server:", socket.id);
    });
    socket.on("streamers-update", (activeStreamers) => {
      setStreamers(activeStreamers);
    });
    socket.on("receive-comment", ({ comment }) => {
      setComments((prev) => [...prev, comment]);
    });
    return () => {
      socket.off("connect");
      socket.off("streamers-update");
      socket.off("receive-comment");
    };
  }, []);

  const startStreaming = () => {
    console.log("Starting stream for user");
    setIsStreamer(true);
    const currentUser = JSON.parse(localStorage.getItem("user")); // Adjust key as needed
    socket.emit("start-stream", {
      username: currentUser?.username || "Guest",
      channelId: "main",
    });
  };

  const stopStreaming = () => {
    console.log("Stopping stream");
    setIsStreamer(false);
    socket.emit("stop-stream");
    // Additional cleanup if needed
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (comment.trim()) {
      setComments([...comments, comment]);
      socket.emit("send-comment", { comment, streamerId: selectedStreamer });
      setComment("");
    }
  };

  const handleBack = () => {
    stopStreaming();
    navigate("/");
  };

  return (
    <Wrapper>
      <Header>
        <BackButton onClick={handleBack}>← Back</BackButton>
        <Title>Live Stream</Title>
        {isStreamer ? (
          <RoleButton onClick={stopStreaming}>Stop Streaming</RoleButton>
        ) : (
          <RoleButton onClick={startStreaming}>Start Streaming</RoleButton>
        )}
      </Header>

      <StreamContainer>
        <VideoBoard>
          {isStreamer ? (
            <LiveStream isStreamer={true} />
          ) : (
            <div>
              <h3>Available Streamers</h3>
              {streamers.length === 0 ? (
                <p>No active streamers</p>
              ) : (
                <ul>
                  {streamers.map((streamer) => (
                    <li key={streamer.id || streamer}>
                      <button
                        onClick={() =>
                          setSelectedStreamer(streamer.id || streamer)
                        }
                      >
                        Watch {streamer.username || streamer.id || streamer}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {selectedStreamer && (
                <LiveStream isStreamer={false} streamerId={selectedStreamer} />
              )}
            </div>
          )}
        </VideoBoard>

        <CommentSection>
          <Comments>
            {comments.map((c, idx) => (
              <Comment key={idx}>{c}</Comment>
            ))}
          </Comments>
          <form onSubmit={handleSubmit}>
            <CommentInput
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Comment here..."
            />
          </form>
        </CommentSection>
      </StreamContainer>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  height: 100vh;
  width: 100vw;
  background-color: #000;
  color: #fff;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  padding: 1rem 2rem;
  background-color: #111;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: #ddd;
  font-size: 1.2rem;
  cursor: pointer;
  &:hover {
    color: #fff;
  }
`;

const Title = styled.h1`
  font-size: 1.5rem;
`;

const RoleButton = styled.button`
  background-color: #ff3b3b;
  border: none;
  padding: 0.6rem 1.2rem;
  color: white;
  font-weight: bold;
  border-radius: 8px;
  cursor: pointer;
  &:hover {
    background-color: #e60000;
  }
`;

const StreamContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const VideoBoard = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: black;
  position: relative;

  video {
    width: 100%;
    height: auto;
    max-height: 70vh;
    object-fit: contain;
    background-color: #000;
  }
`;

const CommentSection = styled.div`
  padding: 1rem;
  background-color: #111;
  display: flex;
  flex-direction: column;
  height: 30vh;
`;

const Comments = styled.div`
  flex: 1;
  overflow-y: auto;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
`;

const Comment = styled.div`
  margin-bottom: 0.3rem;
  color: #ccc;
`;

const CommentInput = styled.input`
  padding: 0.6rem;
  font-size: 1rem;
  border-radius: 6px;
  border: none;
  outline: none;
  width: 100%;
  background-color: #222;
  color: #fff;
`;
