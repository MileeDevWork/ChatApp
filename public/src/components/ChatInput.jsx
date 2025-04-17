import React, { useState } from "react";
import { BsEmojiSmileFill } from "react-icons/bs";
import { IoMdSend } from "react-icons/io";
import styled from "styled-components";
import Picker from "emoji-picker-react";

export default function ChatInput({ handleSendMsg }) {
  const [msg, setMsg] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const handleEmojiPickerhideShow = () => {
    setShowEmojiPicker(!showEmojiPicker);
  };

  const handleEmojiClick = (event, emojiObject) => {
    let message = msg;
    message += emojiObject.emoji;
    setMsg(message);
  };

  const sendChat = (event) => {
    event.preventDefault();
    if (msg.length > 0) {
      handleSendMsg(msg);
      setMsg("");
    }
  };

  return (
    <Container>
      <div className="button-container">
        <div className="emoji">
          <BsEmojiSmileFill onClick={handleEmojiPickerhideShow} />
          {showEmojiPicker && <Picker onEmojiClick={handleEmojiClick} />}
        </div>
      </div>
      <form className="input-container" onSubmit={(event) => sendChat(event)}>
        <input
          type="text"
          placeholder="type your message here"
          onChange={(e) => setMsg(e.target.value)}
          value={msg}
        />
        <button type="submit">
          <IoMdSend />
        </button>
      </form>
    </Container>
  );
}

const Container = styled.div`
  display: grid;
  align-items: center;
  grid-template-columns: 5% 95%;
  background-color: #f9fafb;
  padding: 0 2rem;
  border-top: 1px solid #e5e7eb;

  @media screen and (min-width: 720px) and (max-width: 1080px) {
    padding: 0 1rem;
    gap: 1rem;
  }

  .button-container {
    display: flex;
    align-items: center;
    color: #334155;
    gap: 1rem;

    .emoji {
      position: relative;

      svg {
        font-size: 1.5rem;
        color: #f59e0b; /* bright amber */
        cursor: pointer;
      }

      .emoji-picker-react {
        position: absolute;
        top: -350px;
        background-color: #ffffff;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        border-color: #e5e7eb;
        border-radius: 0.5rem;

        .emoji-scroll-wrapper::-webkit-scrollbar {
          background-color: #f9fafb;
          width: 5px;

          &-thumb {
            background-color: #cbd5e1;
          }
        }

        .emoji-categories {
          button {
            filter: grayscale(1);
          }
        }

        .emoji-search {
          background-color: #f1f5f9;
          border-color: #cbd5e1;
        }

        .emoji-group:before {
          background-color: #ffffff;
        }
      }
    }
  }

  .input-container {
    width: 100%;
    border-radius: 2rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    background-color: #ffffff;
    border: 1px solid #e5e7eb;
    padding: 0.5rem 1rem;

    input {
      width: 100%;
      background-color: transparent;
      color: #1f2937;
      border: none;
      font-size: 1rem;
      padding: 0.6rem 1rem;

      &::selection {
        background-color: #c7d2fe;
      }

      &:focus {
        outline: none;
      }
    }

    button {
      padding: 0.4rem 1.2rem;
      border-radius: 2rem;
      display: flex;
      justify-content: center;
      align-items: center;
      background-color: #6366f1;
      border: none;
      transition: background-color 0.2s ease-in-out;

      @media screen and (min-width: 720px) and (max-width: 1080px) {
        padding: 0.3rem 1rem;

        svg {
          font-size: 1.2rem;
        }
      }

      svg {
        font-size: 1.5rem;
        color: white;
      }

      &:hover {
        background-color: #4f46e5;
      }
    }
  }
`;