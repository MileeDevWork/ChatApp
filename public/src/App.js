import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SetAvatar from "./components/SetAvatar";
import Chat from "./pages/Chat";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { io } from "socket.io-client";

export default function App() {
  useEffect(() => {
    const socket = io("http://localhost:3000");

    // Register this peer with the tracker
    socket.on("connect", () => {
      console.log("Connected to tracker");
      socket.emit("register-peer", { id: socket.id });
    });

    // Request the list of active peers when needed
    socket.on("registration-success", () => {
      console.log("Peer registered successfully");
      socket.emit("get-peer-list");
    });

    // Optionally store peerList in state to use in the Chat component
    socket.on("peer-list", (peerList) => {
      console.log("Active peers:", peerList);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/setAvatar" element={<SetAvatar />} />
        <Route path="/" element={<Chat />} />
      </Routes>
    </BrowserRouter>
  );
}
