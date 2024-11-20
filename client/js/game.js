var cameraX = 0;
var cameraY = 0;
var cameraShakeMagnitude = 0;
var cameraShakeDecay = 0;

var rawMouseX = 0;
var rawMouseY = 0;
var mouseX = 0;
var mouseY = 0;
var selectedDroppedItem = null;
var selfPlayer = null;
var selfMap = null;

var fpsTimes = [];
let ping = 0;
let pingTimes = [];
let pingTimesTotal = 0;

const fpsDisplay = document.getElementById("fpsDisplay");
const tpsDisplay = document.getElementById("tpsDisplay");
const pingDisplay = document.getElementById("pingDisplay");
const clientTickDisplay = document.getElementById("clientTickDisplay");
const serverTickDisplay = document.getElementById("serverTickDisplay");
const totalDrawTime = document.getElementById("totalDrawTime");
const entityDrawTime = document.getElementById("entityDrawTime");
const mapDrawTime = document.getElementById("mapDrawTime");
const debugDrawTime = document.getElementById("debugDrawTime");
const totalTickTime = document.getElementById("totalTickTime");
const playerTickTime = document.getElementById("playerTickTime");
const monsterTickTime = document.getElementById("monsterTickTime");
const projectileTickTime = document.getElementById("projectileTickTime");
const clientHeap = document.getElementById("clientHeap");
const serverHeap = document.getElementById("serverHeap");
const playerPosition = document.getElementById("playerPosition");
const mousePosition = document.getElementById("mousePosition");
const totalEntityCount = document.getElementById("totalEntityCount");
const monsterEntityCount = document.getElementById("monsterEntityCount");
const projectileEntityCount = document.getElementById("projectileEntityCount");
const particleEntityCount = document.getElementById("particleEntityCount");

setInterval(function() {
    fpsDisplay.innerText = "FPS: " + fpsTimes.length;
    let n = performance.now();
    // setTimeout(function() {
    socket.volatile.emit("ping", n);
    // }, 1000);
}, 500);

socket.on("ping", function(data) {
    pingTimes.push((performance.now() - data) / 2);
    pingTimesTotal += pingTimes[pingTimes.length - 1];
    while (pingTimes.length > 100) {
        pingTimesTotal -= pingTimes[0];
        pingTimes.shift();
    }
    ping = pingTimesTotal / pingTimes.length;
    pingDisplay.innerText = "Ping: " + Math.round(ping * 100) / 100 + "ms";
    // setTimeout(function() {
    socket.emit("ping2", ping);
    // }, 1000);
});

var updateTime = performance.now();
var update = function() {
    updateTime += 1000 / settings.fps;
    if (updateTime < performance.now() - 100) {
        updateTime = performance.now();
    }
    setTimeout(update, updateTime - performance.now());
    if (document.hidden) {
        updateTime = performance.now();
        return;
    }
    if (settings.debug) {
        mousePosition.innerText = "(" + Math.floor((mouseX - cameraX) / TILE_SIZE) + ", " + Math.floor((mouseY - cameraY) / TILE_SIZE) + ")";
    }
    var totalStart = performance.now();
    var entityStart = performance.now();
    for (var i in Entity.list) {
        if (Entity.list[i].type == PROJECTILE) {
            Projectile.update(Entity.list[i]);
        }
        Entity.update(Entity.list[i]);
    }
    if (settings.particles) {
        for (var i in ParticleGenerator.list[selfMap]) {
            ParticleGenerator.update(ParticleGenerator.list[selfMap][i]);
        }
    }
    
    var entityEnd = performance.now();

    var cameraShakeX = 0;
    var cameraShakeY = 0;
    if (settings.cameraShake && cameraShakeMagnitude > 0) {
        cameraShakeX = Math.random() * cameraShakeMagnitude - cameraShakeMagnitude / 2;
        cameraShakeY = Math.random() * cameraShakeMagnitude - cameraShakeMagnitude / 2;
        cameraShakeMagnitude *= 1 - cameraShakeDecay * interpolationSteps;
        if (cameraShakeMagnitude < 1) {
            cameraShakeMagnitude = 0;
            cameraShakeDecay = 0;
        }
    }
    offscreenCtx.setTransform(renderScale, 0, 0, renderScale, 0, 0);
    cameraX = windowWidth * devicePixelRatio / settings.zoom * 50 - Math.round(selfPlayer.x + cameraShakeX);
    cameraY = windowHeight * devicePixelRatio / settings.zoom * 50 - Math.round(selfPlayer.y + cameraShakeY);
    
    var mapStart = performance.now();
    
    updateRenderedChunks();

    var mapEnd = performance.now();

    var layers = [];
    for (var y in maps[selfMap].canvases) {
        for (var x in maps[selfMap].canvases[y]) {
            for (var i in maps[selfMap].canvases[y][x]) {
                layers[i] = true;
            }
        }
    }
    if (settings.animatedTiles) {
        for (var i in AnimatedTile.list) {
            layers[AnimatedTile.list[i].layer] = true;
        }
    }
    for (var i in Entity.layers) {
        if (Entity.layers[i].length == 0) {
            delete Entity.layers[i];
        }
        else {
            layers[i] = true;
        }
    }
    if (settings.particles) {
        for (var i in Particle.layers) {
            if (Particle.layers[i].length == 0) {
                delete Particle.layers[i];
            }
            else {
                layers[i] = true;
            }
        }
    }
    selectedDroppedItem = null;
    for (var i in layers) {
        offscreenCtx.globalAlpha = 1;
        if (settings.debug) {
            mapStart += performance.now() - mapEnd;
        }
        for (var y in maps[selfMap].canvases) {
            for (var x in maps[selfMap].canvases[y]) {
                if (maps[selfMap].canvases[y][x][i]) {
                    var startX = (x * CHUNK_SIZE + cameraX) / 4;
                    var startY = (y * CHUNK_SIZE + cameraY) / 4;
                    var endX = (x * CHUNK_SIZE + CHUNK_SIZE + TILE_SIZE + cameraX) / 4;
                    var endY = (y * CHUNK_SIZE + CHUNK_SIZE + TILE_SIZE + cameraY) / 4;
                    // var startX = Math.floor((x * CHUNK_SIZE) / 4);
                    // var startY = Math.floor((y * CHUNK_SIZE) / 4);
                    // var endX = Math.ceil((x * CHUNK_SIZE + CHUNK_SIZE + TILE_SIZE) / 4);
                    // var endY = Math.ceil((y * CHUNK_SIZE + CHUNK_SIZE + TILE_SIZE) / 4);
                    var croppedStartX = Math.max(startX, 0);
                    var croppedStartY = Math.max(startY, 0);
                    var croppedEndX = Math.min(endX, Math.ceil(offscreenCanvas.width / renderScale / 4));
                    var croppedEndY = Math.min(endY, Math.ceil(offscreenCanvas.height / renderScale / 4));
                    var croppedWidth = croppedEndX - croppedStartX;
                    var croppedHeight = croppedEndY - croppedStartY;
                    offscreenCtx.drawImage(maps[selfMap].canvases[y][x][i], croppedStartX - startX, croppedStartY - startY, croppedWidth, croppedHeight, croppedStartX * 4, croppedStartY * 4, croppedWidth * 4, croppedHeight * 4);
                }
            }
        }
        var layer = Number(i);
        if (settings.animatedTiles) {
            for (var j in AnimatedTile.list) {
                if (layer == AnimatedTile.list[j].layer) {
                    AnimatedTile.update(AnimatedTile.list[j]);
                }
            }
        }
        if (settings.debug) {
            mapEnd = performance.now();
        }
        if (Entity.layers[layer] != null) {
            if (settings.debug) {
                entityStart += performance.now() - entityEnd;
            }
            Entity.layers[layer].sort(function(a, b) {
                if (a.layer != layer) {
                    return 1;
                }
                if (b.layer != layer) {
                    return -1;
                }
                return a.y - b.y;
            });
            while (Entity.layers[layer].length > 0 && Entity.layers[layer][Entity.layers[layer].length - 1].layer != layer) {
                Entity.layers[layer].pop();
            }
            for (var j in Entity.layers[i]) {
                if (Entity.layers[i][j].type == PROJECTILE) {
                    Projectile.draw(Entity.layers[i][j]);
                }
                else if (Entity.layers[i][j].type == DROPPED_ITEM) {
                    if (selectedDroppedItem == null && mouseX - cameraX >= Entity.layers[i][j].x - settings.droppedItemSize / 2 && mouseX - cameraX <= Entity.layers[i][j].x + settings.droppedItemSize / 2 && mouseY - cameraY >= Entity.layers[i][j].y - settings.droppedItemSize / 2 && mouseY - cameraY <= Entity.layers[i][j].y + settings.droppedItemSize / 2) {
                        selectedDroppedItem = Entity.layers[i][j].id;
                        DroppedItem.draw(Entity.layers[i][j], true);
                    }
                    else {
                        DroppedItem.draw(Entity.layers[i][j], false);
                    }
                }
                else {
                    Rig.drawBelow(Entity.layers[i][j]);
                }
            }
            for (var j in Entity.layers[i]) {
                if (Entity.layers[i][j].type != PROJECTILE && Entity.layers[i][j].type != DROPPED_ITEM) {
                    Rig.drawAbove(Entity.layers[i][j]);
                }
            }
            if (settings.particles) {
                for (var j in Particle.layers[i]) {
                    Particle.update(Particle.layers[i][j]);
                }
            }
            if (settings.debug) {
                entityEnd = performance.now();
            }
        }
    }
    offscreenCtx.globalAlpha = 1;
    if (draggableWindow.currentTab == TAB_CUSTOMIZE) {
        if (settings.debug) {
            entityStart += performance.now() - entityEnd;
        }
        customizeCtx.clearRect(2, 2, 8, 16);
        customizeCtx.drawImage(selfPlayer.render, selfPlayer.animationStage * 8, selfPlayer.animationDirection * 16, 8, 16, 2, 2, 8, 16);
        if (settings.debug) {
            entityEnd = performance.now();
        }
    }
    if (settings.debug) {
        var debugStart = performance.now();
    }
    // draw debug
    if (settings.debug) {
        offscreenCtx.strokeStyle = "#000000";
        offscreenCtx.lineWidth = 1;
        for (var y in maps[selfMap].collisions) {
            for (var x in maps[selfMap].collisions[y]) {
                for (let i in maps[selfMap].collisions[y][x]) {
                    for (let j in maps[selfMap].collisions[y][x][i]) {
                        let collision = maps[selfMap].collisions[y][x][i][j];
                        if (collision.x - collision.width / 2 + cameraX >= offscreenCanvas.width / renderScale || collision.x + collision.width / 2 + cameraX <= 0 || collision.y - collision.height / 2 + cameraY >= offscreenCanvas.height / renderScale || collision.y + collision.height / 2 + cameraY <= 0) {
                            continue;
                        }
                        offscreenCtx.strokeRect(collision.x - collision.width / 2 + cameraX, collision.y - collision.height / 2 + cameraY, collision.width, collision.height);
                    }
                }
            }
        }
        offscreenCtx.strokeStyle = "#ff0000";
        offscreenCtx.lineWidth = 1;
        for (let i in Entity.list) {
            if (Entity.list[i].type == PROJECTILE) {
                Projectile.drawDebug(Entity.list[i]);
            }
            else if (Entity.list[i].type == DROPPED_ITEM) {
                DroppedItem.drawDebug(Entity.list[i]);
            }
            else {
                Rig.drawDebug(Entity.list[i]);
            }
        }
        
        offscreenCtx.strokeStyle = "#ffff00";
        offscreenCtx.lineWidth = 1;
        if (!(clientPlayer.x - clientPlayer.width / 2 + cameraX >= offscreenCanvas.width / renderScale || clientPlayer.x + clientPlayer.width / 2 + cameraX <= 0 || clientPlayer.y - clientPlayer.height / 2 + cameraY >= offscreenCanvas.height / renderScale || clientPlayer.y + clientPlayer.height / 2 + cameraY <= 0)) {
            offscreenCtx.strokeRect(clientPlayer.x - clientPlayer.width / 2 + cameraX, clientPlayer.y - clientPlayer.height / 2 + cameraY, clientPlayer.width, clientPlayer.height);
        }
        
        offscreenCtx.strokeStyle = "#0000ff";
        offscreenCtx.lineWidth = 1;
        if (!(serverPlayer.x - serverPlayer.width / 2 + cameraX >= offscreenCanvas.width / renderScale || serverPlayer.x + serverPlayer.width / 2 + cameraX <= 0 || serverPlayer.y - serverPlayer.height / 2 + cameraY >= offscreenCanvas.height / renderScale || serverPlayer.y + serverPlayer.height / 2 + cameraY <= 0)) {
            offscreenCtx.strokeRect(serverPlayer.x - serverPlayer.width / 2 + cameraX, serverPlayer.y - serverPlayer.height / 2 + cameraY, serverPlayer.width, serverPlayer.height);
        }


        var debugEnd = performance.now();
        var totalEnd = performance.now();
        totalDrawTime.innerText = "Total: " + Math.round(totalEnd - totalStart) + "ms";
        entityDrawTime.innerText = "Entity: " + Math.round(entityEnd - entityStart) + "ms";
        mapDrawTime.innerText = "Map: " + Math.round(mapEnd - mapStart) + "ms";
        debugDrawTime.innerText = "Debug: " + Math.round(debugEnd - debugStart) + "ms";
        clientHeap.innerText = "Client Heap: " + Math.round(performance.memory.usedJSHeapSize / 1048576 * 100) / 100 + "/" + Math.round(performance.memory.jsHeapSizeLimit / 1048576 * 100) / 100 + "MB";
        playerPosition.innerText = "(" + Math.floor(selfPlayer.x / TILE_SIZE) + ", " + Math.floor(selfPlayer.y / TILE_SIZE) + ")";

        var monsters = 0;
        var projectiles = 0;
        var particles = 0;
        for (var i in Entity.list) {
            if (Entity.list[i].type == MONSTER) {
                monsters += 1;
            }
            else if (Entity.list[i].type == PROJECTILE) {
                projectiles += 1;
            }
        }
        for (var i in Particle.layers) {
            for (var j in Particle.layers[i]) {
                particles += 1;
            }
        }

        totalEntityCount.innerText = "Total: " + (monsters + projectiles + particles);
        monsterEntityCount.innerText = "Monsters: " + monsters;
        projectileEntityCount.innerText = "Projectiles: " + projectiles;
        particleEntityCount.innerText = "Particles: " + particles;
    }
    ctx.drawImage(offscreenCanvas, 0, 0);
    if (settings.lights) {
        offscreenLightCtx.setTransform(renderScale, 0, 0, renderScale, 0, 0);
        offscreenLightCtx.clearRect(0, 0, offscreenLightCanvas.width / renderScale, offscreenLightCanvas.height / renderScale);
        for (var i in Light.list[selfMap]) {
            Light.update(Light.list[selfMap][i]);
        }
        if (maps[selfMap].darkness > 0) {
            offscreenLightCtx.globalCompositeOperation = "darken";
            for (var i in Light.list[selfMap]) {
                Light.drawAlpha(Light.list[selfMap][i]);
            }
            for (var i in Entity.list) {
                if (Entity.list[i].type == PLAYER) {
                    Light.drawEntityAlpha(Entity.list[i]);
                }
            }
            offscreenLightCtx.globalCompositeOperation = "xor";
            offscreenLightCtx.fillStyle = "rgba(0, 0, 0, " + maps[selfMap].darkness + ")";
            offscreenLightCtx.fillRect(0, 0, offscreenLightCanvas.width / renderScale, offscreenLightCanvas.height / renderScale);
        }
        if (settings.coloredLights) {
            offscreenLightCtx.globalCompositeOperation = "lighten";
            // offscreenLightCtx.globalCompositeOperation = "source-over";
            for (var i in Light.list[selfMap]) {
                if (Light.list[selfMap][i].colored) {
                    Light.drawColor(Light.list[selfMap][i]);
                }
            }
        }
        ctx.drawImage(offscreenLightCanvas, 0, 0);
    }
    fpsTimes.push(performance.now());
    while (performance.now() - fpsTimes[0] > 1000) {
        fpsTimes.shift();
    }
};

let clientTick = {
    tick: -1,
    time: 0,
};
let serverTick = {
    tick: -1,
    time: 0,
};
let clientPlayer = {
    x: 0,
    y: 0,
    lastX: 0,
    lastY: 0,
    speedX: 0,
    speedY: 0,
    gridX: 0,
    gridY: 0,
    chunkX: 0,
    chunkY: 0,
    width: 32,
    height: 32,
    layer: 0,
    knockbackX: 0,
    knockbackY: 0,
    moveSpeed: 10,
    slowedDown: false,
    teleporting: false,
    teleportTime: 0,
    controls: [],
    history: [],
    animationType: DIRECTIONAL_8,
    animationStage: 0,
    animationLength: 6,
    animationSpeed: 0.05,
    animationChangeBySpeed: true,
    animationDirection: 0,
    animationPhase: 0,
    update: function() {
        if (selfPlayer.hp == 0) {
            this.updateAnimation();
            return;
        }
        this.updateMove();
    },
    updateMove: function() {
        this.speedX = 0;
        this.speedY = 0;
        // console.log(this.teleporting, this.teleportTime)
        if (this.teleporting) {
            this.knockbackX = 0;
            this.knockbackY = 0;
            this.teleportTime -= 1;
            if (this.teleportTime == 0) {
                this.teleporting = false;
            }
        }
        else {
            if (this.controls[LEFT]) {
                this.speedX -= this.moveSpeed;
            }
            if (this.controls[RIGHT]) {
                this.speedX += this.moveSpeed;
            }
            if (this.controls[UP]) {
                this.speedY -= this.moveSpeed;
            }
            if (this.controls[DOWN]) {
                this.speedY += this.moveSpeed;
            }
            if (this.speedX != 0 && this.speedY != 0) {
                // realistic but feels weird
                // this.speedX /= Math.sqrt(2);
                // this.speedY /= Math.sqrt(2);
                this.x = Math.round(this.x);
                this.y = Math.round(this.y);
            }
        }
        if (this.slowedDown) {
            this.speedX *= 0.5;
            this.speedY *= 0.5;
        }
        this.updateAnimation();
        this.speedX += this.knockbackX;
        this.speedY += this.knockbackY;
        this.knockbackX *= 0.25;
        this.knockbackY *= 0.25;
        if (Math.abs(this.knockbackX) < 0.5) {
            this.knockbackX = 0;
        }
        if (Math.abs(this.knockbackY) < 0.5) {
            this.knockbackY = 0;
        }
        this.move(true);
    },
    move: function(slide) {
        var max = Math.ceil(Math.max(Math.abs(this.speedX) / this.width, Math.abs(this.speedY) / this.height));
        if (max != 0) {
            var speedX = this.speedX / max;
            var speedY = this.speedY / max;
            var collided = false;
            for (var i = 0; i < max; i += 1) {
                this.lastX = this.x;
                this.lastY = this.y;
                if (slide) {
                    this.x += speedX;
                    this.gridX = Math.floor(this.x / TILE_SIZE);
                    if (this.collideWithMap(this.speedX, 0, slide)) {
                        collided = true;
                    }
                    this.y += speedY;
                    this.gridY = Math.floor(this.y / TILE_SIZE);
                    if (this.collideWithMap(0, this.speedY, slide)) {
                        collided = true;
                    }
                }
                else {
                    this.x += speedX;
                    this.y += speedY;
                    this.gridX = Math.floor(this.x / TILE_SIZE);
                    this.gridY = Math.floor(this.y / TILE_SIZE);
                    if (this.collideWithMap(this.speedX, this.speedY, slide)) {
                        collided = true;
                        break;
                    }
                }
                if (this.collideWithMapEffects()) {
                    break;
                }
                if (this.x == this.lastX && this.y == this.lastY) {
                    break;
                }
            }
        }
        // this.chunkX = Math.floor(this.x / CHUNK_SIZE);
        // this.chunkY = Math.floor(this.y / CHUNK_SIZE);
        // Entity.updateChunks(this);
        return collided;
    },
    collideWithMap: function(speedX, speedY, slide) {
        let maxDistanceX = 0;
        let maxDistanceY = 0;
        let signX = Math.sign(speedX);
        let signY = Math.sign(speedY);
        for (var y = Math.floor((this.y - this.height / 2) / TILE_SIZE); y < Math.ceil((this.y + this.height / 2) / TILE_SIZE); y++) {
            if (maps[selfMap].collisions[y] == null) {
                continue;
            }
            for (var x = Math.floor((this.x - this.width / 2) / TILE_SIZE); x < Math.ceil((this.x + this.width / 2) / TILE_SIZE); x++) {
                if (maps[selfMap].collisions[y][x] == null || maps[selfMap].collisions[y][x][this.layer] == null) {
                    continue;
                }
                for (let i in maps[selfMap].collisions[y][x][this.layer]) {
                    let collision = maps[selfMap].collisions[y][x][this.layer][i];
                    if (collision.slowdown) {
                        continue;
                    }
                    if (this.x - this.width / 2 < collision.x + collision.width / 2 && this.x + this.width / 2 > collision.x - collision.width / 2 && this.y - this.height / 2 < collision.y + collision.height / 2 && this.y + this.height / 2 > collision.y - collision.height / 2) {
                        // WHAT DO I NAME THE VARIABLES BUH
                        let distanceX = (this.x + this.width / 2 * signX) - (collision.x - collision.width / 2 * signX);
                        let distanceY = (this.y + this.height / 2 * signY) - (collision.y - collision.height / 2 * signY);
                        let timeX = distanceX / speedX;
                        let timeY = distanceY / speedY;
                        if (!isFinite(timeX)) {
                            timeX = Infinity;
                        }
                        if (!isFinite(timeY)) {
                            timeY = Infinity;
                        }
                        if (timeX < timeY) {
                            maxDistanceX = Math.max(maxDistanceX, distanceX * signX);
                        }
                        else {
                            maxDistanceY = Math.max(maxDistanceY, distanceY * signY);
                        }
                    }
                }
            }
        }
        if (maxDistanceX > 0 || maxDistanceY > 0) {
            let timeX = maxDistanceX * signX / speedX;
            let timeY = maxDistanceY * signY / speedY;
            if (!isFinite(timeX)) {
                timeX = -Infinity;
            }
            if (!isFinite(timeY)) {
                timeY = -Infinity;
            }
            if (timeX > timeY) {
                if (slide) {
                    this.x -= maxDistanceX * signX;
                }
                else {
                    this.x -= maxDistanceX * signX;
                    this.y -= maxDistanceX * signX;
                }
            }
            else {
                if (slide) {
                    this.y -= maxDistanceY * signY;
                }
                else {
                    this.x -= maxDistanceY * signY;
                    this.y -= maxDistanceY * signY;
                }
            }
            return true;
        }
        return false;
    },
    collideWithMapEffects: function() {
        this.slowedDown = false;
        slowedDown: for (var y = Math.floor((this.y - this.height / 2) / TILE_SIZE); y < Math.ceil((this.y + this.height / 2) / TILE_SIZE); y++) {
            if (maps[selfMap].collisions[y] == null) {
                continue;
            }
            for (var x = Math.floor((this.x - this.width / 2) / TILE_SIZE); x < Math.ceil((this.x + this.width / 2) / TILE_SIZE); x++) {
                if (maps[selfMap].collisions[y][x] == null || maps[selfMap].collisions[y][x][this.layer] == null) {
                    continue;
                }
                for (let i in maps[selfMap].collisions[y][x][this.layer]) {
                    let collision = maps[selfMap].collisions[y][x][this.layer][i];
                    if (!collision.slowdown) {
                        continue;
                    }
                    if (this.x - this.width / 2 < collision.x + collision.width / 2 && this.x + this.width / 2 > collision.x - collision.width / 2 && this.y - this.height / 2 < collision.y + collision.height / 2 && this.y + this.height / 2 > collision.y - collision.height / 2) {
                        this.slowedDown = true;
                        break slowedDown;
                    }
                }
            }
        }
        slope: for (var y = Math.floor((this.y - this.height / 2) / TILE_SIZE); y < Math.ceil((this.y + this.height / 2) / TILE_SIZE); y++) {
            if (maps[selfMap].slopes[y] == null) {
                continue;
            }
            let layer = this.layer;
            for (var x = Math.floor((this.x - this.width / 2) / TILE_SIZE); x < Math.ceil((this.x + this.width / 2) / TILE_SIZE); x++) {
                if (maps[selfMap].slopes[y][x] == null) {
                    continue;
                }
                let slope = maps[selfMap].slopes[y][x][this.layer];
                if (slope != -1) {
                    switch (slope % 5) {
                        case 0:
                            this.layer = Math.floor(slope / 5);
                            break slope;
                        case 1:
                            if (this.x - this.width / 2 < x * TILE_SIZE + TILE_SIZE / 2) {
                                this.layer = Math.floor(slope / 5);
                                break slope;
                            }
                            break;
                        case 2:
                            if (this.x + this.width / 2 > x * TILE_SIZE + TILE_SIZE / 2) {
                                this.layer = Math.floor(slope / 5);
                                break slope;
                            }
                            break;
                        case 3:
                            if (this.y - this.height / 2 < y * TILE_SIZE + TILE_SIZE / 2) {
                                this.layer = Math.floor(slope / 5);
                                break slope;
                            }
                            break;
                        case 4:
                            if (this.y + this.height / 2 > y * TILE_SIZE + TILE_SIZE / 2) {
                                this.layer = Math.floor(slope / 5);
                                break slope;
                            }
                            break;
                    }
                }
            }
            if (this.layer != layer) {
                if (Entity.layers[this.layer] == null) {
                    Entity.layers[this.layer] = [];
                }
                Entity.layers[this.layer].push(selfPlayer);
            }
        }
        return false;
    },
    updateAnimation: function() {
        var speed = this.animationSpeed;
        if (this.animationChangeBySpeed) {
            // speed *= Math.sqrt(Math.pow(this.speedX, 2) + Math.pow(this.speedY, 2));
            speed *= Math.max(Math.abs(this.speedX), Math.abs(this.speedY));
        }
        this.animationStage = (this.animationStage + speed) % this.animationLength;
        if (this.animationType == DIRECTIONAL_8) {
            var angle = null;
            if (this.speedX != 0 || this.speedY != 0) {
                angle = Math.atan2(this.speedY, this.speedX) * 180 / Math.PI;
                if (angle < 0) {
                    angle += 360;
                }
            }
            else {
                if (!this.teleporting) {
                    angle = this.controls[TARGET_ANGLE];
                }
                this.animationStage = 0;
            }
            if (angle != null) {
                if (angle <= 22.5) {
                    this.animationDirection = 2;
                }
                else if (angle <= 67.5) {
                    this.animationDirection = 1;
                }
                else if (angle <= 112.5) {
                    this.animationDirection = 0;
                }
                else if (angle <= 157.5) {
                    this.animationDirection = 7;
                }
                else if (angle <= 202.5) {
                    this.animationDirection = 6;
                }
                else if (angle <= 247.5) {
                    this.animationDirection = 5;
                }
                else if (angle <= 292.5) {
                    this.animationDirection = 4;
                }
                else if (angle <= 337.5) {
                    this.animationDirection = 3;
                }
                else {
                    this.animationDirection = 2;
                }
            }
        }
        else if (this.animationType == DIRECTIONAL_4) {
            var angle = null;
            if (this.speedX != 0 || this.speedY != 0) {
                angle = Math.atan2(this.speedY, this.speedX) * 180 / Math.PI;
                if (angle < 0) {
                    angle += 360;
                }
            }
            else {
                if (!this.teleporting) {
                    angle = this.controls[TARGET_ANGLE];
                }
                this.animationStage = 0;
            }
            if (angle != null) {
                if (angle <= 45) {
                    this.animationDirection = 1;
                }
                else if (angle <= 135) {
                    this.animationDirection = 2;
                }
                else if (angle <= 225) {
                    this.animationDirection = 3;
                }
                else if (angle <= 315) {
                    this.animationDirection = 0;
                }
                else {
                    this.animationDirection = 1;
                }
            }
        }
        else if (this.animationType == DIRECTIONAL_2) {
            if (this.speedX > 0) {
                this.animationDirection = 0;
            }
            else if (this.speedX < 0) {
                this.animationDirection = 1;
            }
            else {
                if (!this.teleporting) {
                    if (this.controls[TARGET_ANGLE] <= 90) {
                        this.animationDirection = 0;
                    }
                    else if (this.controls[TARGET_ANGLE] <= 270) {
                        this.animationDirection = 1;
                    }
                    else {
                        this.animationDirection = 0;
                    }
                }
                this.animationStage = 0;
            }
        }
        else if (this.animationType == NON_DIRECTIONAL) {
        }
    },
};
let serverPlayer = {
    x: 0,
    y: 0,
    lastX: 0,
    lastY: 0,
    speedX: 0,
    speedY: 0,
    gridX: 0,
    gridY: 0,
    chunkX: 0,
    chunkY: 0,
    width: 0,
    height: 0,
    layer: 0,
    knockbackX: 0,
    knockbackY: 0,
    moveSpeed: 10,
};
let tickTimeout = null;
var updateTick = function() {
    if (clientTick.tick >= serverTick.tick + 40) {
        return;
    }
    clientTick.tick += 1;
    clientTick.time = performance.now();
    if (settings.debug) {
        if (clientTick.tick < serverTick.tick) {
            clientTickDisplay.innerText = "Client Tick: " + clientTick.tick + " (" + (clientTick.tick - serverTick.tick) + ")";
        }
        else {
            clientTickDisplay.innerText = "Client Tick: " + clientTick.tick + " (+" + (clientTick.tick - serverTick.tick) + ")";
        }
    }
    updateTickTimeout();
    clientPlayer.update();
    clientPlayer.history[clientTick.tick] = {
        x: clientPlayer.x,
        y: clientPlayer.y,
        knockbackX: clientPlayer.knockbackX,
        knockbackY: clientPlayer.knockbackY,
        layer: clientPlayer.layer,
        moveSpeed: clientPlayer.moveSpeed,
        controls: structuredClone(clientPlayer.controls),
    };
    selfPlayer.speedX = (clientPlayer.x - selfPlayer.x) / Math.ceil(interpolationSteps);
    selfPlayer.speedY = (clientPlayer.y - selfPlayer.y) / Math.ceil(interpolationSteps);
    selfPlayer.interpolationSteps = Math.ceil(interpolationSteps);
    selfPlayer.animationStage = Math.floor(clientPlayer.animationStage);
    selfPlayer.animationDirection = clientPlayer.animationDirection;
    selfPlayer.animationPhase = clientPlayer.animationPhase;
    let e = {
        x: clientPlayer.x,
        y: clientPlayer.y,
        knockbackX: clientPlayer.knockbackX,
        knockbackY: clientPlayer.knockbackY,
        layer: clientPlayer.layer,
        moveSpeed: clientPlayer.moveSpeed,
        controls: structuredClone(clientPlayer.controls),
        tick: clientTick.tick,
    };
    // setTimeout(function() {
    socket.emit("tick", e);
// }, 1000);
};
function updateTickTimeout() {
    if (tickTimeout != null) {
        clearTimeout(tickTimeout);
    }
    // if (serverTick.tick - clientTick.tick > 400) {
    //     alert("asdf2")
    //     return;
    // }
    // tickTimeout = setTimeout(updateTick, serverTick.time - ping + (clientTick.tick + 1 - serverTick.tick) * 50 - Date.now());
    tickTimeout = setTimeout(updateTick, serverTick.time - Math.min(ping, 1000) + (clientTick.tick + 1 - serverTick.tick) * 50 - performance.now());
    // tickTimeout = setTimeout(updateTick, (clientTick.tick + 1 - serverTick.tick) * 50 - ping);
    // tickTimeout = setTimeout(updateTick, 50);
};



var respawnState = NONE;
const respawnContainer = document.getElementById("respawnContainer");
const respawnCooldown = document.getElementById("respawnCooldown");
const respawnButton = document.getElementById("respawnButton");

const canvasFlash = document.getElementById("canvasFlash");

socket.on("updateTick", function(data) {
    if (document.hidden) {
        return;
    }
    if (signInState != LOADING_COMPLETE) {
        return;
    }
    if (serverTick.tick == -1) {
        clientTick.tick = data.serverTick.tick;
    }
    serverTick = data.serverTick;
    serverTick.time = performance.now() - Math.min(ping, 1000);
    if (serverTick.tick - clientTick.tick > 40) {
        clientTick.tick = serverTick.tick - 40;
    }
    if (settings.debug) {
        serverTickDisplay.innerText = "Server Tick: " + serverTick.tick;
    }
    while (serverTick.time - Math.min(ping, 1000) + (clientTick.tick + 1 - serverTick.tick) * 50 - performance.now() < 0) {
        updateTick();
    }
    updateTickTimeout();
    var entities = data.entities;
    for (var i in entities) {
        var entity = Entity.list[entities[i].id];
        if (entity == null) {
            if (entities[i].type == PROJECTILE) {
                new Projectile(entities[i]);
            }
            else {
                new Rig(entities[i]);
            }
        }
        else {
            if (entities[i].type != PROJECTILE && entities[i].type != NPC) {
                entity.hpEffect += (entity.hp / entity.hpMax - entities[i].hp / entities[i].hpMax);
                if (entity.hp - entities[i].hp >= 0) {
                    entity.hpChange = false;
                }
                else {
                    entity.hpChange = true;
                }
                entity.hp = entities[i].hp;
                entity.hpMax = entities[i].hpMax;
            }
            if (entities[i].id != selfPlayer.id) {
                entity.speedX = (entities[i].x - entity.x) / Math.ceil(interpolationSteps);
                entity.speedY = (entities[i].y - entity.y) / Math.ceil(interpolationSteps);
                entity.interpolationSteps = Math.ceil(interpolationSteps);
                if (entities[i].type == PROJECTILE) {
                    if (Projectile.data[entity.projectileId].rotationInterpolation) {
                        var angleDifference = entities[i].angle - entity.angle;
                        while (angleDifference > 180) {
                            entities[i].angle -= 360;
                            angleDifference = entities[i].angle - entity.angle;
                        }
                        while (angleDifference <= -180) {
                            entities[i].angle += 360;
                            angleDifference = entities[i].angle - entity.angle;
                        }
                        entity.speedAngle = angleDifference / interpolationSteps;
                    }
                    else {
                        entity.angle = entities[i].angle;
                    }
                    entity.animationStage = entities[i].animationStage;
                    entity.animationPhase = entities[i].animationPhase;
                }
                else {
                    entity.animationStage = entities[i].animationStage;
                    entity.animationDirection = entities[i].animationDirection;
                    if (entities[i].type != PLAYER) {
                        entity.animationPhase = entities[i].animationPhase;
                    }
                    if (entities[i].type == PLAYER) {
                        var changed = false;
                        for (var j in entities[i].customizations) {
                            for (var k in entities[i].customizations[j]) {
                                if (entity.customizations[j][k] != entities[i].customizations[j][k]) {
                                    entity.customizations = entities[i].customizations;
                                    changed = true;
                                    break;
                                }
                            }
                            if (changed) {
                                break;
                            }
                        }
                        if (changed) {
                            Rig.renderCustomizations(entity);
                        }
                    }
                    if (entity.layer != entities[i].layer) {
                        entity.layer = entities[i].layer;
                        if (Entity.layers[entity.layer] == null) {
                            Entity.layers[entity.layer] = [];
                        }
                        Entity.layers[entity.layer].push(entity);
                    }
                }
            }
            entity.updated = true;
        }
    }
    for (var i in Entity.list) {
        if (Entity.list[i].updated == false && Entity.list[i] != selfPlayer) {
            Entity.list[i].layer = null;
            delete Entity.list[i];
        }
        else {
            Entity.list[i].updated = false;
        }
    }
    var droppedItems = data.droppedItems;
    for (var i in droppedItems) {
        var droppedItem = DroppedItem.list[droppedItems[i].id];
        if (droppedItem == null) {
            new DroppedItem(droppedItems[i]);
        }
        else {
            droppedItem.updated = true;
        }
    }
    for (var i in DroppedItem.list) {
        if (DroppedItem.list[i].updated == false) {
            DroppedItem.list[i].layer = null;
            delete DroppedItem.list[i];
        }
        else {
            DroppedItem.list[i].updated = false;
        }
    }
    if (settings.particles && data.particles != null) {
        var particles = data.particles;
        for (var i in particles) {
            switch (particles[i].type) {
                case PARTICLE_DAMAGE:
                    new Particle(particles[i].x, particles[i].y, particles[i].layer, PARTICLE_DAMAGE, particles[i].value);
                    break;
                case PARTICLE_CRIT_DAMAGE:
                    new Particle(particles[i].x, particles[i].y, particles[i].layer, PARTICLE_CRIT_DAMAGE, particles[i].value);
                    break;
                case PARTICLE_HEAL:
                    new Particle(particles[i].x, particles[i].y, particles[i].layer, PARTICLE_HEAL, particles[i].value);
                    break;
                case PARTICLE_TELEPORT:
                    for (var j = 0; j < 20; j++) {
                        new Particle(particles[i].x, particles[i].y, particles[i].layer, PARTICLE_TELEPORT, particles[i].value);
                    }
                    break;
                case PARTICLE_EXPLOSION:
                    for (var j = 0; j < particles[i].value; j++) {
                        new Particle(particles[i].x, particles[i].y, particles[i].layer, PARTICLE_EXPLOSION, particles[i].value);
                    }
                    for (var j = 0; j < particles[i].value / 3; j++) {
                        Particle.spread(new Particle(particles[i].x, particles[i].y, particles[i].layer, PARTICLE_FIRE, j), Math.random() * particles[i].value / 2);
                    }
                    break;
                case PARTICLE_FIRE:
                    new Particle(particles[i].x + Math.random() * particles[i].width - particles[i].width / 2, particles[i].y + Math.random() * particles[i].height - particles[i].height / 2, particles[i].layer, PARTICLE_FIRE, particles[i].value);
                    break;
            }
        }
    }
    if (settings.cameraShake && data.cameraEffects != null) {
        cameraShakeMagnitude += data.cameraEffects.cameraShake.magnitude;
        cameraShakeDecay += data.cameraEffects.cameraShake.decay;
    }
    if (settings.cameraFlash && data.cameraEffects != null) {
        var divs = [];
        for (var i in data.cameraEffects.cameraFlash) {
            const div = document.createElement("div");
            div.classList.add("canvasFlash");
            div.style.opacity = data.cameraEffects.cameraFlash[i].opacity;
            div.style.transition = "opacity " + data.cameraEffects.cameraFlash[i].duration + "ms linear";
            div.style.backgroundColor = data.cameraEffects.cameraFlash[i].color;
            div.addEventListener("transitionend", function() {
                div.remove();
            });
            canvasFlash.appendChild(div);
            divs.push(div);
        }
        canvasFlash.offsetHeight;
        for (var i in divs) {
            divs[i].style.opacity = 0;
        }
    }
    if (settings.debug && data.debugData != null) {
        tpsDisplay.innerText = "TPS: " + data.debugData.tps;
        serverHeap.innerText = "Server Heap: " + data.debugData.heap + "MB";
        totalTickTime.innerText = "Total: " + data.debugData.total + "ms";
        playerTickTime.innerText = "Player: " + data.debugData.player + "ms";
        monsterTickTime.innerText = "Monster: " + data.debugData.monster + "ms";
        projectileTickTime.innerText = "Projectile: " + data.debugData.projectile + "ms";
    }
});
socket.on("clientData", function(data) {
    let clientData = data;
    serverPlayer.x = clientData.x,
    serverPlayer.y = clientData.y;
    serverPlayer.width = clientData.width;
    serverPlayer.height = clientData.height;
    serverPlayer.layer = clientData.layer;
    serverPlayer.knockbackX = clientData.knockbackX;
    serverPlayer.knockbackY = clientData.knockbackY;
    serverPlayer.moveSpeed = clientData.moveSpeed;
    // set stage and direction?
    // serverPlayer.animationType = clientData.animationType;
    // serverPlayer.animationStage = clientData.animationStage;
    // serverPlayer.animationLength = clientData.animationLength;
    // serverPlayer.animationSpeed = clientData.animationSpeed;
    // serverPlayer.animationChangeBySpeed = clientData.animationChangeBySpeed;
    // serverPlayer.animationDirection = clientData.animationDirection;
    // serverPlayer.animationPhase = clientData.animationPhase;
        // let tick = clientData.tick;
        // console.log(tick, performance.now())
    if (clientData.overrideClient) {
        clientPlayer.x = clientData.x;
        clientPlayer.y = clientData.y;
        clientPlayer.width = clientData.width;
        clientPlayer.height = clientData.height;
        clientPlayer.layer = clientData.layer;
        clientPlayer.knockbackX = clientData.knockbackX;
        clientPlayer.knockbackY = clientData.knockbackY;
        clientPlayer.moveSpeed = clientData.moveSpeed;
        // set stage and direction?
        clientPlayer.animationType = clientData.animationType;
        if (clientPlayer.animationLength != clientData.animationLength) {
            clientPlayer.animationStage = clientData.animationStage;
        }
        clientPlayer.animationLength = clientData.animationLength;
        clientPlayer.animationSpeed = clientData.animationSpeed;
        clientPlayer.animationChangeBySpeed = clientData.animationChangeBySpeed;
        clientPlayer.animationPhase = clientData.animationPhase;
        let tick = clientData.tick;
        // if (clientTick.tick - tick > 20) {
        //     clientTick.tick = serverTick.tick - 20;
        // }
        let controls = clientPlayer.controls;
        // for (let i = tick + 1; i <= clientTick.tick; i++) {
        for (let i in clientPlayer.history) {
            i = Number(i);
            if (i <= tick) {
                delete clientPlayer.history[i];
                continue;
            }
            // if (clientPlayer.history[i])
            // if (clientPlayer.history[i] == null) {
            //     continue;
            // }
            clientPlayer.controls = structuredClone(clientPlayer.history[i].controls);
            clientPlayer.update();
            // if (clientPlayer.history[i] != null) {
            //     let same = true;
            //     for (let j in clientPlayer.history[i]) {
            //         if (typeof clientPlayer.history[i][j] != "number") {
            //             continue;
            //         }
            //         if (clientPlayer.history[i][j] != clientPlayer[j]) {
            //             same = false;
            //             break;
            //         }
            //     }
            //     if (same) {
            //         console.log(clientPlayer.history[i], clientPlayer)
            //         break;
            //     }
            // }
            clientPlayer.history[i] = {
                x: clientPlayer.x,
                y: clientPlayer.y,
                knockbackX: clientPlayer.knockbackX,
                knockbackY: clientPlayer.knockbackY,
                layer: clientPlayer.layer,
                moveSpeed: clientPlayer.moveSpeed,
                controls: structuredClone(clientPlayer.controls),
            };
        }
        // for (let i in clientPlayer.history) {
        //     i = Number(i);
        //     if (i <= tick) {
        //         delete clientPlayer.history[i];
        //         continue;
        //     }
        // }
        clientPlayer.controls = controls;
        selfPlayer.speedX = (clientPlayer.x - selfPlayer.x) / Math.ceil(interpolationSteps);
        selfPlayer.speedY = (clientPlayer.y - selfPlayer.y) / Math.ceil(interpolationSteps);
        selfPlayer.interpolationSteps = Math.ceil(interpolationSteps);
        selfPlayer.animationStage = Math.floor(clientPlayer.animationStage);
        selfPlayer.animationDirection = clientPlayer.animationDirection;
        selfPlayer.animationPhase = clientPlayer.animationPhase;
    }
    else {
        clientPlayer.width = clientData.width;
        clientPlayer.height = clientData.height;
        clientPlayer.knockbackX = clientData.knockbackX;
        clientPlayer.knockbackY = clientData.knockbackY;
        clientPlayer.animationType = clientData.animationType;
        if (clientPlayer.animationLength != clientData.animationLength) {
            clientPlayer.animationStage = clientData.animationStage;
        }
        clientPlayer.animationLength = clientData.animationLength;
        clientPlayer.animationSpeed = clientData.animationSpeed;
        clientPlayer.animationChangeBySpeed = clientData.animationChangeBySpeed;
        clientPlayer.animationPhase = clientData.animationPhase;
    }
    if (selfPlayer.hp == 0) {
        clientPlayer.speedX = 0;
        clientPlayer.speedY = 0;
        clientPlayer.animationStage = 0;
    }
    if (clientData.hp == 0) { // just read selfPlayer? TODO
        if (respawnState == NONE) {
            respawnState = RESPAWNING;
            respawnContainer.style.display = "";
            respawnButton.disabled = true;
            respawnCooldown.innerText = "5";
            setTimeout(function() {
                respawnCooldown.innerText = "4";
            }, 1000);
            setTimeout(function() {
                respawnCooldown.innerText = "3";
            }, 2000);
            setTimeout(function() {
                respawnCooldown.innerText = "2";
            }, 3000);
            setTimeout(function() {
                respawnCooldown.innerText = "1";
            }, 4000);
            setTimeout(function() {
                respawnButton.disabled = false;
                respawnCooldown.innerText = "0";
            }, 5000);
        }
    }
    else {
        if (respawnState == AWAITING_RESPAWN) {
            respawnState = NONE;
            respawnContainer.style.display = "none";
        }
    }
    document.getElementById("statsHealthValue").style.width = (clientData.hp / clientData.hpMax) * 100 + "%";
    document.getElementById("statsXpValue").style.width = (clientData.xp / clientData.xpMax) * 100 + "%";
    document.getElementById("statsManaValue").style.width = (clientData.mana / clientData.manaMax) * 100 + "%";
    document.getElementById("statsHealthText").innerText = Math.ceil(clientData.hp) + " / " + clientData.hpMax;
    document.getElementById("statsXpText").innerText = Math.ceil(clientData.xp) + " / " + clientData.xpMax;
    document.getElementById("statsManaText").innerText = Math.ceil(clientData.mana) + " / " + clientData.manaMax;
});
respawnButton.addEventListener("click", function() {
    if (respawnState == RESPAWNING) {
        respawnState = AWAITING_RESPAWN;
        socket.emit("respawn");
    }
});

var keyPress = function(key, state) {
    switch (key) {
        case keybinds.left:
        //     setTimeout(function() {
        //     socket.emit("controls", {
        //         id: LEFT,
        //         state: state,
        //     });
        // }, 1000);
            clientPlayer.controls[LEFT] = state;
            break;
        case keybinds.right:
        //     setTimeout(function() {
        //     socket.emit("controls", {
        //         id: RIGHT,
        //         state: state,
        //     });
        // }, 1000);
            clientPlayer.controls[RIGHT] = state;
            break;
        case keybinds.up:
        //     setTimeout(function() {
        //     socket.emit("controls", {
        //         id: UP,
        //         state: state,
        //     });
        // }, 1000);
            clientPlayer.controls[UP] = state;
            if (state) {
                console.log("pressed up " + clientTick.tick)
            }
            break;
        case keybinds.down:
        //     setTimeout(function() {
        //     socket.emit("controls", {
        //         id: DOWN,
        //         state: state,
        //     });
        // }, 1000);
            clientPlayer.controls[DOWN] = state;
            break;
        case keybinds.attack:
            // socket.emit("controls", {
            //     id: ATTACK,
            //     state: state,
            // });
            clientPlayer.controls[ATTACK] = state;
            break;
        case keybinds.defend:
            if (selectedDroppedItem != null) {
                socket.emit("droppedItem", {
                    id: selectedDroppedItem,
                });
                break;
            }
            clientPlayer.controls[DEFEND] = state;
            // socket.emit("controls", {
            //     id: DEFEND,
            //     state: state,
            // });
            break;
    }
};
document.addEventListener("keydown", function(event) {
    if (selfPlayer == null || inChat || inDebug) {
        return;
    }
    if (changingKeybind != null) {
        if (event.key != "Control" && event.key != "Shift" && event.key != "Alt" && event.key != "Meta") {
            changeKeybind(event.key);
            if (event.key == " ") {
                event.preventDefault();
            }
        }
        return;
    }
    if (event.key == keybinds.drop) {
        if (Inventory.hoveredItem != null) {
            Inventory.dropItem(Inventory.hoveredItem, event.ctrlKey ? 0 : 2);
            if (Inventory.items[Inventory.hoveredItem] != ITEM_NULL) {
                Inventory.showTooltip(Inventory.items[Inventory.hoveredItem]);
                Inventory.moveTooltip();
            }
            else {
                Inventory.hideTooltip();
            }
        }
        return;
    }
    keyPress(event.key, true);
});
document.addEventListener("keyup", function(event) {
    if (selfPlayer == null || inChat) {
        return;
    }
    if (inDebug) {
        if (debugHistory.length > 0) {
            if (event.key == "ArrowUp") {
                if (debugHistoryIndex == debugHistory.length && debugConsoleInput.value.length > 0 && debugHistory[debugHistoryIndex - 1] != debugConsoleInput.value) {
                    debugHistory[debugHistoryIndex] = debugConsoleInput.value;
                }
                debugHistoryIndex = Math.max(debugHistoryIndex - 1, 0);
                debugConsoleInput.value = debugHistory[debugHistoryIndex];
            }
            else if (event.key == "ArrowDown") {
                if (debugHistoryIndex != debugHistory.length) {
                    debugHistoryIndex = Math.min(debugHistoryIndex + 1, debugHistory.length - 1);
                    debugConsoleInput.value = debugHistory[debugHistoryIndex];
                }
            }
        }
        return;
    }
    keyPress(event.key, false);
});

document.addEventListener("mousedown", function(event) {
    if (selfPlayer == null || inChat || inDebug) {
        return;
    }
    if (changingKeybind != null) {
        changeKeybind(event.button);
        return;
    }
    if (Inventory.items[EQUIP_DRAGGING] != ITEM_NULL) {
        Inventory.dropItem(EQUIP_DRAGGING, event.button);
        return;
    }
    keyPress(event.button, true);
});
document.addEventListener("mouseup", function(event) {
    if (selfPlayer == null) {
        return;
    }
    keyPress(event.button, false);
});
document.addEventListener("mousemove", function(event) {
    if (selfPlayer == null) {
        return;
    }
    if (Inventory.items[EQUIP_DRAGGING] != ITEM_NULL) {
        Inventory.moveDraggingItem();
    }
    rawMouseX = event.clientX;
    rawMouseY = event.clientY;
    mouseX = event.clientX * canvasScale / renderScale;
    mouseY = event.clientY * canvasScale / renderScale;
    // socket.volatile.emit("controls", {
    //     id: MOUSE_POSITION,
    //     x: mouseX - cameraX,
    //     y: mouseY - cameraY,
    // });
    clientPlayer.controls[TARGET_X] = mouseX - cameraX;
    clientPlayer.controls[TARGET_Y] = mouseY - cameraY;
    clientPlayer.controls[TARGET_ANGLE] = Math.atan2(mouseY - cameraY - selfPlayer.y, mouseX - cameraX - selfPlayer.x) * 180 / Math.PI;
    if (clientPlayer.controls[TARGET_ANGLE] < 0) {
        clientPlayer.controls[TARGET_ANGLE] += 360;
    }
});

window.addEventListener("blur", function() {
    if (selfPlayer == null) {
        return;
    }
    socket.emit("controls", RELEASE);
    for (var i in clientPlayer.controls) {
        if (typeof clientPlayer.controls[i] == "boolean") {
            clientPlayer.controls[i] = false;
        }
    }
});

// var teleportState = NONE;
const canvasShade = document.getElementById("canvasShade");
socket.on("teleportStart", function() {
    clientPlayer.teleporting = true;
    clientPlayer.teleportTime = 0;
    // teleportState = TELEPORTING;
    canvasShade.style.transition = "opacity 500ms linear";
    canvasShade.style.backgroundColor = "#000000";
    canvasShade.style.opacity = 1;
});
socket.on("teleportEnd", function(data) {
    clientPlayer.teleportTime = 10;
    canvasShade.style.opacity = 0;
    if (selfMap != data.map) {
        Entity.list = {};
        Entity.list[selfPlayer.id] = selfPlayer;
        Entity.layers = [];
        Entity.layers[selfPlayer.layer] = [selfPlayer];
        if (settings.animatedTiles) {
            AnimatedTile.list = {};
        }
        // TODO: Lights/particle generators?
    }
    selfMap = data.map;
    selfPlayer.x = data.x;
    selfPlayer.y = data.y;
    selfPlayer.layer = data.layer;
    selfPlayer.interpolationSteps = 0;
    clientPlayer.x = data.x;
    clientPlayer.y = data.y;
    clientPlayer.layer = data.layer;
    clientPlayer.knockbackX = data.knockbackX;
    clientPlayer.knockbackY = data.knockbackY;
});
canvasShade.addEventListener("transitionend", function() {
    if (clientPlayer.teleporting && clientPlayer.teleportTime <= 0) {
        socket.emit("teleport");
        // return;
    }
    // clientPlayer.teleporting = false;
    // switch (teleportState) {
    //     case TELEPORTING:
    //         socket.emit("teleport");
    //         break;
    // }
    // teleportState = NONE;
});

const regionDisplayContainer = document.getElementById("regionDisplayContainer");
var regionTimeout = null;
var regionFadeState = 0;
var regionId = null;
socket.on("region", function(region) {
    if (regionTimeout != null) {
        clearTimeout(regionTimeout);
    }
    if (regionFadeState == 0) {
        regionFadeState = 1;
        if (region == WILDERNESS) {
            document.getElementById("regionDisplayLarge").innerText = "The Wilderness";
            document.getElementById("regionDisplaySmall").innerText = "";
        }
        else {
            document.getElementById("regionDisplayLarge").innerText = regions[region][0];
            document.getElementById("regionDisplaySmall").innerText = regions[region][1] ?? "";
        }
        regionDisplayContainer.style.transition = "opacity 1s linear";
        regionDisplayContainer.style.opacity = 1;
        regionTimeout = setTimeout(function() {
            regionFadeState = 2;
            regionTimeout = null;
            regionDisplayContainer.style.transition = "opacity 2s linear";
            regionDisplayContainer.style.opacity = 0;
        }, 4000);
    }
    else {
        regionFadeState = 3;
        regionId = region;
        regionDisplayContainer.style.opacity = 1;
        regionDisplayContainer.offsetHeight;
        regionDisplayContainer.style.transition = "opacity 250ms linear";
        regionDisplayContainer.style.opacity = 0;
    }
});
regionDisplayContainer.addEventListener("transitionend", function() {
    switch (regionFadeState) {
        case 2:
            regionFadeState = 0;
            break;
        case 3:
            regionFadeState = 1;
            if (regionId == WILDERNESS) {
                document.getElementById("regionDisplayLarge").innerText = "The Wilderness";
                document.getElementById("regionDisplaySmall").innerText = "";
            }
            else {
                document.getElementById("regionDisplayLarge").innerText = regions[regionId][0];
                document.getElementById("regionDisplaySmall").innerText = regions[regionId][1] ?? "";
            }
            regionDisplayContainer.style.transition = "opacity 250ms linear";
            regionDisplayContainer.style.opacity = 1;
            regionTimeout = setTimeout(function() {
                regionTimeout = null;
                regionDisplayContainer.style.transition = "opacity 2s linear";
                regionDisplayContainer.style.opacity = 0;
                regionFadeState = 2;
            }, 4000);
            break;
    }
});
