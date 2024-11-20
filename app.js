// Copyright (C) MaitianSha 2023

// TODO:
// cache monster stuff and player stuff (done)
// maps (finish) (done)
// ui (done)
// inventory (working on)
// triggers
// monster (done)
// projectile (done)
// database (done)
// parsing json to use numbers (no)

// settings can change other settings
// check if scale changed if canvas resize is needed

// array vs object

// replace with var
// faster for, no in
// data url order
// replace append child right after element creation

// if (this.something > checking thing)
// classes??? oh wait slow or is it ??? needs testing
// math.max in loops are slow
// nevermind its not slow

// use Map for Entity.list, Entity.layers, Collisions

// read inventory and stuff code
// make sure (var craft) is used consiistently

// animation phase for players is kinda weird - DONE

// inSafeRegion -> regionSafety?

// overcapping damage particles

// HEAL control

// changing Attack and DEFEND controls

// pingTimesTotal vs pingTotal

// more logs

/** |  INFO | Projectiles: 0
 [10:01:12] | FATAL | An error has occured, stopping server.
 [10:01:12] | FATAL | TypeError: undefined is not an object (evaluating 'Inventory.items[draggingItem.id].equip')
 [10:01:12] | FATAL | TypeError: undefined is not an object (evaluating 'Inventory.items[draggingItem.id].equip')
    at <anonymous> (/mnt/c/Users/gbsha/Documents/Github/Meadow-Guarder/server/inventory.js:81:101)
    at emit (node:events:56:48)
    at <anonymous> (/mnt/c/Users/gbsha/Documents/Github/Meadow-Guarder/node_modules/socket.io/dist/socket.js:697:39)
    at processTicksAndRejections (native:7:39)
> TypeError: undefined is not an object (evaluating 'Inventory.items[draggingItem.id].equip')
    at <anonymous> (/mnt/c/Users/gbsha/Documents/Github/Meadow-Guarder/server/inventory.js:81:101)
    at emit (node:events:56:48)
    at <anonymous> (/mnt/c/Users/gbsha/Documents/Github/Meadow-Guarder/node_modules/socket.io/dist/socket.js:697:39)
    at processTicksAndRejections (native:7:39) */

// CLIENT SIMUILATING REGIONS

// PARTIY CHECK BETWENE sevrer and CLIENT maPS.JS

// check all == nulls to see if they are actually necessary

// LOOPS: try to use x, y, layer and other variables

// tileset: custom property so code can automatically add collisions YAY - DONE

// fix tileset

// teleportTime - increment before checking

// potentially move teleportEnd, region, and respawn socket emits into 'tick' socket emit

// Map modes:
// Raw
// Compressed
// Layered
// Compressed + layered

// cooldown: stuff that happens once when hits 0
// time: stuff that continuously happens
// speed: 

// REREAD ALL THE CODE!! [IMPORTANT]

// else is fine

// ideas:
/*
regions where you can build
very cool
chests and stuff
*/

const version = "0.0.0";
const copyrightOwner = "MaitianSha1";
fs = require("fs");
const { subtle } = require("crypto").webcrypto;
const keys = subtle.generateKey({
    name: "RSA-OAEP",
    modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: "SHA-256"
}, false, ["encrypt", "decrypt"]);
require("./client/data/constants.js");
require("./server/log.js");

debug("\x1b[35mMeadow Guarder " + version + " Copyright (C) MaitianSha 2023\x1b[0m");

const express = require("express");
const app = express();
const server = require("http").Server(app);
app.get("/", (req, res) => res.sendFile(__dirname + "/client/index.html"));
app.use("/", express.static(__dirname + "/client/"));
// app.use("/", express.static(__dirname));
app.use("/server", express.static(__dirname + "/server/"));

PF = require("pathfinding");
require("./server/inventory.js");
require("./server/filter.js");
require("./server/entity.js");
require("./server/maps.js");
require("./server/database.js");

ENV = {
    useDatabase: false,
    useDiscordWebhook: false,
    devs: {
        "sp": true,
    },
    respawnHp: 1,
    respawnMana: 1,
    respawnTeleport: true,
    hardcore: false,
    hardcoreBanTime: 60,
    playerFriendlyFire: true,
    monsterFriendlyFire: false,
    broadcastPlayerDeaths: true,
    broadcastMonsterDeaths: true,
    // broadcastMonsterTaunts: true,
    broadcastMonsterTaunts: false,
    desyncBuffer: 200,
    physicsInaccuracy: 1,
    hitboxBuffer: 128,
    pathfindBuffer: 6,
    pathfindUpdateSpeed: 10,
    dodgeProjectiles: false,
    dodgeProjectileSearchRange: 2,
    dodgeProjectileSearchLength: 20,
    monsterSpawnTime: 100,
    itemDespawnTime: 5,
    autoSaveInterval: 5,
    autoBackup: false,
};
var config = require("./config.json");
for (var i in config) {
    ENV[i] = config[i];
}

start = async function() {
    start = null;
    log("Starting Database...", "\x1b[32m", "info");
    Database.start();
    await Database.backup();
    if (process.env.REPL_OWNER == copyrightOwner) {
        server.listen(process.env.PORT);
        log("Server Started.", "\x1b[32m", "info");
    }
    else {
        server.listen(3000);
        log("Server Started on port 3000.", "\x1b[32m", "info");
    }
    info("----------------------------------------");
};
stop = async function() {
    stop = null;
    log("Stopping Server...", "\x1b[32m", "info");
    update = null;
    server.close();
    log("Saving Database...", "\x1b[32m", "info");
    clearInterval(autoSaveInterval);
    Database.stop();
    log("Writing Logs...", "\x1b[32m", "info");
    log("Server Stopped.", "\x1b[32m", "info");
    info("----------------------------------------");
    await new Promise(awaitLogs);
    await new Promise(awaitAssets);
    process.stdout.write("\x1b[1A");
    process.exit(0);
};
start();

// process.on("SIGTERM", function() {

//     fatal("An error has occured, stopping server.");
//     fatal(err);
//     console.error(err.stack);
//     stop();
// });
// process.on("SIGINT", function() {

//     fatal("An error has occured, stopping server.");
//     fatal(err);
//     console.error(err.stack);
//     stop();
// });
// process.on("SIGQUIT", function() {

//     fatal("An error has occured, stopping server.");
//     fatal(err);
//     console.error(err.stack);
//     stop();
// });
// process.on("SIGILL", function() {

//     fatal("An error has occured, stopping server.");
//     fatal(err);
//     console.error(err.stack);
//     stop();
// });

process.on("uncaughtException", function(err) {
    fatal("An error has occured, stopping server.");
    fatal(err);
    console.error(err.stack);
    stop();
});
process.on("unhandledRejection", function(err) {
    fatal("An error has occured, stopping server.");
    fatal(err);
    console.error(err.stack);
    stop();
});

var publicKey = null;
var privateKey = null;
var RSAdecode = async function(buffer) {
    if (privateKey == null) {
        privateKey = (await keys).privateKey;
    }
    return new TextDecoder().decode(await subtle.decrypt({ name: "RSA-OAEP" }, privateKey, buffer));
};

var totalAssets = maps.length + 11;
let tilesetData = require("./client/maps/tileset.json");
for (let i = 0; i < tilesetData.tiles.length; i++) {
    if (tilesetData.tiles[i].animation != null) {
        totalAssets += 1;
    }
}
var entityImages = {};
var itemImages = {};
for (var i in Npc.data) {
    if (Npc.data[i].image != null && entityImages[Npc.data[i].image] == null) {
        totalAssets += 1;
        entityImages[Npc.data[i].image] = true;
    }
}
for (var i in Monster.data) {
    if (Monster.data[i].image != null && entityImages[Monster.data[i].image] == null) {
        totalAssets += 1;
        entityImages[Monster.data[i].image] = true;
    }
}
for (var i in Projectile.data) {
    if (Projectile.data[i].image != null && entityImages[Projectile.data[i].image] == null) {
        totalAssets += 1;
        entityImages[Projectile.data[i].image] = true;
    }
}
for (var i in Inventory.items) {
    if (Inventory.items[i].image != null && itemImages[Inventory.items[i].image] == null) {
        totalAssets += 1;
        itemImages[Inventory.items[i].image] = true;
    }
    if (Inventory.items[i].image != null && itemImages[Inventory.items[i].image + "Selected"] == null) {
        totalAssets += 1;
        itemImages[Inventory.items[i].image + "Selected"] = true;
    }
}

var awaitingAssets = 0;
var awaitAssets = function(resolve, reject) {
    if (awaitingAssets == 0) {
        resolve();
    }
    else {
        setTimeout(function() {
            awaitAssets(resolve, reject);
        }, 10);
    }
};

io = new (require("socket.io")).Server(server, { pingTimeout: 10000, upgradeTimeout: 300000, maxHttpBufferSize: 100000000 });
io.on("connection", function(socket) {
    socket.leave = function() {
        socket.emit("disconnected");
        socket.removeAllListeners();
        socket.onevent = function() { };
        socket.disconnect();
    };
    var player = new Player(socket);
    socket.once("publicKey", async function() {
        if (publicKey == null) {
            publicKey = await subtle.exportKey("jwk", (await keys).publicKey);
        }
        socket.emit("publicKey", publicKey);
    });
    socket.on("signIn", async function(data) {
        if (typeof data != "object" || data == null || typeof data.username != "string" || !(data.password instanceof Buffer || typeof data.password == "string")) {
            socket.emit("signIn", { state: DATABASE_EXPLOIT });
            if (player.name != null) {
                player.leave();
            }
            else {
                socket.leave();
            }
            return;
        }
        if (!player.loading) {
            socket.emit("signIn", { state: DATABASE_EXPLOIT });
            player.leave();
            return;
        }
        var decryptedPassword = data.password instanceof Buffer ? await RSAdecode(data.password) : data.password;
        var decryptedNewPassword = null;
        if (data.newPassword != null) {
            if (!(data.password instanceof Buffer || typeof data.password == "string")) {
                socket.emit("signIn", { state: DATABASE_EXPLOIT });
                socket.leave();
                return;
            }
            decryptedNewPassword = data.newPassword instanceof Buffer ? await RSAdecode(data.newPassword) : data.newPassword;
        }
        switch (data.state) {
            case SIGN_IN:
                if (player.name != null) {
                    socket.emit("signIn", { state: DATABASE_EXPLOIT });
                    player.leave();
                    return;
                }
                var state = await Database.signIn(data.username, decryptedPassword);
                if (typeof state == "number") {
                    state = { state: state };
                }
                if (state.state == SIGN_IN_SUCCESS) {
                    state.version = version;
                    state.totalAssets = totalAssets;
                    player.name = data.username;
                }
                socket.emit("signIn", state);
                break;
            case LOADED:
                if (player.name == null) {
                    socket.emit("signIn", { state: DATABASE_EXPLOIT });
                    socket.leave();
                    return;
                }
                Player.loadProgress(player, Database.loadProgress(player.name));
                player.loading = false;
                socket.emit("signIn", {
                    state: LOADING_SUCCESS,
                    id: player.id,
                    type: PLAYER,
                    x: player.x,
                    y: player.y,
                    layer: player.layer,
                    map: player.map,
                    animationStage: Math.floor(player.animationStage),
                    animationDirection: player.animationDirection,
                    animationPhase: player.animationPhase,
                    name: player.name,
                    customizations: player.customizations,
                    hp: player.hp,
                    hpMax: player.hpMax,
                });
                insertChat(player.name + " joined the game.", "login");
                break;
            case CREATE_ACCOUNT:
                if (player.name != null) {
                    socket.emit("signIn", { state: DATABASE_EXPLOIT });
                    player.leave();
                    return;
                }
                socket.emit("signIn", {
                    state: await Database.createAccount(data.username, decryptedPassword),
                });
                break;
            case DELETE_ACCOUNT:
                if (player.name != null) {
                    socket.emit("signIn", { state: DATABASE_EXPLOIT });
                    player.leave();
                    return;
                }
                socket.emit("signIn", {
                    state: await Database.deleteAccount(data.username, decryptedPassword),
                });
                break;
            case CHANGE_PASSWORD:
                if (player.name != null) {
                    socket.emit("signIn", { state: DATABASE_EXPLOIT });
                    player.leave();
                    return;
                }
                socket.emit("signIn", {
                    state: await Database.changePassword(data.username, decryptedPassword, decryptedNewPassword),
                });
                break;
        }
    });
    socket.on("saveAsset", function(data) {
        if (process.env.REPL_OWNER == copyrightOwner) {
            if (player.name != null) {
                player.leave();
            }
            else {
                socket.leave();
            }
            return;
        }
        info("Asset --- ");
        if (data.data.imageData) {
            // var fileSignature = [137, 80, 78, 71, 13, 10, 26, 10];
            // var chunkLength = [Math.floor(data.data.imageData.length / Math.pow(256, 3)), Math.floor(data.data.imageData.length % Math.pow(256, 3) / Math.pow(256, 2)), Math.floor(data.data.imageData.length % Math.pow(256, 2) / Math.pow(256, 1)), data.data.imageData.length % 256];
            // var chunkType = [73, 72, 68, 82];
            // var chunkCRC = [];
            // var chunkCRCTable = [];

            // for (var i = 0; i < 256; i++) {
            //     var c = i;
            //     for (var j = 0; j < 8; j++) {
            //         if (c & 1) {
            //             c = 3988292384 ^ (c >> 1);
            //         }
            //         else {
            //             c = (c >> 1);
            //         }
            //     }
            //     chunkCRCTable[i] = c;
            // }
            // var c = 4294967295;
            // for (var i = 0; i < data.data.imageData.length; i++) {
            //     c = chunkCRCTable[(c ^ data.data.imageData[i]) & 255] ^ (c >> 8);
            // }
            // c = c ^ 4294967295;
            // chunkCRC = [Math.floor(c / Math.pow(256, 3)), Math.floor(c % Math.pow(256, 3) / Math.pow(256, 2)), Math.floor(c % Math.pow(256, 2) / Math.pow(256, 1)), c % 256];

            // info(typeof data.data.imageData)
            data.data.imageData = new Array(data.data.imageData)
            var buffer = Buffer.from(data.data.imageDataURL, "base64");
            fs.writeFile("./client/images/" + data.file + "/" + data.data.image + ".png", buffer, function() {});
            info("aaa written file " + data.data.image);
        }
        switch (data.file) {
            case "projectile":
                if (Projectile.data[data.asset] == null) {
                    Projectile.data[data.asset] = {};
                }
                for (var i in data) {
                    if (i != "imageData" && i != "imageDataURL") {
                        Projectile.data[data.asset][i] = data.data[i];
                    }
                }
                fs.writeFile("./client/data/projectile.json", JSON.stringify(Projectile.data[data.asset][i]), function() {

                });
                break;
        }
    });
});

TPS = 0;
tick = 0;
debugData = {};

var tpsTimes = [];
var updateTime = performance.now();
var update = function() {
    if (update != null) {
        updateTime += 50;
        // if (TPS > 30) {
        //     updateTime = performance.now();
        // }
        setTimeout(update, updateTime - performance.now());
    }
    var start = performance.now();
    Entity.update();
    for (var i in Player.list) {
        var player = Player.list[i];
        if (player.name == null) {
            continue;
        }
        var localEntityPack = [];
        var localParticlePack = [];
        var localDroppedItemPack = [];
        for (var y = player.chunkY - player.renderDistance; y <= player.chunkY + player.renderDistance; y++) {
            if (entityPack[player.map][y] != null) {
                for (var x = player.chunkX - player.renderDistance; x <= player.chunkX + player.renderDistance; x++) {
                    if (entityPack[player.map][y][x] != null) {
                        localEntityPack.push(...entityPack[player.map][y][x]);
                    }
                }
            }
            if (droppedItemPack[player.map][y] != null) {
                for (var x = player.chunkX - player.renderDistance; x <= player.chunkX + player.renderDistance; x++) {
                    if (droppedItemPack[player.map][y][x] != null) {
                        for (var i in droppedItemPack[player.map][y][x]) {
                            if (droppedItemPack[player.map][y][x][i].parent == null || droppedItemPack[player.map][y][x][i].parent == player.id) {
                                localDroppedItemPack.push(droppedItemPack[player.map][y][x][i]);
                            }
                        }
                    }
                }
            }
        }
        if (player.particles) {
            for (var y = player.chunkY - player.renderDistance; y <= player.chunkY + player.renderDistance; y++) {
                if (particlePack[player.map][y] != null) {
                    for (var x = player.chunkX - player.renderDistance; x <= player.chunkX + player.renderDistance; x++) {
                        if (particlePack[player.map][y][x] != null) {
                            localParticlePack.push(...particlePack[player.map][y][x]);
                        }
                    }
                }
            }
        }
        var pack = {
            serverTick: {
                tick: tick,
                time: Date.now(),
            },
            entities: localEntityPack,
            droppedItems: localDroppedItemPack,
            clientData: Player.getClientData(player),
        };
        if (player.particles) {
            pack.particles = localParticlePack;
        }
        if (player.cameraEffects) {
            pack.cameraEffects = {
                cameraShake: {
                    magnitude: player.cameraShakeMagnitude,
                    decay: player.cameraShakeDecay,
                },
                cameraFlash: player.cameraFlash,
            };
        }
        if (player.debug) {
            pack.debugData = debugData;
        }
        // setTimeout(function() {
        //     player.socket.emit("updateTick", pack);
        // }, 1000);
        player.socket.emit("updateTick", pack);
        player.socket.emit("updateInventory", Inventory.getClientData(player.inventory));
    }
    var end = performance.now();
    if (end - start > 25) {
        warn("[!] Server Tick Timed Out! Took " + Math.round((end - start) * 10) / 10 + "ms! [!]");
    }
    tpsTimes.push(end);
    while (end - tpsTimes[0] > 1000) {
        tpsTimes.shift();
    }
    TPS = tpsTimes.length;
    tick += 1;
};
update();

// setInterval(function() {
//     info("TPS: " + TPS);
//     var projectiles = 0;
//     for (var i in Projectile.list) {
//         projectiles += 1;
//     }
//     info("Projectiles: " + projectiles);
// }, 1000);

var autoSaveInterval = setInterval(function() {
    for (var i in Player.list) {
        if (Player.list[i].name != null) {
            Database.saveProgress(Player.list[i].name, Player.saveProgress(Player.list[i]));
        }
    }
    Database.save();
    if (ENV.autoBackup) {
        Database.backup();
    }
}, ENV.autoSaveInterval * 60 * 1000);

// setTimeout(async function() {
//     var object = { test: { bla: { buh: { oof: 1 } } } }; console.log(1); for (var i = 0; i < 1000000; i++) { object.test.bla.buh.oof += 1; } console.log(2);
//     var object = { test: { bla: { buh: { oof: 1 } } } }; console.log(1); var object2 = object.test.bla.buh; for (var i = 0; i < 1000000; i++) { object2.oof += 1; } console.log(2);
// })

// purple: amethyst
// blue: azurite, sapphire, aquamarine
// green: emeraldite
// yellow: sunstone
// orange: scorpite
// red: pyroite

exports.oofStrictMode = 1