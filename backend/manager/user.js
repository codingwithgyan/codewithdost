import { Socket } from "socket.io";
import { createRoom, onAnswer, onIceCandidates, onOffer } from "./room.js";

let userList = [];
let queue = [];

const handshake = (socket) => {
    socket.on("offer", ({sdp, roomId}) => {
        onOffer(roomId, sdp, socket.id);
    })

    socket.on("answer",({sdp, roomId}) => {
        onAnswer(roomId, sdp, socket.id);
    })

    socket.on("add-ice-candidate", ({candidate, roomId, type}) => {
        onIceCandidates(roomId, socket.id, candidate, type);
    });
}

const addUser = (user, socket) => {
    userList.push({user,socket});
    queue.push(socket.id);
    socket.emit("lobby");
    clearQueue()
    handshake(socket);
}

const removeUser = () => {
    const user = userList.find(user => user.socket.id === socketId); 
    userList = userList.filter(user => user.socket.id !== socketId);
    queue = queue.filter(user => user === socketId);
}

const clearQueue = () => {
    if (queue.length < 2) {
        return;
    }

    const id1 = queue.pop();
    const id2 = queue.pop();

    const user1 = userList.find(user => user.socket.id === id1);
    const user2 = userList.find(user => user.socket.id === id2);

    if (!user1 || !user2) {
        return;
    }

    console.log("creating room");

    const room = createRoom(user1, user2);
    clearQueue();
}

export {
    addUser,
    removeUser,
}