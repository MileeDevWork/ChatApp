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
  const [currentUser, setCurrentUser] = useState(undefined);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [activeStreams, setActiveStreams] = useState([]);
  const [notifications, setNotifications] = useState([]);

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
          console.log("Status update received:", userId, status);
          setOnlineUsers(prev => {
            const newSet = new Set(prev);
            if (status === 'online') {
              newSet.add(userId);
            } else {
              newSet.delete(userId);
            }
            console.log("Updated online users:", Array.from(newSet));
            return newSet;
          });
        });

        // Listen for initial online users
        socket.current.on("initial-online-users", (users) => {
          console.log("Initial online users received:", users);
          setOnlineUsers(new Set(users));
        });

        // Listen for new stream notifications
        socket.current.on("new-stream-notification", (streamData) => {
          console.log("New stream notification received:", streamData);
          // Add to active streams
          setActiveStreams(prev => [...prev, streamData]);
          // Show notification (avoid notifying the streamer themselves)
          if (streamData.username !== currentUser.username) {
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
          }
        });

        // Listen for streamers-update to keep activeStreams in sync
        socket.current.on("streamers-update", (streamers) => {
          console.log("Streamers update received:", streamers);
          setActiveStreams(streamers);
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
            console.log("Contacts fetched from API:", data);
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

  const joinStream = (streamerId) => {
    navigate(`/live?streamerId=${streamerId}`);
  };

  const dismissNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  return (
    <Container>
      <h2>Chat Room</h2>
      <LiveButton onClick={goToLiveStreaming}>Live Streaming</LiveButton>
      <ChannelButton onClick={goToChannel}>Channel</ChannelButton>
      <StreamList>
        {activeStreams.length > 0 ? (
          activeStreams.map(stream => (
            <StreamItem
              key={stream.streamId}
              onClick={() => joinStream(stream.streamerId)}
            >
              {stream.username} is live on {stream.channelId}
            </StreamItem>
          ))
        ) : (
          <NoStreams>No live streams available</NoStreams>
        )}
      </StreamList>
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

const StreamList = styled.ul`
  width: 85vw;
  max-height: 100px;
  overflow-y: auto;
  margin: 10px 0;
  padding: 0;
  list-style: none;
`;

const StreamItem = styled.li`
  padding: 8px;
  background-color: #e8ecef;
  margin: 5px 0;
  border-radius: 5px;
  cursor: pointer;
  &:hover {
    background-color: #d8dfe6;
  }
`;

const NoStreams = styled.p`
  color: #666;
  text-align: center;
  padding: 8px;
`;

const NotificationContainer = styled.div`
  position: fixed;
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
