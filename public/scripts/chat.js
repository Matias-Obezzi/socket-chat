const socket = io();
const muted = [];

var inputMessage;
var sendButton;
var messageContainer = null;
var usersContainer = null;
var musicPlayer = null;
var youtubePlayer = null;
var musicTitle = null;
var playStopButton = null;

var musicState = false;
var started = false;
var lastMessage = {};

var username = null;
var userData = null;
let tempCantChar = Math.floor($(window).width() / 11);
const cantChar = tempCantChar>130?130:tempCantChar;

if(GetParameterValues("username").length<1 || GetParameterValues("username").length>8 || GetParameterValues("room").length==0){
    window.location.replace("/");
}else{
    $("#chat").removeClass("d-none");
    // $('[data-toggle="popover"]').popover();
    main();
}

function main(){
    socket.emit('joinRoom', { username: GetParameterValues('username'),room: GetParameterValues("room") });
    $(document).ready(()=>{
        // $("#room")[0].innerHTML = GetParameterValues("room");
        inputMessage = $("#message")
        sendButton = $("#send");
        userShow = $("#username");
        usersContainer = $("#users-container");
        usersState = $("#users-state");
        messageContainer = $("#message-container");
        musicPlayer = $("#music-player");
        youtubePlayer = $("#youtube-music");
        musicTitle = $("#music-title");
        playStopButton = $("#play-stop-button");

        adaptPadding();

        socket.on('chat:message', message=>{
            if(message.system || muted.indexOf(message.author.id)==-1){ 
                addMessage(message);
                lastMessage = message;
            }else if(muted.indexOf(message.author.id)!=-1 && message.content.indexOf("left")!=-1){
                mute(message.author.id);
            }
        })
        socket.on('chat:typing', userTyping=>{
            usersState[0].innerHTML = `${userTyping}`;
        })
        socket.on('music:url', songInfo=>{
            if(!started){
                musicPlayer.removeClass('d-none');
                started=true;
                adaptPadding();
            }
            musicState = false;
            youtubePlayer[0].src = songInfo.embed;
            musicTitle[0].innerHTML = songInfo.title;
            setMusic();
        })
        socket.on('music:play', songInfo=>{
            if(musicTitle[0].innerHTML==''){
                youtubePlayer[0].src = songInfo.embed;
                musicTitle[0].innerHTML = songInfo.title;
            }
            musicState = !songInfo.state;
            setMusic();
        })
        socket.on('roomUsers', usersTemp=>{
            if(youtubePlayer[0].src){
                let temp = {
                    embed: youtubePlayer[0].src,
                    state: !musicState,
                    title: musicTitle[0].innerHTML
                }
                socket.emit('music:play', temp);
            }
            addUsers(usersTemp);
        })
        socket.on('userData', userDataTemp=>{
            userData = userDataTemp;
            userShow[0].innerHTML = `${userData.username}`;
        })

        sendButton.click(()=>{
            sendMessage();
        })

        let timeout;
        inputMessage.keydown(e=>{
            if(e.code == "NumpadEnter" || e.code=="Enter"){
                socket.emit('chat:typing', false);
                sendMessage();
            }else if((event.keyCode >= 48 && event.keyCode <= 57) || (event.keyCode >= 65 && event.keyCode <= 90) || (event.keyCode >= 97 && event.keyCode <= 122)){
                clearTimeout(timeout);
                socket.emit('chat:typing', true);
                timeout = setTimeout(() => {
                    socket.emit('chat:typing', false);
                },1000)
            }
        })

        playStopButton.click(()=>{
            if(youtubePlayer[0].src.length>0){
                let temp = {
                    embed: youtubePlayer[0].src,
                    state: musicState,
                    title: musicTitle[0].innerHTML
                }
                socket.emit('music:play', temp);
                musicState = !musicState;
                setMusic();
            }
        })
        
    })

}

function playStop(){
    if(musicState){
        youtubePlayer[0].src = removeURLParameter(youtubePlayer[0].src, 'autoplay');
    }else{
        //as noted in addendum, check for querystring exitence
        let symbol = youtubePlayer[0].src.indexOf("?") > -1 ? "&" : "?";
        //modify source to autoplay and start video
        youtubePlayer[0].src += symbol + "autoplay=1";
    }
}

function setMusicButton(){
    playStopButton[0].innerHTML = `${musicState? '<i class="fas fa-play m-2"></i>' : '<i class="fas fa-pause m-2"></i>'}`
}

function setMusic(){
    playStop();
    setMusicButton();
}

function sendMessage(){
    var messageContent = inputMessage[0].value.trim();
    if(inputMessage[0].value.trim().length>0){
        if(messageContent[0]!='!'){
            let message = {
                author: null,
                time: null,
                system: false,
                content: messageContent
            }
            socket.emit('chat:message' , message);
        }else if(messageContent.split(" ").length == 2 && messageContent.split(" ")[1] && messageContent.split(" ")[0]=='!p'){
            let temp = messageContent.split(" ")[1];
            temp = temp.indexOf('?')==-1?`?v=${temp}`:temp
            socket.emit('music:url' , temp);
        }
        inputMessage[0].value = '';
    }
}

function addMessage(temp){
    var message = {
        content: temp.content,
        author: temp.author?temp.author:'',
        time: temp.time,
        system: temp.system
    }
    let newMessage = document.createElement('div');
    newMessage.classList += "mx-0 my-2 px-1 text-center py-0" + (message.system?'':'');
    newMessage.innerHTML = `
        ${message.system || (lastMessage.author && lastMessage.author.id == message.author.id)?'' :
            `<div class="text-left row mx-0">
                <a class="font-weight-bold my-0" role="button" data-toggle="popover" data-placement="bottom" data-trigger="hover" data-content="#${message.author.id}">${message.author.username}&nbsp;</a>
                <p class="small font-italic my-auto text-right ml-auto">${message.time}</p>
            </div>`
        }
        <div class="message ${message.system?'text.center small':'text-left border-left border-light pl-2'} col px-0 container ml-auto">
            ${message.content.indexOf(" ")==-1?adaptText(message.content):message.content}
        </div>`
        // ${message.system?message.content:adaptText(message.content)}
    messageContainer.append(newMessage);
    // messageContainer.prepend(newMessage);
    $('[data-toggle="popover"]').popover(); 
    window.scrollTo(0, document.getElementById("message-container").scrollHeight);
}

function adaptText(text){
    var cant = Math.floor(text.length/cantChar);
    var temp = '';
    for(var i = 0; i<cant; i++){
        var init = cantChar*(i);
        var end = cantChar*(i+1);
        temp += text.slice(init, end) + "-<br />";
    }
    temp += text.slice(cantChar*(cant), text.length);
    return temp;
}

function addUsers(users){
    usersContainer.empty();
    users.forEach(user => {
        usersContainer.append(`<li class="mb-1 p-2 text-left">${user.id!==userData.id?`<button id="${user.id}" onclick="mute('${user.id}')" class="btn px-0 text-light">${muted.indexOf(user.id)==-1?'<i class="fas fa-comment"></i>':'<i class="fas fa-comment-slash"></i>'}</button>`:'<div class="text-light align-middle d-inline-block"><i class="fas fa-user-alt"></i></div>'}<p class="d-inline-block my-auto align-middle text-right ml-2 my-auto">${adaptText(user.username)}</p> <p class="my-0 align-bottom text-italic font-weight-normal d-inline-block">#endregion${user.id}</p></li>`);
    })
}

function mute(id){
    if(muted.indexOf(id)==-1){
        muted.push(id);
        $(`#${id}`).html('<i class="fas fa-comment-slash"></i>');
    }else{
        muted.splice(muted.indexOf(id),1);
        $(`#${id}`).html('<i class="fas fa-comment"></i>');
    }
    console.log(muted)
}  

function GetParameterValues(param) {  
    var url = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');  
    for (var i = 0; i < url.length; i++) {  
        var urlparam = url[i].split('=');  
        if (urlparam[0] == param) {  
            return urlparam[1];  
        }  
    }  
} 

function removeURLParameter(url, parameter) {
    //prefer to use l.search if you have a location/link object
    var urlparts = url.split('?');   
    if (urlparts.length >= 2) {

        var prefix = encodeURIComponent(parameter) + '=';
        var pars = urlparts[1].split(/[&;]/g);

        //reverse iteration as may be destructive
        for (var i = pars.length; i-- > 0;) {    
            //idiom for string.startsWith
            if (pars[i].lastIndexOf(prefix, 0) !== -1) {  
                pars.splice(i, 1);
            }
        }

        return urlparts[0] + (pars.length > 0 ? '?' + pars.join('&') : '');
    }
    return url;
}

function adaptPadding(){
    // messageContainer.height($(window).height() - $("#header").height() - $("#input-menu").height());
    messageContainer.css("padding-top",$("#header").height());
    messageContainer.css("padding-bottom",$("#input-menu").height());
}