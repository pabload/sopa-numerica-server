const express = require('express');
const socketio = require('socket.io');
const cors = require('cors');
const http = require('http');
const { addUser, removeUser, getUser, getUsersInRoom, addMatch, removeMatch, getMatch, users, matches } = require('./gameinfo.js');

const PORT = process.env.PORT || 5000;

const router = require('./router');
const { use } = require('./router');

      

const app = express();
const server = http.createServer(app);
const io = socketio(server);



//middleware
app.use(cors());
app.use(router);

//sockethandling
io.set('origins', '*:*');
io.on('connection', (Socket) => {
   console.log("new connection");

   Socket.on('createroom', ({ room, name, operation, limit }, callback) => {
      const { errorUser, user } = addUser({ id: Socket.id, name, room, rol: "admin", points: 0 });
      const { errorMatch, match } = addMatch({ room, operation, limit });
      if (errorUser) return callback(errorUser);
      if (errorMatch) return callback(errorMatch);
      console.log("match created: " + JSON.stringify(match));
      console.log("new admin: " + JSON.stringify(user));
      Socket.join(room);
   });
   Socket.on('adduser', ({ room, name }, callback) => {
      const { error, user } = addUser({ id: Socket.id, name, room, rol: "player", points: 0 });
      if (error) {
         console.log("error: " + error);
         return callback(error);
      }
      if (user) {
         Socket.join(user.room);
         io.in(room).emit("getusers", { users: getUsersInRoom(room) });
         console.log("New user on room: " + room + " " + JSON.stringify(user));
         return callback(user);
      }

   });

   Socket.on("removeuser", ({ }, callback) => {
      const user = getUser(Socket.id);
      if (user != null) {
         const adminleft = user.rol == "admin" ? true : false;
         if(user.rol=="admin"){
            removeMatch(user.room);
         }
         Socket.leave(user.room);
         removeUser(Socket.id);
         io.in(user.room).emit("getusers", { users: getUsersInRoom(user.room), adminleft: adminleft });
      }
   });
   Socket.on("getuser", ({ }, callback) => {
      const user = getUser(Socket.id);
      callback(user);
   });
   Socket.on("getusersroom", ({ }, callback) => {
      const user = getUser(Socket.id);
      if(user==null){
         return  callback(null);
      }
      const users = getUsersInRoom(user.room);
      callback(users);
   });
   Socket.on("getroom", ({ id }, callback) => {
      if (io.sockets.adapter.rooms[id] !== undefined) {
         if (callback) {
            callback({ res: true })
         }
         return;
      } else {
         if (callback) {
            callback({ res: false })
         }
      }  
   });
   Socket.on("getmatch", ({ }, callback) => {
      const user = getUser(Socket.id);
      if(user==null){
         return  callback(null);
      }
      const match = getMatch(user.room)
      callback(match);
   });

   Socket.on('startgame', ({ }, callback) => {
      const user = getUser(Socket.id);
      io.in(user.room).emit("gotogame", {});
   });

   Socket.on('getinfogame', ({ }, callback) => {
      const user = getUser(Socket.id);
      if(user==null){
         return callback({user:null,users:null,match:null});
      }
      const users = getUsersInRoom(user.room);
      const match = getMatch(user.room);
      match.start= true;
      callback({ user, users,match })
   });

   Socket.on('correctanswer', ({}, callback) => {
      const user = getUser(Socket.id);
      const match = getMatch(user.room);
      var num1 = match.numbers[Math.floor(Math.random() * match.numbers.length)];
      var num2 = match.numbers[Math.floor(Math.random() * match.numbers.length)];
      var operators = {
         'suma': function (a, b) { return a + b },
         'resta': function (a, b) { return a < b ? b - a : a - b },
         'multi': function (a, b) { return a * b }
      }
      match.res=operators[match.operation](num1, num2);
      user.points=user.points+1;
      io.in(user.room).emit("changeres", {res:match.res, users:getUsersInRoom(user.room)});
   });
   Socket.on('getgameresults', ({}, callback) => {
      const user=getUser(Socket.id);
      if(user==null){
        return  callback(null);
      }
      const users=getUsersInRoom(user.room);
      const finalusers=users.sort((a, b) => parseInt(b.points) - parseInt(a.points));
      callback(finalusers);
   });
   Socket.on('endgame', ({}, callback) => {
      const user = getUser(Socket.id);
      removeUser(Socket.id);
      removeMatch(user.room);
      io.of('/').in(user.room).clients((error, socketIds) => {
         if (error) throw error;
         socketIds.forEach(socketId => io.sockets.sockets[socketId].leave(user.room));
      });
   });
   Socket.on('disconnect', () => {
      console.log("user left");
      const user = getUser(Socket.id);
      if (user != null) {
         const adminleft = user.rol == "admin" ? true : false;
         if(user.rol=="admin"){
            removeMatch(user.room);
         }
         Socket.leave(user.room,()=>{"user:"+user.name+" left room"});
         removeUser(Socket.id);
         io.in(user.room).emit("getusers", { users: getUsersInRoom(user.room), adminleft: adminleft });
      }
   });
});


server.listen(PORT, () => console.log(`server works at  port: ${PORT}`));

