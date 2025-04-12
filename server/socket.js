let activePeers = [];

const onlineUsers = new Map();

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log(`A user connected: ${socket.id}`);

    // Chat functionality
    socket.on("add-user", (userId) => {
      onlineUsers.set(userId, socket.id);
      console.log("Online users:", Array.from(onlineUsers.entries())); // Optional: log for debugging
    });

    socket.on("send-msg", (data) => {
      const sendUserSocket = onlineUsers.get(data.to);
      if (sendUserSocket) {
        console.log(
          `Sending message from ${socket.id} to ${sendUserSocket} (user: ${data.to})`
        ); // Debug log
        io.to(sendUserSocket).emit("msg-recieve", data.msg);
      } else {
        console.log(`User ${data.to} not found or offline.`); // Debug log
      }
    });

    // Peer management for live streaming
    socket.on("register-peer", (peerInfo) => {
      // Simple check to avoid duplicates if needed
      if (!activePeers.some((p) => p.id === socket.id)) {
        const { ip, port } = peerInfo;
        activePeers.push({ id: socket.id, ip, port });
        console.log(`Peer registered: ${ip}:${port} (ID: ${socket.id})`);
        console.log("Active peers:", activePeers); // Debug log
        socket.emit("registration-success", activePeers); // Send current list back
      }
    });

    socket.on("disconnect", () => {
      console.log(`User/Peer disconnected: ${socket.id}`);
      // Remove user from onlineUsers map
      for (let [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          console.log(`Removed user ${userId} from online list.`);
          break;
        }
      }
      // Filter out the disconnected peer - **THIS REQUIRES activePeers to be 'let'**
      const initialLength = activePeers.length;
      activePeers = activePeers.filter((peer) => peer.id !== socket.id);
      if (activePeers.length < initialLength) {
        console.log(`Peer ${socket.id} removed from active peers.`);
        console.log("Active peers:", activePeers); // Debug log
      }
    });

    socket.on("get-peer-list", () => {
      // Send back all peers except the one asking
      const peerList = activePeers.filter((peer) => peer.id !== socket.id);
      socket.emit("peer-list", peerList);
    });

    // WebRTC signaling for live streaming
    socket.on("offer", (offer) => {
      socket.broadcast.emit("offer", offer); // Broadcast offer to all peers
    });

    socket.on("answer", (answer) => {
      socket.broadcast.emit("answer", answer); // Send answer back to streamer
    });

    socket.on("ice-candidate", (candidate) => {
      socket.broadcast.emit("ice-candidate", candidate); // Share ICE candidates
    });

    // Peer registration with tracker
    socket.on("register-peer", (peerData) => {
      // Store peer info (e.g., in memory or database)
      console.log(`Peer registered: ${socket.id}`);
    });
  });
};
