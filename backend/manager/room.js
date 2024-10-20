const rooms = new Map();
let GLOBAL_ROOM_ID = 1;

const generateRoomId = () => {
    return GLOBAL_ROOM_ID++;
}

const createRoom = (user1, user2) => {
    const roomId = generateRoomId().toString();
    rooms.set(roomId, {
        user1, 
        user2,
    })

    user1.socket.emit("send-offer", {
        roomId
    })

    user2.socket.emit("send-offer", {
        roomId
    })
}

const onOffer = (roomId, sdp, senderSocketid) => {
    const room = rooms.get(roomId);
    if (!room) {
        return;
    }
    const receivingUser = room.user1.socket.id === senderSocketid ? room.user2: room.user1;
    receivingUser?.socket.emit("offer", {
        sdp,
        roomId
    })
}

const onAnswer = (roomId, sdp, senderSocketid) => {
    const room = rooms.get(roomId);
    if (!room) {
        return;
    }
    const receivingUser = room.user1.socket.id === senderSocketid ? room.user2: room.user1;

    receivingUser?.socket.emit("answer", {
        sdp,
        roomId
    });
}

const onIceCandidates = (roomId, senderSocketid, candidate, type) => {
    const room = rooms.get(roomId);
    if (!room) {
        return;
    }
    const receivingUser = room.user1.socket.id === senderSocketid ? room.user2: room.user1;
    receivingUser.socket.emit("add-ice-candidate", ({candidate, type}));
}

export {
    createRoom,
    onOffer,
    onAnswer,
    onIceCandidates
}