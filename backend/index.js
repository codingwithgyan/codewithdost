import express from "express";
import { Server } from "socket.io";
import { createServer } from 'node:http';
import dotenv from "dotenv";
import { addUser, removeUser } from "./manager/user.js";

dotenv.config();
let PORT = process.env.PORT;
const app = express();
const server = createServer(app);
const io = new Server(server);

io.on('connection', (socket) => {
    console.log('New user connected');
    addUser("Gyan", socket);
    socket.on("disconnect", () => {
      console.log("user disconnected");
      removeUser(socket.id);
    })
  });


server.listen(PORT, () => {
    try {
        console.log(`Listening on port ${PORT}`)
    }
    catch(error) {
        console.log("error",error);
    }
});
