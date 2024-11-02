const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

let rooms = {};

io.on('connection', (socket) => {
    console.log('New user connected');
    socket.emit('roomList', rooms);

    socket.on('createRoom', (roomName) => {
        if (!rooms[roomName]) {
            rooms[roomName] = { users: [] };
            io.emit('roomList', rooms);
        }
    });

    socket.on('joinRoom', (roomName, username) => {
        if (rooms[roomName]) {
            rooms[roomName].users.push(username);
            socket.username = username;
            socket.roomName = roomName;
            socket.join(roomName);
            io.to(roomName).emit('userList', rooms[roomName].users);
        }
    });

    socket.on('sendMessage', (roomName, message, username) => {
        io.to(roomName).emit('newMessage', `${username}: ${message}`);
    });

    socket.on('leaveRoom', (roomName, username) => {
        if (rooms[roomName]) {
            rooms[roomName].users = rooms[roomName].users.filter(user => user !== username);
            socket.leave(roomName);
            if (rooms[roomName].users.length === 0) {
                delete rooms[roomName];
            }
            io.emit('roomList', rooms);
            io.to(roomName).emit('userList', rooms[roomName]?.users || []);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
        if (socket.roomName && rooms[socket.roomName]) {
            rooms[socket.roomName].users = rooms[socket.roomName].users.filter(user => user !== socket.username);
            if (rooms[socket.roomName].users.length === 0) {
                delete rooms[socket.roomName];
            }
            io.emit('roomList', rooms);
            if (socket.roomName) {
                io.to(socket.roomName).emit('userList', rooms[socket.roomName]?.users || []);
            }
        }
    });
});

server.listen(3000, () => {
    console.log('Server is running on port 3000');
});
