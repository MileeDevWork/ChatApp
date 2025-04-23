// import React, { useEffect, useState, useRef } from "react";
// import axios from "axios";
// import { useNavigate } from "react-router-dom";
// import { io } from "socket.io-client";
// import styled from "styled-components";
// import { allUsersRoute, host } from "../utils/APIRoutes";
// import ChatContainer from "../components/ChatContainer";
// import Contacts from "../components/Contacts";
// import Welcome from "../components/Welcome";

// export default function Chat() {
//   const navigate = useNavigate();
//   const socket = useRef();
//   const [contacts, setContacts] = useState([]);
//   const [currentChat, setCurrentChat] = useState(undefined);
//   const [currentUser, setCurrentUser] = useState(undefined);

//   useEffect(async () => {
//     if (!localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)) {
//       navigate("/login");
//     } else {
//       setCurrentUser(
//         await JSON.parse(
//           localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)
//         )
//       );
//     }
//   }, []);
//   useEffect(() => {
//     if (currentUser) {
//       socket.current = io(host);
//       socket.current.emit("add-user", currentUser._id);
//     }
//   }, [currentUser]);

//   useEffect(async () => {
//     if (currentUser) {
//       if (currentUser.isAvatarImageSet) {
//         const data = await axios.get(`${allUsersRoute}/${currentUser._id}`);
//         setContacts(data.data);
//       } else {
//         navigate("/setAvatar");
//       }
//     }
//   }, [currentUser]);

//   const handleChatChange = (chat) => {
//     setCurrentChat(chat);
//   };
  
//   const goToLiveStreaming = () => {
//     navigate("/live");
//   };
//   const goToChannel = () => {
//     navigate("/channel");
//   };
//   return (
//     <>
//       <Container>
//         <h2>Chat Room</h2>
//         <LiveButton onClick={goToLiveStreaming}>Live Streaming</LiveButton>
//         <ChannelButton onClick={goToChannel}>Channel</ChannelButton>
//         <div className="container">
//           <Contacts contacts={contacts} changeChat={handleChatChange} />
//           {currentChat === undefined ? (
//             <Welcome />
//           ) : (
//             <ChatContainer currentChat={currentChat} socket={socket} />
//           )}
//         </div>
//       </Container>
//     </>
//   );
// }

// const Container = styled.div`
//   height: 100vh;
//   width: 100vw;
//   display: flex;
//   flex-direction: column;
//   justify-content: center;
//   align-items: center;
//   background-color: #f2f4f8;

//   .container {
//     height: 85vh;
//     width: 85vw;
//     background-color: #ffffff;
//     display: grid;
//     grid-template-columns: 25% 75%;
//     border-radius: 1rem;
//     box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
//     overflow: hidden;

//     @media screen and (min-width: 720px) and (max-width: 1080px) {
//       grid-template-columns: 35% 65%;
//     }
//   }
// `;

// const LiveButton = styled.button`
//   background-color: #ff5e57;
//   color: #fff;
//   border: none;
//   padding: 0.6rem 1rem;
//   border-radius: 0.5rem;
//   cursor: pointer;
//   &:hover {
//     background-color: #ff4a43;
//   }
// `;

// const ChannelButton = styled.button`
//   background-color: #4CAF50;
//   color: #fff;
//   border: none;
//   padding: 0.5rem 1rem;
//   border-radius: 0.5rem;
//   cursor: pointer;
//   &:hover {
//     background-color: #4CAF50;
//   }
// `;


import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import styled from "styled-components";
import { allUsersRoute, host } from "../utils/APIRoutes";
import ChatContainer from "../components/ChatContainer";
import Contacts from "../components/Contacts";
import Welcome from "../components/Welcome";

export default function Chat() {
  const navigate = useNavigate();
  const socket = useRef();
  const [contacts, setContacts] = useState([]);
  const [currentChat, setCurrentChat] = useState(undefined);
  const [currentUser, setCurrentUser] = useState(undefined); // Thêm state currentUser
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  useEffect(() => {
    const checkUser = async () => {
      const userData = localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY);
      if (!userData) {
        navigate("/login");
      } else {
        const parsedUser = JSON.parse(userData);
        console.log("Current user:", parsedUser);
        setCurrentUser(parsedUser);
      }
    };
    checkUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      if (!socket.current) {
        socket.current = io(host);
        
        // Emit add-user event
        socket.current.emit("add-user", currentUser._id);

        // Listen for status updates
        socket.current.on("user-status-update", ({ userId, status }) => {
          console.log("Status update received:", userId, status); // Debug log
          setOnlineUsers(prev => {
            const newSet = new Set(prev);
            if (status === 'online') {
              newSet.add(userId);
            } else {
              newSet.delete(userId);
            }
            console.log("Updated online users:", Array.from(newSet)); // Debug log
            return newSet;
          });
        });

        // Listen for initial online users
        socket.current.on("initial-online-users", (users) => {
          console.log("Initial online users received:", users); // Debug log
          setOnlineUsers(new Set(users));
        });
      }
    }

    return () => {
      if (socket.current) {
        socket.current.disconnect();
        socket.current = null;
      }
    };
  }, [currentUser]);

  useEffect(() => {
    const fetchContacts = async () => {
      if (currentUser) {
        if (currentUser.isAvatarImageSet) {
          try {
            const { data } = await axios.get(`${allUsersRoute}/${currentUser._id}`);
            console.log("Contacts fetched from API:", data); // Debug
            setContacts(Array.isArray(data) ? data : []);
          } catch (error) {
            console.error("Lỗi khi lấy danh sách liên hệ:", error);
            setContacts([]);
          }
        } else {
          navigate("/setAvatar");
        }
      }
    };
    fetchContacts();
  }, [currentUser]);

  const handleChatChange = (chat) => {
    setCurrentChat(chat);
  };

  const goToLiveStreaming = () => {
    navigate("/live");
  };

  const goToChannel = () => {
    navigate("/channel");
  };

  return (
    <>
    <Container>
      <h2>Chat Room</h2>
      <LiveButton onClick={goToLiveStreaming}>Live Streaming</LiveButton>
      <ChannelButton onClick={goToChannel}>Channel</ChannelButton>
      <div className="container">
        <Contacts 
          contacts={contacts} 
          changeChat={handleChatChange}
          onlineUsers={onlineUsers}
        />
        {currentChat === undefined ? (
          <Welcome />
        ) : (
          <ChatContainer currentChat={currentChat} socket={socket} />
        )}
      </div>
    </Container>
    </>
  );
}

const Container = styled.div`
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: #f2f4f8;

  .container {
    height: 85vh;
    width: 85vw;
    background-color: #ffffff;
    display: grid;
    grid-template-columns: 25% 75%;
    border-radius: 1rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    overflow: hidden;

    @media screen and (min-width: 720px) and (max-width: 1080px) {
      grid-template-columns: 35% 65%;
    }
  }
`;

const LiveButton = styled.button`
  background-color: #ff5e57;
  color: #fff;
  border: none;
  padding: 0.6rem 1rem;
  border-radius: 0.5rem;
  cursor: pointer;
  &:hover {
    background-color: #ff4a43;
  }
`;

const ChannelButton = styled.button`
  background-color: #4CAF50;
  color: #fff;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  cursor: pointer;
  &:hover {
    background-color: #4CAF50;
  }
`;