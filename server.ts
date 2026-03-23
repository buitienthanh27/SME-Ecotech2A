import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const PORT = 3000;

  // Presence tracking
  const projectUsers = new Map<string, Set<string>>(); // projectId -> Set of userIds
  const socketToUser = new Map<string, { userId: string; projectId: string }>();

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join-project", ({ projectId, userId, userName }) => {
      socket.join(projectId);
      
      if (!projectUsers.has(projectId)) {
        projectUsers.set(projectId, new Set());
      }
      projectUsers.get(projectId)?.add(userId);
      socketToUser.set(socket.id, { userId, projectId });

      // Broadcast presence update
      io.to(projectId).emit("presence-updated", Array.from(projectUsers.get(projectId) || []));
      
      console.log(`${userName} joined project ${projectId}`);
    });

    // Generic event relay
    socket.on("emit-event", ({ event, data, projectId }) => {
      // Relay to others in the same project
      socket.to(projectId).emit(event, data);
    });

    socket.on("typing", ({ projectId, userId, userName, isTyping }) => {
      socket.to(projectId).emit("user-typing", { userId, userName, isTyping });
    });

    socket.on("disconnect", () => {
      const userInfo = socketToUser.get(socket.id);
      if (userInfo) {
        const { userId, projectId } = userInfo;
        projectUsers.get(projectId)?.delete(userId);
        io.to(projectId).emit("presence-updated", Array.from(projectUsers.get(projectId) || []));
        socketToUser.delete(socket.id);
      }
      console.log("User disconnected:", socket.id);
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
