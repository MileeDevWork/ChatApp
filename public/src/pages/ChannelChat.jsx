import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styled from "styled-components";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { io } from "socket.io-client";

// Thay đổi từ localhost thành IP của server
const SERVER_URL = process.env.REACT_APP_SERVER_URL;

export default function ChannelChat() {
  const { channelId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [members, setMembers] = useState([]);
  const [channelName, setChannelName] = useState("");
  const [channels, setChannels] = useState([]);
  const scrollRef = useRef();
  const socket = useRef();
  const [users, setUsers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);

  const getCurrentUser = () => {
    return JSON.parse(localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY));
  };

  const fetchUsers = useCallback(async () => {
    try {
      const currentUser = getCurrentUser();
      const response = await axios.get(`${SERVER_URL}/api/auth/allusers/${currentUser._id}`);
      setUsers(response.data);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  }, []);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await axios.get(`${SERVER_URL}/api/channels/messages/${channelId}`);
      setMessages(res.data.messages);
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  }, [channelId]);

  const fetchMembers = useCallback(async () => {
    try {
      const res = await axios.get(`${SERVER_URL}/api/channels/${channelId}/members`);
      setMembers(res.data.members);
    } catch (err) {
      console.error("Error fetching members:", err);
    }
  }, [channelId]);

  const fetchChannels = useCallback(async () => {
    try {
      const user = getCurrentUser();
      const res = await axios.get(`${SERVER_URL}/api/channels/user/${user._id}`);
      setChannels(res.data.channels);
    } catch (err) {
      console.error("Error fetching channels:", err);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchMessages();
    fetchMembers();
    fetchChannels();
  }, [channelId, fetchMessages, fetchMembers, fetchChannels]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    socket.current = io(SERVER_URL);
    socket.current.emit("join-channel", channelId);

    socket.current.on("channel-message", async ({ senderId, message }) => {
      const sender = members.find((m) => m._id === senderId);
      if (!sender) return;
      const user = getCurrentUser();
      if (senderId !== user._id) {
        setMessages((prev) => [
          ...prev,
          {
            sender: { username: sender.username },
            message,
          },
        ]);
      }
    });

    return () => {
      if (socket.current) {
        socket.current.disconnect();
      }
    };
  }, [channelId, members]);

  const handleCreateChannel = async (e) => {
    e.preventDefault();
    const user = getCurrentUser();
    if (!channelName.trim()) return;

    try {
      const res = await axios.post(`${SERVER_URL}/api/channels/create`, {
        name: channelName,
        creator: [user._id],
      });

      alert("Tạo kênh thành công!");
      setChannelName("");
      fetchChannels();
      navigate(`/channel/${res.data.channel._id}`);
    } catch (err) {
      console.error("Tạo kênh thất bại:", err);
      alert("Tạo kênh thất bại.");
    }
  };

  const handleAddMember = async () => {
    try {
      for (const userId of selectedMembers) {
        await axios.post(`${SERVER_URL}/api/channels/addmember`, {
          channelId,
          userId
        });
      }
      alert("Thêm thành viên thành công!");
      setSelectedMembers([]);
      fetchMembers();
    } catch (err) {
      console.error("Lỗi khi thêm thành viên:", err);
      alert("Không thể thêm thành viên.");
    }
  };

  const handleLeaveChannel = async () => {
    const user = getCurrentUser();
    try {
      await axios.post(`${SERVER_URL}/api/channels/leave`, {
        channelId,
        userId: user._id,
      });
      alert("Bạn đã rời khỏi kênh.");
      fetchChannels();
      navigate("/");
    } catch (err) {
      console.error("Lỗi khi rời kênh:", err);
      alert("Không thể rời kênh.");
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const currentUser = getCurrentUser();
    const payload = {
      channelId,
      senderId: currentUser._id,
      message: newMessage.trim(),
    };

    try {
      const res = await axios.post(`${SERVER_URL}/api/channels/message`, payload);
      setMessages((prev) => [...prev, res.data.message]);
      socket.current.emit("send-channel-message", {
        channelId,
        senderId: currentUser._id,
        message: newMessage.trim(),
      });
      setNewMessage("");
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  const handleBack = () => {
    navigate('/');
  };
  return (
    <Grid>
      <LeftSidebar>
        <h3>Kênh của bạn</h3>
        <ul>
          {channels.map((ch) => (
            <li key={ch._id} onClick={() => navigate(`/channel/${ch._id}`)}>
              {ch.name}
            </li>
          ))}
        </ul>
        <CreateBox onSubmit={handleCreateChannel}>
          <input
            type="text"
            placeholder="Tên kênh mới"
            value={channelName}
            onChange={(e) => setChannelName(e.target.value)}
          />
          <button type="submit">Tạo</button>
        </CreateBox>
      </LeftSidebar>

      <ChatBox>
        {/* <h2>Channel Chat - ID: {channelId}</h2> */}
        <div className="chat-header">
          <div className="header-left">
            <button className="back-button" onClick={handleBack}>← Back</button>
            <h2>Channel Chat - {channels.find(ch => ch._id === channelId)?.name || channelId}</h2>
          </div>
          <span className="current-user">
            {getCurrentUser().username}
          </span>
        </div>
        <Messages>
          {messages.map((msg) => (
            <div key={uuidv4()} ref={scrollRef} className="message">
              <b>{msg.sender.username}:</b>{" "}
              {msg.fileUrl ? (
                <div>
                  <a href={msg.fileUrl} download={msg.fileName} target="_blank" rel="noreferrer">
                    {msg.fileName ? msg.fileName : msg.fileUrl.split("/").pop()}
                  </a>
                </div>
              ) : (
                <span>{msg.message}</span>
              )}
            </div>
          ))}
        </Messages>

        <MessageInputForm onSubmit={handleSendMessage}>
          <input
            type="text"
            placeholder="Nhập tin nhắn của bạn..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <label style={{ cursor: "pointer" }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" style={{ width: "24px", height: "24px", color: "#4b5563" }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 7.5h-.75A2.25 2.25 0 0 0 4.5 9.75v7.5a2.25 2.25 0 0 0 2.25 2.25h7.5a2.25 2.25 0 0 0 2.25-2.25v-7.5a2.25 2.25 0 0 0-2.25-2.25h-.75m0-3-3-3m0 0-3 3m3-3v11.25m6-2.25h.75a2.25 2.25 0 0 1 2.25 2.25v7.5a2.25 2.25 0 0 1-2.25 2.25h-7.5a2.25 2.25 0 0 1-2.25-2.25v-.75" />
            </svg>
            <input
              type="file"
              style={{ display: "none" }}
              onChange={async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const currentUser = getCurrentUser();
                const formData = new FormData();
                formData.append("file", file);
                formData.append("channelId", channelId);
                formData.append("senderId", currentUser._id);
                try {
                  const res = await axios.post("http://localhost:5001/api/channels/message/file", formData);
                  setMessages((prev) => [...prev, res.data.message]);
                } catch (err) {
                  console.error("Upload lỗi:", err);
                }
              }}
            />
          </label>
          <button type="submit">Gửi</button>
        </MessageInputForm>
      </ChatBox>

      <Sidebar>
        <h3>Thành viên</h3>
        <ul>
          {members.map((user) => (
            <li key={user._id}>{user.username}</li>
          ))}
        </ul>

        <div style={{ marginTop: "1rem" }}>
          <h4>Thêm thành viên</h4>
          <select
            multiple
            value={selectedMembers}
            onChange={(e) => {
              const options = Array.from(e.target.selectedOptions, (option) => option.value);
              setSelectedMembers(options);
            }}
            style={{
              width: "100%",
              padding: "0.5rem",
              marginBottom: "0.5rem",
              borderRadius: "0.375rem",
              border: "1px solid #e5e7eb"
            }}
          >
            {users
              .filter(user => !members.some(member => member._id === user._id)) // Lọc ra những user chưa là thành viên
              .map((user) => (
                <option key={user._id} value={user._id}>
                  {user.username}
                </option>
              ))}
          </select>
          <button onClick={handleAddMember} style={{ padding: "0.5rem 1rem", background: "#10b981", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}>
            Thêm
          </button>
        </div>

        <div style={{ marginTop: "2rem" }}>
          <button onClick={handleLeaveChannel} style={{ padding: "0.5rem 1rem", background: "#ef4444", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}>
            Rời khỏi kênh
          </button>
        </div>
      </Sidebar>
    </Grid>
  );
}

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 3fr 1fr;
  height: 100vh;
`;

const ChatBox = styled.div`
  padding: 1rem 1rem 0 1rem;
  border-left: 1px solid #e5e7eb;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  background-color: white;

  h2 {
    padding: 1rem 0;
    border-bottom: 1px solid #e5e7eb;
    color: #1f2937;
    font-size: 1.5rem;
  }
  .chat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 0;
    border-bottom: 1px solid #e5e7eb;

    h2 {
      color: #1f2937;
      font-size: 1.5rem;
      margin: 0;
    }

    .current-user {
      color: #4f46e5;
      font-weight: 500;
    }
  }
`;

const Sidebar = styled.div`
  padding: 1rem;
  background-color: #f9fafb;
  overflow-y: auto;

  h3 {
    margin-bottom: 1rem;
    font-weight: 600;
    color: #1f2937;
  }

  ul {
    list-style: none;
    padding-left: 0;
  }

  li {
    padding: 0.5rem 0;
    border-bottom: 1px solid #e5e7eb;
    color: #374151;
  }
`;

const LeftSidebar = styled.div`
  padding: 1rem;
  background-color: #f9fafb;
  overflow-y: auto;
  border-right: 1px solid #e5e7eb;

  h3 {
    margin-bottom: 1rem;
    font-weight: 600;
    color: #1f2937;
  }

  ul {
    list-style: none;
    padding-left: 0;
    margin-bottom: 1rem;
  }

  li {
    padding: 0.5rem;
    cursor: pointer;
    border-bottom: 1px solid #e5e7eb;
    color: #374151;
    transition: background-color 0.2s;

    &:hover {
      background-color: #e0e7ff;
    }
  }
`;

const Messages = styled.div`
  // Cập nhật height để phù hợp với input form mới
  height: calc(70vh - 4rem);
  overflow-y: auto;
  padding: 1rem;

  .message {
    margin-bottom: 1rem;
    padding: 0.75rem 1rem;
    background-color: #f1f5f9;
    border-radius: 8px;
  }
`;

const MessageInputForm = styled.form`
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  background-color: #f8fafc;
  border-top: 1px solid #e2e8f0;
  position: sticky;
  bottom: 0;

  input {
    flex: 1;
    padding: 0.75rem 1rem;
    border: 2px solid #e2e8f0;
    border-radius: 0.5rem;
    font-size: 1rem;
    transition: all 0.3s ease;

    &:focus {
      outline: none;
      border-color: #6366f1;
      box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
    }

    &::placeholder {
      color: #94a3b8;
    }
  }

  button {
    padding: 0.75rem 2rem;
    background-color: #6366f1;
    color: white;
    border: none;
    border-radius: 0.5rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      background-color: #4f46e5;
      transform: translateY(-1px);
    }

    &:active {
      transform: translateY(0);
    }
  }
`;

const CreateBox = styled.form`
  display: flex;
  gap: 0.5rem;

  input {
    flex: 1;
    padding: 0.5rem 1rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    font-size: 1rem;
  }

  button {
    padding: 0.5rem 1rem;
    background-color: #6366f1;
    color: white;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;

    &:hover {
      background-color: #4f46e5;
    }
  }
`;
