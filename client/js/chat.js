let inChat = false;
let chatMessages = [];
const chat = document.getElementById("chat");
const chatInput = document.getElementById("chatInput");
chatInput.addEventListener("focus", function() {
    inChat = true;
    for (let i in clientPlayer.controls) {
        if (typeof clientPlayer.controls[i] == "boolean") {
            clientPlayer.controls[i] = false;
        }
    }
});
chatInput.addEventListener("blur", function() {
    inChat = false;
});
chatInput.addEventListener("keydown", function(event) {
    if (event.key == "Enter") {
        if (chatInput.value.length > 0) {
            socket.emit("chat", chatInput.value);
            chatInput.value = "";
        }
    }
});
let insertChat = function(text, color) {
    switch (color) {
        case "text":
            color = "color: #000000;";
            break;
        case "server":
            color = "color: #ffdd00;";
            break;
        case "death":
            color = "color: #ff0000;";
            break;
        case "taunt":
            color = "color: #00ddff;";
            break;
        case "login":
            color = "color: #ffff00;";
            break;
        case "info":
            color = "color: #0033ff;";
            break;
        case "error":
            color = "color: #ff9900; font-weight: bold;";
            break;
        case "anticheat":
            color = "color: #ff0000; font-weight: bold;";
            break;
        case "fun":
            color = "animation: fun 2s linear infinite;";
            break;
    }
    let date = new Date();
    let minute = date.getMinutes().toString();
    if (minute.length == 1){
        minute = "0" + minute;
    }
    const message = document.createElement("div");
    message.className = "chatText";
    message.innerHTML = "[" + date.getHours() + ":" + minute + "] <span style=\"" + color + "\">" + text + "</span>";
    let scroll = false;
    if (chat.scrollTop + chat.clientHeight >= chat.scrollHeight - 5) {
        scroll = true;
    }
    chat.appendChild(message);
    if (scroll) {
        chat.scrollTop = chat.scrollHeight;
    }
    chatMessages.unshift(message);
    if (chatMessages.length >= 100) {
        chatMessages.pop().remove();
    }
};

socket.on("chat", function(data) {
    if (selfPlayer == null) {
        return;
    }
    insertChat(data.text, data.color);
});

let inDebug = false;
let debugMessages = [];
let debugHistory = [];
let debugHistoryIndex = 0;
const debugConsole = document.getElementById("debugConsole");
const debugConsoleInput = document.getElementById("debugConsoleInput");
debugConsoleInput.addEventListener("focus", function() {
    inDebug = true;
    for (let i in clientPlayer.controls) {
        if (typeof clientPlayer.controls[i] == "boolean") {
            clientPlayer.controls[i] = false;
        }
    }
});
debugConsoleInput.addEventListener("blur", function() {
    inDebug = false;
});
debugConsoleInput.addEventListener("keydown", function(event) {
    if (event.key == "Enter") {
        if (debugConsoleInput.value.length > 0) {
            socket.emit("debugConsole", debugConsoleInput.value);
            insertDebugConsole(debugConsoleInput.value, "success");
            if (debugHistory[debugHistory.length - 1] != debugConsoleInput.value) {
                debugHistory.push(debugConsoleInput.value);
                debugHistoryIndex = debugHistory.length;
            }
            debugConsoleInput.value = "";
        }
    }
});
let insertDebugConsole = function(text, color) {
    switch (color) {
        case "success":
            color = "color: #00ff00;";
            break;
        case "warn":
            color = "color: #ffff00;";
            break;
        case "error":
            color = "color: #ff0000; font-weight: bold;";
            break;
    }
    let date = new Date();
    let minute = date.getMinutes().toString();
    if (minute.length == 1){
        minute = "0" + minute;
    }
    const message = document.createElement("div");
    message.className = "debugConsoleText";
    message.innerHTML = "[" + date.getHours() + ":" + minute + "] <span style=\"" + color + "\">" + text + "</span>";
    let scroll = false;
    if (debugConsole.scrollTop + debugConsole.clientHeight >= debugConsole.scrollHeight - 5) {
        scroll = true;
    }
    debugConsole.appendChild(message);
    if (scroll) {
        debugConsole.scrollTop = debugConsole.scrollHeight;
    }
    debugMessages.unshift(message);
    if (debugMessages.length >= 100) {
        debugMessages.pop().remove();
    }
};

socket.on("debugConsole", function(data) {
    if (selfPlayer == null) {
        return;
    }
    insertDebugConsole(data.text, data.color);
});