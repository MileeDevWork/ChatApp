import React, { useState } from 'react';
import styled from 'styled-components';
import LiveStream from '../components/LiveStream';
import { useNavigate } from "react-router-dom";

export default function LiveStreamingPage() {
  const [isStreamer, setIsStreamer] = useState(false);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (comment.trim()) {
      setComments([...comments, comment]);
      setComment("");
    }
  };

  return (
    <Wrapper>
      <Header>
        <BackButton onClick={() => navigate("/")}>← Back</BackButton>
        <Title>Live Stream</Title>
        <RoleButton onClick={() => setIsStreamer(!isStreamer)}>
          {isStreamer ? "Stop Streaming" : "Start Streaming"}
        </RoleButton>
      </Header>

      <StreamContainer>
        <VideoBoard>
          <LiveStream isStreamer={isStreamer} />
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
