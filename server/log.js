
const readline = require("readline");

/*
Global Colors:
31 : red    : error
32 : green  : debug
33 : yellow : warn
34 : blue   : local chat
35 : purple : meadow
36 : cyan   : global chat
*/

appendLog = function(text, type) {
    var prefix = "--- ";
    if (type == "info") {
        prefix = " INFO ";
    }
    else if (type == "warn") {
        prefix = " WARN ";
    }
    else if (type == "error") {
        prefix = "ERROR ";
    }
    else if (type == "fatal") {
        prefix = "FATAL ";
    }
    else if (type == "debug") {
        prefix = "DEBUG ";
    }
    else if (type == "chat") {
        prefix = " CHAT ";
    }
    var date = new Date();
    var name = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + ".log";
    fs.appendFile("./server/logs/" + name, prefix + text.replaceAll("\n", "\n" + prefix) + "\n", {encoding: "utf-8"}, function() {});
};

var awaitingLogs = 0;
log = function(text, color, type) {
    var prefix = getTimeStamp() + "| ";
    switch (type) {
        case "info":
            prefix += " INFO";
            break;
        case "warn":
            prefix += " WARN";
            break;
        case "error":
            prefix += "ERROR";
            break;
        case "fatal":
            prefix += "FATAL";
            break;
        case "debug":
            prefix += "DEBUG";
            break;
        case "info":
            prefix += " CHAT";
            break;
        default:
            prefix += "-----";
            break;
    }
    prefix += " | ";

    process.stdout.write("\x1b[2K\r " + prefix + color + text + "\x1b[0m\n\r> ");
    prompt._refreshLine();

    var date = new Date();
    var name = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + ".log";

    awaitingLogs += 1;
    fs.appendFile("./server/logs/" + name, prefix + text.toString().replaceAll("\n", "\n" + prefix) + "\n", { encoding: "utf-8" }, function() {
        awaitingLogs -= 1;
    });
};
awaitLogs = function(resolve, reject) {
    if (awaitingLogs == 0) {
        resolve();
    }
    else {
        setTimeout(function() {
            awaitLogs(resolve, reject);
        }, 10);
    }
};

info = function(text) {
    log(text, "", "info");
};
debug = function(text) {
    log(text, "\x1b[32m", "debug");
};
warn = function(text) {
    log(text, "\x1b[33m", "warn");
};
error = function(text) {
    log(text, "\x1b[31m", "error");
    if (text instanceof Error) {
        log(text.stack, "\x1b[31m", "error");
    }
};
fatal = function(text) {
    log(text, "\x1b[31m", "fatal");
    if (text instanceof Error) {
        log(text.stack, "\x1b[31m", "fatal");
    }
};

insertChat = function(text, color, player) {
    if (player != null) {
        log("(" + player.name + ") " + text, "\x1b[34m", "chat");
        player.socket.emit("chat", { text: text.replaceAll("<", "&lt;").replaceAll(">", "&gt;"), color: color });
    }
    else {
        log(text, "\x1b[36m", "chat");
        io.emit("chat", { text: text.replaceAll("<", "&lt;").replaceAll(">", "&gt;"), color: color });
    }
};

getTimeStamp = function() {
    var date = new Date();
    var hour = date.getHours().toString();
    if (hour.length == 1) {
        hour = "0" + hour;
    }
    var minute = date.getMinutes().toString();
    if (minute.length == 1) {
        minute = "0" + minute;
    }
    var second = date.getSeconds().toString();
    if (second.length == 1) {
        second = "0" + second;
    }
    return "[" + hour + ":" + minute + ":" + second + "] ";
};

const commands = {
    players: function() {
        for (var i in Player.list) {
            console.log(Player.list[i]);
        }
    },
    ultraSecretFilters: function(argument) {
        for (var i in Player.list) {
            Player.list[i].socket.emit("ultraSecretFilters", argument);
        }
    },
};

const prompt = readline.createInterface({ input: process.stdin, output: process.stdout });
prompt.on("line", async function(input) {
    if (input != "") {
        if (input.toLowerCase() == "help") {
            log("-------- Console help --------", "\x1b[33m", "debug");
            log("help               shows this screen", "\x1b[33m", "debug");
            log("copyright-details  shows copyright details", "\x1b[33m", "debug");
            log("stop               stops the server", "\x1b[33m", "debug");
            log("", "\x1b[33m", "debug");
            log("Use \"/\" to run commands. For more information, run \"/help\"", "\x1b[33m", "debug");
            return;
        }
        else if (input.toLowerCase() == "stop") {
            if (start) {
                log("[!] Warning: Server has not started. [!]", "\x1b[33m", "debug");
            }
            else if (stop) {
                stop();
            }
            else {
                log("[!] Warning: Server is already stopping. [!]", "\x1b[33m", "debug");
            }
            return;
        }
        else if (input.toLowerCase() == "copyright-details") {
            debug("┌───────────────────────────────────────────────────────────────────────┐");
            debug("│   \x1b[1m\x1b[35mMeadow Guarder\x1b[0m                                                      │");
            debug("│   \x1b[1m\x1b[34mCopyright (C) 2024 MaitianSha        \x1b[0m                               │");
            debug("├───────────────────────────────────────────────────────────────────────┤");
            debug("│ You are free to:                                                      │");
            debug("│                                                                       │");
            debug("│ Share — copy and redistribute the material in any medium or format    │");
            debug("│                                                                       │");
            debug("│ Adapt — remix, transform, and build upon the material                 │");
            debug("│                                                                       │");
            debug("│ The licensor cannot revoke these freedoms as long as you follow the   │");
            debug("│ license terms.                                                        │");
            debug("│                                                                       │");
            debug("│ Attribution — You must give appropriate credit, provide a link to the │");
            debug("│ license, and indicate if changes were made. You may do so in any      │");
            debug("│ reasonable manner, but not in any way that suggests the licensor      │");
            debug("│ endorses you or your use.                                             │");
            debug("│                                                                       │");
            debug("│ NonCommercial — You may not use the material for commercial purposes. │");
            debug("│                                                                       │");
            debug("│ No additional restrictions — You may not apply legal terms or         │");
            debug("│ technological measures that legally restrict others from doing        │");
            debug("│ anything the license permits.                                         │");
            debug("│                                                                       │");
            debug("│ Notices:                                                              │");
            debug("│ You do not have to comply with the license for elements of the        │");
            debug("│ material in the public domain or where your use is permitted by an    │");
            debug("│ applicable exception or limitation. No warranties are given. The      │");
            debug("│ license may not give you all of the permissions necessary for your    │");
            debug("│ intended use. For example, other rights such as publicity, privacy,   │");
            debug("│ or moral rights may limit how you use the material.                   │");
            debug("└───────────────────────────────────────────────────────────────────────┘");
            return;
        }
        else if (input == "colortest") {
            debug("\x1b[0m█ \x1b[0m\x1b[1m█ \x1b[0m");
            debug("\x1b[30m\x1b[40m█ \x1b[0m\x1b[90m\x1b[100m█ \x1b[0m");
            debug("\x1b[31m\x1b[41m█ \x1b[0m\x1b[91m\x1b[101m█ \x1b[0m");
            debug("\x1b[32m\x1b[42m█ \x1b[0m\x1b[92m\x1b[102m█ \x1b[0m");
            debug("\x1b[33m\x1b[43m█ \x1b[0m\x1b[93m\x1b[103m█ \x1b[0m");
            debug("\x1b[34m\x1b[44m█ \x1b[0m\x1b[94m\x1b[104m█ \x1b[0m");
            debug("\x1b[35m\x1b[45m█ \x1b[0m\x1b[95m\x1b[105m█ \x1b[0m");
            debug("\x1b[36m\x1b[46m█ \x1b[0m\x1b[96m\x1b[106m█ \x1b[0m");
            debug("\x1b[37m\x1b[47m█ \x1b[0m\x1b[97m\x1b[107m█ \x1b[0m");
            return;
        }
        if (input.indexOf("/") == 0) {
            try {
                var command = input.substring(1).split(" ").shift();
                appendLog(getTimeStamp() + "SERVER: " + input, "debug");
                if (commands[command]) {
                    try {
                        var result = commands[command](input.substring(command.length + 2));
                        if (result != null) {
                            result = result.toString();
                        }
                        log(result, "\x1b[33m", "debug");
                    }
                    catch (err) {
                        error(err);
                    }
                }
                else {
                    error("/" + command + " is not an existing command. Try /help for a list of commands.");
                }
            }
            catch (err) {
                error(err);
            }
        }
        else {
            try {
                appendLog(getTimeStamp() + "SERVER: " + input, "debug");
                var result = eval(input);
                if (result == null) {
                    result = "Successfully executed command";
                }
                else {
                    result = result.toString();
                }
                log(result, "\x1b[33m", "debug");
            }
            catch (err) {
                error(err);
            }
        }
    }
    else if (input == "") {
        process.stdout.write("\r \x1b[1A\x1b[1C");
    }
});
prompt.on("close", function() {
    if (process.env.PORT == null) {
        if (stop && !start) {
            stop();
        }
    }
});
process.stdout.write("\r \x1b[1A\x1b[1C");