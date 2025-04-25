import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SetAvatar from "./components/SetAvatar";
import Chat from "./pages/Chat";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Streaming from "./pages/Streaming";
import Channel from "./pages/Channel";
import ChannelChat from "./pages/ChannelChat";
import io from "socket.io-client";

// const socket = io("http://localhost:5001");
// đổi thành địa chỉ IP của máy chủ
const socket = io(process.env.REACT_APP_SERVER_URL); 

export default function App() {
  useEffect(() => {
    socket.emit("register-peer", { id: socket.id });
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/setAvatar" element={<SetAvatar />} />
        <Route path="/" element={<Chat />} />
        <Route path="/live" element={<Streaming />} />
        <Route path="/channel" element={<Channel />} />
        <Route path="/channel/:channelId" element={<ChannelChat />} />
      </Routes>
    </BrowserRouter>
  );
}
