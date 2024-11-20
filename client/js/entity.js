var Entity = function(param) {
    var self = {
        id: param.id,
        x: param.x,
        y: param.y,
        speedX: 0,
        speedY: 0,
        chunkX: Math.floor(param.x / CHUNK_SIZE),
        chunkY: Math.floor(param.y / CHUNK_SIZE),
        layer: param.layer,
        interpolationSteps: 0,
        updated: true,
    };

    Entity.list[self.id] = self;
    if (Entity.layers[self.layer] == null) {
        Entity.layers[self.layer] = [];
    }
    Entity.layers[self.layer].push(self);
    return self;
};
Entity.images = {
    player: new Image(),
    healthBar: new Image(),
    missingImage: new Image(),
};
Entity.list = {};
Entity.layers = [];
Entity.update = function(entity) {
    if (entity.interpolationSteps > 0) {
        entity.x += entity.speedX;
        entity.y += entity.speedY;
        entity.chunkX = Math.floor(entity.x / CHUNK_SIZE);
        entity.chunkY = Math.floor(entity.y / CHUNK_SIZE);
        entity.interpolationSteps -= 1;
    }
};

var Rig = function(param) {
    var self = Entity(param);
    self.type = param.type;
    self.rigId = param.rigId;

    if (self.type != NPC) {
        self.hp = param.hp;
        self.hpMax = param.hpMax;
        self.hpEffect = 0;
        self.hpChange = false;
    }

    if (self.type == PLAYER) {
        self.name = param.name;
        self.customizations = param.customizations;
    }
    else {
        self.name = Rig.data[self.type][self.rigId].name;
    }

    Rig.renderName(self);

    self.animationStage = param.animationStage;
    self.animationDirection = param.animationDirection;
    self.animationPhase = param.animationPhase ?? 0;

    if (self.type == PLAYER || Rig.data[self.type][self.rigId].customizations != null) {
        self.width = 32;
        self.height = 32;
        Rig.renderCustomizations(self);
    }
    else {
        self.width = Rig.data[self.type][self.rigId].width;
        self.height = Rig.data[self.type][self.rigId].height;
        self.image = Rig.data[self.type][self.rigId].image;
        self.imageWidth = Rig.data[self.type][self.rigId].imageWidth;
        self.imageHeight = Rig.data[self.type][self.rigId].imageHeight;
        self.imageOffsetX = Rig.data[self.type][self.rigId].imageOffsetX;
        self.imageOffsetY = Rig.data[self.type][self.rigId].imageOffsetY;
        self.imageScale = Rig.data[self.type][self.rigId].imageScale;
        self.animationDirections = Rig.data[self.type][self.rigId].animationDirections;
    }
    return self;
};
Rig.data = [];
Rig.renderName = function(rig) {
    offscreenCtx.font = "12px Miniset";
    var metrics = offscreenCtx.measureText(rig.name);
    rig.nameWidth = metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight;
    rig.nameHeight = metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent;
    rig.nameRender = createOffscreenCanvas(Math.floor(rig.nameWidth * renderScale), Math.floor(rig.nameHeight * renderScale));
    var nameCtx = rig.nameRender.getContext("2d");
    nameCtx.font = Math.floor(12 * renderScale) + "px Miniset";
    nameCtx.textBaseline = metrics.actualBoundingBoxDescent > 0 ? "bottom" : "alphabetic";
    nameCtx.fillStyle = "#ff9900";
    if (rig.type == PLAYER) {
        if (rig.name == "sp") {
            nameCtx.fillStyle = "#ff0099";
        }
        if (rig.name == "the-real-tianmu") {
            nameCtx.fillStyle = "#0099ff";
        }
    }
    nameCtx.fillText(rig.name, 0, Math.floor(rig.nameHeight * renderScale));
};
Rig.renderCustomizations = function(rig) {
    rig.render = createOffscreenCanvas(8 * 6, 16 * 8);
    var bufferCtx = rig.render.getContext("2d");
    resetCanvas(bufferCtx);
    bufferCtx.drawImage(drawColoredPlayer(0, rig.customizations.body), 0, 0);
    bufferCtx.drawImage(drawColoredPlayer(1, rig.customizations.shirt), 0, 0);
    bufferCtx.drawImage(drawColoredPlayer(2, rig.customizations.pants), 0, 0);
    bufferCtx.drawImage(drawColoredPlayer(3, rig.customizations.eyes), 0, 0);
    if (rig.customizations.gloves[4] == 1) {
        bufferCtx.drawImage(drawColoredPlayer(4, rig.customizations.gloves), 0, 0);
    }
    if (rig.customizations.boots[4] == 1) {
        bufferCtx.drawImage(drawColoredPlayer(5, rig.customizations.boots), 0, 0);
    }
    if (rig.customizations.pouch[4] == 1) {
        bufferCtx.drawImage(drawColoredPlayer(6, rig.customizations.pouch), 0, 0);
    }
    if (rig.customizations.hair[4] > 0) {
        bufferCtx.drawImage(drawColoredPlayer(rig.customizations.hair[4] + 6, rig.customizations.hair), 0, 0);
    }
}
Rig.drawBelow = function(rig) {
    // only draw if on screen
    var x = Math.round(rig.x) + cameraX;
    var y = Math.round(rig.y) + cameraY;
    if (rig.render != null) {
        if (x - 4 * 4 >= offscreenCanvas.width / renderScale || x + 4 * 4 <= 0 || y - 12 * 4 >= offscreenCanvas.height / renderScale || y + 4 * 4 <= 0) {
            return;
        }
        offscreenCtx.drawImage(rig.render, rig.animationStage * 8, rig.animationDirection * 16 + rig.animationPhase * 8 * 16, 8, 16, x - 4 * 4, y - 12 * 4, 8 * 4, 16 * 4);
    }
    else {
        if (x + rig.imageOffsetX - rig.imageWidth * rig.imageScale / 2 >= offscreenCanvas.width / renderScale || x + rig.imageOffsetX + rig.imageWidth * rig.imageScale / 2 <= 0 || y + rig.imageOffsetY - rig.imageHeight * rig.imageScale / 2 >= offscreenCanvas.height / renderScale || y + rig.imageOffsetY + rig.imageHeight * rig.imageScale / 2 <= 0) {
            return;
        }
        offscreenCtx.drawImage(Entity.images[rig.image], rig.animationStage * rig.imageWidth, rig.animationDirection * rig.imageHeight + rig.animationPhase * rig.animationDirections * rig.imageHeight, rig.imageWidth, rig.imageHeight, x + rig.imageOffsetX - rig.imageWidth * rig.imageScale / 2, y + rig.imageOffsetY - rig.imageHeight * rig.imageScale / 2, rig.imageWidth * rig.imageScale, rig.imageHeight * rig.imageScale);
    }
};
Rig.drawAbove = function(rig) {
    // TODO: what?
    // if (rig.render != null) {
    //     if (x - 8 * 4 >= offscreenCanvas.width / renderScale || x + 8 * 4 <= 0 || y - 12 * 4 - 5 * 4 >= offscreenCanvas.height / renderScale || y - 12 * 4 - 1 * 4 <= 0) {
    //         return;
    //     }
    // }
    // else {
    //     if (x - 8 * 4 >= offscreenCanvas.width / renderScale || x + 8 * 4 <= 0 || y + rig.imageOffsetY - rig.imageHeight * rig.imageScale / 2 - 5 * 4 >= offscreenCanvas.height / renderScale || y + rig.imageOffsetY - rig.imageHeight * rig.imageScale / 2 - 1 * 4 <= 0) {
    //         return;
    //     }
    // }
    var x = Math.round(rig.x) + cameraX;
    if (x - Math.max(8 * 4, rig.nameWidth / 2) >= offscreenCanvas.width / renderScale || x + Math.max(8 * 4, rig.nameWidth / 2) <= 0) {
        return;
    }
    var y = Math.round(rig.y) + cameraY - 4;
    if (rig.type != NPC) {
        y -= 5 * 4;
    }
    if (rig.render != null) {
        y -= 12 * 4;
    }
    else {
        y += rig.imageOffsetY - rig.imageHeight * rig.imageScale / 2;
    }
    if (y - 4 - rig.nameHeight >= offscreenCanvas.height / renderScale || y + 4 * 4 <= 0) {
        return;
    }
    offscreenCtx.drawImage(rig.nameRender, x - rig.nameWidth / 2, y - 4 - rig.nameHeight, rig.nameWidth, rig.nameHeight);
    if (rig.type == NPC) {
        return;
    }
    // only draw if on screen
    if (Math.abs(rig.hpEffect) < 0.1 / 14) {
        rig.hpEffect = 0;
    }
    else {
        rig.hpEffect *= 1 - (0.15 / interpolationSteps);
        if (rig.hpEffect < 0) {
            rig.hpEffect = 0;
        }
        // if (!rig.hpChange) {
        //     rig.hpEffect *= 0.9;
        // }
        // else if (rig.hpEffect > 0) {
        //     rig.hpEffect *= 0.95;
        // }
        // else {
        //     // rig.hpEffect *= 0.99 * Math.max(1 - Math.abs(rig.hpEffect) / rig.hpMax, 0.99);
        //     rig.hpEffect *= 0.99;
        // }
    }
    offscreenCtx.drawImage(Entity.images.healthBar, 0, 0, 16, 4, x - 8 * 4, y, 16 * 4, 4 * 4);
    offscreenCtx.drawImage(Entity.images.healthBar, 1, 5 + (rig.type == MONSTER ? 4 : 0), rig.hp / rig.hpMax * 14, 2, x - 7 * 4, y + 4, rig.hp / rig.hpMax * 14 * 4, 2 * 4);
    if (rig.hpEffect != 0) {
        offscreenCtx.fillStyle = "#ffffff";
        offscreenCtx.fillRect(x - 7 * 4 + rig.hp / rig.hpMax * 14 * 4, y + 4, (Math.min(rig.hp / rig.hpMax + rig.hpEffect, 1) - rig.hp / rig.hpMax) * 14 * 4, 2 * 4);
    }
};
Rig.drawDebug = function(rig) {
    if (rig.x - rig.width / 2 + cameraX >= offscreenCanvas.width / renderScale || rig.x + rig.width / 2 + cameraX <= 0 || rig.y - rig.height / 2 + cameraY >= offscreenCanvas.height / renderScale || rig.y + rig.height / 2 + cameraY <= 0) {
        return;
    }
    offscreenCtx.strokeRect(rig.x - rig.width / 2 + cameraX, rig.y - rig.height / 2 + cameraY, rig.width, rig.height);
};

var drawColoredPlayer = function(layer, color) {
    var buffer = createOffscreenCanvas(8 * 6, 16 * 8);
    var bufferCtx = buffer.getContext("2d");
    resetCanvas(bufferCtx);
    bufferCtx.drawImage(Entity.images.player, 0, layer * 16 * 8, 8 * 6, 16 * 8, 0, 0, 8 * 6, 16 * 8);
    bufferCtx.fillStyle = "rgba(" + color[0] + ", " + color[1] + ", " + color[2] + ", " + color[3] + ")";
    bufferCtx.globalCompositeOperation = "multiply";
    bufferCtx.fillRect(0, 0, 8 * 6, 16 * 8);
    bufferCtx.globalCompositeOperation = "destination-in";
    bufferCtx.drawImage(Entity.images.player, 0, layer * 16 * 8, 8 * 6, 16 * 8, 0, 0, 8 * 6, 16 * 8);
    return buffer;
};

var Projectile = function(param) {
    var self = new Entity(param);
    self.projectileId = param.projectileId;
    self.type = PROJECTILE;

    self.width = Projectile.data[self.projectileId].width;
    self.height = Projectile.data[self.projectileId].height;
    self.diagonal = Math.sqrt(Math.pow(self.width, 2) + Math.pow(self.height, 2));

    self.angle = param.angle;
    self.speedAngle = 0;

    self.animationStage = param.animationStage;
    self.animationPhase = param.animationPhase;

    self.image = Projectile.data[self.projectileId].image;
    self.imageWidth = Projectile.data[self.projectileId].imageWidth;
    self.imageHeight = Projectile.data[self.projectileId].imageHeight;
    self.imageOffsetX = Projectile.data[self.projectileId].imageOffsetX;
    self.imageOffsetY = Projectile.data[self.projectileId].imageOffsetY;
    self.imageScale = Projectile.data[self.projectileId].imageScale;

    return self;
};
Projectile.data = null;
Projectile.draw = function(projectile) {
    if (projectile.x - projectile.diagonal / 2 + cameraX >= offscreenCanvas.width / renderScale || projectile.x + projectile.diagonal / 2 + cameraX <= 0 || projectile.y - projectile.diagonal / 2 + cameraY >= offscreenCanvas.height / renderScale || projectile.y + projectile.diagonal / 2 + cameraY <= 0) {
        return;
    }
    offscreenCtx.translate(projectile.x + cameraX, projectile.y + cameraY);
    // offscreenCtx.setTransform(renderScale, 0, 0, renderScale, projectile.x * renderScale, projectile.y * renderScale);
    offscreenCtx.rotate(projectile.angle / 180 * Math.PI);
    offscreenCtx.drawImage(Entity.images[projectile.image], projectile.animationStage * projectile.imageWidth, projectile.animationPhase * projectile.imageHeight, projectile.imageWidth, projectile.imageHeight, projectile.imageOffsetX - projectile.width / 2, projectile.imageOffsetY - projectile.height / 2, projectile.imageWidth * projectile.imageScale, projectile.imageHeight * projectile.imageScale);
    offscreenCtx.setTransform(renderScale, 0, 0, renderScale, 0, 0);
    // offscreenCtx.rotate(-projectile.angle / 180 * Math.PI);
    // offscreenCtx.translate(-cameraX - projectile.x, -cameraY - projectile.y);
};
Projectile.drawDebug = function(projectile) {
    if (projectile.x - projectile.diagonal / 2 + cameraX >= offscreenCanvas.width / renderScale || projectile.x + projectile.diagonal / 2 + cameraX <= 0 || projectile.y - projectile.diagonal / 2 + cameraY >= offscreenCanvas.height / renderScale || projectile.y + projectile.diagonal / 2 + cameraY <= 0) {
        return;
    }
    offscreenCtx.translate(projectile.x + cameraX, projectile.y + cameraY);
    offscreenCtx.rotate(projectile.angle / 180 * Math.PI);
    offscreenCtx.strokeRect(-projectile.width / 2, -projectile.height / 2, projectile.width, projectile.height);
    offscreenCtx.setTransform(renderScale, 0, 0, renderScale, 0, 0);
};
Projectile.update = function(projectile) {
    if (projectile.interpolationSteps > 0) {
        projectile.angle += projectile.speedAngle;
    }
};

var DroppedItem = function(param) {
    var self = {
        id: param.id,
        x: param.x,
        y: param.y,
        layer: param.layer,
        item: param.item,
        type: DROPPED_ITEM,
        updated: true,
    };

    DroppedItem.renderStackSize(self);

    DroppedItem.list[self.id] = self;
    if (Entity.layers[self.layer] == null) {
        Entity.layers[self.layer] = [];
    }
    Entity.layers[self.layer].push(self);
    return self;
};
DroppedItem.list = {};
DroppedItem.renderStackSize = function(droppedItem) {
    offscreenCtx.font = "16px Miniset";
    var metrics = offscreenCtx.measureText(droppedItem.item.stackSize);
    droppedItem.nameWidth = metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight;
    droppedItem.nameHeight = metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent;
    droppedItem.nameRender = createOffscreenCanvas(Math.floor(droppedItem.nameWidth * renderScale), Math.floor(droppedItem.nameHeight * renderScale));
    var nameCtx = droppedItem.nameRender.getContext("2d");
    nameCtx.font = Math.floor(16 * renderScale) + "px Miniset";
    nameCtx.textBaseline = metrics.actualBoundingBoxDescent > 0 ? "bottom" : "alphabetic";
    nameCtx.fillStyle = "#ffffff";
    nameCtx.fillText(droppedItem.item.stackSize, 0, Math.floor(droppedItem.nameHeight * renderScale));
};
DroppedItem.draw = function(droppedItem, selected) {
    if (droppedItem.x - settings.droppedItemSize / 2 + cameraX >= offscreenCanvas.width / renderScale || droppedItem.x + settings.droppedItemSize / 2 + cameraX <= 0 || droppedItem.y - settings.droppedItemSize / 2 + cameraY >= offscreenCanvas.height / renderScale || droppedItem.y + settings.droppedItemSize / 2 + cameraY <= 0) {
        return;
    }
    offscreenCtx.drawImage(Entity.images[Inventory.data.items[droppedItem.item.id].image + (selected ? "Selected" : "")], droppedItem.x - settings.droppedItemSize / 2 + cameraX, droppedItem.y - settings.droppedItemSize / 2 + cameraY, settings.droppedItemSize, settings.droppedItemSize);
    offscreenCtx.drawImage(droppedItem.nameRender, droppedItem.x + settings.droppedItemSize / 2 - droppedItem.nameWidth + cameraX, droppedItem.y + settings.droppedItemSize / 2 - droppedItem.nameHeight + cameraY, droppedItem.nameWidth, droppedItem.nameHeight);
};
DroppedItem.drawDebug = function(droppedItem) {
    // TODO
};

var Light = function(x, y, map, size, alpha, colored, r, g, b) {
    var self = {
        id: Math.random(),
        x: x,
        y: y,
        chunkX: Math.floor(x / CHUNK_SIZE),
        chunkY: Math.floor(y / CHUNK_SIZE),
        map: map,
        size: size,
        flickerSize: size,
        alpha: alpha,
        flickerAlpha: alpha,
        colored: colored,
        r: r,
        g: g,
        b: b,
    };
    if (Light.list[self.map] == null) {
        Light.list[self.map] = {};
    }
    Light.list[self.map][self.id] = self;
    return self;
};
Light.list = [];
Light.drawAlpha = function(light) {
    var x = light.x + cameraX;
    var y = light.y + cameraY;
    if (x - light.size / 2 - 16 >= offscreenCanvas.width / renderScale || x + light.size / 2 + 16 <= 0 || y - light.size / 2 - 16 >= offscreenCanvas.height / renderScale || y + light.size / 2 + 16 <= 0) {
        return;
    }
    var radialGradient = offscreenLightCtx.createRadialGradient(x, y, 0, x, y, light.flickerSize / 2);
    radialGradient.addColorStop(1, "rgba(0, 0, 0, 0)");
    radialGradient.addColorStop(0, "rgba(0, 0, 0, " + light.flickerAlpha + ")");
    offscreenLightCtx.fillStyle = radialGradient;
    offscreenLightCtx.fillRect(x - light.flickerSize / 2, y - light.flickerSize / 2, light.flickerSize, light.flickerSize);
};
Light.drawColor = function(light) {
    var x = light.x + cameraX;
    var y = light.y + cameraY;
    if (x - light.size / 2 - 16 >= offscreenCanvas.width / renderScale || x + light.size / 2 + 16 <= 0 || y - light.size / 2 - 16 >= offscreenCanvas.height / renderScale || y + light.size / 2 + 16 <= 0) {
        return;
    }
    var radialGradient = offscreenLightCtx.createRadialGradient(x, y, 0, x, y, light.flickerSize / 2);
    radialGradient.addColorStop(1, "rgba(" + light.r + ", " + light.g + ", " + light.b + ", 0)");
    radialGradient.addColorStop(0, "rgba(" + light.r + ", " + light.g + ", " + light.b + ", " + light.flickerAlpha + ")");
    offscreenLightCtx.fillStyle = radialGradient;
    offscreenLightCtx.fillRect(x - light.flickerSize / 2, y - light.flickerSize / 2, light.flickerSize, light.flickerSize);
};
Light.update = function(light) {
    if (light.chunkX < selfPlayer.chunkX - settings.renderDistance || light.chunkX > selfPlayer.chunkX + settings.renderDistance || light.chunkY < selfPlayer.chunkY - settings.renderDistance || light.chunkY > selfPlayer.chunkY + settings.renderDistance) {
        delete Lights.list[light.id];
        return;
    }
    if (settings.flickeringLights) {
        light.flickerSize = Math.round(Math.max(Math.min(light.flickerSize + Math.random() * 2 - 1, light.size + 32), light.size - 32, 1));
        light.flickerAlpha = Math.max(Math.min(light.flickerAlpha + Math.random() * 0.04 - 0.02, light.alpha + 0.1, 1), light.alpha - 0.1, 0);
    }
};
const entityAlphaSize = 512;
Light.drawEntityAlpha = function(entity) {
    var x = entity.x + cameraX;
    var y = entity.y + cameraY;
    if (x - entityAlphaSize / 2 >= offscreenCanvas.width / renderScale || x + entityAlphaSize / 2 <= 0 || y - entityAlphaSize / 2 >= offscreenCanvas.height / renderScale || y + entityAlphaSize / 2 <= 0) {
        return;
    }
    var radialGradient = offscreenLightCtx.createRadialGradient(x, y, 0, x, y, entityAlphaSize / 2);
    radialGradient.addColorStop(1, "rgba(0, 0, 0, 0)");
    radialGradient.addColorStop(0, "rgba(0, 0, 0, 1)");
    offscreenLightCtx.fillStyle = radialGradient;
    offscreenLightCtx.fillRect(x - entityAlphaSize / 2, y - entityAlphaSize / 2, entityAlphaSize, entityAlphaSize);
};

var AnimatedTile = function(x, y, layer, tile) {
    var self = {
        id: Math.random(),
        x: x * TILE_SIZE,
        y: y * TILE_SIZE,
        layer: layer,
        chunkX: Math.floor(x / CHUNK_SIZE),
        chunkY: Math.floor(y / CHUNK_SIZE),
        tile: tile,
        time: 0,
        index: 0,
    };
    AnimatedTile.list[self.id] = self;
    return self;
};
AnimatedTile.list = {};
AnimatedTile.update = function(animatedTile) {
    if (animatedTile.chunkX < selfPlayer.chunkX - settings.renderDistance || animatedTile.chunkX > selfPlayer.chunkX + settings.renderDistance || animatedTile.chunkY < selfPlayer.chunkY - settings.renderDistance || animatedTile.chunkY > selfPlayer.chunkY + settings.renderDistance) {
        delete AnimatedTile.list[animatedTile.id];
        return;
    }
    let timings = tileset[animatedTile.tile].animation.timings;
    if (performance.now() - animatedTile.time > timings[animatedTile.index]) {
        animatedTile.time += timings[animatedTile.index];
        animatedTile.index = (animatedTile.index + 1) % timings.length;
    }
    if (performance.now() - animatedTile.time > timings[animatedTile.index]) {
        animatedTile.time = performance.now();
    }
    offscreenCtx.drawImage(tileset[animatedTile.tile].animation.image, animatedTile.index * 16, 0, 16, 16, animatedTile.x + cameraX, animatedTile.y + cameraY, TILE_SIZE, TILE_SIZE);
};

var Particle = function(x, y, layer, type, value) {
    var self = {
        id: Math.random(),
        x: x,
        y: y,
        speedX: 0,
        speedY: 0,
        accelerationX: 0,
        accelerationY: 0,
        decayX: 0,
        decayY: 0,
        layer: layer,
        chunkX: Math.floor(x / CHUNK_SIZE),
        chunkY: Math.floor(y / CHUNK_SIZE),
        type: type,
        value: value,
        width: 0,
        height: 0,
        opacity: 1,
        speedOpacity: 0,
    };
    switch (self.type) {
        case PARTICLE_DAMAGE: {
            self.speedX = Math.random() * 8 - 4;
            self.speedY = -20;
            self.decayX = 0.03;
            self.accelerationY = 2;
            self.speedOpacity = 0.06;
            break;
        }
        case PARTICLE_CRIT_DAMAGE: {
            self.speedX = Math.random() * 8 - 4;
            self.speedY = -20;
            self.decayX = 0.02;
            self.accelerationY = 1.5;
            self.speedOpacity = 0.04;
            break;
        }
        case PARTICLE_HEAL: {
            self.speedX = Math.random() * 8 - 4;
            self.speedY = -20;
            self.decayX = 0.03;
            self.accelerationY = 2;
            self.speedOpacity = 0.06;
            break;
        }
        case PARTICLE_TELEPORT: {
            var angle = Math.random() * 2 * Math.PI;
            var magnitude = Math.random() * 3;
            self.speedX = Math.cos(angle) * magnitude;
            self.speedY = Math.sin(angle) * magnitude;
            var size = Math.random() * 10 + 10;
            self.width = size;
            self.height = size;
            self.decayX = 0.05;
            self.decayY = 0.05;
            self.opacity = Math.random() * 0.5 + 1;
            self.speedOpacity = 0.03;
            break;
        }
        case PARTICLE_EXPLOSION: {
            var angle = Math.random() * 2 * Math.PI;
            var magnitude = Math.random() * self.value / 10;
            self.speedX = Math.cos(angle) * magnitude;
            self.speedY = Math.sin(angle) * magnitude;
            var size = Math.random() * 10 + 20;
            self.width = size;
            self.height = size;
            self.decayX = 0.15;
            self.decayY = 0.15;
            self.opacity = Math.random() * 1 + 1;
            self.speedOpacity = 0.04;
            self.value = Math.floor(Math.random() * 5);
            if (self.value < 2) {
                self.opacity -= 0.5;
            }
            break;
        }
        case PARTICLE_FIRE: {
            self.speedX = Math.random() * 8 - 4;
            self.speedY = -Math.random() - 1;
            var size = Math.random() * 10 + 20;
            self.width = size;
            self.height = size;
            self.decayX = 0.15;
            self.opacity = Math.random() * 1;
            self.speedOpacity = 0.0075;
            self.value += Math.floor(Math.random() * 75) - 25;
            if (self.value < 10) {
                self.opacity -= 0.25;
            }
            break;
        }
    }
    Particle.renderText(self);
    if (Particle.layers[self.layer] == null) {
        Particle.layers[self.layer] = {};
    }
    Particle.layers[self.layer][self.id] = self;
    return self;
};
Particle.layers = [];
Particle.renderText = function(particle) {
    switch (particle.type) {
        case PARTICLE_DAMAGE: {
            offscreenCtx.font = "24px Miniset";
            var metrics = offscreenCtx.measureText("-" + particle.value);
            particle.width = metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight;
            particle.height = metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent;
            particle.render = createOffscreenCanvas(Math.floor(particle.width * renderScale), Math.floor(particle.height * renderScale));
            var renderCtx = particle.render.getContext("2d");
            renderCtx.font = Math.floor(12 * renderScale) * 2 + "px Miniset";
            renderCtx.textBaseline = metrics.actualBoundingBoxDescent > 0 ? "bottom" : "alphabetic";
            renderCtx.fillStyle = "#ff0000";
            renderCtx.fillText("-" + particle.value, 0, Math.floor(particle.height * renderScale));
            break;
        }
        case PARTICLE_CRIT_DAMAGE: {
            offscreenCtx.font = "bold 36px Miniset";
            var metrics = offscreenCtx.measureText("-" + particle.value);
            particle.width = metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight;
            particle.height = metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent;
            particle.render = createOffscreenCanvas(Math.floor(particle.width * renderScale), Math.floor(particle.height * renderScale));
            var renderCtx = particle.render.getContext("2d");
            renderCtx.font = "bold " + Math.floor(12 * renderScale) * 3 + "px Miniset";
            renderCtx.textBaseline = metrics.actualBoundingBoxDescent > 0 ? "bottom" : "alphabetic";
            renderCtx.fillStyle = "#ffff00";
            renderCtx.fillText("-" + particle.value, 0, Math.floor(particle.height * renderScale));
            break;
        }
        case PARTICLE_HEAL: {
            offscreenCtx.font = "24px Miniset";
            var metrics = offscreenCtx.measureText("+" + particle.value);
            particle.width = metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight;
            particle.height = metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent;
            particle.render = createOffscreenCanvas(Math.floor(particle.width * renderScale), Math.floor(particle.height * renderScale));
            var renderCtx = particle.render.getContext("2d");
            renderCtx.font = Math.floor(12 * renderScale) * 2 + "px Miniset";
            renderCtx.textBaseline = metrics.actualBoundingBoxDescent > 0 ? "bottom" : "alphabetic";
            renderCtx.fillStyle = "#00ff00";
            renderCtx.fillText("+" + particle.value, 0, Math.floor(particle.height * renderScale));
            break;
        }
    }
};
Particle.spread = function(particle, magnitude) {
    var angle = Math.random() * 2 * Math.PI;
    particle.x += Math.cos(angle) * magnitude;
    particle.y += Math.sin(angle) * magnitude;
};
Particle.draw = function(particle) {
    var x = Math.round(particle.x) + cameraX;
    var y = Math.round(particle.y) + cameraY;
    if (x - particle.width / 2 >= offscreenCanvas.width / renderScale || x + particle.width / 2 <= 0 || y - particle.height / 2 >= offscreenCanvas.height / renderScale || y + particle.height / 2 <= 0) {
        return;
    }
    offscreenCtx.globalAlpha = particle.opacity;
    if (particle.render != null) {
        offscreenCtx.drawImage(particle.render, x - particle.width / 2, y - particle.height / 2, particle.width, particle.height);
    }
    switch (particle.type) {
        case PARTICLE_DAMAGE:
        case PARTICLE_CRIT_DAMAGE:
        case PARTICLE_HEAL:
            break;
        case PARTICLE_TELEPORT:
            offscreenCtx.fillStyle = "#9900cc";
            offscreenCtx.fillRect(x - particle.width / 2, y - particle.height / 2, particle.width, particle.height);
            break;
        case PARTICLE_EXPLOSION:
            if (particle.value == 0) {
                offscreenCtx.fillStyle = "#ff3333";
            }
            else if (particle.value == 1) {
                offscreenCtx.fillStyle = "#ffaa33";
            }
            else if (particle.value == 2) {
                offscreenCtx.fillStyle = "#ffffff";
            }
            else if (particle.value == 3) {
                offscreenCtx.fillStyle = "#999999";
            }
            else if (particle.value == 4) {
                offscreenCtx.fillStyle = "#333333";
            }
            offscreenCtx.fillRect(x - particle.width / 2, y - particle.height / 2, particle.width, particle.height);
            break;
        case PARTICLE_FIRE:
            offscreenCtx.fillStyle = "rgb(" + (255 - particle.value) + ", " + Math.max(170 - particle.value, 51) + ", 51)";
            offscreenCtx.fillRect(x - particle.width / 2, y - particle.height / 2, particle.width, particle.height);
            break;
    }
};
Particle.update = function(particle) {
    if (particle.chunkX < selfPlayer.chunkX - settings.renderDistance || particle.chunkX > selfPlayer.chunkX + settings.renderDistance || particle.chunkY < selfPlayer.chunkY - settings.renderDistance || particle.chunkY > selfPlayer.chunkY + settings.renderDistance) {
        delete Particle.layers[particle.layer][particle.id];
        return;
    }
    particle.speedX += particle.accelerationX / interpolationSteps;
    particle.speedX *= 1 - particle.decayX / interpolationSteps;
    particle.speedY += particle.accelerationY / interpolationSteps;
    particle.speedY *= 1 - particle.decayY / interpolationSteps;
    particle.x += particle.speedX / interpolationSteps;
    particle.y += particle.speedY / interpolationSteps;
    particle.chunkX = Math.floor(particle.x / CHUNK_SIZE);
    particle.chunkY = Math.floor(particle.y / CHUNK_SIZE);
    switch (particle.type) {
        case PARTICLE_DAMAGE:
        case PARTICLE_CRIT_DAMAGE:
            break;
        case PARTICLE_FIRE:
            particle.value += 1;
            break;
    }
    Particle.draw(particle);
    particle.opacity -= particle.speedOpacity / interpolationSteps;
    if (particle.opacity <= 0) {
        delete Particle.layers[particle.layer][particle.id];
    }
};

var ParticleGenerator = function(x, y, layer, map, type, value, speed, spread) {
    var self = {
        id: Math.random(),
        x: x,
        y: y,
        layer: layer,
        map,
        chunkX: Math.floor(x / CHUNK_SIZE),
        chunkY: Math.floor(y / CHUNK_SIZE),
        type: type,
        value: value,
        speed: speed,
        spread: spread,
        cooldown: 0,
    };
    if (ParticleGenerator.list[self.map] == null) {
        ParticleGenerator.list[self.map] = {};
    }
    ParticleGenerator.list[self.map][self.id] = self;
    return self;
};
ParticleGenerator.list = [];
ParticleGenerator.update = function(particleGenerator) {
    if (particleGenerator.chunkX < selfPlayer.chunkX - settings.renderDistance || particleGenerator.chunkX > selfPlayer.chunkX + settings.renderDistance || particleGenerator.chunkY < selfPlayer.chunkY - settings.renderDistance || particleGenerator.chunkY > selfPlayer.chunkY + settings.renderDistance) {
        delete ParticleGenerator.list[particleGenerator.id];
        return;
    }
    if (particleGenerator.cooldown == 0) {
        Particle.spread(new Particle(particleGenerator.x, particleGenerator.y, particleGenerator.layer, particleGenerator.type, particleGenerator.value), particleGenerator.spread);
        particleGenerator.cooldown = particleGenerator.speed;
    }
    particleGenerator.cooldown -= 1;
};
// built-in types
// TORCH_LEFT
// CAMPFIRE
// WARPER
// SUPER_SECRET_STUFF