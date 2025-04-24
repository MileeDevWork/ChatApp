const fs = require("fs");
const logFile = "connections.log";
const Stream = require("./models/streamModel");
const Comment = require("./models/commentModel");
const User = require("./models/userModel"); 

let activePeers = [];
const onlineUsers = new Map();
global.onlineUsers = onlineUsers;
const activeStreamers = new Map();
const pendingStreams = new Set();

// Enhanced logging function for connection events with only ip, port, socketId
function logConnection(event, socket) {
  try {
    const timestamp = new Date().toISOString();
    
    // Get the best available client IP
    const ip = getClientIp(socket);
    
    // Get the port from socket (try multiple sources)
    const port = socket.conn?.remotePort || 
                 socket.request?.connection?.remotePort || 
                 socket.request?.socket?.remotePort || 
                 socket.handshake.address?.port || 
                 'no-port';
    
    // Only log ip, port, and socketId
    const detailsStr = `ip=${ip}, port=${port}, socketId=${socket.id}`;
    
    const logMessage = `[${timestamp}] - ${event} (${detailsStr})\n`;
    fs.appendFileSync(logFile, logMessage);

    // Optional: Temporary debug log to inspect socket properties (comment out after use)
    /*
    fs.appendFileSync('debug.log', `[${timestamp}] - Debug: conn.remotePort=${socket.conn?.remotePort}, ` +
      `request.connection.remotePort=${socket.request?.connection?.remotePort}, ` +
      `request.socket.remotePort=${socket.request?.socket?.remotePort}, ` +
      `handshake.address=${JSON.stringify(socket.handshake.address)}\n`);
    */
  } catch (err) {
    // Silent fail if logging fails
  }
}

// Function to get the best available client IP
function getClientIp(socket) {
  const forwardedFor = socket.handshake.headers['x-forwarded-for'];
  const realIp = socket.handshake.headers['x-real-ip'];
  const address = socket.handshake.address?.address || socket.handshake.address;
  
  // Prioritize 127.0.0.1 for localhost over ::1
  if (address === '::1' || address === '::ffff:127.0.0.1') {
    return '127.0.0.1';
  }
  return forwardedFor || realIp || address || 'unknown';
}

module.exports = (io) => {
  io.on("connection", (socket) => {
    // Log connection
    logConnection("Peer connected", socket);

    // Xử lý online status
    socket.on("add-user", async (userId) => {
      try {
        onlineUsers.set(userId, socket.id);
        
        await User.findByIdAndUpdate(userId, {
          status: 'online',
          lastSeen: new Date()
        });

        // Broadcast to all clients
        io.emit("user-status-update", {
          userId: userId,
          status: 'online'
        });

        // Send current online users list
        socket.emit("initial-online-users", Array.from(onlineUsers.keys()));
        
        logConnection("User online status updated", socket);
      } catch (err) {
        logConnection("Error updating user status", socket);
      }
    });

    // Xử lý disconnect
    socket.on("disconnect", async () => {
      try {
        for (let [userId, socketId] of onlineUsers.entries()) {
          if (socketId === socket.id) {
            onlineUsers.delete(userId);
            
            await User.findByIdAndUpdate(userId, {
              status: 'offline',
              lastSeen: new Date()
            });

            io.emit("user-status-update", {
              userId: userId,
              status: 'offline'
            });
            
            logConnection("User offline status updated", socket);
            break;
          }
        }
      } catch (err) {
        logConnection("Error handling disconnect", socket);
      }
    });

    socket.on("add-user", (userId) => {
      onlineUsers.set(userId, socket.id);
    });

    socket.on("send-msg", (data) => {
      const sendUserSocket = onlineUsers.get(data.to);
      if (sendUserSocket) {
        io.to(sendUserSocket).emit("msg-recieve", {
          text: data.msg?.text,
          fileUrl: data.msg?.fileUrl,
          fileName: data.msg?.fileName,
          fileType: data.msg?.fileType,
        });
      }
    });

    socket.on("register-peer", (peerInfo) => {
      if (!activePeers.some((p) => p.id === socket.id)) {
        const { ip, port } = peerInfo;
        activePeers.push({ id: socket.id, ip, port });
        socket.emit("registration-success", activePeers);
        
        logConnection("Peer registered", socket);
      }
    });

    socket.on("register-visitor", ({ nickname }) => {
      socket.username = nickname || `Visitor_${socket.id}`;
      socket.userId = null;
      socket.isVisitor = true;
      
      logConnection("Visitor registered", socket);
    });

    socket.on("get-peer-list", () => {
      const peerList = activePeers.filter((peer) => peer.id !== socket.id);
      socket.emit("peer-list", peerList);
    });

    socket.on("start-stream", async (data) => {
      const { channelId, username } = data;
      if (!username || username === "Guest") {
        socket.emit("error", { message: "Authentication required to start streaming" });
        
        logConnection("Stream start failed - auth required", socket);
        return;
      }
      socket.username = username;
      socket.isVisitor = false;
      pendingStreams.add(socket.id);
      const streamer = { id: socket.id, username, channelId: channelId || "default" };
      activeStreamers.set(socket.id, streamer);
      io.emit("streamers-update", Array.from(activeStreamers.values()));
      
      try {
        const newStream = new Stream({
          streamerId: socket.id,
          startTime: new Date(),
          channelId: channelId || "default",
        });
        await newStream.save();
        
        logConnection("Stream started", socket);
      } catch (error) {
        logConnection("Failed to save stream", socket);
      } finally {
        pendingStreams.delete(socket.id);
      }
    });

    socket.on("stop-stream", async () => {
      if (activeStreamers.has(socket.id)) {
        const streamer = activeStreamers.get(socket.id);
        activeStreamers.delete(socket.id);
        
        logConnection("Stream stopped", socket);
      } else {
        logConnection("Stream stop requested but not found", socket);
      }
      
      io.emit("streamers-update", Array.from(activeStreamers.values()));
    });

    socket.emit("streamers-update", Array.from(activeStreamers.values()));

    socket.on("get-streamers", () => {
      socket.emit("streamers-update", Array.from(activeStreamers.values()));
    });

    socket.on("request-offer", ({ streamerId }) => {
      const streamer = activeStreamers.get(streamerId);
      if (streamer) {
        socket.join(`stream_${streamerId}`);
        io.to(streamerId).emit("request-offer", { from: socket.id });
        
        logConnection("Viewer requested offer", socket);
      } else {
        socket.emit("error", { message: "Streamer not found" });
        
        logConnection("Offer request failed - streamer not found", socket);
      }
    });

    socket.on("offer", ({ offer, to }) => {
      io.to(to).emit("offer", { offer, from: socket.id });
      
      logConnection("WebRTC offer sent", socket);
    });

    socket.on("answer", ({ answer, to }) => {
      io.to(to).emit("answer", { answer, from: socket.id });
      
      logConnection("WebRTC answer sent", socket);
    });

    socket.on("send-comment", async ({ comment, streamerId, username }) => {
      if (!username || username === "Guest") {
        socket.emit("error", { message: "Authentication required to comment" });
        
        logConnection("Comment blocked - auth required", socket);
        return;
      }
      
      socket.username = username;
      socket.isVisitor = false;
      const from = socket.id;
      const newComment = new Comment({
        streamerId,
        channelId: "main",
        username,
        comment,
      });
      
      await newComment.save();
      io.to(`stream_${streamerId}`).emit("receive-comment", {
        comment,
        from,
        username,
      });
      socket.emit("receive-comment", {
        comment,
        from,
        username,
      });
      
      logConnection("Comment received", socket);
    });

    socket.on("get-comments", async ({ streamerId }) => {
      const comments = await Comment.find({ streamerId })
        .sort({ timestamp: -1 })
        .limit(50);
      socket.emit("comments-history", comments);
    });

    socket.on("ice-candidate", ({ candidate, to }) => {
      io.to(to).emit("ice-candidate", { candidate, from: socket.id });
      
      logConnection("ICE candidate exchanged", socket);
    });

    socket.on("get-stream-history", async () => {
      const streams = await Stream.find({}).sort({ startTime: -1 }).limit(10);
      socket.emit("stream-history", streams);
    });

    socket.on("disconnect", async () => {
      logConnection("Peer disconnected", socket);

      for (let [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
        }
      }

      activePeers = activePeers.filter((peer) => peer.id !== socket.id);
      if (!pendingStreams.has(socket.id) && activeStreamers.has(socket.id)) {
        activeStreamers.delete(socket.id);
      }
      
      io.emit("streamers-update", Array.from(activeStreamers.values()));
    });
  });

  io.on("connection", (socket) => {
    socket.on("join-channel", (channelId) => {
      socket.join(channelId);
      
      logConnection("User joined channel", socket);
    });

    socket.on("send-channel-message", (data) => {
      const { channelId, senderId, message } = data;
      socket.to(channelId).emit("channel-message", {
        senderId,
        message,
      });
      
      logConnection("Channel message sent", socket);
    });
  });
};
