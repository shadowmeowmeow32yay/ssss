const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const formatMessage = require("./utils/messages");
const {
    userJoin,
    getCurrentUser,
    userLeave,
    getRoomUsers,
} = require("./utils/users");
// !Note here app.js is server and main.js is client 

const app = express();
const server = http.createServer(app);
// setting up server

const io = socketio(server);
// ! since route are not set for button we got a query on top  
// this will look for an index.html file

app.use(express.static(path.join(__dirname, "public")));
const botName = "Chat Bot idrk ok?";
// when new user join or client connects

io.on("connection", (socket) => {
    console.log(io.of("/").adapter);
    socket.on("joinRoom", ({ username, room }) => {
        const user = userJoin(socket.id, username, room);
        // ! catching room and user from client

        socket.join(user.room);
        // !socket.join is used to join different user to single room  
        // this will emit for every one excepts user join

        socket.emit("message", formatMessage(botName, "Welcome to (name in development)!"));
        // this will show for single client
        // to broadcast for a specific roomwe use to()
        socket.broadcast
            .to(user.room)
            .emit(
                "message",
                formatMessage(botName, `${user.username} has joined the chat. To everyone if you leave your gay.`)
            );
        io.to(user.room).emit("roomUsers", {
            room: user.room,
            users: getRoomUsers(user.room),
        });
    });
    // !catching mssg send by client

    socket.on("chatMessage", (msg) => {
        const user = getCurrentUser(socket.id);
        // sending back msg from server to client

        io.to(user.room).emit("message", formatMessage(user.username, msg));
    });
    // Runs when client disconnect

    socket.on("disconnect", () => {
        const user = userLeave(socket.id);
        //! to every one     

        if (user) {
            io.to(user.room).emit(
                "message",
                formatMessage(botName, `${user.username} has left the chat. ${user.username} has no life, likes furries, and is gay.`)
            );
            io.to(user.room).emit("roomUsers", {
                room: user.room,
                users: getRoomUsers(user.room),
            });
        }
    });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));