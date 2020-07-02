const PORT = process.env.PORT || 3000 ;

const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const moment = require('moment');
const { userJoin, getCurrentUser, getUserLeft, getRoomUsers } = require('./utils/users');
const ytdl = require('ytdl-core');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

var req, res;

app.use(express.static(path.join(__dirname, "public")));

app.all('/*', function(rq, rs) {
    req = rq;
    res = rs;
});

io.on('connection', socket => {
    socket.on('joinRoom', params => {
        const user = userJoin(socket.id, params.username, params.room);
        socket.join(user.room);
        socket.emit('chat:message', {system: true, content: `Welcome ${user.username}!`});
        socket.emit('userData', user);
        socket.broadcast.to(user.room).emit('chat:message', {system:true, content: user.username + " joined!"})
        io.to(user.room).emit('roomUsers', getRoomUsers(user.room));
    });

    socket.on('disconnect', ()=>{
        const user = getUserLeft(socket.id);
        if(user){
            io.to(user.room).emit('chat:message', {system:true, content: `${user.username} left!`})
            io.to(user.room).emit('roomUsers', getRoomUsers(user.room));
        }
    })

    socket.on('chat:message', (message)=>{
        const user = getCurrentUser(socket.id);
        message.author = user;
        message.time = moment().format("h:mm a");
        io.to(user.room).emit('chat:message', message);
    })

    socket.on('chat:typing', (state)=>{
        const user = getCurrentUser(socket.id);
        socket.broadcast.to(user.room).emit('chat:typing', `${state?user.username + ' is typing' : ''}`);
    })
    
    socket.on('music:url', (url)=>{
        const user = getCurrentUser(socket.id);
        var videoId = GetParameterValues(url, 'v');
        let message = {
            author: getCurrentUser(socket.id),
            time: moment().format("h:mm a"),
            system: true,
            content: `Playing `
        }
        var urlEmbed = `https://www.youtube.com/embed/${videoId}`;
        ytdl.getBasicInfo(url, function(err, info){
            var songInfo={
                embed: urlEmbed,
                title: info.title
            }
            message.content += `<b>${info?info.title:'sin nombre'}</b>`;
            io.to(user.room).emit('chat:message', message);
            io.to(user.room).emit('music:url',  songInfo);
        }).catch(err=>{
            var songInfo={
                embed: urlEmbed,
                title: 'canción sin nombre'
            }
            message.content += `<b>${'canción sin nombre'}</b>`;
            io.to(user.room).emit('chat:message', message);
            io.to(user.room).emit('music:url',  songInfo);
        })
    })

    socket.on('music:play', (state)=>{
        const user = getCurrentUser(socket.id);
        let message = {
            author: getCurrentUser(socket.id),
            time: moment().format("h:mm a"),
            system: true,
            content: `${user.username} ${state.state? 'started' : 'stopped'} music`
        }
        io.to(user.room).emit('chat:message', message);
        io.to(user.room).emit('music:play', state);
    })
})

server.listen(PORT, ()=>{
    console.log("Server running on port " + PORT);
})


function GetParameterValues(url, param) {  
    url = url.slice(url.indexOf('?') + 1).split('&');  
    for (var i = 0; i < url.length; i++) {  
        var urlparam = url[i].split('=');  
        if (urlparam[0] == param) {  
            return urlparam[1];  
        }  
    }  
} 