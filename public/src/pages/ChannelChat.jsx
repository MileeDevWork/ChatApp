// import React, { useEffect, useState, useRef } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import styled from "styled-components";
// import axios from "axios";
// import { v4 as uuidv4 } from "uuid";
// import { io } from "socket.io-client";

// export default function ChannelChat() {
//   const { channelId } = useParams();
//   const navigate = useNavigate();
//   const [messages, setMessages] = useState([]);
//   const [newMessage, setNewMessage] = useState("");
//   const [members, setMembers] = useState([]);
//   const [channelName, setChannelName] = useState("");
//   const [channels, setChannels] = useState([]);
//   const scrollRef = useRef();
//   const socket = useRef();

//   const getCurrentUser = () => {
//     return JSON.parse(localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY));
//   };

//   const fetchMessages = async () => {
//     try {
//       const res = await axios.get(`http://localhost:5001/api/channels/messages/${channelId}`);
//       setMessages(res.data.messages);
//     } catch (err) {
//       console.error("Error fetching messages:", err);
//     }
//   };

//   const fetchMembers = async () => {
//     try {
//       const res = await axios.get(`http://localhost:5001/api/channels/${channelId}/members`);
//       setMembers(res.data.members);
//     } catch (err) {
//       console.error("Error fetching members:", err);
//     }
//   };

//   const fetchChannels = async () => {
//     try {
//       const user = getCurrentUser();
//       const res = await axios.get(`http://localhost:5001/api/channels/user/${user._id}`);
//       setChannels(res.data.channels);
//     } catch (err) {
//       console.error("Error fetching channels:", err);
//     }
//   };

//   const handleCreateChannel = async (e) => {
//     e.preventDefault();
//     const user = getCurrentUser();
//     if (!channelName.trim()) return;

//     try {
//       const res = await axios.post("http://localhost:5001/api/channels/create", {
//         name: channelName,
//         creator: [user._id],
//       });

//       alert("Tạo kênh thành công!");
//       setChannelName("");
//       fetchChannels();
//       navigate(`/channel/${res.data.channel._id}`);
//     } catch (err) {
//       console.error("Tạo kênh thất bại:", err);
//       alert("Tạo kênh thất bại.");
//     }
//   };

//   useEffect(() => {
//     fetchMessages();
//     fetchMembers();
//     fetchChannels();
//   }, [channelId]);

//   useEffect(() => {
//     scrollRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   useEffect(() => {
//     socket.current = io("http://localhost:5001");
//     socket.current.emit("join-channel", channelId);

//     socket.current.on("channel-message", async ({ senderId, message }) => {
//       const sender = members.find((m) => m._id === senderId);
//       if (!sender) return;
//       const user = getCurrentUser();
//       if (senderId !== user._id) {
//         setMessages((prev) => [
//           ...prev,
//           {
//             sender: { username: sender.username },
//             message,
//           },
//         ]);
//       }
//     });

//     return () => {
//       socket.current.disconnect();
//     };
//   }, [channelId, members]);

//   const handleSendMessage = async (e) => {
//     e.preventDefault();
//     if (!newMessage.trim()) return;

//     const currentUser = getCurrentUser();
//     const payload = {
//       channelId,
//       senderId: currentUser._id,
//       message: newMessage.trim(),
//     };

//     try {
//       const res = await axios.post(`http://localhost:5001/api/channels/message`, payload);
//       setMessages((prev) => [...prev, res.data.message]);
//       socket.current.emit("send-channel-message", {
//         channelId,
//         senderId: currentUser._id,
//         message: newMessage.trim(),
//       });
//       setNewMessage("");
//     } catch (err) {
//       console.error("Error sending message:", err);
//     }
//   };

//   return (
//     <Grid>
//       <LeftSidebar>
//         <h3>Kênh của bạn</h3>
//         <ul>
//           {channels.map((ch) => (
//             <li key={ch._id} onClick={() => navigate(`/channel/${ch._id}`)}>
//               {ch.name}
//             </li>
//           ))}
//         </ul>
//         <CreateBox onSubmit={handleCreateChannel}>
//           <input
//             type="text"
//             placeholder="Tên kênh mới"
//             value={channelName}
//             onChange={(e) => setChannelName(e.target.value)}
//           />
//           <button type="submit">Tạo</button>
//         </CreateBox>
//       </LeftSidebar>

//       <ChatBox>
//         <h2>Channel Chat - ID: {channelId}</h2>
//         <Messages>
//           {messages.map((msg) => (
//             <div key={uuidv4()} ref={scrollRef} className="message">
//               <b>{msg.sender.username}:</b> {msg.message}
//             </div>
//           ))}
//         </Messages>
//         <form className="input-area" onSubmit={handleSendMessage}>
//           <input
//             type="text"
//             placeholder="Nhập tin nhắn..."
//             value={newMessage}
//             onChange={(e) => setNewMessage(e.target.value)}
//           />
//           <button type="submit">Gửi</button>
//         </form>
//       </ChatBox>

//       <Sidebar>
//         <h3>Thành viên</h3>
//         <ul>
//           {members.map((user) => (
//             <li key={user._id}>{user.username}</li>
//           ))}
//         </ul>
//       </Sidebar>
//     </Grid>
//   );
// }

// const Grid = styled.div`
//   display: grid;
//   grid-template-columns: 1fr 3fr 1fr;
//   height: 100vh;
// `;

// const ChatBox = styled.div`
//   padding: 1rem;
//   border-left: 1px solid #e5e7eb;
//   border-right: 1px solid #e5e7eb;
//   display: flex;
//   flex-direction: column;
// `;

// const Sidebar = styled.div`
//   padding: 1rem;
//   background-color: #f9fafb;
//   overflow-y: auto;

//   h3 {
//     margin-bottom: 1rem;
//     font-weight: 600;
//     color: #1f2937;
//   }

//   ul {
//     list-style: none;
//     padding-left: 0;
//   }

//   li {
//     padding: 0.5rem 0;
//     border-bottom: 1px solid #e5e7eb;
//     color: #374151;
//   }
// `;

// const LeftSidebar = styled.div`
//   padding: 1rem;
//   background-color: #f9fafb;
//   overflow-y: auto;
//   border-right: 1px solid #e5e7eb;

//   h3 {
//     margin-bottom: 1rem;
//     font-weight: 600;
//     color: #1f2937;
//   }

//   ul {
//     list-style: none;
//     padding-left: 0;
//     margin-bottom: 1rem;
//   }

//   li {
//     padding: 0.5rem;
//     cursor: pointer;
//     border-bottom: 1px solid #e5e7eb;
//     color: #374151;
//     transition: background-color 0.2s;

//     &:hover {
//       background-color: #e0e7ff;
//     }
//   }
// `;

// const Messages = styled.div`
//   margin-top: 1rem;
//   height: 70vh;
//   overflow-y: auto;

//   .message {
//     margin-bottom: 1rem;
//     padding: 0.75rem 1rem;
//     background-color: #f1f5f9;
//     border-radius: 8px;
//   }
// `;

// const CreateBox = styled.form`
//   display: flex;
//   gap: 0.5rem;

//   input {
//     flex: 1;
//     padding: 0.5rem 1rem;
//     border: 1px solid #e5e7eb;
//     border-radius: 0.5rem;
//     font-size: 1rem;
//   }

//   button {
//     padding: 0.5rem 1rem;
//     background-color: #6366f1;
//     color: white;
//     border: none;
//     border-radius: 0.5rem;
//     cursor: pointer;

//     &:hover {
//       background-color: #4f46e5;
//     }
//   }
// `;


import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styled from "styled-components";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { io } from "socket.io-client";

export default function ChannelChat() {
  const { channelId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [members, setMembers] = useState([]);
  const [channelName, setChannelName] = useState("");
  const [channels, setChannels] = useState([]);
  const [newMemberUsername, setNewMemberUsername] = useState("");
  const scrollRef = useRef();
  const socket = useRef();
  // Thêm state mới
  const [users, setUsers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);

  // Thêm function để fetch users
  const fetchUsers = async () => {
    try {
      const currentUser = getCurrentUser();
      const response = await axios.get(`http://localhost:5001/api/auth/allusers/${currentUser._id}`);
      setUsers(response.data);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  // Thêm useEffect để load users
  useEffect(() => {
    fetchUsers();
  }, []);

  const getCurrentUser = () => {
    return JSON.parse(localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY));
  };

  const fetchMessages = async () => {
    try {
      const res = await axios.get(`http://localhost:5001/api/channels/messages/${channelId}`);
      setMessages(res.data.messages);
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await axios.get(`http://localhost:5001/api/channels/${channelId}/members`);
      setMembers(res.data.members);
    } catch (err) {
      console.error("Error fetching members:", err);
    }
  };

  const fetchChannels = async () => {
    try {
      const user = getCurrentUser();
      const res = await axios.get(`http://localhost:5001/api/channels/user/${user._id}`);
      setChannels(res.data.channels);
    } catch (err) {
      console.error("Error fetching channels:", err);
    }
  };

  const handleCreateChannel = async (e) => {
    e.preventDefault();
    const user = getCurrentUser();
    if (!channelName.trim()) return;

    try {
      const res = await axios.post("http://localhost:5001/api/channels/create", {
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

  // const handleAddMember = async () => {
  //   if (!newMemberUsername.trim()) return;
  //   try {
  //     const res = await axios.post("http://localhost:5001/api/channels/addmember", {
  //       channelId,
  //       username: newMemberUsername.trim(),
  //     });
  //     alert("Thêm thành viên thành công!");
  //     setNewMemberUsername("");
  //     fetchMembers();
  //   } catch (err) {
  //     console.error("Lỗi khi thêm thành viên:", err);
  //     alert("Không thể thêm thành viên.");
  //   }
  // };

  const handleAddMember = async () => {
    try {
      for (const userId of selectedMembers) {
        await axios.post("http://localhost:5001/api/channels/addmember", {
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
      await axios.post("http://localhost:5001/api/channels/leave", {
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

  useEffect(() => {
    fetchMessages();
    fetchMembers();
    fetchChannels();
  }, [channelId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    socket.current = io("http://localhost:5001");
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
      socket.current.disconnect();
    };
  }, [channelId, members]);

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
      const res = await axios.post(`http://localhost:5001/api/channels/message`, payload);
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
        <h2>Channel Chat - ID: {channelId}</h2>
        <Messages>
          {messages.map((msg) => (
            <div key={uuidv4()} ref={scrollRef} className="message">
              <b>{msg.sender.username}:</b> {msg.message}
            </div>
          ))}
        </Messages>
        <form className="input-area" onSubmit={handleSendMessage}>
          <input
            type="text"
            placeholder="Nhập tin nhắn..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button type="submit">Gửi</button>
        </form>
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
          {/* <input
            type="text"
            placeholder="Nhập username"
            value={newMemberUsername}
            onChange={(e) => setNewMemberUsername(e.target.value)}
            style={{ width: "100%", padding: "0.5rem", marginBottom: "0.5rem" }}
          /> */}
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
  padding: 1rem;
  border-left: 1px solid #e5e7eb;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
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
  margin-top: 1rem;
  height: 70vh;
  overflow-y: auto;

  .message {
    margin-bottom: 1rem;
    padding: 0.75rem 1rem;
    background-color: #f1f5f9;
    border-radius: 8px;
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
