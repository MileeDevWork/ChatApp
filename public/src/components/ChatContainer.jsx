import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import ChatInput from "./ChatInput";
import Logout from "./Logout";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { sendMessageRoute, recieveMessageRoute } from "../utils/APIRoutes";

export default function ChatContainer({ currentChat, socket }) {
  const [messages, setMessages] = useState([]);
  const scrollRef = useRef();
  const [arrivalMessage, setArrivalMessage] = useState(null);

  useEffect(() => {
    const fetchMessages = async () => {
      const data = await JSON.parse(localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY));
      const response = await axios.post(recieveMessageRoute, {
        from: data._id,
        to: currentChat._id,
      });
      setMessages(response.data);
    };
    if (currentChat) {
      fetchMessages();
    }
  }, [currentChat]);

  useEffect(() => {
    const getCurrentChat = async () => {
      if (currentChat) {
        await JSON.parse(localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY));
      }
    };
    getCurrentChat();
  }, [currentChat]);

  const handleSendMsg = async (msg) => {
    const data = await JSON.parse(localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY));
    socket.current.emit("send-msg", {
      to: currentChat._id,
      from: data._id,
      msg,
    });

    if (msg.text) {
      await axios.post(sendMessageRoute, {
        from: data._id,
        to: currentChat._id,
        message: msg.text,
      });
    }

    const msgs = [...messages];
    msgs.push({ fromSelf: true, message: msg.text, fileUrl: msg.fileUrl, fileName: msg.fileName, fileType: msg.fileType });
    setMessages(msgs);
  };

  useEffect(() => {
    if (socket.current) {
      socket.current.on("msg-recieve", (msg) => {
        setArrivalMessage({
          fromSelf: false,
          message: msg.text,
          fileUrl: msg.fileUrl,
          fileName: msg.fileName,
          fileType: msg.fileType,
        });
      });
    }
  }, []);

  useEffect(() => {
    arrivalMessage && setMessages((prev) => [...prev, arrivalMessage]);
  }, [arrivalMessage]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <Container>
      <div className="chat-header">
        <div className="user-details">
          <div className="avatar">
            <img
              src={`data:image/svg+xml;base64,${currentChat.avatarImage}`}
              alt=""
            />
          </div>
          <div className="username">
            <h3>{currentChat.username}</h3>
          </div>
        </div>
        <Logout />
      </div>
      <div className="chat-messages">
        {messages.map((message) => {
          return (
            <div ref={scrollRef} key={uuidv4()}>
              <div
                className={`message ${message.fromSelf ? "sended" : "recieved"
                  }`}
              >
                <div className="content">
                  {message.fileUrl ? (
                    <div>
                      <a
                        href={message.fileUrl}
                        download={message.fileName}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {message.fileName ? message.fileName : message.fileUrl.split("/").pop()}
                      </a>
                    </div>
                  ) : (
                    <p>{message.message}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {/* <ChatInput handleSendMsg={handleSendMsg} /> */}
      <ChatInput handleSendMsg={handleSendMsg} currentChat={currentChat} />
    </Container>
  );
}

const Container = styled.div`
  display: grid;
  grid-template-rows: 10% 80% 10%;
  gap: 0.1rem;
  overflow: hidden;
  @media screen and (min-width: 720px) and (max-width: 1080px) {
    grid-template-rows: 15% 70% 15%;
  }

  .chat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 2rem;
    background-color: #f9fafb;
    border-bottom: 1px solid #e5e7eb;

    .user-details {
      display: flex;
      align-items: center;
      gap: 1rem;

      .avatar {
        img {
          height: 3rem;
        }
      }

      .username {
        h3 {
          color: #1f2937;
        }
      }
    }
  }

  .chat-messages {
    padding: 1rem 2rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    overflow: auto;

    &::-webkit-scrollbar {
      width: 0.2rem;

      &-thumb {
        background-color: #cbd5e1;
        width: 0.1rem;
        border-radius: 1rem;
      }
    }

    .message {
      display: flex;
      align-items: center;

      .content {
        max-width: 40%;
        overflow-wrap: break-word;
        padding: 1rem;
        font-size: 1.1rem;
        border-radius: 1rem;
        color: #1f2937;
        @media screen and (min-width: 720px) and (max-width: 1080px) {
          max-width: 70%;
        }
      }
    }

    .sended {
      justify-content: flex-end;

      .content {
        background-color: #c7d2fe;
      }
    }

    .recieved {
      justify-content: flex-start;

      .content {
        background-color: #e5e7eb;
      }
    }
  }
`;