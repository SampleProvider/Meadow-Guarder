
// all monsters and items will use number ids

const e = require("express");

// TODO: replace for i in with for i = 0; I < length

const pathfinder = new PF.JumpPointFinder(PF.JPFMoveDiagonallyIfNoObstacles);

var globalId = 0;
entityPack = [];
particlePack = [];
droppedItemPack = [];

Entity = function() {
    var self = {
        id: globalId,
        type: ENTITY,
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
        lastChunkX: 0,
        lastChunkY: 0,
        width: 0,
        height: 0,
        layer: 0,
        lastLayer: 0,
        map: 0,
        lastMap: 0,
        physicsInaccuracy: 1,
    };
    globalId++;
    self.id = Math.random();
    return self;
};
Entity.init = function(entity) {
    entity.gridX = Math.floor(entity.x / TILE_SIZE);
    entity.gridY = Math.floor(entity.y / TILE_SIZE);
    entity.chunkX = Math.floor(entity.x / CHUNK_SIZE);
    entity.chunkY = Math.floor(entity.y / CHUNK_SIZE);
    Entity.addChunks(entity);
    switch (entity.type) {
        case PLAYER:
            Player.list[entity.id] = entity;
            break;
        case NPC:
            Npc.list[entity.id] = entity;
            break;
        case MONSTER:
            Monster.list[entity.id] = entity;
            break;
        case PROJECTILE:
            Projectile.list[entity.id] = entity;
            break;
        case DROPPED_ITEM:
            DroppedItem.list[entity.id] = entity;
            break;
        default:
            error("Invalid type " + entity.type + ".");
            break;
    }
};
Entity.update = function() {
    for (var i in maps) {
        entityPack[i] = {};
        particlePack[i] = {};
        droppedItemPack[i] = {};
    }
    // update order
    // projectiles
    // player
    // monster
    for (var i in spawners) {
        spawners[i].timer -= 1;
        if (spawners[i].timer == 0) {
            var totalWeight = 0;
            for (var j in spawners[i].monsters) {
                totalWeight += Monster.data[spawners[i].monsters[j]].spawnWeight;
            }
            var monsterId = Math.floor(Math.random() * totalWeight);
            for (var j in spawners[i].monsters) {
                totalWeight -= Monster.data[spawners[i].monsters[j]].spawnWeight;
                if (monsterId >= totalWeight) {
                    monsterId = spawners[i].monsters[j];
                    break;
                }
            }
            new Monster(monsterId, spawners[i].x * TILE_SIZE + TILE_SIZE / 2, spawners[i].y * TILE_SIZE + TILE_SIZE / 2, spawners[i].layer, spawners[i].map, i);
            Entity.addParticle({
                x: spawners[i].x,
                y: spawners[i].y,
                layer: spawners[i].layer,
                map: spawners[i].map,
                type: PARTICLE_SPAWN,
            });
        }
    }
    var totalStart = performance.now();
    var playerStart = performance.now();
    for (var i in Player.list) {
        Player.list[i].cameraShakeMagnitude = 0;
        Player.list[i].cameraShakeDecay = 0;
        Player.list[i].cameraFlash = [];
    }
    for (var i in Player.list) {
        // TODO
        if (Player.list[i].tick < tick - ENV.desyncBuffer && Player.list[i].tick != -1) {
            Player.list[i].tick += 1;
            Player.update(Player.list[i]);
        }
        let player = Player.list[i];
        if (!player.loading) {
            Entity.addEntity(player, {
                id: player.id,
                type: PLAYER,
                x: player.x,
                y: player.y,
                layer: player.layer,
                animationStage: Math.floor(player.animationStage),
                animationDirection: player.animationDirection,
                animationPhase: player.animationPhase,
                name: player.name,
                customizations: player.customizations,
                hp: player.hp,
                hpMax: player.hpMax,
            });
        }
    }
    var playerEnd = performance.now();
    var monsterStart = performance.now();
    for (var i in Monster.list) {
        Monster.update(Monster.list[i]);
    }
    var monsterEnd = performance.now();
    playerStart += performance.now() - playerEnd;
    for (var i in Player.list) {
        Player.updateCollisions(Player.list[i]);
    }
    playerEnd = performance.now();
    monsterStart += performance.now() - monsterEnd;
    for (var i in Monster.list) {
        Monster.updateCollisions(Monster.list[i]);
    }
    monsterEnd = performance.now();
    for (var i in Npc.list) {
        Npc.update(Npc.list[i]);
    }
    var projectileStart = performance.now();
    for (var i in Projectile.list) {
        Projectile.update(Projectile.list[i]);
    }
    var projectileEnd = performance.now();
    for (var i in DroppedItem.list) {
        DroppedItem.update(DroppedItem.list[i]);
    }
    var totalEnd = performance.now();
    debugData = {
        tps: TPS,
        heap: Math.round(process.memoryUsage().heapUsed / 1048576 * 100) / 100 + "/" + Math.round(process.memoryUsage().rss / 1048576 * 100) / 100,
        total: Math.round(totalEnd - totalStart),
        player: Math.round(playerEnd - playerStart),
        monster: Math.round(monsterEnd - monsterStart),
        projectile: Math.round(projectileEnd - projectileStart),
    };
};
Entity.updateLastPosition = function(entity) {
    entity.lastChunkX = entity.chunkX;
    entity.lastChunkY = entity.chunkY;
    entity.lastLayer = entity.layer;
    entity.lastMap = entity.map;
};
Entity.addChunks = function(entity) {
    var chunks = null;
    switch (entity.type) {
        case PLAYER:
            chunks = Player.chunks;
            break;
        case NPC:
            chunks = Npc.chunks;
            break;
        case MONSTER:
            chunks = Monster.chunks;
            break;
        case PROJECTILE:
            chunks = Projectile.chunks;
            break;
        case DROPPED_ITEM:
            chunks = DroppedItem.chunks;
            break;
        default:
            error("Invalid type " + entity.type + ".");
            return;
    }
    if (chunks[entity.map] == null) {
        chunks[entity.map] = [];
    }
    if (chunks[entity.map][entity.chunkY] == null) {
        chunks[entity.map][entity.chunkY] = [];
    }
    if (chunks[entity.map][entity.chunkY][entity.chunkX] == null) {
        chunks[entity.map][entity.chunkY][entity.chunkX] = [];
    }
    chunks[entity.map][entity.chunkY][entity.chunkX][entity.id] = entity;
};
Entity.updateChunks = function(entity) {
    if (entity.chunkX != entity.lastChunkX || entity.chunkY != entity.lastChunkY || entity.map != entity.lastMap) {
        switch (entity.type) {
            case PLAYER:
                delete Player.chunks[entity.lastMap][entity.lastChunkY][entity.lastChunkX][entity.id];
                break;
            case NPC:
                delete Npc.chunks[entity.lastMap][entity.lastChunkY][entity.lastChunkX][entity.id];
                break;
            case MONSTER:
                delete Monster.chunks[entity.lastMap][entity.lastChunkY][entity.lastChunkX][entity.id];
                break;
            case PROJECTILE:
                delete Projectile.chunks[entity.lastMap][entity.lastChunkY][entity.lastChunkX][entity.id];
                break;
            default:
                error("Invalid type " + entity.type + ".");
                return;
        }
        Entity.addChunks(entity);
    }
};
Entity.delete = function(entity) {
    switch (entity.type) {
        case PLAYER:
            delete Player.list[entity.id];
            delete Player.chunks[entity.lastMap][entity.lastChunkY][entity.lastChunkX][entity.id];
            break;
        case NPC:
            delete Npc.list[entity.id];
            delete Npc.chunks[entity.lastMap][entity.lastChunkY][entity.lastChunkX][entity.id];
            break;
        case MONSTER:
            delete Monster.list[entity.id];
            delete Monster.chunks[entity.lastMap][entity.lastChunkY][entity.lastChunkX][entity.id];
            break;
        case PROJECTILE:
            delete Projectile.list[entity.id];
            delete Projectile.chunks[entity.lastMap][entity.lastChunkY][entity.lastChunkX][entity.id];
            break;
        case DROPPED_ITEM:
            delete DroppedItem.list[entity.id];
            delete DroppedItem.chunks[entity.map][entity.chunkY][entity.chunkX][entity.id];
            break;
        default:
            error("Invalid type " + entity.type + ".");
            break;
    }
};
Entity.addEntity = function(entity, data) {
    for (var y = Math.floor((entity.y - entity.height / 2) / CHUNK_SIZE); y < Math.ceil((entity.y + entity.height / 2) / CHUNK_SIZE); y++) {
        if (entityPack[entity.map][y] == null) {
            entityPack[entity.map][y] = [];
        }
        for (var x = Math.floor((entity.x - entity.width / 2) / CHUNK_SIZE); x < Math.ceil((entity.x + entity.width / 2) / CHUNK_SIZE); x++) {
            if (entityPack[entity.map][y][x] == null) {
                entityPack[entity.map][y][x] = [];
            }
            entityPack[entity.map][y][x].push(data);
        }
    }
};
Entity.addDroppedItem = function(droppedItem, data) {
    for (var y = Math.floor((droppedItem.y - droppedItem.height / 2) / CHUNK_SIZE); y < Math.ceil((droppedItem.y + droppedItem.height / 2) / CHUNK_SIZE); y++) {
        if (droppedItemPack[droppedItem.map][y] == null) {
            droppedItemPack[droppedItem.map][y] = [];
        }
        for (var x = Math.floor((droppedItem.x - droppedItem.width / 2) / CHUNK_SIZE); x < Math.ceil((droppedItem.x + droppedItem.width / 2) / CHUNK_SIZE); x++) {
            if (droppedItemPack[droppedItem.map][y][x] == null) {
                droppedItemPack[droppedItem.map][y][x] = [];
            }
            droppedItemPack[droppedItem.map][y][x].push(data);
        }
    }
};
Entity.addParticle = function(particle) {
    if (particlePack[particle.map][Math.floor(particle.y / CHUNK_SIZE)] == null) {
        particlePack[particle.map][Math.floor(particle.y / CHUNK_SIZE)] = [];
    }
    if (particlePack[particle.map][Math.floor(particle.y / CHUNK_SIZE)][Math.floor(particle.x / CHUNK_SIZE)] == null) {
        particlePack[particle.map][Math.floor(particle.y / CHUNK_SIZE)][Math.floor(particle.x / CHUNK_SIZE)] = [];
    }
    particlePack[particle.map][Math.floor(particle.y / CHUNK_SIZE)][Math.floor(particle.x / CHUNK_SIZE)].push(particle);
};
Entity.searchChunks = function(chunks, x, y, map, range, callback) {
    if (chunks[map] == null) {
        return;
    }
    for (var i = y - range + 1; i < y + range; i++) {
        if (chunks[map][i] == null) {
            continue;
        }
        for (var j = x - range + 1; j < x + range; j++) {
            if (chunks[map][i][j] == null) {
                continue;
            }
            for (var k in chunks[map][i][j]) {
                if (callback(chunks[map][i][j][k])) {
                    return;
                }
            }
        }
    }
};
Entity.searchHitboxChunks = function(chunks, x, y, width, height, map, callback) {
    if (chunks[map] == null) {
        return;
    }
    for (var i = Math.floor((y - height / 2 - ENV.hitboxBuffer) / CHUNK_SIZE); i < Math.ceil((y + height / 2 + ENV.hitboxBuffer) / CHUNK_SIZE); i++) {
        if (chunks[map][i] == null) {
            continue;
        }
        for (var j = Math.floor((x - width / 2 - ENV.hitboxBuffer) / CHUNK_SIZE); j < Math.ceil((x + width / 2 + ENV.hitboxBuffer) / CHUNK_SIZE); j++) {
            if (chunks[map][i][j] == null) {
                continue;
            }
            for (var k in chunks[map][i][j]) {
                if (callback(chunks[map][i][j][k])) {
                    return;
                }
            }
        }
    }
};
Entity.getDistance = function(entity1, entity2) {
    return Math.sqrt(Math.pow(entity1.x - entity2.x, 2) + Math.pow(entity1.y - entity2.y, 2));
};
Entity.getDistanceSquared = function(entity1, entity2) {
    return Math.pow(entity1.x - entity2.x, 2) + Math.pow(entity1.y - entity2.y, 2);
};
Entity.getSquareDistance = function(entity1, entity2) {
    return Math.min(entity1.x - entity2.x + entity1.y - entity2.y);
};
Entity.move = function(entity, slide) {
    // var max = Math.ceil(Math.max(Math.abs(entity.speedX), Math.abs(entity.speedY)) / entity.physicsInaccuracy / ENV.physicsInaccuracy);
    var max = Math.ceil(Math.max(Math.abs(entity.speedX) / entity.width, Math.abs(entity.speedY) / entity.height));
    if (max != 0) {
        var speedX = entity.speedX / max;
        var speedY = entity.speedY / max;
        var collided = false;
        for (var i = 0; i < max; i += 1) {
            entity.lastX = entity.x;
            entity.lastY = entity.y;
            if (slide) {
                entity.x += speedX;
                entity.gridX = Math.floor(entity.x / TILE_SIZE);
                if (Entity.collideWithMap(entity, entity.speedX, 0, slide)) {
                    collided = true;
                }
                entity.y += speedY;
                entity.gridY = Math.floor(entity.y / TILE_SIZE);
                if (Entity.collideWithMap(entity, 0, entity.speedY, slide)) {
                    collided = true;
                }
            }
            else {
                entity.x += speedX;
                entity.y += speedY;
                entity.gridX = Math.floor(entity.x / TILE_SIZE);
                entity.gridY = Math.floor(entity.y / TILE_SIZE);
                if (Entity.collideWithMap(entity, entity.speedX, entity.speedY, slide)) {
                    collided = true;
                    break;
                }
            }
            // if (Entity.collideWithMap(entity, entity.speedX, entity.speedY, slide)) {
            //     collided = true;
            //     if (slide) {
            //         if (entity.x != entity.lastX + speedX) {
            //             Entity.collideWithMap(entity, 0, entity.speedY, slide);
            //         }
            //         else {
            //             Entity.collideWithMap(entity, entity.speedX, 0, slide);
            //         }
            //     }
            //     if (!slide) {
            //         break;
            //     }
            // }
            // if (Entity.collideWithMap(entity)) {
            //     collided = true;
            //     entity.x = Math.round(entity.lastX);
            //     if (Entity.collisionMap(entity)) {
            //         entity.x += speedX;
            //         entity.y = Math.round(entity.lastY);
            //         if (Entity.collisionMap(entity)) {
            //             entity.x = Math.round(entity.lastX);
            //         }
            //     }
            // }
            if (Entity.collideWithMapEffects(entity)) {
                break;
            }
            if (entity.x == entity.lastX && entity.y == entity.lastY) {
                break;
            }
        }
    }
    entity.chunkX = Math.floor(entity.x / CHUNK_SIZE);
    entity.chunkY = Math.floor(entity.y / CHUNK_SIZE);
    Entity.updateChunks(entity);
    return collided;
};
Entity.collisionStop = function(entity) {
    var max = Math.ceil(Math.max(Math.abs(entity.speedX), Math.abs(entity.speedY)) / entity.physicsInaccuracy / ENV.physicsInaccuracy);
    if (max != 0) {
        var speedX = entity.speedX / max;
        var speedY = entity.speedY / max;
        for (var i = 0; i < max; i += 1) {
            entity.lastX = entity.x;
            entity.lastY = entity.y;
            entity.x += speedX;
            entity.y += speedY;
            entity.gridX = Math.floor(entity.x / TILE_SIZE);
            entity.gridY = Math.floor(entity.y / TILE_SIZE);
            if (Entity.collisionMap(entity)) {
                entity.chunkX = Math.floor(entity.x / CHUNK_SIZE);
                entity.chunkY = Math.floor(entity.y / CHUNK_SIZE);
                Entity.updateChunks(entity);
                return true;
            }
        }
    }
    entity.chunkX = Math.floor(entity.x / CHUNK_SIZE);
    entity.chunkY = Math.floor(entity.y / CHUNK_SIZE);
    Entity.updateChunks(entity);
    return false;
};
Entity.collisionPoint = function(entity, x, y) {
    if (entity.x - entity.width / 2 >= x) {
        return false;
    }
    if (entity.x + entity.width / 2 <= x) {
        return false;
    }
    if (entity.y - entity.height / 2 >= y) {
        return false;
    }
    if (entity.y + entity.height / 2 <= y) {
        return false;
    }
    return true;
};
Entity.collideWithEntity = function(entity1, entity2) {
    if (entity1.x - entity1.width / 2 >= entity2.x + entity2.width / 2) {
        return false;
    }
    if (entity2.x - entity2.width / 2 >= entity1.x + entity1.width / 2) {
        return false;
    }
    if (entity1.y - entity1.height / 2 >= entity2.y + entity2.height / 2) {
        return false;
    }
    if (entity2.y - entity2.height / 2 >= entity1.y + entity1.height / 2) {
        return false;
    }
    return true;
};
Entity.collisionMap = function(entity) {
    if (collisions[entity.map] == null) {
        return false;
    }
    if (collisions[entity.map][entity.layer] == null) {
        return false;
    }
    for (var y = Math.floor((entity.y - entity.height / 2) / TILE_SIZE); y < Math.ceil((entity.y + entity.height / 2) / TILE_SIZE); y++) {
        if (collisions[entity.map][entity.layer][y] == null) {
            continue;
        }
        for (var x = Math.floor((entity.x - entity.width / 2) / TILE_SIZE); x < Math.ceil((entity.x + entity.width / 2) / TILE_SIZE); x++) {
            if (collisions[entity.map][entity.layer][y][x] == null) {
                continue;
            }
            for (let i in collisions[entity.map][entity.layer][y][x]) {
                let collision = collisions[entity.map][entity.layer][y][x][i];
                if (collision.slowdown) {
                    continue;
                }
                if (entity.x - entity.width / 2 < x * TILE_SIZE + collision.x + collision.width && entity.x + entity.width / 2 > x * TILE_SIZE + collision.x && entity.y - entity.height / 2 < y * TILE_SIZE + collision.y + collision.height && entity.y + entity.height / 2 > y * TILE_SIZE + collision.y) {
                    return true;
                }
            }
            // switch (collisions[entity.map][entity.layer][y][x]) {
            //     case 0:
            //         break;
            //     case 2191:
            //     case 2449:
            //         return true;
            //     case 2192:
            //     case 2450:
            //         if (entity.x - entity.width / 2 < x * TILE_SIZE + TILE_SIZE / 2) {
            //             return true;
            //         }
            //         break;
            //     case 2193:
            //     case 2451:
            //         if (entity.x + entity.width / 2 > x * TILE_SIZE + TILE_SIZE / 2) {
            //             return true;
            //         }
            //         break;
            //     case 2194:
            //     case 2452:
            //         if (entity.y - entity.height / 2 < y * TILE_SIZE + TILE_SIZE / 2) {
            //             return true;
            //         }
            //         break;
            //     case 2195:
            //     case 2453:
            //         if (entity.y + entity.height / 2 > y * TILE_SIZE + TILE_SIZE / 2) {
            //             return true;
            //         }
            //         break;
            //     case 2196:
            //         if (entity.x - entity.width / 2 < x * TILE_SIZE + TILE_SIZE / 2 || entity.y - entity.height / 2 < y * TILE_SIZE + TILE_SIZE / 2) {
            //             return true;
            //         }
            //         break;
            //     case 2197:
            //         if (entity.x + entity.width / 2 > x * TILE_SIZE + TILE_SIZE / 2 || entity.y - entity.height / 2 < y * TILE_SIZE + TILE_SIZE / 2) {
            //             return true;
            //         }
            //         break;
            //     case 2198:
            //         if (entity.x - entity.width / 2 < x * TILE_SIZE + TILE_SIZE / 2 || entity.y + entity.height / 2 > y * TILE_SIZE + TILE_SIZE / 2) {
            //             return true;
            //         }
            //         break;
            //     case 2199:
            //         if (entity.x + entity.width / 2 > x * TILE_SIZE + TILE_SIZE / 2 || entity.y + entity.height / 2 > y * TILE_SIZE + TILE_SIZE / 2) {
            //             return true;
            //         }
            //         break;
            //     case 2277:
            //         if (entity.x - entity.width / 2 < x * TILE_SIZE + TILE_SIZE * 3 / 4 && entity.x + entity.width / 2 > x * TILE_SIZE + TILE_SIZE / 4) {
            //             return true;
            //         }
            //         break;
            //     case 2278:
            //         if (entity.x - entity.width / 2 < x * TILE_SIZE + TILE_SIZE / 2 && entity.y - entity.height / 2 < y * TILE_SIZE + TILE_SIZE / 2) {
            //             return true;
            //         }
            //         break;
            //     case 2279:
            //         if (entity.x + entity.width / 2 > x * TILE_SIZE + TILE_SIZE / 2 && entity.y - entity.height / 2 < y * TILE_SIZE + TILE_SIZE / 2) {
            //             return true;
            //         }
            //         break;
            //     case 2280:
            //         if (entity.x - entity.width / 2 < x * TILE_SIZE + TILE_SIZE / 2 && entity.y + entity.height / 2 > y * TILE_SIZE + TILE_SIZE / 2) {
            //             return true;
            //         }
            //         break;
            //     case 2281:
            //         if (entity.x + entity.width / 2 > x * TILE_SIZE + TILE_SIZE / 2 && entity.y + entity.height / 2 > y * TILE_SIZE + TILE_SIZE / 2) {
            //             return true;
            //         }
            //         break;
            //     case 2282:
            //         if (entity.x - entity.width / 2 < x * TILE_SIZE + TILE_SIZE * 7 / 8 && entity.x + entity.width / 2 > x * TILE_SIZE + TILE_SIZE / 8 && entity.y + entity.height / 2 > y * TILE_SIZE + TILE_SIZE / 4) {
            //             return true;
            //         }
            //         break;
            //     case 2283:
            //         if (entity.x - entity.width / 2 < x * TILE_SIZE + TILE_SIZE * 7 / 8 && entity.x + entity.width / 2 > x * TILE_SIZE + TILE_SIZE / 8 && entity.y + entity.height / 2 > y * TILE_SIZE + TILE_SIZE / 8) {
            //             return true;
            //         }
            //         break;
            //     case 2284:
            //         if (entity.y - entity.height / 2 < y * TILE_SIZE + TILE_SIZE * 15 / 16 && entity.y + entity.height / 2 > y * TILE_SIZE + TILE_SIZE / 2) {
            //             return true;
            //         }
            //         break;
            //     case 2285:
            //         if (entity.y - entity.height / 2 < y * TILE_SIZE + TILE_SIZE * 7 / 16) {
            //             return true;
            //         }
            //         break;
            //     case 2363:
            //         if (entity.x - entity.width / 2 < x * TILE_SIZE + TILE_SIZE / 8 || entity.x + entity.width / 2 > x * TILE_SIZE + TILE_SIZE * 7 / 8) {
            //             return true;
            //         }
            //         break;
            //     case 2364:
            //         if (entity.x - entity.width / 2 < x * TILE_SIZE + TILE_SIZE / 4) {
            //             return true;
            //         }
            //         break;
            //     case 2365:
            //         if (entity.x + entity.width / 2 > x * TILE_SIZE + TILE_SIZE * 3 / 4) {
            //             return true;
            //         }
            //         break;
            //     case 2366:
            //         if (entity.x - entity.width / 2 < x * TILE_SIZE + TILE_SIZE * 5 / 8 && entity.x + entity.width / 2 > x * TILE_SIZE + TILE_SIZE * 3 / 8) {
            //             return true;
            //         }
            //         break;
            //     case 2368:
            //         if (entity.x - entity.width / 2 < x * TILE_SIZE + TILE_SIZE * 7 / 8 && entity.x + entity.width / 2 > x * TILE_SIZE + TILE_SIZE / 8 && entity.y - entity.height / 2 < y * TILE_SIZE + TILE_SIZE * 15 / 16 && entity.y + entity.height / 2 > y * TILE_SIZE + TILE_SIZE * 3 / 16) {
            //             return true;
            //         }
            //         break;
            //     case 2369:
            //         if (entity.x - entity.width / 2 < x * TILE_SIZE + TILE_SIZE * 7 / 8 && entity.x + entity.width / 2 > x * TILE_SIZE + TILE_SIZE / 8 && entity.y - entity.height / 2 < y * TILE_SIZE + TILE_SIZE * 15 / 16 && entity.y + entity.height / 2 > y * TILE_SIZE + TILE_SIZE * 1 / 16) {
            //             return true;
            //         }
            //         break;
            //     case 2370:
            //         if (entity.y - entity.height / 2 < y * TILE_SIZE + TILE_SIZE * 15 / 16 && entity.y + entity.height / 2 > y * TILE_SIZE + TILE_SIZE * 5 / 16) {
            //             return true;
            //         }
            //         break;
            //     case 2371:
            //         if (entity.y + entity.height / 2 > y * TILE_SIZE + TILE_SIZE * 13 / 16) {
            //             return true;
            //         }
            //         break;
            //     case 2457:
            //         if (entity.y - entity.height / 2 < y * TILE_SIZE + TILE_SIZE * 7 / 16) {
            //             return true;
            //         }
            //         break;
            //     default:
            //         break;
            // }
        }
    }
    return false;
};
Entity.collideWithMap = function(entity, speedX, speedY, slide) {
    if (collisions[entity.map] == null) {
        return false;
    }
    if (collisions[entity.map][entity.layer] == null) {
        return false;
    }
    let maxDistanceX = 0;
    let maxDistanceY = 0;
    let signX = Math.sign(speedX);
    let signY = Math.sign(speedY);
    for (var y = Math.floor((entity.y - entity.height / 2) / TILE_SIZE); y < Math.ceil((entity.y + entity.height / 2) / TILE_SIZE); y++) {
        if (collisions[entity.map][entity.layer][y] == null) {
            continue;
        }
        for (var x = Math.floor((entity.x - entity.width / 2) / TILE_SIZE); x < Math.ceil((entity.x + entity.width / 2) / TILE_SIZE); x++) {
            if (collisions[entity.map][entity.layer][y][x] == null) {
                continue;
            }
            for (let i in collisions[entity.map][entity.layer][y][x]) {
                let collision = collisions[entity.map][entity.layer][y][x][i];
                if (collision.slowdown) {
                    continue;
                }
                if (entity.x - entity.width / 2 < collision.x + collision.width / 2 && entity.x + entity.width / 2 > collision.x - collision.width / 2 && entity.y - entity.height / 2 < collision.y + collision.height / 2 && entity.y + entity.height / 2 > collision.y - collision.height / 2) {
                // if (entity.x - entity.width / 2 < x * TILE_SIZE + collision.x + collision.width / 2 && entity.x + entity.width / 2 > x * TILE_SIZE + collision.x - collision.width / 2 && entity.y - entity.height / 2 < y * TILE_SIZE + collision.y + collision.height / 2 && entity.y + entity.height / 2 > y * TILE_SIZE + collision.y - collision.height / 2) {
                    // WHAT DO I NAME THE VARIABLES BUH
                    let distanceX = (entity.x + entity.width / 2 * signX) - (collision.x - collision.width / 2 * signX);
                    let distanceY = (entity.y + entity.height / 2 * signY) - (collision.y - collision.height / 2 * signY);
                    // let distanceX = (entity.x + entity.width / 2 * signX) - (x * TILE_SIZE + collision.x - collision.width / 2 * signX);
                    // let distanceY = (entity.y + entity.height / 2 * signY) - (y * TILE_SIZE + collision.y - collision.height / 2 * signY);
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
                entity.x -= maxDistanceX * signX;
            }
            else {
                entity.x -= maxDistanceX * signX;
                entity.y -= maxDistanceX * signX;
            }
        }
        else {
            if (slide) {
                entity.y -= maxDistanceY * signY;
            }
            else {
                entity.x -= maxDistanceY * signY;
                entity.y -= maxDistanceY * signY;
            }
        }
        return true;
    }
    return false;
};
Entity.collideWithMapEffects = function(entity) {
    if (collisions[entity.map] != null && collisions[entity.map][entity.layer] != null) {
        entity.slowedDown = false;
        slowedDown: for (var y = Math.floor((entity.y - entity.height / 2) / TILE_SIZE); y < Math.ceil((entity.y + entity.height / 2) / TILE_SIZE); y++) {
            if (collisions[entity.map][entity.layer][y] == null) {
                continue;
            }
            for (var x = Math.floor((entity.x - entity.width / 2) / TILE_SIZE); x < Math.ceil((entity.x + entity.width / 2) / TILE_SIZE); x++) {
                if (collisions[entity.map][entity.layer][y][x] == null) {
                    continue;
                }
                for (let i in collisions[entity.map][entity.layer][y][x]) {
                    let collision = collisions[entity.map][entity.layer][y][x][i];
                    if (!collision.slowdown) {
                        continue;
                    }
                    if (entity.x - entity.width / 2 < collision.x + collision.width / 2 && entity.x + entity.width / 2 > collision.x - collision.width / 2 && entity.y - entity.height / 2 < collision.y + collision.height / 2 && entity.y + entity.height / 2 > collision.y - collision.height / 2) {
                        entity.slowedDown = true;
                        break slowedDown;
                    }
                }
            }
        }
    }
    if (slopes[entity.map] != null && slopes[entity.map][entity.layer] != null) {
        slope: for (var y = Math.floor((entity.y - entity.height / 2) / TILE_SIZE); y < Math.ceil((entity.y + entity.height / 2) / TILE_SIZE); y++) {
            if (slopes[entity.map][entity.layer][y] == null) {
                continue;
            }
            for (var x = Math.floor((entity.x - entity.width / 2) / TILE_SIZE); x < Math.ceil((entity.x + entity.width / 2) / TILE_SIZE); x++) {
                if (slopes[entity.map][entity.layer][y][x] != -1) {
                    switch (slopes[entity.map][entity.layer][y][x] % 5) {
                        case 0:
                            entity.layer = Math.floor(slopes[entity.map][entity.layer][y][x] / 5);
                            break slope;
                        case 1:
                            if (entity.x - entity.width / 2 < x * TILE_SIZE + TILE_SIZE / 2) {
                                entity.layer = Math.floor(slopes[entity.map][entity.layer][y][x] / 5);
                                break slope;
                            }
                            break;
                        case 2:
                            if (entity.x + entity.width / 2 > x * TILE_SIZE + TILE_SIZE / 2) {
                                entity.layer = Math.floor(slopes[entity.map][entity.layer][y][x] / 5);
                                break slope;
                            }
                            break;
                        case 3:
                            if (entity.y - entity.height / 2 < y * TILE_SIZE + TILE_SIZE / 2) {
                                entity.layer = Math.floor(slopes[entity.map][entity.layer][y][x] / 5);
                                break slope;
                            }
                            break;
                        case 4:
                            if (entity.y + entity.height / 2 > y * TILE_SIZE + TILE_SIZE / 2) {
                                entity.layer = Math.floor(slopes[entity.map][entity.layer][y][x] / 5);
                                break slope;
                            }
                            break;
                    }
                }
            }
        }
    }
    if (regions[entity.map] != null && regions[entity.map][entity.gridY] != null && entity.region != regions[entity.map][entity.gridY][entity.gridX]) {
        entity.region = regions[entity.map][entity.gridY][entity.gridX];
        entity.inSafeRegion = regionSafety[entity.region];
        if (entity.type == PLAYER) {
            entity.socket.emit("region", entity.region ?? WILDERNESS);
        }
        else if (entity.type == MONSTER) {
            if (entity.inSafeRegion) {
                entity.movePath = Rig.escapeSafeRegion(entity);
                entity.movePathIndex = 0;
                entity.pathfindCooldown = ENV.pathfindUpdateSpeed;
            }
        }
    }
    if (teleporters[entity.map] != null && teleporters[entity.map][entity.layer] != null) {
        for (var y = Math.floor((entity.y - entity.height / 2) / TILE_SIZE); y < Math.ceil((entity.y + entity.height / 2) / TILE_SIZE); y++) {
            if (teleporters[entity.map][entity.layer][y] == null) {
                continue;
            }
            for (var x = Math.floor((entity.x - entity.width / 2) / TILE_SIZE); x < Math.ceil((entity.x + entity.width / 2) / TILE_SIZE); x++) {
                if (teleporters[entity.map][entity.layer][y][x] != null) {
                    switch (teleporters[entity.map][entity.layer][y][x].direction) {
                        case 0:
                            if (entity.speedX < 0) {
                                if (Rig.teleport(entity, teleporters[entity.map][entity.layer][y][x].x, teleporters[entity.map][entity.layer][y][x].y, teleporters[entity.map][entity.layer][y][x].layer, teleporters[entity.map][entity.layer][y][x].map)) {
                                    return true;
                                }
                            }
                            break;
                        case 1:
                            if (entity.speedX > 0) {
                                if (Rig.teleport(entity, teleporters[entity.map][entity.layer][y][x].x, teleporters[entity.map][entity.layer][y][x].y, teleporters[entity.map][entity.layer][y][x].layer, teleporters[entity.map][entity.layer][y][x].map)) {
                                    return true;
                                }
                            }
                            break;
                        case 2:
                            if (entity.speedY < 0) {
                                if (Rig.teleport(entity, teleporters[entity.map][entity.layer][y][x].x, teleporters[entity.map][entity.layer][y][x].y, teleporters[entity.map][entity.layer][y][x].layer, teleporters[entity.map][entity.layer][y][x].map)) {
                                    return true;
                                }
                            }
                            break;
                        case 3:
                            if (entity.speedY > 0) {
                                if (Rig.teleport(entity, teleporters[entity.map][entity.layer][y][x].x, teleporters[entity.map][entity.layer][y][x].y, teleporters[entity.map][entity.layer][y][x].layer, teleporters[entity.map][entity.layer][y][x].map)) {
                                    return true;
                                }
                            }
                            break;
                    }
                }
            }
        }
    }
    return false;
};

// Entity: type, x, y, speedX, speedY, layer, map, width, height, direction
// Rig: stuff

Rig = function() {
    var self = new Entity();

    self.slowedDown = false;

    self.hp = 0;
    self.hpMax = 0;
    self.hpRegen = 0;
    self.hpRegenCooldown = 0;
    self.hpRegenSpeed = 0;
    self.hpRegenAccelerationRate = 0;
    self.hpRegenAccelerationCap = 0;
    self.hpRegenAcceleration = 0;

    self.mana = 0;
    self.manaMax = 0;
    self.manaRegen = 0;
    self.manaRegenCooldown = 0;
    self.manaRegenSpeed = 0;
    self.manaRegenAccelerationRate = 0;
    self.manaRegenAccelerationCap = 0;
    self.manaRegenAcceleration = 0;

    self.defense = 0;
    self.damageReduction = 0;
    self.knockbackResistance = 0;
    self.projectileDefense = 0;
    self.projectileDamageReduction = 0;
    self.projectileDamage = 0;
    self.projectileSpeed = 1;
    self.projectileRange = 1;
    self.projectileAccuracy = 0;
    self.projectileKnockback = 1;
    self.projectilePierce = 0;
    self.critChance = 0;
    self.critDamage = 1;
    self.critKnockback = 1;
    self.shieldKnockbackResistance = 0;
    self.shieldBlockAngle = 0;
    self.shieldReflectionChance = 0;
    self.contactDefense = 0;
    self.contactDamageReduction = 0;
    self.contactDamage = 0;
    self.contactEvents = [];
    self.contactKnockback = 1;

    self.moveSpeed = 0;
    self.moveType = NONE;
    self.moveX = 0;
    self.moveY = 0;
    self.moveWaypoint = 0;
    self.moveWaypointLocation = 0;
    // waypoints will have certain locations, precalculated paths
    self.moveCooldown = 0;
    self.movePath = [];
    self.movePathIndex = 0;

    self.teleporting = false;
    self.teleportTime = 0;
    self.teleportX = 0;
    self.teleportY = 0;
    self.teleportLayer = 0;
    self.teleportMap = 0;

    self.region = WILDERNESS;
    self.inSafeRegion = false;

    self.invincibilityFrames = {};

    self.effects = [];
    self.immuneEffects = [];
    self.vulnerableEffects = [];

    // pathfinding wander/waypoint npc/player/monster
    // changing maps, global code, await socket emit for player

    self.controls = [
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        0,
        0,
        0,
    ];

    self.knockbackX = 0;
    self.knockbackY = 0;

    self.dashX = 0;
    self.dashY = 0;
    self.dashTime = 0;

    self.heldItem = NONE;

    self.animationType = NON_DIRECTIONAL;
    self.animationStage = 0;
    self.animationLength = 1;
    self.animationSpeed = 0;
    self.animationChangeBySpeed = false;
    self.animationDirection = 0;
    self.animationPhase = 0;

    return self;
};
Rig.init = function(rig) {
    Entity.init(rig);
    rig.moveX = rig.gridX;
    rig.moveY = rig.gridY;
};
Rig.update = function(rig) {
    if (rig.hp == 0) {
        Rig.updateAnimation(rig);
        return;
    }
    Rig.updateInvincibilityFrames(rig);
    Rig.updateMove(rig);
};
Rig.updateMove = function(rig) {
    Entity.updateLastPosition(rig);
    rig.speedX = 0;
    rig.speedY = 0;
    rig.dashTime -= 1;
    if (rig.teleporting) {
        rig.knockbackX = 0;
        rig.knockbackY = 0;
        if (rig.type == PLAYER) {
            if (rig.teleportTime >= 0) {
                rig.teleportTime = Math.min(rig.teleportTime + 1, 9);
            }
            else {
                rig.teleportTime -= 1;
            }
            if (rig.teleportTime == -10) {
                Entity.addParticle({
                    x: rig.x,
                    y: rig.y,
                    layer: rig.layer,
                    map: rig.map,
                    type: PARTICLE_TELEPORT,
                });
                rig.x = rig.teleportX;
                rig.y = rig.teleportY;
                rig.layer = rig.teleportLayer;
                rig.map = rig.teleportMap;
                Entity.addParticle({
                    x: rig.x,
                    y: rig.y,
                    layer: rig.layer,
                    map: rig.map,
                    type: PARTICLE_TELEPORT,
                });
                rig.socket.emit("teleportEnd", {
                    x: rig.x,
                    y: rig.y,
                    layer: rig.layer,
                    map: rig.map,
                    knockbackX: rig.knockbackX,
                    knockbackY: rig.knockbackY,
                });
            }
            if (rig.teleportTime == -20) {
                rig.teleporting = false;
            }
        }
        else {
            rig.teleportTime += 1;
            if (rig.teleportTime == 10) {
                Entity.addParticle({
                    x: rig.x,
                    y: rig.y,
                    layer: rig.layer,
                    map: rig.map,
                    type: PARTICLE_TELEPORT,
                });
                rig.x = rig.teleportX;
                rig.y = rig.teleportY;
                rig.layer = rig.teleportLayer;
                rig.map = rig.teleportMap;
                Entity.addParticle({
                    x: rig.x,
                    y: rig.y,
                    layer: rig.layer,
                    map: rig.map,
                    type: PARTICLE_TELEPORT,
                });
            }
            if (rig.teleportTime == 20) {
                rig.teleporting = false;
            }
        }
    }
    else if (rig.effects[EFFECT_FROZEN] != null) {

    }
    else if (rig.dashTime >= 0) {
        rig.speedX = rig.dashX;
        rig.speedY = rig.dashY;
    }
    else if (rig.moveType == PATH || rig.moveType == WANDER || rig.moveType == WAYPOINT) {
        if (rig.movePath.length > rig.movePathIndex && rig.x == rig.movePath[rig.movePathIndex][0] * TILE_SIZE + 32 && rig.y == rig.movePath[rig.movePathIndex][1] * TILE_SIZE + 32) {
            rig.movePathIndex += 1;
        }
        if (rig.movePath.length == rig.movePathIndex) {
            if (rig.moveType == WANDER) {
                rig.moveCooldown -= 1;
                if (rig.moveCooldown < 0) {
                    if (pathfindCollisions[rig.map] == null || pathfindCollisions[rig.layer] == null) {
                        rig.movePath = Rig.pathfind(rig, rig.moveX + Math.floor(Math.random() * 9 - 4), rig.moveY + Math.floor(Math.random() * 9 - 4));
                        rig.movePathIndex = 0;
                        rig.moveCooldown = Math.floor(Math.random() * 200) + 100;
                    }
                    else {
                        var totalSpots = 0;
                        for (var i = -4; i <= 4; i++) {
                            for (var j = -4; j <= 4; j++) {
                                if (rig.gridX == rig.moveX + j && rig.gridY == rig.moveY + i) {
                                    continue;
                                }
                                if (pathfindCollisions[rig.map][rig.layer][rig.moveY + i] != null && pathfindCollisions[rig.map][rig.layer][rig.moveY + i][rig.moveX + j] == 1) {
                                    continue;
                                }
                                totalSpots += 1;
                            }
                        }
                        if (totalSpots > 0) {
                            var spot = Math.floor(Math.random() * totalSpots);
                            search: for (var i = -4; i <= 4; i++) {
                                for (var j = -4; j <= 4; j++) {
                                    if (rig.gridX == rig.moveX + j && rig.gridY == rig.moveY + i) {
                                        continue;
                                    }
                                    if (pathfindCollisions[rig.map][rig.layer][rig.moveY + i] != null && pathfindCollisions[rig.map][rig.layer][rig.moveY + i][rig.moveX + j] == 1) {
                                        continue;
                                    }
                                    totalSpots -= 1;
                                    if (spot == totalSpots) {
                                        rig.movePath = Rig.pathfind(rig, rig.moveX + j, rig.moveY + i);
                                        rig.movePathIndex = 0;
                                        rig.moveCooldown = Math.floor(Math.random() * 200) + 100;
                                        break search;
                                    }
                                }
                            }
                        }
                    }
                }
            }
            else if (rig.moveType == WAYPOINT) {
                rig.moveCooldown -= 1;
                if (rig.moveCooldown < 0) {
                    var totalWeight = 0;
                    for (var i in Rig.waypoints[rig.moveWaypoint][rig.moveWaypointLocation].paths) {
                        totalWeight += Rig.waypoints[rig.moveWaypoint][rig.moveWaypointLocation].paths[i].weight;
                    }
                    var path = Math.floor(Math.random() * totalWeight);
                    for (var i in Rig.waypoints[rig.moveWaypoint][rig.moveWaypointLocation].paths) {
                        totalWeight -= Rig.waypoints[rig.moveWaypoint][rig.moveWaypointLocation].paths[i].weight;
                        if (path >= totalWeight) {
                            rig.movePath = Rig.waypoints[rig.moveWaypoint][rig.moveWaypointLocation].paths[i].path;
                            rig.movePathIndex = 0;
                            rig.moveCooldown = Math.floor(Math.random() * (Rig.waypoints[rig.moveWaypoint][rig.moveWaypointLocation].paths[i].endDelay[1] - Rig.waypoints[rig.moveWaypoint][rig.moveWaypointLocation].paths[i].endDelay[0])) + Rig.waypoints[rig.moveWaypoint][rig.moveWaypointLocation].paths[i].endDelay[0];
                            rig.moveWaypointLocation = Rig.waypoints[rig.moveWaypoint][rig.moveWaypointLocation].paths[i].location;
                            break;
                        }
                    }
                }
            }
        }
        if (rig.movePath.length > rig.movePathIndex) {
            var x = rig.movePath[rig.movePathIndex][0] * TILE_SIZE + 32;
            var y = rig.movePath[rig.movePathIndex][1] * TILE_SIZE + 32;
            if (x > rig.x) {
                rig.speedX += Math.min(x - rig.x, rig.moveSpeed);
            }
            else if (x < rig.x) {
                rig.speedX -= Math.min(rig.x - x, rig.moveSpeed);
            }
            if (y > rig.y) {
                rig.speedY += Math.min(y - rig.y, rig.moveSpeed);
            }
            else if (y < rig.y) {
                rig.speedY -= Math.min(rig.y - y, rig.moveSpeed);
            }
            if (rig.speedX != 0 && rig.speedY != 0 && Math.abs(rig.speedX) == Math.abs(rig.speedY)) {
                rig.x = Math.round(rig.x);
                rig.y = Math.round(rig.y);
            }
        }
    }
    else if (rig.moveType == CONTROLS && rig.dialogue == null) {
        if (rig.controls[LEFT]) {
            rig.speedX -= rig.moveSpeed;
        }
        if (rig.controls[RIGHT]) {
            rig.speedX += rig.moveSpeed;
        }
        if (rig.controls[UP]) {
            rig.speedY -= rig.moveSpeed;
        }
        if (rig.controls[DOWN]) {
            rig.speedY += rig.moveSpeed;
        }
        if (rig.speedX != 0 && rig.speedY != 0) {
            // realistic but feels weird
            // rig.speedX /= Math.sqrt(2);
            // rig.speedY /= Math.sqrt(2);
            rig.x = Math.round(rig.x);
            rig.y = Math.round(rig.y);
        }
    }
    if (rig.dashTime < 0 && !rig.teleporting && rig.effects[EFFECT_FROZEN] == null) {
        rig.dashX *= 0.25;
        rig.dashY *= 0.25;
        if (Math.abs(rig.dashX) < 0.5) {
            rig.dashX = 0;
            if (Math.abs(rig.dashY) < 1) {
                rig.dashY = 0;
            }
        }
        if (Math.abs(rig.dashY) < 0.5) {
            rig.dashY = 0;
            if (Math.abs(rig.dashX) < 1) {
                rig.dashX = 0;
            }
        }
        rig.speedX += rig.dashX;
        rig.speedY += rig.dashY;
    }
    if (rig.slowedDown) {
        rig.speedX *= 0.5;
        rig.speedY *= 0.5;
    }
    Rig.updateRegen(rig);
    Rig.updateAnimation(rig);
    Rig.updateEffects(rig);
    // update effects
    if (rig.type == PLAYER) {
        rig.lastKnockbackX = rig.knockbackX;
        rig.lastKnockbackY = rig.knockbackY;
    }
    rig.speedX += rig.knockbackX;
    rig.speedY += rig.knockbackY;
    rig.knockbackX *= 0.25;
    rig.knockbackY *= 0.25;
    if (Math.abs(rig.knockbackX) < 0.5) {
        rig.knockbackX = 0;
    }
    if (Math.abs(rig.knockbackY) < 0.5) {
        rig.knockbackY = 0;
    }
    var x = rig.x;
    var y = rig.y;
    // Entity.collisionSlide(rig);
    Entity.move(rig, true);
    rig.speedX = rig.x - x;
    rig.speedY = rig.y - y;
};
Rig.updateRegen = function(rig) {
    var multiplier = 1;
    if (Math.abs(rig.speedX) < 0.5 && Math.abs(rig.speedY) < 0.5) {
        multiplier *= 1.5;
    }
    if (rig.knockbackX != 0 || rig.knockbackY != 0) {
        multiplier *= 0.75;
    }
    if (rig.hpRegenSpeed != 0) {
        rig.hpRegenAcceleration += rig.hpRegenAccelerationRate * multiplier;
        rig.hpRegenCooldown -= Math.min(rig.hpRegenAcceleration, rig.hpRegenAccelerationCap);
        if (rig.hp >= rig.hpMax) {
            rig.hpRegenCooldown = 0;
        }
        while (rig.hpRegenCooldown <= 0 && rig.hp < rig.hpMax) {
            var hp = rig.hp;
            rig.hpRegenCooldown += rig.hpRegenSpeed;
            rig.hp += rig.hpRegen;
            if (rig.hp > rig.hpMax) {
                rig.hp = rig.hpMax;
            }
            if (Math.ceil(rig.hp) - Math.ceil(hp) > 0) {
                Entity.addParticle({
                    x: rig.x,
                    y: rig.y,
                    layer: rig.layer,
                    map: rig.map,
                    type: PARTICLE_HEAL,
                    value: Math.ceil(rig.hp) - Math.ceil(hp),
                });
            }
        }
    }
    if (rig.manaRegenSpeed != 0) {
        rig.manaRegenAcceleration += rig.manaRegenAccelerationRate * multiplier;
        rig.manaRegenCooldown -= Math.min(rig.manaRegenAcceleration, rig.manaRegenAccelerationCap);
        if (rig.mana >= rig.manaMax) {
            rig.manaRegenCooldown = 0;
        }
        while (rig.manaRegenCooldown <= 0 && rig.mana < rig.manaMax) {
            rig.manaRegenCooldown = rig.manaRegenSpeed;
            rig.mana += rig.manaRegen;
            if (rig.mana > rig.manaMax) {
                rig.mana = rig.manaMax;
            }
        }
    }
};
Rig.updateAnimation = function(rig) {
    var speed = rig.animationSpeed;
    if (rig.animationChangeBySpeed) {
        // speed *= Math.sqrt(Math.pow(rig.speedX, 2) + Math.pow(rig.speedY, 2));
        speed *= Math.max(Math.abs(rig.speedX), Math.abs(rig.speedY));
    }
    rig.animationStage = (rig.animationStage + speed) % rig.animationLength;
    if (rig.animationType == DIRECTIONAL_8) {
        var angle = null;
        if (rig.speedX != 0 || rig.speedY != 0) {
            angle = Math.atan2(rig.speedY, rig.speedX) * 180 / Math.PI;
            if (angle < 0) {
                angle += 360;
            }
        }
        else {
            if (rig.moveType == CONTROLS && !rig.teleporting) {
                angle = rig.controls[TARGET_ANGLE];
            }
            rig.animationStage = 0;
        }
        if (angle != null) {
            if (angle <= 22.5) {
                rig.animationDirection = 2;
            }
            else if (angle <= 67.5) {
                rig.animationDirection = 1;
            }
            else if (angle <= 112.5) {
                rig.animationDirection = 0;
            }
            else if (angle <= 157.5) {
                rig.animationDirection = 7;
            }
            else if (angle <= 202.5) {
                rig.animationDirection = 6;
            }
            else if (angle <= 247.5) {
                rig.animationDirection = 5;
            }
            else if (angle <= 292.5) {
                rig.animationDirection = 4;
            }
            else if (angle <= 337.5) {
                rig.animationDirection = 3;
            }
            else {
                rig.animationDirection = 2;
            }
        }
    }
    else if (rig.animationType == DIRECTIONAL_4) {
        var angle = null;
        if (rig.speedX != 0 || rig.speedY != 0) {
            angle = Math.atan2(rig.speedY, rig.speedX) * 180 / Math.PI;
            if (angle < 0) {
                angle += 360;
            }
        }
        else {
            if (rig.moveType == CONTROLS && !rig.teleporting) {
                angle = rig.controls[TARGET_ANGLE];
            }
            rig.animationStage = 0;
        }
        if (angle != null) {
            if (angle <= 45) {
                rig.animationDirection = 1;
            }
            else if (angle <= 135) {
                rig.animationDirection = 2;
            }
            else if (angle <= 225) {
                rig.animationDirection = 3;
            }
            else if (angle <= 315) {
                rig.animationDirection = 0;
            }
            else {
                rig.animationDirection = 1;
            }
        }
    }
    else if (rig.animationType == DIRECTIONAL_2) {
        if (rig.speedX > 0) {
            rig.animationDirection = 0;
        }
        else if (rig.speedX < 0) {
            rig.animationDirection = 1;
        }
        else {
            if (rig.moveType == CONTROLS && !rig.teleporting) {
                if (rig.controls[TARGET_ANGLE] <= 90) {
                    rig.animationDirection = 0;
                }
                else if (rig.controls[TARGET_ANGLE] <= 270) {
                    rig.animationDirection = 1;
                }
                else {
                    rig.animationDirection = 0;
                }
            }
            rig.animationStage = 0;
        }
    }
    else if (rig.animationType == NON_DIRECTIONAL) {
    }
};
Rig.updateInvincibilityFrames = function(rig) {
    for (var i in rig.invincibilityFrames) {
        rig.invincibilityFrames[i] -= 1;
        if (rig.invincibilityFrames[i] <= 0) {
            delete rig.invincibilityFrames[i];
        }
    }
};
Rig.addEffect = function(rig, effect, duration) {
    if (rig.immuneEffects[effect]) {
        return;
    }
    if (rig.effects[effect] == null) {
        rig.effects[effect] = duration;
        Rig.effects[effect].start(rig);
    }
    else {
        rig.effects[effect] = Math.max(duration, rig.effects[effect]);
    }
};
Rig.updateEffects = function(rig) {
    for (var i in rig.effects) {
        if (rig.immuneEffects[i]) {
            Rig.effects[i].end(rig);
            delete rig.effects[i];
            continue;
        }
        Rig.effects[i].during(rig);
        if (rig.hp == 0) {
            return;
        }
        if (rig.vulnerableEffects[i]) {
            Rig.effects[i].during(rig);
            if (rig.hp == 0) {
                return;
            }
        }
        rig.effects[i] -= 1;
        if (rig.effects[i] <= 0) {
            Rig.effects[i].end(rig);
            delete rig.effects[i];
        }
    }
};
Rig.pathfind = function(rig, x, y) {
    var left = Math.min(rig.gridX - ENV.pathfindBuffer, x - ENV.pathfindBuffer);
    var right = Math.max(rig.gridX + ENV.pathfindBuffer, x + ENV.pathfindBuffer);
    var top = Math.min(rig.gridY - ENV.pathfindBuffer, y - ENV.pathfindBuffer);
    var bottom = Math.max(rig.gridY + ENV.pathfindBuffer, y + ENV.pathfindBuffer);
    var grid = new PF.Grid(right - left, bottom - top);
    for (var i = top; i < bottom; i++) {
        for (var j = left; j < right; j++) {
            if (j == rig.gridX && i == rig.gridY|| j == x && i == y) {
                continue;
            }
            if (pathfindCollisions[rig.map] != null && pathfindCollisions[rig.map][rig.layer] != null && pathfindCollisions[rig.map][rig.layer][i] != null && pathfindCollisions[rig.map][rig.layer][i][j] == 1) {
                grid.setWalkableAt(j - left, i - top, false);
            }
            else if (rig.type == MONSTER && regions[rig.map] != null && regions[rig.map][rig.layer] != null && regions[rig.map][rig.layer][i] != null && regionSafety[regions[rig.map][rig.layer][i][j]]) {
                grid.setWalkableAt(j - left, i - top, false);
            }
        }
    }
    var path = pathfinder.findPath(rig.gridX - left, rig.gridY - top, x - left, y - top, grid);
    path.shift();
    path = PF.Util.compressPath(path);
    for (var i in path) {
        path[i][0] += left;
        path[i][1] += top;
    }
    return path;
};
Rig.retreat = function(rig, x, y) {
    var left = rig.gridX - ENV.pathfindBuffer;
    var right = rig.gridX + ENV.pathfindBuffer;
    var top = rig.gridY - ENV.pathfindBuffer;
    var bottom = rig.gridY + ENV.pathfindBuffer;
    var best = null;
    var bestX = null;
    var bestY = null;
    for (var i = top; i < bottom; i++) {
        for (var j = left; j < right; j++) {
            if (j == rig.gridX && i == rig.gridY) {
                continue;
            }
            if (pathfindCollisions[rig.map] != null && pathfindCollisions[rig.map][rig.layer] != null && pathfindCollisions[rig.map][rig.layer][i] != null && pathfindCollisions[rig.map][rig.layer][i][j] == 1) {
                continue;
            }
            if (rig.type == MONSTER && regions[rig.map] != null && regions[rig.map][rig.layer] != null && regions[rig.map][rig.layer][i] != null && regionSafety[regions[rig.map][rig.layer][i][j]]) {
                continue;
            }
            var weight = Math.pow(rig.gridX - j, 2) + Math.pow(rig.gridY - i, 2) + Math.pow(x - j, 2) + Math.pow(y - i, 2);
            if (best == null || weight > best) {
                best = weight;
                bestX = j;
                bestY = i;
            }
        }
    }
    if (best) {
        return Rig.pathfind(rig, bestX, bestY);
    }
    return [];
};
Rig.escapeSafeRegion = function(rig) {
    var left = rig.gridX - ENV.pathfindBuffer;
    var right = rig.gridX + ENV.pathfindBuffer;
    var top = rig.gridY - ENV.pathfindBuffer;
    var bottom = rig.gridY + ENV.pathfindBuffer;
    var best = null;
    var bestX = null;
    var bestY = null;
    for (var i = top; i < bottom; i++) {
        for (var j = left; j < right; j++) {
            if (j == rig.gridX && i == rig.gridY) {
                continue;
            }
            if (pathfindCollisions[rig.map] != null && pathfindCollisions[rig.map][rig.layer] != null && pathfindCollisions[rig.map][rig.layer][i] != null && pathfindCollisions[rig.map][rig.layer][i][j] == 1) {
                continue;
            }
            if (rig.type == MONSTER && regions[rig.map] != null && regions[rig.map][rig.layer] != null && regions[rig.map][rig.layer][i] != null && regionSafety[regions[rig.map][rig.layer][i][j]]) {
                continue;
            }
            var weight = Math.pow(rig.gridX - j, 2) + Math.pow(rig.gridY - i, 2);
            if (best == null || weight < best) {
                best = weight;
                bestX = j;
                bestY = i;
            }
        }
    }
    if (best) {
        return Rig.pathfind(rig, bestX, bestY);
    }
    return [];
};
Rig.dodgeProjectiles = function(rig) {
    if (rig.movePath.length == 0) {
        return;
    }
    var projectiles = [];
    Entity.searchChunks(Projectile.chunks, rig.chunkX, rig.chunkY, rig.map, ENV.dodgeProjectileSearchRange, function(projectile) {
        projectiles.push({
            x: projectile.x,
            y: projectile.y,
            speedX: projectile.speedX,
            speedY: projectile.speedY,
            layer: projectile.layer,
            width: projectile.collisionBoxWidth,
            height: projectile.collisionBoxHeight,
        });
    });
    var x = rig.gridX;
    var y = rig.gridY;
    var index = rig.movePathIndex;
    for (var i = 0; i < ENV.dodgeProjectileSearchLength; i++) {
        var indexChanged = false;
        if (rig.movePath[index][0] == x && rig.movePath[index][1] == y) {
            index += 1;
            indexChanged = true;
            if (index == rig.movePath.length) {
                break;
            }
        }
        var lastX = x;
        var lastY = y;
        if (rig.movePath[index][0] < x) {
            x -= 1;
        }
        else if (rig.movePath[index][0] > x) {
            x += 1;
        }
        if (rig.movePath[index][1] < y) {
            y -= 1;
        }
        else if (rig.movePath[index][1] > y) {
            y += 1;
        }
        for (var i in projectiles) {
            projectiles[i].x += projectiles[i].speedX;
            projectiles[i].y += projectiles[i].speedY;
            if (pathfindCollisions[rig.map] != null && pathfindCollisions[rig.map][projectiles[i].layer] != null && pathfindCollisions[rig.map][projectiles[i].layer][Math.floor(projectiles[i].y / TILE_SIZE)] != null && pathfindCollisions[rig.map][projectiles[i].layer][Math.floor(projectiles[i].y / TILE_SIZE)][Math.floor(projectiles[i].x / TILE_SIZE)] == 1) {
                delete projectiles[i];
                continue;
            }
            if (Entity.collideWithEntity(rig, projectiles[i])) {
                if (!indexChanged) {
                    rig.movePath.splice(index - 1, 0, [lastX, lastY]);
                    index += 1;
                }
                var clockwise = true;
                var counterClockwise = true;
                var newX = lastX + y - lastY;
                var newY = lastY - x + lastX;
                if (pathfindCollisions[rig.map] != null && pathfindCollisions[rig.map][rig.layer] != null && pathfindCollisions[rig.map][rig.layer][newY] != null && pathfindCollisions[rig.map][rig.layer][newY][newX] == 1) {
                    clockwise = false;
                }
                newX = lastX + y - lastY;
                newY = lastY - x + lastX;
                if (pathfindCollisions[rig.map] != null && pathfindCollisions[rig.map][rig.layer] != null && pathfindCollisions[rig.map][rig.layer][newY] != null && pathfindCollisions[rig.map][rig.layer][newY][newX] == 1) {
                    counterClockwise = false;
                }
                if (clockwise) {
                    if (counterClockwise) {
                        if (Math.random() < 0.5) {
                            newX = lastX + y - lastY;
                            newY = lastY - x + lastX;
                        }
                    }
                    else {
                        newX = lastX + y - lastY;
                        newY = lastY - x + lastX;
                    }
                }
                else {
                    if (counterClockwise) {
                        
                    }
                    else {
                        break;
                    }
                }
                rig.movePath.splice(index - 1, 0, [newX, newY]);
                break;
            }
        }
    }
};
Rig.raycast = function(x1, y1, x2, y2, layer, map) {
    if (pathfindCollisions[map] == null || pathfindCollisions[map][layer] == null) {
        return false;
    }
    var angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
    var speedX = cos(angle) * 16;
    var speedY = cos(angle) * 16;
    var distance = Math.ceil(Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)));
    for (var i = 0; i < distance; i++) {
        x1 += speedX;
        y1 += speedY;
        if (pathfindCollisions[map][layer][Math.floor(y1 / TILE_SIZE)]) {
            if (pathfindCollisions[map][layer][Math.floor(y1 / TILE_SIZE)][Math.floor(x1 - TILE_SIZE)] == 1) {
                return true;
            }
        }
    }
    return false;
};
Rig.teleport = function(rig, x, y, layer, map) {
    if (rig.teleporting) {
        return false;
    }
    rig.teleporting = true;
    rig.teleportTime = 0;
    rig.teleportX = x;
    rig.teleportY = y;
    rig.teleportLayer = layer;
    rig.teleportMap = map;
    rig.knockbackX = 0;
    rig.knockbackY = 0;
    rig.dashX = 0;
    rig.dashY = 0;
    rig.dashTime = 0;
    if (rig.type == PLAYER) {
        rig.socket.emit("teleportStart");
    }
    return true;
};
Rig.onDamage = function(rig, entity, type, data) {
    var parent = null;
    if (entity != null) {
        if (rig.invincibilityFrames[entity.id] >= 1) {
            // rig.invincibilityFrames[entity.id] = 2;
            return;
        }
        rig.invincibilityFrames[entity.id] = 5;
        parent = entity.parent ?? entity;
    }
    var multiplier = Math.random() * 0.4 + 0.8;
    var damage = null;
    var crit = false;
    var blockState = NOT_BLOCKED;
    switch (type) {
        case DAMAGE_CONTACT:
            if (Math.random() < entity.critChance) {
                damage = Math.max(Math.min(Math.floor(entity.contactDamage * multiplier * entity.critDamage * (1 - rig.defense) * (1 - rig.contactDefense) - rig.damageReduction - rig.contactDamageReduction), rig.hp), 0);
                multiplier *= entity.critKnockback;
                crit = true;
            }
            else {
                damage = Math.max(Math.min(Math.floor(entity.contactDamage * multiplier * (1 - rig.defense) * (1 - rig.contactDefense) - rig.damageReduction - rig.contactDamageReduction), rig.hp), 0);
            }
            multiplier *= entity.contactKnockback;
            var angle = Math.atan2(entity.y - rig.y, entity.x - rig.x) * 180 / Math.PI;
            if (rig.heldItem == SHIELD && Math.abs(rig.controls[TARGET_ANGLE] - angle) < rig.shieldBlockAngle / 2) {
                // if dashing and reflected, reflect dash
                blockState = BLOCKED;
                multiplier *= Math.max(1 - rig.knockbackResistance - rig.shieldKnockbackResistance, 0);
                if (entity.dashTime > 0) {
                    var dashAngle = 2 * rig.controls[TARGET_ANGLE] - Math.atan2(entity.dashY, entity.dashX) * 180 / Math.PI;
                    var dashMagnitude = Math.sqrt(Math.pow(entity.dashX, 2), Math.pow(entity.dashY, 2));
                    entity.dashX = cos(dashAngle) * dashMagnitude;
                    entity.dashY = sin(dashAngle) * dashMagnitude;
                }
            }
            else {
                multiplier *= Math.max(1 - rig.knockbackResistance, 0);
                rig.hp -= damage;
                // particles
                if (rig.hp == 0) {
                    if ((rig.type == PLAYER && ENV.broadcastPlayerDeaths) || (rig.type == MONSTER && ENV.broadcastMonsterDeaths)) {
                        var deathMessages = [];
                        if (entity.type == MONSTER) {
                            deathMessages = Monster.data[entity.monsterId].deathMessages;
                        }
                        else {
                            deathMessages = ["<name1> was killed by <name2>.", "<name1> was smashed by <name2>.", "<name1> was squished by <name2>.", "<name1> got brutally obliterated by <name2>.", "<name2> smashed into <name1> too fast."];
                        }
                        insertChat(deathMessages[Math.floor(Math.random() * deathMessages.length)].replaceAll("<name1>", rig.name).replaceAll("<name2>", entity.name), "death");
                    }
                    // reset effects, dash, knockback
                }
            }
            if (rig.hp > 0) {
                rig.knockbackX += (-cos(angle) * 10 + entity.speedX) * multiplier;
                rig.knockbackY += (-sin(angle) * 10 + entity.speedY) * multiplier;
            }
            for (var i in entity.contactEvents) {
                Rig.contactEvents[entity.contactEvents[i].type](rig, entity, entity.contactEvents[i].data);
            }
            break;
        case DAMAGE_PROJECTILE:
            if (Math.random() < entity.critChance) {
                damage = Math.max(Math.min(Math.floor(entity.damage * multiplier * entity.critDamage * (1 - rig.defense) * (1 - rig.projectileDefense) - rig.damageReduction - rig.projectileDamageReduction), rig.hp), 0);
                multiplier *= entity.critKnockback;
                crit = true;
            }
            else {
                damage = Math.max(Math.min(Math.floor(entity.damage * multiplier * (1 - rig.defense) * (1 - rig.projectileDefense) - rig.damageReduction - rig.projectileDamageReduction), rig.hp), 0);
            }
            multiplier *= entity.knockback;
            var angle = Math.atan2(-entity.speedY, -entity.speedX) * 180 / Math.PI;
            if (rig.heldItem == SHIELD && Math.abs(rig.controls[TARGET_ANGLE] - angle) < rig.shieldBlockAngle / 2) {
                // if dashing and reflected, reflect dash
                multiplier *= Math.max(1 - rig.knockbackResistance - rig.shieldKnockbackResistance, 0);
                if (Projectile.data[entity.projectileId].reflectable && Math.random() < rig.shieldReflectionChance) {
                    blockState = REFLECTED;
                    entity.parent = rig;
                    entity.layer = rig.layer;
                    entity.angle = 2 * rig.controls[TARGET_ANGLE] - angle * 180 / Math.PI;
                    Projectile.updateAngle(entity);
                    entity.speedX = entity.speed * entity.cosAngle + rig.speedX;
                    entity.speedY = entity.speed * entity.sinAngle + rig.speedY;
                }
                else {
                    blockState = BLOCKED;
                }
            }
            else {
                multiplier *= Math.max(1 - rig.knockbackResistance, 0);
                rig.hp -= damage;
                entity.pierce -= 1;
                // particles
                if (rig.hp == 0) {
                    if ((rig.type == PLAYER && ENV.broadcastPlayerDeaths) || (rig.type == MONSTER && ENV.broadcastMonsterDeaths)) {
                        var deathMessages = Projectile.data[entity.projectileId].deathMessages;
                        insertChat(deathMessages[Math.floor(Math.random() * deathMessages.length)].replaceAll("<name1>", rig.name).replaceAll("<name2>", entity.parent.name), "death");
                    }
                    // reset effects, dash, knockback
                }
            }
            if (rig.hp > 0) {
                rig.knockbackX += entity.speedX * multiplier;
                rig.knockbackY += entity.speedY * multiplier;
            }
            for (var i in Projectile.data[entity.projectileId].contactEvents) {
                Projectile.contactEvents[Projectile.data[entity.projectileId].contactEvents[i].type](rig, entity, Projectile.data[entity.projectileId].contactEvents[i].data);
            }
            break;
        case DAMAGE_EXPLOSION:
            var distanceX = Math.max(Math.abs(rig.x - entity.x) - data.diameter / 2, 0);
            var distanceY = Math.max(Math.abs(rig.y - entity.y) - data.diameter / 2, 0);
            var distance = Math.sqrt(Math.pow(distanceX, 2) + Math.pow(distanceY, 2));
            if (distance > data.diameter / 2) {
                return;
            }
            multiplier *= (1.5 - (distance / (data.diameter / 2)));
            var angle = Math.atan2(entity.y - rig.y, entity.x - rig.x) * 180 / Math.PI;
            if (rig.heldItem == SHIELD && Math.abs(rig.controls[TARGET_ANGLE] - angle) < rig.shieldBlockAngle / 2) {
                blockState = BLOCKED;
                if (Math.random() < entity.critChance) {
                    damage = Math.max(Math.min(Math.floor((entity.damage ?? entity.contactDamage) * 0.2 * multiplier * entity.critDamage * (1 - rig.defense) * (1 - rig.projectileDefense) - rig.damageReduction - rig.projectileDamageReduction), rig.hp), 0);
                    multiplier *= entity.critKnockback;
                    crit = true;
                }
                else {
                    damage = Math.max(Math.min(Math.floor((entity.damage ?? entity.contactDamage) * 0.2 * multiplier * (1 - rig.defense) * (1 - rig.projectileDefense) - rig.damageReduction - rig.projectileDamageReduction), rig.hp), 0);
                }
                multiplier *= entity.knockback ?? entity.contactKnockback;
                multiplier *= Math.max(1 - rig.knockbackResistance - rig.shieldKnockbackResistance, 0);
            }
            else {
                if (Math.random() < entity.critChance) {
                    damage = Math.max(Math.min(Math.floor((entity.damage ?? entity.contactDamage) * multiplier * entity.critDamage * (1 - rig.defense) * (1 - rig.projectileDefense) - rig.damageReduction - rig.projectileDamageReduction), rig.hp), 0);
                    multiplier *= entity.critKnockback;
                    crit = true;
                }
                else {
                    damage = Math.max(Math.min(Math.floor((entity.damage ?? entity.contactDamage) * multiplier * (1 - rig.defense) * (1 - rig.projectileDefense) - rig.damageReduction - rig.projectileDamageReduction), rig.hp), 0);
                }
                multiplier *= entity.knockback ?? entity.contactKnockback;
                multiplier *= Math.max(1 - rig.knockbackResistance, 0);
                rig.hp -= damage;
                // particles
                if (rig.hp == 0) {
                    if ((rig.type == PLAYER && ENV.broadcastPlayerDeaths) || (rig.type == MONSTER && ENV.broadcastMonsterDeaths)) {
                        var deathMessages = [];
                        switch (entity.projectileId) {
                            case "explosive" :
                                var deathMessages = ["<name1> was blown up by <name2>.", "<name1> got blown to pieces due to <name2>.", "<name1> exploded due to <name2>.", "<name1> went boom with the help of <name2>."];
                                break;
                            default:
                                var deathMessages = ["<name1> was blown up by <name2>.", "<name1> got blown to pieces due to <name2>.", "<name1> exploded due to <name2>.", "<name1> went boom with the help of <name2>."];
                                break;
                        }
                        insertChat(deathMessages[Math.floor(Math.random() * deathMessages.length)].replaceAll("<name1>", rig.name).replaceAll("<name2>", entity.name ?? entity.parent.name), "death");
                    }
                    // reset effects, dash, knockback
                }
            }
            if (rig.hp > 0) {
                rig.knockbackX += -cos(angle) * 10 * multiplier;
                rig.knockbackY += -sin(angle) * 10 * multiplier;
            }
            break;
        case DAMAGE_EFFECT:
            damage = Math.min(data.damage, rig.hp);
            rig.hp -= damage;
            // particles
            if (rig.hp == 0) {
                if ((rig.type == PLAYER && ENV.broadcastPlayerDeaths) || (rig.type == MONSTER && ENV.broadcastMonsterDeaths)) {
                    var deathMessages = [];
                    switch (data.damageType) {
                        case "fire" :
                            var deathMessages = ["<name1> went up in flames.", "<name1> got burnt.", "<name1> played with fire."];
                            break;
                        default:
                            var deathMessages = ["<name1> died."];
                            break;
                    }
                    insertChat(deathMessages[Math.floor(Math.random() * deathMessages.length)].replaceAll("<name1>", rig.name), "death");
                }
                // reset effects, dash, knockback
            }
            break;
        default:
            Entity.addParticle({
                x: rig.x,
                y: rig.y,
                layer: rig.layer,
                map: rig.map,
                type: PARTICLE_CRIT_DAMAGE,
                value: "OOF",
            });
            return;
    };
    if (rig.type == PLAYER) {
        if (blockState == REFLECTED) {
            rig.trackedData.damageReflected += damage;
        }
        else if (blockState == BLOCKED) {
            rig.trackedData.damageBlocked += damage;
        }
        else {
            rig.trackedData.damageTaken += damage;
        }
    }
    else if (rig.type == MONSTER) {
        if (parent != null && parent.id != rig.id) {
            rig.aiState = ATTACK;
            rig.pathfindCooldown = 0;
            rig.target = parent;
            rig.targetLastGridX = null;
            rig.targetLastGridY = null;
            rig.provoked = true;
            rig.moveType = PATH;
        }
    }
    if (parent != null && parent.type == PLAYER) {
        parent.trackedData.damageDealt += damage;
    }
    if (rig.hp == 0) {
        if (rig.type == PLAYER) {
            rig.trackedData.deaths += 1;
        }
        if (parent != null && parent.type == PLAYER) {
            parent.trackedData.kills += 1;
            if (rig.type == MONSTER && parent.trackedData.quest.trackData) {
                parent.trackedData.quest.killMonsters[rig.monsterId] += 1;
            }
        }
        if (rig.type == PLAYER) {
            Player.onDeath(rig, parent);
        }
        else if (rig.type == MONSTER) {
            Monster.onDeath(rig, parent);
        }
    }
    else {
        if (damage > 0) {
            rig.hpRegenAcceleration = 0;
        }
    }
    Entity.addParticle({
        x: rig.x,
        y: rig.y,
        layer: rig.layer,
        map: rig.map,
        type: crit ? PARTICLE_CRIT_DAMAGE : PARTICLE_DAMAGE,
        value: damage,
    });
};
// buh just use switch statement buh bhuh buh buhuhuhuhuhuhuhuhuhuhuhubsaduifbawk;awhnjegladf;jewlkrfnsd lfgsdljfmskldf jsdklfja sdkfj as;;;;;;;;
// patterns stores basic data, oother stuf is parser and stuf lolol OKWROWLKSJ LOMG OOMG OMGO MG LO LSD FHJISDLF JBWEFGUOJSD KLGHBSDJKRM<HEKJFGSDK BHNWJKESDFHBWEJKDFB SDHJKVHSD JKFH JKB#QWEKJDRFH:WESG FJKLSDB KSDFMVHL:KWSERHJFIOWELKFGHNOWDSJKL:VBM< NVSDCKL:IWSEJURFILEKNDF:DNFK:DLFJDLGK:
Rig.areaEffect = function(x, y, map, diameter, type, callback) {
    if (type == MONSTER || ENV.playerFriendlyFire) {
        Entity.searchHitboxChunks(Player.chunks, x, y, diameter, diameter, map, callback);
    }
    if (type == PLAYER || ENV.monsterFriendlyFire) {
        Entity.searchHitboxChunks(Monster.chunks, x, y, diameter, diameter, map, callback);
    }
};
Rig.attacks = [
    {
        id: "single",
        attack: function(rig, attack) {
            // attacks as a parser???
            new Projectile(attack.projectile, rig.x, rig.y, rig.controls[TARGET_ANGLE] + Math.random() * rig.projectileAccuracy - rig.projectileAccuracy / 2, rig);
        },
    },
    {
        id: "triple",
        attack: function(rig, attack) {
            var angle = rig.controls[TARGET_ANGLE] + Math.random() * rig.projectileAccuracy - rig.projectileAccuracy / 2;
            new Projectile(attack.projectile, rig.x, rig.y, angle - attack.deviation, rig);
            new Projectile(attack.projectile, rig.x, rig.y, angle, rig);
            new Projectile(attack.projectile, rig.x, rig.y, angle + attack.deviation, rig);
        },
    },
    {
        id: "buh",
        attack: function(rig, attack) {
            var angle = rig.controls[TARGET_ANGLE] + Math.random() * rig.projectileAccuracy - rig.projectileAccuracy / 2;
            for (var i = -24; i < 25; i++) {
                new Projectile(attack.projectile, rig.x, rig.y, angle + attack.deviation * i, rig);
            }
        },
    },
    {
        id: "cameraShake",
        attack: function(rig, attack) {
            var radiusSquared = Math.pow(attack.diameter / 2, 2);
            Entity.searchHitboxChunks(Player.chunks, rig.x, rig.y, attack.diameter, attack.diameter, rig.map, function(player) {
                var distanceSquared = Entity.getDistanceSquared(rig, player);
                if (distanceSquared > radiusSquared) {
                    return;
                }
                player.cameraShakeMagnitude += attack.magnitude * (1 - distanceSquared / radiusSquared);
                player.cameraShakeDecay += attack.decay * distanceSquared / radiusSquared;
            });
        },
    },
    {
        id: "cameraFlash",
        attack: function(rig, attack) {
            var radiusSquared = Math.pow(attack.diameter / 2, 2);
            Entity.searchHitboxChunks(Player.chunks, rig.x, rig.y, attack.diameter, attack.diameter, rig.map, function(player) {
                var distanceSquared = Entity.getDistanceSquared(rig, player);
                if (distanceSquared > radiusSquared) {
                    return;
                }
                var opacity = attack.opacity * (1 - distanceSquared / radiusSquared);
                var duration = attack.duration;
                if (opacity > 1) {
                    duration += (opacity - 1) * 1000;
                    opacity = 1;
                }
                player.cameraFlash.push({
                    opacity: opacity,
                    duration: duration,
                    color: attack.color,
                });
            });
        },
    },
];
Rig.parseAttack = function(attack) {
    for (var i = 0; i < Rig.attacks.length; i++) {
        if (Rig.attacks[i].id == attack.type) {
            attack.type = i;
            break;
        }
        if (Rig.attacks[i].id == attack.pattern) {
            attack.pattern = i;
            break;
        }
    }
    if (attack.data.projectile != null) {
        for (var i = 0; i < Projectile.data.length; i++) {
            if (Projectile.data[i].id == attack.data.projectile) {
                attack.data.projectile = i;
                break;
            }
        }
    }
};
Rig.waypoints = require("./../client/data/waypoint.json");
Rig.effects = [
    {
        id: "fire",
        start: function(rig) {
            rig.hpRegen -= 10;
        },
        during: function(rig) {
            Entity.addParticle({
                x: rig.x,
                y: rig.y,
                layer: rig.layer,
                map: rig.map,
                type: PARTICLE_FIRE,
                width: rig.width,
                height: rig.height,
                value: 0,
            });
            if (rig.teleporting || rig.dialogue != null) {
                return;
            }
            // if (rig.effects.fire % 5 == 0) {
            if (rig.effects[0] % 5 == 0) {
                Rig.onDamage(rig, null, DAMAGE_EFFECT, {
                    damage: Math.ceil(Math.random() * 4),
                    damageType: "fire",
                });
            }
        },
        end: function(rig) {
            rig.hpRegen += 10;
        },
    },
];
EFFECT_STUNNED = 10;
EFFECT_FROZEN = 10;
for (var i = 0; i < Rig.effects.length; i++) {
    if (Rig.effects[i].id == "stunned") {
        EFFECT_STUNNED = i;
    }
    else if (Rig.effects[i].id == "frozen") {
        EFFECT_FROZEN = i;
    }
}
Rig.contactEvents = [
    {
        id: "explosion",
        event: function(rig1, rig2, data) {
            Rig.areaEffect(rig2.x, rig2.y, rig2.map, data.diameter, rig2.type, function(rig) {
                if (rig1.id == rig.id) {
                    return;
                }
                if (rig1.layer != rig.layer) {
                    return;
                }
                if (rig.inSafeRegion || rig.hp == 0 || rig.teleporting || rig.loading || rig.dialogue != null) {
                    return;
                }
                Rig.onDamage(rig, rig2, DAMAGE_EXPLOSION, data);
            });
        },
    },
    {
        id: "areaEffect",
        event: function(rig1, rig2, data) {
            Rig.areaEffect(rig2.x, rig2.y, rig2.map, data.diameter, rig2.type, function(rig) {
                if (rig1.layer != rig.layer) {
                    return;
                }
                if (rig.inSafeRegion || rig.hp == 0 || rig.teleporting || rig.loading || rig.dialogue != null) {
                    return;
                }
                var distanceX = Math.max(Math.abs(rig.x - rig2.x) - data.diameter / 2, 0);
                var distanceY = Math.max(Math.abs(rig.y - rig2.y) - data.diameter / 2, 0);
                var distance = Math.sqrt(Math.pow(distanceX, 2) + Math.pow(distanceY, 2));
                if (distance > data.diameter / 2) {
                    return;
                }
                Rig.addEffect(rig, data.effect, data.duration);
            });
        },
    },
    {
        id: "effect",
        event: function(rig1, rig2, data) {
            Rig.addEffect(rig1, data.effect, data.duration);
        },
    },
    {
        id: "particle",
        event: function(rig1, rig2, data) {
            particlePack[rig2.map].push({
                type: data.particle,
                x: rig2.x,
                y: rig2.y,
                layer: rig2.layer,
                value: data.value,
            });
        },
    },
];
Rig.parseEvent = function(event) {
    if (event.data.projectile != null) {
        for (var i = 0; i < Projectile.data.length; i++) {
            if (Projectile.data[i].id == event.data.projectile) {
                event.data.projectile = i;
                break;
            }
        }
    }
    if (event.data.particle != null) {
        event.data.particle = eval("PARTICLE_" + event.data.particle.toUpperCase());
    }
    if (event.data.effect != null) {
        for (var i = 0; i < Rig.effects.length; i++) {
            if (Rig.effects[i].id == event.data.effect) {
                event.data.effect = i;
                break;
            }
        }
    }
};
Rig.parseContactEvent = function(event) {
    for (var i = 0; i < Rig.contactEvents.length; i++) {
        if (Rig.contactEvents[i].id == event.type) {
            event.type = i;
            break;
        }
    }
    Rig.parseEvent(event);
};

Player = function(socket) {
    var self = new Rig();
    self.type = PLAYER;
    self.socket = socket;
    self.name = null;
    self.loading = true;

    self.ping = 0;
    self.tick = -1;
    self.clientDesyncTime = 0;
    self.overrideClient = true;

    self.width = 32;
    self.height = 32;

    self.moveSpeed = 10;
    self.moveType = CONTROLS;
    
    self.lastKnockbackX = 0;
    self.lastKnockbackY = 0;

    self.animationType = DIRECTIONAL_8;
    self.animationLength = 6;
    self.animationSpeed = 0.05;
    self.animationChangeBySpeed = true;

    self.attack = [];
    self.attackIndex = 0;
    self.attackCooldown = 0;
    self.attackHpCost = 0;
    self.attackManaCost = 0;
    for (var i = 0; i < 19; i++) {
        // a = [];
        // for (var i = 0; i < 50; i++) {
        //     a.push({
        //         // pattern: "single",
        //         type: 0,
        //         data: {
        //             projectile: 0,
        //         },
        //     })
        // }
        // self.attack.push(a)
        self.attack.push(
            [
                {
                    // pattern: "single",
                    type: 0,
                    data: {
                        projectile: 0,
                        // deviation: 15,
                    },
                },
            ]);
    }
    self.attack.push(
        [
            {
                // pattern: "single",
                type: 1,
                data: {
                    projectile: 1,
                    deviation: 15,
                },
            },
            {
                // pattern: "single",
                type: 1,
                data: {
                    projectile: 4,
                    deviation: 15,
                },
            },
        ]);
    self.crystal = [];
    self.crystalIndex = 0;
    self.crystalCooldown = 0;
    self.crystalHpCost = 0;
    self.crystalManaCost = 0;

    self.hp = 10000;
    self.hpMax = 10000;
    self.hpRegen = 10;
    self.hpRegenSpeed = 1;
    self.hpRegenAccelerationRate = 0.1;
    self.hpRegenAccelerationCap = 200;

    self.contactDamage = 1000;
    
    self.projectileDamage = 200;
    self.critChance = 0.1;
    self.critDamage = 3;
    self.critKnockback = 2;

    self.xp = 0;
    self.xpMax = 0;
    self.xpScale = 1;

    self.luck = 0;

    self.cameraShakeMagnitude = 0;
    self.cameraShakeDecay = 0;
    self.cameraFlash = [];

    self.inventory = new Inventory(self);
    Inventory.addItem(self.inventory, 0, [], 1);

    self.customizations = {
        body: [0, 0, 0, 0],
        shirt: [255, 0, 0, 0.5],
        pants: [0, 125, 255, 0.2],
        eyes: [0, 0, 0, 1],
        gloves: [0, 0, 0, 0, 0],
        boots: [0, 0, 0, 0, 0],
        pouch: [0, 0, 0, 0, 0],
        hair: [125, 75, 0, 0.9, 2],
        shield: "shield1",
        item: "bow",
    };

    self.trackedData = {
        playTime: 0,
        quest: {
            killMonsters: [],
            obtainItems: [],
            kills: 0,
            deaths: 0,
            damageDealt: 0,
            damageTaken: 0,
            damageBlocked: 0,
            damageReflected: 0,
            trackData: false,
            updated: false,
        },
        quests: {},
        kills: 0,
        deaths: 0,
        damageDealt: 0,
        damageTaken: 0,
        damageBlocked: 0,
        damageReflected: 0,
        dps: 0,
        maxDps: 0,
    };

    self.dialogue = null;
    self.dialogueStage = 0;

    self.quest = null;
    self.questStage = 0;

    // goals for dialogue/quest
    // interact function
    // sends, "its the 4th dialogue!!"
    // everything else handled by client, such as "continue"
    // sends "end" or "quest" or "shop" (actions)
    // "end:advance", advances quest stage

    // quest:
    // start quest, check criteria (just in case)
    // sends "advance" and "end" packets

    self.renderDistance = 2;
    self.particles = false;
    self.cameraEffects = false;
    self.debug = false;
    self.desyncBuffer = 0;

    Player.init(self);
    return self;
};
Player.list = {};
Player.chunks = {};
Player.init = function(player) {
    Rig.init(player);
    player.leave = function() {
        player.hp = 0;
        if (player.name != null) {
            insertChat(player.name + " left the game.", "login");
            Database.saveProgress(player.name, Player.saveProgress(player));
        }
        player.socket.leave();
        Entity.delete(player);
    };
    player.socket.on("disconnect", function() {
        player.leave();
    });
    player.socket.on("ping", function(data) {
        if (typeof data != "number") {
            player.leave();
            return;
        }
        // setTimeout(function() {
        player.socket.emit("ping", data);
        // }, 1000);
    });
    player.socket.on("ping2", function(data) {
        if (typeof data != "number") {
            player.leave();
            return;
        }
        player.ping = data;
        // player.ping = 1000;
    });
    player.socket.on("settings", function(data) {
        if (!data instanceof Object) {
            player.leave();
            return;
        }
        switch (data.id) {
            case "renderDistance":
                if (typeof data.value != "number") {
                    player.leave();
                    return;
                }
                let renderDistance = Math.floor(data.value);
                if (renderDistance < 1 || renderDistance > 10) {
                    player.leave();
                    return;
                }
                player.renderDistance = renderDistance;
                break;
            case "particles":
                if (typeof data.value != "boolean") {
                    player.leave();
                    return;
                }
                player.particles = data.value;
                break;
            case "cameraEffects":
                if (typeof data.value != "boolean") {
                    player.leave();
                    return;
                }
                player.cameraEffects = data.value;
                break;
            case "debug":
                if (typeof data.value != "boolean") {
                    player.leave();
                    return;
                }
                player.debug = data.value;
                break;
            case "desyncBuffer":
                if (typeof data.value != "number") {
                    player.leave();
                    return;
                }
                if (data.value < 0 || data.value > 64) {
                    player.leave();
                    return;
                }
                player.desyncBuffer = data.value;
                break;
        }
    });
    player.socket.on("tick", function(data) {
        if (player.loading) {
            player.leave();
            return;
        }
        if (!data instanceof Object) {
            player.leave();
            return;
        }
        if (!data.controls instanceof Object) {
            player.leave();
            return;
        }
        // controls
        for (let i in player.controls) {
            if (typeof data.controls[i] == typeof player.controls[i]) {
                player.controls[i] = data.controls[i];
            }
        }
        player.controls[TARGET_ANGLE] = Math.atan2(player.controls[TARGET_Y] - player.y, player.controls[TARGET_X] - player.x) * 180 / Math.PI;
        if (player.controls[TARGET_ANGLE] < 0) {
            player.controls[TARGET_ANGLE] += 360;
        }
        // player.tick = data.tick;
        if (player.tick == -1) {
            player.tick = Math.max(data.tick, tick - ENV.desyncBuffer);
        }
        else if (data.tick > player.tick) {
            player.tick = data.tick;
        }
        else {
            // player.tick += 1;
            return;
        }
        Player.update(player);
        // for (let i in data) {
        //     if (typeof data[i] != "number") {
        //         continue;
        //     }
        //     if (Math.abs(player[i] - data[i]) > player.desyncBuffer) {
        //         // console.log("player " + i + " different. server: " + player[i] + ", client: " + data[i])
        //         // player.clientDesyncTime += 1;
        //         player.clientDesyncTime = 20;
        //         // if (player.clientDesyncTime > player.ping / 50 * 3 + ENV.desyncBuffer) {
        //         //     player.overrideClient = true;
        //         //     player.clientDesyncTime = 0;
        //         // }
        //         player.overrideClient = true;
        //         let d = Player.getClientData(player);
        //         // setTimeout(function() {
        //         player.socket.emit("clientData", d);
        //         // }, 1000);
        //         return;
        //     }
        // }
        // player.clientDesyncTime = 0;
        let d = Player.getClientData(player);
        // setTimeout(function() {
        player.socket.emit("clientData", d);
        // }, 1000);
    });
    player.socket.on("controls", function(data) {
        if (player.loading) {
            player.leave();
            return;
        }
        if (data == RELEASE) {
            for (var i in player.controls) {
                if (typeof player.controls[i] == "boolean") {
                    player.controls[i] = false;
                }
            }
            return;
        }
        if (!data instanceof Object) {
            player.leave();
            return;
        }
        var id = data.id;
        if (id == MOUSE_POSITION) {
            if (typeof data.x != "number" || typeof data.y != "number") {
                player.leave();
                return;
            }
            player.controls[TARGET_X] = data.x;
            player.controls[TARGET_Y] = data.y;
            player.controls[TARGET_ANGLE] = Math.atan2(data.y - player.y, data.x - player.x) * 180 / Math.PI;
            if (player.controls[TARGET_ANGLE] < 0) {
                player.controls[TARGET_ANGLE] += 360;
            }
        }
        else {
            if (typeof data.state != "boolean") {
                player.leave();
                return;
            }
            if (id == DEFEND && data.state) {
                player.x -= 10;
                data.state = false;
            }
            player.controls[id] = data.state;
        }
    });
    player.socket.on("droppedItem", function(data) {
        if (player.loading) {
            player.leave();
            return;
        }
        if (!data instanceof Object) {
            player.leave();
            return;
        }
        var id = data.id;
        if (DroppedItem.list[id] == null) {
            return;
        }
        if (DroppedItem.list[id].parent != null && DroppedItem.list[id].parent != player.id) {
            return;
        }
        Inventory.addItem(player.inventory, DroppedItem.list[id].item.id, DroppedItem.list[id].item.enchantments, DroppedItem.list[id].item.stackSize);
        Entity.delete(DroppedItem.list[id]);
    });
    player.socket.on("customize", function(data) {
        if (player.loading) {
            player.leave();
            return;
        }
        if (!data instanceof Object) {
            player.leave();
            return;
        }
        if (player.customizations[data.id] == null) {
            player.leave();
            return;
        }
        switch (data.type) {
            case CUSTOMIZE_COLOR:
                if (!data.value instanceof Object) {
                    player.leave();
                    return;
                }
                if (typeof data.value[0] != "number" || typeof data.value[1] != "number" || typeof data.value[2] != "number") {
                    return;
                }
                player.customizations[data.id][0] = data.value[0];
                player.customizations[data.id][1] = data.value[1];
                player.customizations[data.id][2] = data.value[2];
                break;
            case CUSTOMIZE_ALPHA:
                if (typeof data.value != "number") {
                    return;
                }
                player.customizations[data.id][3] = data.value;
                break;
            case CUSTOMIZE_TYPE:
                if (typeof data.value != "number") {
                    return;
                }
                if (data.value < 0) {
                    player.leave();
                    return;
                }
                if (data.id == "gloves" || data.id == "boots" || data.id == "pouch") {
                    if (data.value > 1) {
                        player.leave();
                        return;
                    }
                }
                else if (data.id == "hair") {
                    if (data.value > 8) {
                        player.leave();
                        return;
                    }
                }
                else {
                    player.leave();
                    return;
                }
                player.customizations[data.id][4] = data.value;
                break;
        }
    });
    player.socket.on("chat", function(data) {
        if (player.loading) {
            player.leave();
            return;
        }
        if (!data instanceof String) {
            player.leave();
            return;
        }
        if (data.startsWith("/")) {
            var command = data.substring(1).split(" ").shift();
            switch (command) {
                case "help":
                    insertChat("Command Help:\n/help -Displays info on all commands.", "info", player);
                    break;
                default:
                    insertChat("/" + command + " is not an existing command. Try /help for a list of commands.", "error", player);
                    break;
            }
        }
        else {
            var valid = false;
            for (var i = 0; i < data.length; i++) {
                if (data[i] != " ") {
                    valid = true;
                    break;
                }
            }
            if (valid) {
                if (Filter.check(data)) {
                    insertChat("Hey! Don't do that!", "error", player);
                }
                else {
                    var color = "text";
                    if (player.name == "sp") {
                        color = "color: #ff0099;";
                    }
                    else {
                        color = "color: #0099ff;";
                    }
                    if (player.name == "the-real-tianmu") {
                        color = "color: #0099ff;";
                    }
                    insertChat(player.name + ": " + data, color);
                }
            }
        }
    });
    player.socket.on("debugConsole", function(data) {
        if (player.loading) {
            player.leave();
            return;
        }
        if (!data instanceof String) {
            player.leave();
            return;
        }
        
        if (ENV.devs[player.name]) {
            debug(player.name + " - " + data);
            try {
                var self = player;
                var result = eval(data);
                if (result != null) {
                    result = result.toString();
                }
                player.socket.emit("debugConsole", { text: result.replaceAll("<", "&lt;").replaceAll(">", "&gt;"), color: "success" });
                debug(result);
            }
            catch (err) {
                player.socket.emit("debugConsole", { text: err.toString().replaceAll("<", "&lt;").replaceAll(">", "&gt;"), color: "error" });
                error(err);
            }
        }
        else {
            player.socket.emit("debugConsole", { text: "No Permission!", color: "error" });
        }
    });
    player.socket.on("teleport", function() {
        if (player.loading) {
            player.leave();
            return;
        }
        if (player.teleportTime > 0) {
            player.teleportTime *= -1;
        }
    });
    player.socket.on("respawn", function() {
        if (player.loading) {
            player.leave();
            return;
        }
        if (player.hp == 0) {
            player.hp = Math.ceil(player.hpMax * ENV.respawnHp);
            player.mana = Math.ceil(player.manaMax * ENV.respawnMana);
            if (ENV.respawnTeleport) {
                Rig.teleport(player, 0, 0, 0, 0);
            }
        }
    });
    player.socket.on("dialogue", function(data) {
        if (player.loading) {
            player.leave();
            return;
        }
        if (!data instanceof Number) {
            player.leave();
            return;
        }
        var actions = Npc.dialogue[player.dialogue][player.dialogueStage].options[data].action.split("_");
        switch (actions[0]) {
            case "continue":
                player.dialogueStage += 1;
                player.socket.emit("dialogue", player.dialogue);
                break;
            case "end":
                if (player.quest != null && Npc.quest[player.quest].stages[player.questStage].talk == player.dialogue) {
                    Player.advanceQuest(player);
                }
                player.dialogue = null;
                player.socket.emit("dialogue");
                break;
            case "quest":
                player.dialogue = null;
                player.quest = actions[1];
                player.questStage = 0;
                player.trackedData.quest.killMonsters = [];
                player.socket.emit("quest", player.quest);
                break;
            case "dialogue":
                player.dialogue = actions[1];
                player.dialogueStage = 0;
                player.socket.emit("dialogue", player.dialogue);
                break;
            default:
                error("Invalid dialogue action " + action + ". Dialogue " + player.dialogue + ", stage " + player.dialogueStage + ", option " + data + ".");
                break;
        }
    });
};
Player.update = function(player) {
    if (player.loading) {
        return;
    }
    Rig.update(player);
    if (player.hp > 0) {
        Player.updateAttack(player);
    }
    Inventory.update(player.inventory);
};
Player.updateAttack = function(player) {
    if (player.teleporting || player.dialogue != null || player.effects[EFFECT_STUNNED] != null) {
        return;
    }
    if (player.controls[DEFEND]) {
        if (player.dashTime < -18) {
            player.dashX = cos(player.controls[TARGET_ANGLE]) * 200;
            player.dashY = sin(player.controls[TARGET_ANGLE]) * 200;
            player.dashTime = 2;
            player.overrideClient = true;
        }
        // player.heldItem = SHIELD;
        return;
    }
    // if (player.controls[ATTACK] && player.inventory.items[player.inventory.selectedItem] != null && player.inventory.items[player.inventory.selectedItem].cooldown <= 0) {
    if (player.controls[ATTACK]) {
        if (player.attackManaCost <= player.mana) {
            player.hp -= player.attackHpCost;
            if (player.attackHpCost > 0) {
                player.hpRegenAcceleration = 0;
            }
            player.mana -= player.attackManaCost;
            if (player.attackManaCost > 0) {
                player.manaRegenAcceleration = 0;
            }
            for (var i in player.attack[player.attackIndex]) {
                Rig.attacks[player.attack[player.attackIndex][i].type](player, player.attack[player.attackIndex][i].data);
            }
            player.attackIndex = (player.attackIndex + 1) % player.attack.length;
            // player.inventory.items[player.inventory.selectedItem].cooldown = player.attack.useTime;
        }
        if (player.crystalManaCost <= player.mana) {
            player.hp -= player.crystalHpCost;
            if (player.crystalHpCost > 0) {
                player.hpRegenAcceleration = 0;
            }
            player.mana -= player.crystalManaCost;
            if (player.crystalManaCost > 0) {
                player.manaRegenAcceleration = 0;
            }
            for (var i in player.crystal[player.crystalIndex]) {
                Rig.attacks[player.crystal[player.crystalIndex][i].type](player, player.crystal[player.crystalIndex][i].data);
            }
            player.crystalIndex = (player.crystalIndex + 1) % player.crystal.length;
            // player.inventory.items[player.inventory.selectedItem].cooldown = player.crystal.useTime;
        }
    }
};
Player.updateStats = function(player) {
    var hp = player.hp;
    var hpMax = player.hpMax;
    var mana = player.mana;
    var manaMax = player.manaMax;

    player.hpMax = 100;
    player.hpRegen = 1;
    player.hpRegenSpeed = 10;
    player.hpRegenAccelerationRate = 0.1;
    player.hpRegenAccelerationCap = 1;

    player.manaMax = 100;
    player.manaRegen = 1;
    player.manaRegenSpeed = 10;
    player.manaRegenAccelerationRate = 0.1;
    player.manaRegenAccelerationCap = 1;

    player.defense = 0;
    player.damageReduction = 0;
    player.knockbackResistance = 0;
    player.projectileDefense = 0;
    player.projectileDamageReduction = 0;
    player.projectileDamage = 0;
    player.projectileSpeed = 1;
    player.projectileRange = 1;
    player.projectileAccuracy = 0;
    player.projectileKnockback = 1;
    player.projectilePierce = 0;
    player.critChance = 0;
    player.critDamage = 1;
    player.critKnockback = 1;
    player.shieldKnockbackResistance = 0;
    player.shieldBlockAngle = 0;
    player.shieldReflectionChance = 0;
    player.contactDefense = 0;
    player.contactDamageReduction = 0;
    player.contactDamage = 0;
    player.contactEvents = [];
    player.contactKnockback = 1;

    player.moveSpeed = 10;

    player.xpScale = 1;

    player.luck = 0;

    var damageType = null;
    if (player.inventory.items[player.inventory.selectedItem] != ITEM_NULL) {

    }
    for (var i = EQUIP_HELMET; i >= EQUIP_ACCESSORY_2; i--) {
        if (player.inventory.items[i] == ITEM_NULL) {
            continue;
        }
        if (Inventory.items[player.inventory.items[i].id].effects != null) {
            for (var j in Inventory.items[player.inventory.items[i].id].effects) {
                var effect = Inventory.items[player.inventory.items[i].id].effects[j];
                var id = null;
                switch (effect.id) {
                    case "damage":
                        id = "projectileDamage";
                        break;
                    case "meleeDamage":
                        if (damageType == DAMAGE_MELEE) {
                            id = "projectileDamage";
                        }
                        break;
                    case "rangedDamage":
                        if (damageType == DAMAGE_RANGED) {
                            id = "projectileDamage";
                        }
                        break;
                    case "magicDamage":
                        if (damageType == DAMAGE_MAGIC) {
                            id = "projectileDamage";
                        }
                        break;
                    case "hp":
                        id = "hpMax";
                        break;
                    case "mana":
                        id = "manaMax";
                        break;
                    default:
                        id = effect.id;
                        break;
                }
                if (id == null) {
                    continue;
                }
                switch (effect.type) {
                    case EFFECT_BASE:
                        player[id] = effect.value;
                        break;
                    case EFFECT_ADDITIVE:
                        player[id] += effect.value;
                        break;
                    case EFFECT_MULTIPLICATIVE:
                        player[id] *= effect.value;
                        break;
                }
            }
        }
    }

    if (hp != 0) {
        player.hp = player.hpMax - (hpMax - hp);
        player.mana = player.manaMax - (manaMax - mana);
    
        if (player.hp < 0) {
            if (ENV.broadcastPlayerDeaths) {
                var deathMessages = ["<name1> became too weak."];
                insertChat(deathMessages[Math.floor(Math.random() * deathMessages.length)].replaceAll("<name1>", player.name), "death");
            }
            Player.onDeath(player, null);
        }
    }
};
Player.onDeath = function(player, parent) {
    if (ENV.broadcastMonsterTaunts && parent != null && parent.type == MONSTER) {
        var tauntMessages = Monster.data[parent.monsterId].tauntMessages;
        insertChat(parent.name + ": " + tauntMessages[Math.floor(Math.random() * tauntMessages.length)].replaceAll("<name1>", player.name).replaceAll("<name2>", parent.name), "taunt");
    }
    if (ENV.hardcore) {
        Database.ban(player.name, ENV.hardcoreBanTime);
    }
    else {
        player.speedX = 0;
        player.speedY = 0;
        player.animationStage = 0;
        player.hp = 0;
        player.hpRegenCooldown = 0;
        player.hpRegenAcceleration = 0;
        player.mana = 0;
        player.manaRegenCooldown = 0;
        player.manaRegenAcceleration = 0;
        player.invincibilityFrames = {};
        for (var i in player.effects) {
            Rig.effects[i].end(player);
        }
        player.effects = {};
        player.knockbackX = 0;
        player.knockbackY = 0;
        player.dashX = 0;
        player.dashY = 0;
        player.dashTime = 0;
        player.heldItem = NONE;
    }
};
Player.updateCollisions = function(player) {
    if (player.inSafeRegion || player.hp == 0 || player.teleporting || player.loading || player.dialogue != null) {
        return;
    }
    if (ENV.playerFriendlyFire) {
        Entity.searchHitboxChunks(Player.chunks, player.x, player.y, player.width, player.height, player.map, function(rig) {
            if (rig.id == player.id) {
                return;
            }
            if (rig.layer != player.layer) {
                return;
            }
            if (rig.inSafeRegion || rig.hp == 0 || rig.teleporting || rig.loading || rig.dialogue != null) {
                return;
            }
            if (Entity.collideWithEntity(player, rig)) {
                Rig.onDamage(rig, player, DAMAGE_CONTACT);
            }
        });
    }
    Entity.searchHitboxChunks(Monster.chunks, player.x, player.y, player.width, player.height, player.map, function(rig) {
        if (rig.layer != player.layer) {
            return;
        }
        if (rig.inSafeRegion || rig.hp == 0 || rig.teleporting) {
            return;
        }
        if (Entity.collideWithEntity(player, rig)) {
            Rig.onDamage(rig, player, DAMAGE_CONTACT);
        }
    });
};
Player.interact = function(player) {
    if (player.dialogue == null) {
        Entity.searchChunks(Npc.chunks, Math.floor(player.controls.targetX / CHUNK_SIZE), Math.floor(player.controls.targetY / CHUNK_SIZE), player.map, 1, function(npc) {
            if (Entity.collisionPoint(npc, player.controls.targetX, player.controls.targetY)) {
                Npc.interact(npc, player);
            }
        });
    }
};
Player.advanceQuest = function(player) {
    if (Npc.quest[player.quest].stages.length == player.questStage + 1) {
        player.trackedData.quests[player.quest] = true;
        player.quest = null;
        player.socket.emit("quest", QUEST_COMPLETE);
    }
    else {
        player.questStage += 1;
        player.socket.emit("quest", QUEST_ADVANCE);
    }
};
Player.updateQuest = function(player) {
    if (player.quest != null && player.trackedData.quest.updated) {
        var data = [];
        var stage = Npc.quest[player.quest].stages[player.questStage];
        var completed = true;
        if (stage.killMonsters != null) {
            for (var i in stage.killMonsters) {
                if (player.trackedData.quest.killMonsters[i] < stage.killMonsters[i]) {
                    completed = false;
                }
                data.push(player.trackedData.quest.killMonsters[i] || 0);
            }
        }
        if (stage.obtainItems != null) {
            for (var i in stage.obtainItems) {
                if (player.trackedData.quest.obtainItems[i] < stage.obtainItems[i]) {
                    completed = false;
                }
                data.push(player.trackedData.quest.obtainItems[i] || 0);
            }
        }
        if (stage.kills != null) {
            if (player.trackedData.quest.kills < stage.kills) {
                completed = false;
            }
            data.push(player.trackedData.quest.kills || 0);
        }
        if (stage.deaths != null) {
            if (player.trackedData.quest.deaths < stage.deaths) {
                completed = false;
            }
            data.push(player.trackedData.quest.deaths || 0);
        }
        if (stage.damageDealt != null) {
            if (player.trackedData.quest.damageDealt < stage.damageDealt) {
                completed = false;
            }
            data.push(player.trackedData.quest.damageDealt || 0);
        }
        if (stage.damageTaken != null) {
            if (player.trackedData.quest.damageTaken < stage.damageTaken) {
                completed = false;
            }
            data.push(player.trackedData.quest.damageTaken || 0);
        }
        if (stage.damageBlocked != null) {
            if (player.trackedData.quest.damageBlocked < stage.damageBlocked) {
                completed = false;
            }
            data.push(player.trackedData.quest.damageBlocked || 0);
        }
        if (stage.damageReflected != null) {
            if (player.trackedData.quest.damageReflected < stage.damageReflected) {
                completed = false;
            }
            data.push(player.trackedData.quest.damageReflected || 0);
        }
        if (stage.dps != null) {
            if (player.trackedData.dps < stage.dps) {
                completed = false;
            }
            data.push(player.trackedData.dps || 0);
        }
        if (completed) {
            Player.advanceQuest(player);
        }
        player.socket.emit("quest", data);
    }
    player.trackedData.quest.updated = false;
};
Player.satisfiesCriteria = function(player, criteria) {
    var array = criteria.split(":");
    for (var i in array) {
        if (array[i].substring(0, 2) == "xp") {
            if (array[i].substring(2, 4) == "<=") {
                var sections = array[i].split("<=");
                if (player.xp > Number(sections[1])) {
                    return false;
                }
            }
            else if (array[i].substring(2, 4) == ">=") {
                var sections = array[i].split(">=");
                if (player.xp < Number(sections[1])) {
                    return false;
                }
            }
            else if (array[i].substring(2, 4) == "==") {
                var sections = array[i].split("==");
                if (player.xp != Number(sections[1])) {
                    return false;
                }
            }
            else if (array[i].substring(2, 3) == "<") {
                var sections = array[i].split("<");
                if (player.xp >= Number(sections[1])) {
                    return false;
                }
            }
            else if (array[i].substring(2, 3) == ">") {
                var sections = array[i].split(">");
                if (player.xp <= Number(sections[1])) {
                    return false;
                }
            }
            continue;
        }
        var sections = array[i].split("_");
        switch (sections[0]) {
            case "quest":
                if (!player.trackedData.quests[sections[1]]) {
                    return false;
                }
                break;
            case "!quest":
                if (player.trackedData.quests[sections[1]]) {
                    return false;
                }
                break;
            default:
                error("Invalid criteria " + sections[0] + " with args " + sections.shift() + ".");
                break;
        }
    }
    return true;
};
Player.parseCriteria = function(criteria) {
    if (criteria.quests != null) {
        for (var i = 0; i < criteria.quests.length; i++) {
            
        }
    }
    var array = criteria.split(":");
    for (var i in array) {
        if (array[i].substring(0, 2) == "xp") {
            continue;
        }
        var sections = array[i].split("_");
        switch (sections[0]) {
            default:
                break;
        }
    }
    return true;
};
Player.runTrigger = function(trigger) {
    var array = criteria.split(":");
    for (var i in array) {
        if (array[i].substring(0, 2) == "xp") {
            continue;
        }
        var sections = array[i].split("_");
        switch (sections[0]) {
            default:
                break;
        }
    }
    return true;
};
Player.saveProgress = function(player) {
    var progress = {};
    // progress.xp = player.xp;
    // progress.trackedData = player.trackedData;
    progress.customizations = player.customizations;
    return progress;
};
Player.loadProgress = function(player, progress) {
    if (progress.customizations != null) {
        player.customizations = progress.customizations;
    }
};
Player.getClientData = function(player) {
    let data = {
        x: player.x,
        y: player.y,
        width: player.width,
        height: player.height,
        layer: player.layer,
        knockbackX: player.knockbackX,
        knockbackY: player.knockbackY,
        moveSpeed: player.moveSpeed,
        animationType: player.animationType,
        animationStage: player.animationStage,
        animationLength: player.animationLength,
        animationSpeed: player.animationSpeed,
        animationChangeBySpeed: player.animationChangeBySpeed,
        animationPhase: player.animationPhase,
        overrideClient: player.overrideClient,
        hp: player.hp,
        hpMax: player.hpMax,
        mana: player.mana,
        manaMax: player.manaMax,
        xp: player.xp,
        xpMax: player.xpMax,
        tick: player.tick,
    };
    if (player.overrideClient) {
        player.overrideClient = false;
    }
    return data;
};

Npc = function(npcId, x, y, layer, map) {
    var self = new Rig();
    self.type = NPC;

    self.npcId = npcId;

    self.x = x;
    self.y = y;
    self.layer = layer;
    self.map = map;

    self.hp = 100;
    self.hpMax = 100;

    if (Npc.data[self.npcId].customizations != null) {
        self.width = 32;
        self.height = 32;
        self.animationType = DIRECTIONAL_8;
        self.animationLength = 6;
        self.animationSpeed = 0.1;
        self.animationChangeBySpeed = true;
    }
    else {
        self.width = Npc.data[self.npcId].width;
        self.height = Npc.data[self.npcId].height;
        // self.animationType = eval(Npc.data[self.npcId].animationType);
        self.animationLength = Npc.data[self.npcId].animationLength;
        self.animationSpeed = Npc.data[self.npcId].animationSpeed;
        self.animationChangeBySpeed = Npc.data[self.npcId].animationChangeBySpeed;
    }

    self.moveSpeed = Npc.data[self.npcId].moveSpeed;
    // self.moveType = eval(Npc.data[self.npcId].moveType);
    self.moveWaypoint = self.npcId;

    Npc.init(self);
    return self;
};
Npc.list = {};
Npc.chunks = {};
Npc.data = require("./../client/data/npc.json");
Npc.dialogue = require("./../client/data/dialogue.json");
Npc.quest = require("./../client/data/quest.json");
Npc.init = function(npc) {
    Rig.init(npc);
};
Npc.update = function(npc) {
    Rig.update(npc);
    Entity.addEntity(npc, {
        id: npc.id,
        rigId: npc.npcId,
        type: NPC,
        x: npc.x,
        y: npc.y,
        layer: npc.layer,
        animationStage: Math.floor(npc.animationStage),
        animationDirection: npc.animationDirection,
        animationPhase: npc.animationPhase,
    });
};
Npc.interact = function(npc, player) {
    for (var i in Npc.data[npc.name].rightClickEvents) {
        if (Player.satisfiesCriteria(player, Npc.data[npc.name].rightClickEvents[i].criteria)) {
            if (Npc.data[npc.name].rightClickEvents[i].dialogue) {
                player.dialogue = Npc.data[npc.name].rightClickEvents[i].dialogue;
                player.dialogueStage = 0;
                player.socket.emit("dialogue", player.dialogue);
            }
            if (Npc.data[npc.name].rightClickEvents[i].script) {
                eval(Npc.data[npc.name].rightClickEvents[i].script);
            }
            // triggers
            break;
        }
    }
};

Monster = function(monsterId, x, y, layer, map, spawnerId) {
    var self = new Rig();
    self.type = MONSTER;

    self.monsterId = monsterId;

    self.name = Monster.data[self.monsterId].name;

    self.x = x;
    self.y = y;
    self.layer = layer;
    self.map = map;

    if (Monster.data[self.monsterId].customizations != null) {
        self.width = 32;
        self.height = 32;
        self.animationType = DIRECTIONAL_8;
        self.animationLength = 6;
    }
    else {
        self.width = Monster.data[self.monsterId].width;
        self.height = Monster.data[self.monsterId].height;
        self.animationType = eval(Monster.data[self.monsterId].animationType);
        self.animationLength = Monster.data[self.monsterId].animationLength;
        self.animationSpeed = Monster.data[self.monsterId].animationSpeed;
        self.animationChangeBySpeed = Monster.data[self.monsterId].animationChangeBySpeed;
    }

    self.moveType = WANDER;

    self.spawnerId = spawnerId;

    self.aiState = SPAWNING;
    self.spawningTime = 60;
    self.target = null;
    self.targetLastGridX = 0;
    self.targetLastGridY = 0;
    self.pathfindCooldown = 0;
    self.provoked = false;
    self.aggroMinDistance = Monster.data[self.monsterId].aggroMinDistance;
    self.aggroMaxDistance = Monster.data[self.monsterId].aggroMaxDistance;
    self.retreatMinThreshold = 0;
    self.retreatMaxThreshold = 0;
    self.circleDistance = 0;
    self.circleDistanceSpread = Math.random() * 128 - 64;
    self.circleDirection = CLOCKWISE;
    self.smartAim = -1;

    self.attackStage = 0;
    self.attackCooldown = 0;
    self.attackTime = 0;
    self.startAttacks = null;
    self.loopedAttacks = null;
    self.randomAttacks = null;

    self.endTrigger = null;

    Monster.init(self);
    return self;
};
Monster.list = {};
Monster.chunks = {};
Monster.data = require("./../client/data/monster.json");
// scientific name lol
Monster.init = function(monster) {
    Rig.init(monster);
    Monster.updateStats(monster);
};
Monster.update = function(monster) {
    Rig.update(monster);
    Monster.updateAI(monster);
    Monster.updateAttack(monster);
    Entity.addEntity(monster, {
        id: monster.id,
        rigId: monster.monsterId,
        type: MONSTER,
        x: monster.x,
        y: monster.y,
        layer: monster.layer,
        animationStage: Math.floor(monster.animationStage),
        animationDirection: monster.animationDirection,
        animationPhase: monster.animationPhase,
        hp: monster.hp,
        hpMax: monster.hpMax,
    });
};
Monster.updateAI = function(monster) {
    if (monster.inSafeRegion) {
        monster.pathfindCooldown -= 1;
        if (monster.pathfindCooldown <= 0) {
            monster.movePath = Rig.escapeSafeRegion(monster);
            monster.movePathIndex = 0;
            monster.pathfindCooldown = ENV.pathfindUpdateSpeed;
        }
        return;
    }
    if (monster.aiState == SPAWNING) {
        monster.spawningTime -= 1;
        if (monster.spawningTime == 0) {
            monster.aiState = IDLE;
        }
    }
    if (monster.aiState == IDLE) {
        var lowest = null;
        var lowestDistance = 0;
        Entity.searchChunks(Player.chunks, monster.chunkX, monster.chunkY, monster.map, 2, function(player) {
            if (player.inSafeRegion || player.hp == 0 || player.teleporting || player.loading || player.dialogue != null) {
                return;
            }
            if (lowest == null || Entity.getDistance(monster, player) < lowestDistance) {
                lowest = player;
                // set parent not to id but just to reference object
                lowestDistance = Entity.getDistance(monster, player);
            }
        });
        if (lowest != null && lowestDistance <= monster.aggroMinDistance) {
            monster.aiState = ATTACK;
            monster.pathfindCooldown = 0;
            monster.target = lowest;
            monster.targetLastGridX = null;
            monster.targetLastGridY = null;
            monster.provoked = false;
            monster.moveType = PATH;
        }
    }
    if (monster.aiState == ATTACK && monster.hp <= monster.hpMax * monster.retreatMinThreshold) {
        monster.aiState = RETREATING;
        monster.pathfindCooldown = 0;
        monster.targetLastGridX = null;
        monster.targetLastGridY = null;
    }
    if (monster.aiState == ATTACK) {
        if (monster.target == null || monster.target.inSafeRegion || monster.target.hp == 0 || monster.target.teleporting || monster.target.loading || monster.target.dialogue != null || (!monster.provoked && Entity.getDistance(monster, monster.target) > monster.aggroMaxDistance)) {
            monster.target = null;
            monster.aiState = IDLE;
            monster.provoked = false;
            monster.moveType = WANDER;
            monster.moveCooldown = 0;
            monster.movePathIndex = monster.movePath.length;
            return;
        }
        monster.pathfindCooldown -= 1;
        if ((monster.pathfindCooldown <= 0 && (monster.target.gridX != monster.targetLastGridX || monster.target.gridY != monster.targetLastGridY)) || monster.movePath.length == monster.movePathIndex) {
            if (Entity.getDistance(monster, monster.target) < monster.circleDistance) {
                // circling
                var angle = Math.atan2(monster.target.y - monster.y, monster.target.x - monster.x) * 180 / Math.PI;
                if (monster.circleDirection == CLOCKWISE) {
                    angle += 20;
                }
                else {
                    angle -= 20;
                }
                var x = Math.round(monster.target.x + cos(angle) * monster.circleDistance);
                var y = Math.round(monster.target.x + sin(angle) * monster.circleDistance);
                var changeDirection = false;
                if (Rig.raycast(monster.x, monster.y, x, y, monster.layer, monster.map)) {
                    changeDirection = true;
                }
                else if (Math.random() < 0.02) {
                    changeDirection = true;
                }
                if (changeDirection) {
                    if (monster.circleDirection == CLOCKWISE) {
                        angle -= 40;
                        monster.circleDirection = COUNTER_CLOCKWISE;
                    }
                    else {
                        angle += 40;
                        monster.circleDirection = CLOCKWISE;
                    }
                    x = Math.round(monster.target.x + cos(angle) * monster.circleDistance);
                    y = Math.round(monster.target.x + sin(angle) * monster.circleDistance);
                }
                monster.movePath = Rig.pathfind(monster, Math.floor(x / TILE_SIZE), Math.floor(y / TILE_SIZE));
            }
            else {
                monster.movePath = Rig.pathfind(monster, monster.target.gridX, monster.target.gridY);
            }
            if (ENV.dodgeProjectiles) {
                Rig.dodgeProjectiles(monster);
            }
            monster.movePathIndex = 0;
            monster.pathfindCooldown = ENV.pathfindUpdateSpeed;
        }
        monster.targetLastGridX = monster.target.gridX;
        monster.targetLastGridY = monster.target.gridY;
    }
    if (monster.aiState == RETREATING) {
        if (monster.target == null || monster.target.inSafeRegion || monster.target.hp == 0 || monster.target.teleporting || monster.target.loading || monster.target.dialogue != null || (!monster.provoked && Entity.getDistance(monster, monster.target) > monster.aggroMaxDistance)) {
            monster.target = null;
            monster.aiState = IDLE;
            monster.provoked = false;
            monster.moveType = WANDER;
            monster.moveCooldown = 0;
            monster.movePathIndex = monster.movePath.length;
            return;
        }
        if (monster.hp >= monster.hpMax * monster.retreatMaxThreshold) {
            if (monster.provoked) {
                monster.aiState = ATTACK;
                monster.pathfindCooldown = 0;
                monster.targetLastGridX = null;
                monster.targetLastGridY = null;
            }
            else {
                monster.aiState = IDLE;
                monster.moveType = WANDER;
            }
            return;
        }
        monster.pathfindCooldown -= 1;
        if ((monster.pathfindCooldown <= 0 && (monster.target.gridX != monster.targetLastGridX || monster.target.gridY != monster.targetLastGridY)) || monster.movePath.length == monster.movePathIndex) {
            monster.movePath = Rig.retreat(monster, monster.target.gridX, monster.target.gridY);
            if (ENV.dodgeProjectiles) {
                Rig.dodgeProjectiles(monster);
            }
            monster.movePathIndex = 0;
            monster.pathfindCooldown = ENV.pathfindUpdateSpeed;
        }
        monster.targetLastGridX = monster.target.gridX;
        monster.targetLastGridY = monster.target.gridY;
    }
};
Monster.updateAttack = function(monster) {
    if (monster.aiState == SPAWNING || monster.aiState == IDLE) {
        return;
    }
    monster.controls[TARGET_X] = monster.target.x;
    monster.controls[TARGET_Y] = monster.target.y;
    if (monster.smartAim == -1) {
        monster.controls[TARGET_ANGLE] = Math.atan2(monster.target.y - monster.y, monster.target.x - monster.x) * 180 / Math.PI;
    }
    else {
        var targetAngle = Math.atan2(monster.target.y - monster.y, monster.target.x - monster.x) * 180 / Math.PI;
        var targetAngleMultiplier = monster.target.x > monster.x ? 1 : -1;
        var targetSpeed = Math.sqrt(Math.pow(monster.target.speedX - monster.speedX, 2) + Math.pow(monster.target.speedY - monster.speedY, 2));
        var targetSpeedAngle = (180 - Math.atan2(monster.target.speedY - monster.speedY, monster.target.speedX - monster.speedX) * 180 / Math.PI + targetAngle) * targetAngleMultiplier;
        var projectileSpeed = Projectile.data[monster.smartAim].speed * monster.projectileSpeed;
        var projectileAngle = Math.asin(targetSpeed / projectileSpeed * sin(targetSpeedAngle)) * targetAngleMultiplier * 180 / Math.PI;
        if (isNaN(projectileAngle)) {
            projectileAngle = 0;
        }
        monster.controls[TARGET_ANGLE] = projectileAngle + targetAngle;
    }
    monster.attackCooldown -= 1;
    if (monster.attackCooldown <= 0) {
        var totalWeight = 0;
        for (var i in monster.loopedAttacks) {
            totalWeight += monster.loopedAttacks[i].weight;
        }
        var attack = Math.floor(Math.random() * totalWeight);
        for (var i in monster.loopedAttacks) {
            totalWeight -= monster.loopedAttacks[i].weight;
            if (attack >= totalWeight) {
                monster.attackCooldown = monster.loopedAttacks[i].cooldown;
                for (var j in monster.loopedAttacks[i].attacks) {
                    Rig.attacks[monster.loopedAttacks[i].attacks[j].pattern](monster, monster.loopedAttacks[i].attacks[j].data);
                }
                break;
            }
        }
    }
    for (var i in monster.randomAttacks) {
        if (Math.random() <= monster.randomAttacks[i].chance) {
            for (var j in monster.randomAttacks[i].attacks) {
                Rig.attacks[monster.randomAttacks[i].attacks[j].pattern](monster, monster.randomAttacks[i].attacks[j].data);
            }
        }
    }
    monster.attackTime += 1;
    switch (monster.endTrigger.type) {
        case "time":
            if (monster.attackTime >= monster.endTrigger.data.time) {
                Monster.nextAttackStage(monster);
            }
            break;
        case "hp":
            if (monster.hp <= monster.hpMax * monster.endTrigger.data.hp) {
                Monster.nextAttackStage(monster);
            }
            break;
        case "none":
            break;
    }
};
Monster.nextAttackStage = function(monster) {
    monster.attackStage += 1;
    monster.attackCooldown = 0;
    monster.attackTime = 0;
    Monster.updateStats(monster);
    for (var i in monster.startAttacks) {
        Rig.attacks[monster.startAttacks[i].type](monster, monster.startAttacks[i].data);
    }
};
Monster.updateStats = function(monster) {
    var data = Monster.data[monster.monsterId].stages[monster.attackStage];

    monster.hp = data.hp;
    monster.hpMax = data.hpMax;
    monster.hpRegen = data.hpRegen;
    monster.hpRegenSpeed = data.hpRegenSpeed;
    monster.hpRegenAccelerationRate = data.hpRegenAccelerationRate;
    monster.hpRegenAccelerationCap = data.hpRegenAccelerationCap;

    monster.defense = data.defense;
    monster.damageReduction = data.damageReduction;
    monster.knockbackResistance = data.knockbackResistance;
    monster.projectileDefense = data.projectileDefense;
    monster.projectileDamageReduction = data.projectileDamageReduction;
    monster.projectileDamage = data.projectileDamage;
    monster.projectileSpeed = data.projectileSpeed;
    monster.projectileRange = data.projectileRange;
    monster.projectileAccuracy = data.projectileAccuracy;
    monster.projectileKnockback = data.projectileKnockback;
    monster.projectilePierce = data.projectilePierce;
    monster.critChance = data.critChance;
    monster.critDamage = data.critDamage;
    monster.critKnockback = data.critKnockback;
    monster.shieldKnockbackResistance = data.shieldKnockbackResistance;
    monster.shieldBlockAngle = data.shieldBlockAngle;
    monster.shieldReflectionChance = data.shieldReflectionChance;
    monster.contactDefense = data.contactDefense;
    monster.contactDamageReduction = data.contactDamageReduction;
    monster.contactDamage = data.contactDamage;
    monster.contactEvents = data.contactEvents;
    monster.contactKnockback = data.contactKnockback;

    monster.moveSpeed = data.moveSpeed;

    monster.heldItem = data.heldItem;

    monster.animationPhase = data.animationPhase;

    monster.retreatMinThreshold = data.retreatMinThreshold;
    monster.retreatMaxThreshold = data.retreatMaxThreshold;
    monster.circleDistance = data.circleDistance + monster.circleDistanceSpread;
    monster.smartAim = data.smartAim;

    monster.startAttacks = data.startAttacks;
    monster.loopedAttacks = data.loopedAttacks;
    monster.randomAttacks = data.randomAttacks;
    
    monster.endTrigger = data.endTrigger;
};
Monster.onDeath = function(monster, parent) {
    if (parent != null && parent.type == PLAYER) {
        // spawn items
    }
    if (monster.spawnerId != null) {
        spawners[monster.spawnerId].timer = Math.floor(Math.random() * ENV.monsterSpawnTime) + ENV.monsterSpawnTime;
    }
    Entity.delete(monster);
};
Monster.updateCollisions = function(monster) {
    if (monster.inSafeRegion || monster.hp == 0 || monster.teleporting) {
        return;
    }
    Entity.searchHitboxChunks(Player.chunks, monster.x, monster.y, monster.width, monster.height, monster.map, function(rig) {
        if (rig.layer != monster.layer) {
            return;
        }
        if (rig.inSafeRegion || rig.hp == 0 || rig.teleporting || rig.loading || rig.dialogue != null) {
            return;
        }
        if (Entity.collideWithEntity(monster, rig)) {
            Rig.onDamage(rig, monster, DAMAGE_CONTACT);
        }
    });
    if (ENV.monsterFriendlyFire) {
        Entity.searchHitboxChunks(Monster.chunks, monster.x, monster.y, monster.width, monster.height, monster.map, function(rig) {
            if (rig.id == monster.id) {
                return;
            }
            if (rig.layer != monster.layer) {
                return;
            }
            if (rig.inSafeRegion || rig.hp == 0 || rig.teleporting) {
                return;
            }
            if (Entity.collideWithEntity(monster, rig)) {
                Rig.onDamage(rig, monster, DAMAGE_CONTACT);
            }
        });
    }
};


// pathfinding
// different map regions
// if in same region, use bug/A*
// if in seperate region use lookup

// inverse sin 

// attack patterns
// array of actions

Projectile = function(projectileId, x, y, angle, parent) {
    var self = new Entity();
    self.type = PROJECTILE;

    self.projectileId = projectileId;

    self.x = x;
    self.y = y;

    self.width = Projectile.data[self.projectileId].width;
    self.height = Projectile.data[self.projectileId].height;
    self.pattern = Projectile.data[self.projectileId].pattern;

    self.angle = angle;

    self.sinAngle = 0;
    self.cosAngle = 0;

    self.collisionBoxWidth = 0;
    self.collisionBoxHeight = 0;

    self.updateVertices = false;

    self.vertex1x = 0;
    self.vertex1y = 0;
    self.vertex2x = 0;
    self.vertex2y = 0;
    self.vertex3x = 0;
    self.vertex3y = 0;
    self.vertex4x = 0;
    self.vertex4y = 0;

    self.hitCollision = false;

    // directely use object as parent
    self.parent = parent;

    self.layer = parent.layer;
    self.map = parent.map;

    self.speedX = parent.speedX;
    self.speedY = parent.speedY;

    self.damage = parent.projectileDamage * Projectile.data[self.projectileId].damage;
    self.speed = parent.projectileSpeed * Projectile.data[self.projectileId].speed;
    self.range = parent.projectileRange * Projectile.data[self.projectileId].range;
    self.knockback = parent.projectileKnockback * Projectile.data[self.projectileId].knockback;
    self.pierce = parent.projectilePierce + Projectile.data[self.projectileId].pierce;
    self.critChance = parent.critChance + Projectile.data[self.projectileId].critChance;
    self.critDamage = parent.critDamage * Projectile.data[self.projectileId].critDamage;
    self.critKnockback = parent.critKnockback * Projectile.data[self.projectileId].critKnockback;

    self.animationStage = 0;
    self.animationSpeed = Projectile.data[self.projectileId].animationSpeed ?? 0;
    self.animationLength = Projectile.data[self.projectileId].animationLength ?? 0;
    self.animationPhase = 0;
    
    self.bouncy = Projectile.data[self.projectileId].bouncy;
    self.bounceAngle = Projectile.data[self.projectileId].bounceAngle;
    
    self.pattern = Projectile.data[self.projectileId].pattern;

    self.rangeTimer = 0;

    self.physicsInaccuracy = 4;

    self.firstTick = true;

    Projectile.init(self);
    return self;
};
Projectile.data = require("./../client/data/projectile.json");
Projectile.list = {};
Projectile.chunks = {};
Projectile.init = function(projectile) {
    if (projectile.pattern != null) {
        Projectile.patterns[projectile.pattern.type].start(projectile, projectile.pattern.data);
    }
    Entity.init(projectile);
    Projectile.updateAngle(projectile);

    projectile.speedX += projectile.speed * projectile.cosAngle;
    projectile.speedY += projectile.speed * projectile.sinAngle;

    if (Projectile.data[projectile.projectileId].offsetPosition) {
        projectile.x += projectile.cosAngle * projectile.width / 2;
        projectile.y += projectile.sinAngle * projectile.width / 2;
    }
};
Projectile.update = function(projectile) {
    if (!projectile.hitCollision) {
        Entity.updateLastPosition(projectile);
    }
    if (projectile.rangeTimer == projectile.range) {
        // range event
        for (var i in Projectile.data[projectile.projectileId].rangeEvents) {
            Projectile.collisionEvents[Projectile.data[projectile.projectileId].rangeEvents[i].type](projectile, Projectile.data[projectile.projectileId].rangeEvents[i].data);
        }
        Entity.delete(projectile);
        return;
    }
    if (!projectile.hitCollision && projectile.pattern != null) {
        Projectile.patterns[projectile.pattern.type].during(projectile, projectile.pattern.data);
    }
    if (projectile.firstTick) {
        projectile.firstTick = false;
        if (Projectile.collideWithMap(projectile, 0, 0, false)) {
            if (Projectile.data[projectile.projectileId].stickToCollision) {
                projectile.hitCollision = true;
                projectile.range = Projectile.data[projectile.projectileId].stickToCollisionTime;
            }
            else {
                // Entity.delete(projectile);
                return;
            }
        }
    }
    else if (Projectile.data[projectile.projectileId].collision) {
        if (!projectile.hitCollision && Projectile.collisionStop(projectile)) {
            for (var i in Projectile.data[projectile.projectileId].collisionEvents) {
                Projectile.collisionEvents[Projectile.data[projectile.projectileId].collisionEvents[i].type](projectile, Projectile.data[projectile.projectileId].collisionEvents[i].data);
            }
            if (Projectile.data[projectile.projectileId].stickToCollision) {
                projectile.hitCollision = true;
                projectile.range = Projectile.data[projectile.projectileId].stickToCollisionTime;
            }
            else {
                // Entity.delete(projectile);
                return;
            }
        }
    }
    else {
        projectile.x += projectile.speedX;
        projectile.y += projectile.speedY;
        projectile.gridX = Math.floor(projectile.x / TILE_SIZE);
        projectile.gridY = Math.floor(projectile.y / TILE_SIZE);
        projectile.chunkX = Math.floor(projectile.x / CHUNK_SIZE);
        projectile.chunkY = Math.floor(projectile.y / CHUNK_SIZE);
        Entity.updateChunks(projectile);
    }
    projectile.rangeTimer += 1;
    if (!projectile.hitCollision && Projectile.updateCollisions(projectile)) {
        Entity.delete(projectile);
        return;
    }
    Projectile.addEntity(projectile, {
        id: projectile.id,
        projectileId: projectile.projectileId,
        type: PROJECTILE,
        x: projectile.x,
        y: projectile.y,
        layer: projectile.layer,
        angle: projectile.angle,
        animationStage: Math.floor(projectile.animationStage),
        animationPhase: projectile.animationPhase,
    });
};
Projectile.updateCollisions = function(projectile) {
    if (projectile.parent.type == MONSTER || ENV.playerFriendlyFire) {
        Entity.searchHitboxChunks(Player.chunks, projectile.x, projectile.y, projectile.collisionBoxWidth, projectile.collisionBoxHeight, projectile.map, function(rig) {
            if (rig.id == projectile.parent.id) {
                return;
            }
            if (rig.layer > projectile.layer) {
                return;
            }
            if (rig.inSafeRegion || rig.hp == 0 || rig.teleporting || rig.loading || rig.dialogue != null) {
                return;
            }
            if (Projectile.collisionRect(projectile, rig.x, rig.y, rig.width, rig.height)) {
                projectile.layer = rig.layer;
                Rig.onDamage(rig, projectile, DAMAGE_PROJECTILE);
                if (projectile.pierce == -1) {
                    return true;
                }
            }
        });
        if (projectile.pierce == -1) {
            return true;
        }
    }
    if (projectile.parent.type == PLAYER || ENV.monsterFriendlyFire) {
        Entity.searchHitboxChunks(Monster.chunks, projectile.x, projectile.y, projectile.collisionBoxWidth, projectile.collisionBoxHeight, projectile.map, function(rig) {
            if (rig.id == projectile.parent.id) {
                return;
            }
            if (rig.layer > projectile.layer) {
                return;
            }
            if (rig.inSafeRegion || rig.hp == 0 || rig.teleporting) {
                return;
            }
            if (Projectile.collisionRect(projectile, rig.x, rig.y, rig.width, rig.height)) {
                projectile.layer = rig.layer;
                Rig.onDamage(rig, projectile, DAMAGE_PROJECTILE);
                if (projectile.pierce == -1) {
                    return true;
                }
            }
        });
        if (projectile.pierce == -1) {
            return true;
        }
    }
};
Projectile.updateAngle = function(projectile) {
    projectile.sinAngle = sin(projectile.angle);
    projectile.cosAngle = cos(projectile.angle);
    projectile.collisionBoxWidth = Math.abs(projectile.cosAngle * projectile.width) + Math.abs(projectile.sinAngle * projectile.height);
    projectile.collisionBoxHeight = Math.abs(projectile.sinAngle * projectile.width) + Math.abs(projectile.cosAngle * projectile.height);
    projectile.updateVertices = true;
};
Projectile.updateVertices = function(projectile) {
    projectile.updateVertices = false;
    projectile.vertex1x = projectile.width / 2 * projectile.cosAngle - projectile.height / 2 * projectile.sinAngle;
    projectile.vertex1y = projectile.width / 2 * projectile.sinAngle + projectile.height / 2 * projectile.cosAngle;
    projectile.vertex2x = projectile.width / 2 * projectile.cosAngle + projectile.height / 2 * projectile.sinAngle;
    projectile.vertex2y = projectile.width / 2 * projectile.sinAngle - projectile.height / 2 * projectile.cosAngle;
    projectile.vertex3x = -projectile.width / 2 * projectile.cosAngle + projectile.height / 2 * projectile.sinAngle;
    projectile.vertex3y = -projectile.width / 2 * projectile.sinAngle - projectile.height / 2 * projectile.cosAngle;
    projectile.vertex4x = -projectile.width / 2 * projectile.cosAngle - projectile.height / 2 * projectile.sinAngle;
    projectile.vertex4y = -projectile.width / 2 * projectile.sinAngle + projectile.height / 2 * projectile.cosAngle;
};
Projectile.addEntity = function(projectile, data) {
    for (var y = Math.floor((projectile.y - projectile.collisionBoxHeight / 2) / CHUNK_SIZE); y < Math.ceil((projectile.y + projectile.collisionBoxHeight / 2) / CHUNK_SIZE); y++) {
        if (entityPack[projectile.map][y] == null) {
            entityPack[projectile.map][y] = [];
        }
        for (var x = Math.floor((projectile.x - projectile.collisionBoxWidth / 2) / CHUNK_SIZE); x < Math.ceil((projectile.x + projectile.collisionBoxWidth / 2) / CHUNK_SIZE); x++) {
            if (entityPack[projectile.map][y][x] == null) {
                entityPack[projectile.map][y][x] = [];
            }
            entityPack[projectile.map][y][x].push(data);
        }
    }
};
Projectile.collisionStop = function(projectile) {
    // projectile.angle = 45;
    // Projectile.updateAngle(projectile);
    var max = Math.ceil(Math.max(Math.abs(projectile.speedX), Math.abs(projectile.speedY)) / projectile.physicsInaccuracy / ENV.physicsInaccuracy);
    if (max != 0) {
        var speedX = projectile.speedX / max;
        var speedY = projectile.speedY / max;
        for (var i = 0; i < max; i += 1) {
            projectile.lastX = projectile.x;
            projectile.lastY = projectile.y;
            projectile.x += speedX;
            projectile.y += speedY;
            projectile.gridX = Math.floor(projectile.x / TILE_SIZE);
            projectile.gridY = Math.floor(projectile.y / TILE_SIZE);
            let direction = Projectile.collideWithMap(projectile, speedX, speedY, true);
            if (direction !== false) {
                if (projectile.bouncy) {
                    // FIX?
                    let cosAngle = cos(direction);
                    let sinAngle = sin(direction);
                    let bounceX = speedX * cosAngle + speedY * sinAngle;
                    let bounceY = speedY * cosAngle - speedX * sinAngle;
                    projectile.x = Math.round(projectile.lastX);
                    if (Projectile.collisionMap(projectile)) {
                        projectile.x += speedX;
                        projectile.y = Math.round(projectile.lastY);
                        if (Projectile.collisionMap(projectile)) {
                            projectile.x = Math.round(projectile.lastX);
                            projectile.speedX *= -1;
                            speedX *= -1;
                            projectile.speedY *= -1;
                            speedY *= -1;
                            if (projectile.bounceAngle) {
                                projectile.angle -= 180;
                                if (projectile.angle < 0) {
                                    projectile.angle += 360;
                                }
                            }
                        }
                        else {
                            projectile.speedY *= -1;
                            speedY *= -1;
                            if (projectile.bounceAngle) {
                                projectile.angle = -projectile.angle;
                                if (projectile.angle < 0) {
                                    projectile.angle += 360;
                                }
                            }
                        }
                    }
                    else {
                        projectile.speedX *= -1;
                        speedX *= -1;
                        if (projectile.bounceAngle) {
                            projectile.angle = 180 - projectile.angle;
                            if (projectile.angle < 0) {
                                projectile.angle += 360;
                            }
                        }
                    }
                    break;
                }
            // if (Projectile.collideWithMap(projectile, speedX, speedY, false)) {
                // projectile.chunkX = Math.floor(projectile.x / CHUNK_SIZE);
                // projectile.chunkY = Math.floor(projectile.y / CHUNK_SIZE);
                // Entity.updateChunks(projectile);
                // return true;
            }
            // if (Projectile.collisionMap(projectile)) {
            //     if (projectile.bouncy) {
            //         projectile.x = Math.round(projectile.lastX);
            //         if (Projectile.collisionMap(projectile)) {
            //             projectile.x += speedX;
            //             projectile.y = Math.round(projectile.lastY);
            //             if (Projectile.collisionMap(projectile)) {
            //                 projectile.x = Math.round(projectile.lastX);
            //                 projectile.speedX *= -1;
            //                 speedX *= -1;
            //                 projectile.speedY *= -1;
            //                 speedY *= -1;
            //                 if (projectile.bounceAngle) {
            //                     projectile.angle -= 180;
            //                     if (projectile.angle < 0) {
            //                         projectile.angle += 360;
            //                     }
            //                 }
            //             }
            //             else {
            //                 projectile.speedY *= -1;
            //                 speedY *= -1;
            //                 if (projectile.bounceAngle) {
            //                     projectile.angle = -projectile.angle;
            //                     if (projectile.angle < 0) {
            //                         projectile.angle += 360;
            //                     }
            //                 }
            //             }
            //         }
            //         else {
            //             projectile.speedX *= -1;
            //             speedX *= -1;
            //             if (projectile.bounceAngle) {
            //                 projectile.angle = 180 - projectile.angle;
            //                 if (projectile.angle < 0) {
            //                     projectile.angle += 360;
            //                 }
            //             }
            //         }
            //         break;
            //     }
            //     else {
            //         projectile.chunkX = Math.floor(projectile.x / CHUNK_SIZE);
            //         projectile.chunkY = Math.floor(projectile.y / CHUNK_SIZE);
            //         Entity.updateChunks(projectile);
            //         return true;
            //     }
            // }
        }
    }
    projectile.chunkX = Math.floor(projectile.x / CHUNK_SIZE);
    projectile.chunkY = Math.floor(projectile.y / CHUNK_SIZE);
    Entity.updateChunks(projectile);
    return false;
};
Projectile.collisionRect = function(projectile, x, y, width, height) {
    if (projectile.x - projectile.collisionBoxWidth / 2 > x + width / 2) {
        return false;
    }
    if (x - width / 2 > projectile.x + projectile.collisionBoxWidth / 2) {
        return false;
    }
    if (projectile.y - projectile.collisionBoxHeight / 2 > y + height / 2) {
        return false;
    }
    if (y - height / 2 > projectile.y + projectile.collisionBoxHeight / 2) {
        return false;
    }
    if (projectile.updateVertices) {
        Projectile.updateVertices(projectile);
    }
    var slope1 = getSlope(projectile.vertex1x, projectile.vertex1y, projectile.vertex2x, projectile.vertex2y);
    var slope2 = getSlope(projectile.vertex2x, projectile.vertex2y, projectile.vertex3x, projectile.vertex3y);
    var slope3 = getSlope(projectile.vertex3x, projectile.vertex3y, projectile.vertex4x, projectile.vertex4y);
    var slope4 = getSlope(projectile.vertex4x, projectile.vertex4y, projectile.vertex1x, projectile.vertex1y);
    if (y + height / 2 - projectile.y - projectile.vertex1y < slope1 * (x + width / 2 - projectile.x - projectile.vertex1x)) {
        if (y + height / 2 - projectile.y - projectile.vertex2y > slope2 * (x + width / 2 - projectile.x - projectile.vertex2x)) {
            if (y + height / 2 - projectile.y - projectile.vertex3y > slope3 * (x + width / 2 - projectile.x - projectile.vertex3x)) {
                if (y + height / 2 - projectile.y - projectile.vertex4y < slope4 * (x + width / 2 - projectile.x - projectile.vertex4x)) {
                    return true;
                }
            }
        }
    }
    if (y + height / 2 - projectile.y - projectile.vertex1y < slope1 * (x - width / 2 - projectile.x - projectile.vertex1x)) {
        if (y + height / 2 - projectile.y - projectile.vertex2y > slope2 * (x - width / 2 - projectile.x - projectile.vertex2x)) {
            if (y + height / 2 - projectile.y - projectile.vertex3y > slope3 * (x - width / 2 - projectile.x - projectile.vertex3x)) {
                if (y + height / 2 - projectile.y - projectile.vertex4y < slope4 * (x - width / 2 - projectile.x - projectile.vertex4x)) {
                    return true;
                }
            }
        }
    }
    if (y - height / 2 - projectile.y - projectile.vertex1y < slope1 * (x - width / 2 - projectile.x - projectile.vertex1x)) {
        if (y - height / 2 - projectile.y - projectile.vertex2y > slope2 * (x - width / 2 - projectile.x - projectile.vertex2x)) {
            if (y - height / 2 - projectile.y - projectile.vertex3y > slope3 * (x - width / 2 - projectile.x - projectile.vertex3x)) {
                if (y - height / 2 - projectile.y - projectile.vertex4y < slope4 * (x - width / 2 - projectile.x - projectile.vertex4x)) {
                    return true;
                }
            }
        }
    }
    if (y - height / 2 - projectile.y - projectile.vertex1y < slope1 * (x + width / 2 - projectile.x - projectile.vertex1x)) {
        if (y - height / 2 - projectile.y - projectile.vertex2y > slope2 * (x + width / 2 - projectile.x - projectile.vertex2x)) {
            if (y - height / 2 - projectile.y - projectile.vertex3y > slope3 * (x + width / 2 - projectile.x - projectile.vertex3x)) {
                if (y - height / 2 - projectile.y - projectile.vertex4y < slope4 * (x + width / 2 - projectile.x - projectile.vertex4x)) {
                    return true;
                }
            }
        }
    }
    if (x - width / 2 < projectile.x && x + width / 2 > projectile.x && y - height / 2 < projectile.y && y + height / 2 > projectile.y) {
        return true;
    }
    if (x - width / 2 < projectile.x + projectile.vertex1x && x + width / 2 > projectile.x + projectile.vertex1x && y - height / 2 < projectile.y + projectile.vertex1y && y + height / 2 > projectile.y + projectile.vertex1y) {
        return true;
    }
    if (x - width / 2 < projectile.x + projectile.vertex2x && x + width / 2 > projectile.x + projectile.vertex2x && y - height / 2 < projectile.y + projectile.vertex2y && y + height / 2 > projectile.y + projectile.vertex2y) {
        return true;
    }
    if (x - width / 2 < projectile.x + projectile.vertex3x && x + width / 2 > projectile.x + projectile.vertex3x && y - height / 2 < projectile.y + projectile.vertex3y && y + height / 2 > projectile.y + projectile.vertex3y) {
        return true;
    }
    if (x - width / 2 < projectile.x + projectile.vertex4x && x + width / 2 > projectile.x + projectile.vertex4x && y - height / 2 < projectile.y + projectile.vertex4y && y + height / 2 > projectile.y + projectile.vertex4y) {
        return true;
    }
    return false;
};
Projectile.collisionMap = function(projectile) {
    // 1: 0, 0, 16x16
    if (collisions[projectile.map] == null) {
        return false;
    }
    if (collisions[projectile.map][projectile.layer] == null) {
        return false;
    }
    for (var y = Math.floor((projectile.y - projectile.collisionBoxHeight / 2) / TILE_SIZE); y < Math.ceil((projectile.y + projectile.collisionBoxHeight / 2) / TILE_SIZE); y++) {
        if (collisions[projectile.map][projectile.layer][y] == null) {
            continue;
        }
        for (var x = Math.floor((projectile.x - projectile.collisionBoxWidth / 2) / TILE_SIZE); x < Math.ceil((projectile.x + projectile.collisionBoxWidth / 2) / TILE_SIZE); x++) {
            switch (collisions[projectile.map][projectile.layer][y][x]) {
                case 0:
                    break;
                case 2191:
                    if (Projectile.collisionRect(projectile, x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2, TILE_SIZE, TILE_SIZE)) {
                        return true;
                    }
                    break;
                case 2192:
                    if (Projectile.collisionRect(projectile, x * TILE_SIZE + TILE_SIZE / 4, y * TILE_SIZE + TILE_SIZE / 2, TILE_SIZE / 2, TILE_SIZE)) {
                        return true;
                    }
                    break;
                case 2193:
                    if (Projectile.collisionRect(projectile, x * TILE_SIZE + TILE_SIZE * 3 / 4, y * TILE_SIZE + TILE_SIZE / 2, TILE_SIZE / 2, TILE_SIZE)) {
                        return true;
                    }
                    break;
                case 2194:
                    if (Projectile.collisionRect(projectile, x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 4, TILE_SIZE, TILE_SIZE / 2)) {
                        return true;
                    }
                    break;
                case 2195:
                    if (Projectile.collisionRect(projectile, x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE * 3 / 4, TILE_SIZE, TILE_SIZE / 2)) {
                        return true;
                    }
                    break;
                case 2196:
                    if (Projectile.collisionRect(projectile, x * TILE_SIZE + TILE_SIZE / 4, y * TILE_SIZE + TILE_SIZE / 2, TILE_SIZE / 2, TILE_SIZE) || Projectile.collisionRect(projectile, x * TILE_SIZE + TILE_SIZE * 3 / 4, y * TILE_SIZE + TILE_SIZE / 4, TILE_SIZE / 2, TILE_SIZE / 2)) {
                        return true;
                    }
                    break;
                case 2197:
                    if (Projectile.collisionRect(projectile, x * TILE_SIZE + TILE_SIZE * 3 / 4, y * TILE_SIZE + TILE_SIZE / 2, TILE_SIZE / 2, TILE_SIZE) || Projectile.collisionRect(projectile, x * TILE_SIZE + TILE_SIZE / 4, y * TILE_SIZE + TILE_SIZE / 4, TILE_SIZE / 2, TILE_SIZE / 2)) {
                        return true;
                    }
                    break;
                case 2198:
                    if (Projectile.collisionRect(projectile, x * TILE_SIZE + TILE_SIZE / 4, y * TILE_SIZE + TILE_SIZE / 2, TILE_SIZE / 2, TILE_SIZE) || Projectile.collisionRect(projectile, x * TILE_SIZE + TILE_SIZE * 3 / 4, y * TILE_SIZE + TILE_SIZE * 3 / 4, TILE_SIZE / 2, TILE_SIZE / 2)) {
                        return true;
                    }
                    break;
                case 2199:
                    if (Projectile.collisionRect(projectile, x * TILE_SIZE + TILE_SIZE * 3 / 4, y * TILE_SIZE + TILE_SIZE / 2, TILE_SIZE / 2, TILE_SIZE) || Projectile.collisionRect(projectile, x * TILE_SIZE + TILE_SIZE / 4, y * TILE_SIZE + TILE_SIZE * 3 / 4, TILE_SIZE / 2, TILE_SIZE / 2)) {
                        return true;
                    }
                    break;
                case 2277:
                    if (Projectile.collisionRect(projectile, x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2, TILE_SIZE / 2, TILE_SIZE)) {
                        return true;
                    }
                    break;
                case 2278:
                    if (Projectile.collisionRect(projectile, x * TILE_SIZE + TILE_SIZE / 4, y * TILE_SIZE + TILE_SIZE / 4, TILE_SIZE / 2, TILE_SIZE / 2)) {
                        return true;
                    }
                    break;
                case 2279:
                    if (Projectile.collisionRect(projectile, x * TILE_SIZE + TILE_SIZE * 3 / 4, y * TILE_SIZE + TILE_SIZE / 4, TILE_SIZE / 2, TILE_SIZE / 2)) {
                        return true;
                    }
                    break;
                case 2280:
                    if (Projectile.collisionRect(projectile, x * TILE_SIZE + TILE_SIZE / 4, y * TILE_SIZE + TILE_SIZE * 3 / 4, TILE_SIZE / 2, TILE_SIZE / 2)) {
                        return true;
                    }
                    break;
                case 2281:
                    if (Projectile.collisionRect(projectile, x * TILE_SIZE + TILE_SIZE * 3 / 4, y * TILE_SIZE + TILE_SIZE * 3 / 4, TILE_SIZE / 2, TILE_SIZE / 2)) {
                        return true;
                    }
                    break;
                case 2282:
                    if (Projectile.collisionRect(projectile, x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE * 5 / 8, TILE_SIZE * 3 / 4, TILE_SIZE * 3 / 4)) {
                        return true;
                    }
                    break;
                case 2283:
                    if (Projectile.collisionRect(projectile, x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE * 9 / 16, TILE_SIZE * 3 / 4, TILE_SIZE * 5 / 8)) {
                        return true;
                    }
                    break;
                case 2284:
                    if (Projectile.collisionRect(projectile, x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE * 23 / 32, TILE_SIZE, TILE_SIZE * 7 / 16)) {
                        return true;
                    }
                    break;
                case 2285:
                    if (Projectile.collisionRect(projectile, x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE * 7 / 32, TILE_SIZE, TILE_SIZE * 7 / 16)) {
                        return true;
                    }
                    break;
                case 2363:
                    if (Projectile.collisionRect(projectile, x * TILE_SIZE + TILE_SIZE / 16, y * TILE_SIZE + TILE_SIZE / 2, TILE_SIZE / 8, TILE_SIZE) || Projectile.collisionRect(projectile, x * TILE_SIZE + TILE_SIZE * 15 / 16, y * TILE_SIZE + TILE_SIZE / 2, TILE_SIZE / 8, TILE_SIZE)) {
                        return true;
                    }
                    break;
                case 2364:
                    if (Projectile.collisionRect(projectile, x * TILE_SIZE + TILE_SIZE / 8, y * TILE_SIZE + TILE_SIZE / 2, TILE_SIZE / 4, TILE_SIZE)) {
                        return true;
                    }
                    break;
                case 2365:
                    if (Projectile.collisionRect(projectile, x * TILE_SIZE + TILE_SIZE * 7 / 8, y * TILE_SIZE + TILE_SIZE / 2, TILE_SIZE / 4, TILE_SIZE)) {
                        return true;
                    }
                    break;
                case 2366:
                    if (Projectile.collisionRect(projectile, x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2, TILE_SIZE / 4, TILE_SIZE)) {
                        return true;
                    }
                    break;
                case 2368:
                    if (Projectile.collisionRect(projectile, x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE * 21 / 32, TILE_SIZE * 3 / 4, TILE_SIZE * 3 / 4)) {
                        return true;
                    }
                    break;
                case 2369:
                    if (Projectile.collisionRect(projectile, x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2, TILE_SIZE * 3 / 4, TILE_SIZE * 7 / 8)) {
                        return true;
                    }
                    break;
                case 2370:
                    if (Projectile.collisionRect(projectile, x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE * 5 / 8, TILE_SIZE, TILE_SIZE * 5 / 8)) {
                        return true;
                    }
                    break;
                case 2371:
                    if (Projectile.collisionRect(projectile, x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE * 29 / 32, TILE_SIZE, TILE_SIZE * 3 / 16)) {
                        return true;
                    }
                    break;
                case 2457:
                    if (Projectile.collisionRect(projectile, x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE * 7 / 32, TILE_SIZE, TILE_SIZE * 7 / 16)) {
                        return true;
                    }
                    break;
                default:
                    break;
            }
        }
    }
    return false;
};
Projectile.collideWithMap = function(projectile, speedX, speedY, slide) {
    if (collisions[projectile.map] == null) {
        return false;
    }
    if (collisions[projectile.map][projectile.layer] == null) {
        return false;
    }
    let maxDistanceX = 0;
    let maxDistanceY = 0;
    let maxDistanceX2 = 0;
    let maxDistanceY2 = 0;
    let signX = Math.sign(speedX);
    let signY = Math.sign(speedY);
    let speedX2 = speedX * projectile.cosAngle + speedY * projectile.sinAngle;
    let speedY2 = speedY * projectile.cosAngle - speedX * projectile.sinAngle;
    let signX2 = Math.sign(speedX2);
    let signY2 = Math.sign(speedY2);
    let signCos = Math.sign(projectile.cosAngle);
    let signSin = Math.sign(projectile.sinAngle);
    if (signCos == 0) {
        signCos = 1;
    }
    if (signSin == 0) {
        signSin = 1;
    }
    for (var y = Math.floor((projectile.y - projectile.collisionBoxHeight / 2) / TILE_SIZE); y < Math.ceil((projectile.y + projectile.collisionBoxHeight / 2) / TILE_SIZE); y++) {
        if (collisions[projectile.map][projectile.layer][y] == null) {
            continue;
        }
        for (var x = Math.floor((projectile.x - projectile.collisionBoxWidth / 2) / TILE_SIZE); x < Math.ceil((projectile.x + projectile.collisionBoxWidth / 2) / TILE_SIZE); x++) {
            if (collisions[projectile.map][projectile.layer][y][x] == null) {
                continue;
            }
            for (let i in collisions[projectile.map][projectile.layer][y][x]) {
                let collision = collisions[projectile.map][projectile.layer][y][x][i];
                if (collision.slowdown || !collision.collideWithProjectile) {
                    continue;
                }
                if (projectile.x - projectile.collisionBoxWidth / 2 < collision.x + collision.width / 2 && projectile.x + projectile.collisionBoxWidth / 2 > collision.x - collision.width / 2 && projectile.y - projectile.collisionBoxHeight / 2 < collision.y + collision.height / 2 && projectile.y + projectile.collisionBoxHeight / 2 > collision.y - collision.height / 2) {
                    // WHAT DO I NAME THE VARIABLES BUH
                    let distanceX = (projectile.x + projectile.collisionBoxWidth / 2 * signX) - (collision.x - collision.width / 2 * signX);

                    if (Math.abs(projectile.y - distanceX / speedX * speedY - (projectile.height / 2 * projectile.cosAngle * signSin - projectile.width / 2 * projectile.sinAngle * signCos) * signX - collision.y) < collision.height / 2) {
                        maxDistanceX = Math.max(maxDistanceX, distanceX * signX);
                        continue;
                    }

                    let distanceY = (projectile.y + projectile.collisionBoxHeight / 2 * signY) - (collision.y - collision.height / 2 * signY);

                    if (Math.abs(projectile.x - distanceY / speedY * speedX + (projectile.width / 2 * projectile.cosAngle * signSin - projectile.height / 2 * projectile.sinAngle * signCos) * signY - collision.x) < collision.width / 2) {
                        maxDistanceY = Math.max(maxDistanceY, distanceY * signY);
                        continue;
                    }
                    
                    let distanceX2 = (projectile.x * projectile.cosAngle + projectile.y * projectile.sinAngle + projectile.width / 2 * signX2) - (collision.x * projectile.cosAngle + collision.y * projectile.sinAngle - (Math.abs(collision.width / 2 * projectile.cosAngle) + Math.abs(collision.height / 2 * projectile.sinAngle)) * signX2);

                    if (Math.abs((projectile.y - distanceX2 / speedX2 * speedY) * projectile.cosAngle - (projectile.x - distanceX2 / speedX2 * speedX) * projectile.sinAngle - (collision.y * projectile.cosAngle - collision.x * projectile.sinAngle - (collision.height / 2 * projectile.cosAngle * signSin - collision.width / 2 * projectile.sinAngle * signCos) * signX2)) < projectile.height / 2) {
                        maxDistanceX2 = Math.max(maxDistanceX2, distanceX2 * signX2);
                        continue;
                    }

                    let distanceY2 = (projectile.y * projectile.cosAngle - projectile.x * projectile.sinAngle + projectile.height / 2 * signY2) - (collision.y * projectile.cosAngle - collision.x * projectile.sinAngle - (Math.abs(collision.height / 2 * projectile.cosAngle) + Math.abs(collision.width / 2 * projectile.sinAngle)) * signY2);
                    
                    if (Math.abs((projectile.x - distanceY2 / speedY2 * speedX) * projectile.cosAngle + (projectile.y - distanceY2 / speedY2 * speedY) * projectile.sinAngle - (collision.x * projectile.cosAngle + collision.y * projectile.sinAngle - (collision.width / 2 * projectile.cosAngle * signSin - collision.height / 2 * projectile.sinAngle * signCos) * signY2)) < projectile.width / 2) {
                        maxDistanceY2 = Math.max(maxDistanceY2, distanceY2 * signY2);
                        continue;
                    }
                }
            }
        }
    }
    if (maxDistanceX > 0 || maxDistanceY > 0 || maxDistanceX2 > 0 || maxDistanceY2 > 0) {
        let timeX = maxDistanceX * signX / speedX;
        let timeY = maxDistanceY * signY / speedY;
        let timeX2 = maxDistanceX2 * signX2 / speedX2;
        let timeY2 = maxDistanceY2 * signY2 / speedY2;
        if (!isFinite(timeX)) {
            timeX = -Infinity;
        }
        if (!isFinite(timeY)) {
            timeY = -Infinity;
        }
        if (!isFinite(timeX2)) {
            timeX2 = -Infinity;
        }
        if (!isFinite(timeY2)) {
            timeY2 = -Infinity;
        }
        let max = Math.max(timeX, timeY, timeX2, timeY2);
        if (slide) {
            if (max == timeX) {
                projectile.x -= maxDistanceX * signX;
            }
            else if (max == timeY) {
                projectile.y -= maxDistanceY * signY;
            }
            else if (max == timeX2) {
                projectile.x -= maxDistanceX2 * signX2 * projectile.cosAngle;
                projectile.y -= maxDistanceX2 * signX2 * projectile.sinAngle;
            }
            else {
                projectile.x -= -maxDistanceY2 * signY2 * projectile.sinAngle;
                projectile.y -= maxDistanceY2 * signY2 * projectile.cosAngle;
            }
        }
        else {
            projectile.x -= max * speedX;
            projectile.y -= max * speedY;
        }
        if (max == timeX) {
            return Math.PI / 2;
        }
        else if (max == timeY) {
            return 0;
        }
        else if (max == timeX2) {
            return projectile.angle;
        }
        else {
            return projectile.angle + Math.PI / 2;
        }
    }
    return false;
};
// Projectile.collideWithMap = function(projectile, speedX, speedY, slide) {
//     if (collisions[projectile.map] == null) {
//         return false;
//     }
//     if (collisions[projectile.map][projectile.layer] == null) {
//         return false;
//     }
//     let maxDistanceX = 0;
//     let maxDistanceY = 0;
//     let maxDistanceX2 = 0;
//     let maxDistanceY2 = 0;
//     let signX = Math.sign(speedX);
//     let signY = Math.sign(speedY);
//     let speedX2 = speedX * projectile.cosAngle + speedY * projectile.sinAngle;
//     let speedY2 = speedY * projectile.cosAngle - speedX * projectile.sinAngle;
//     let signX2 = Math.sign(speedX2);
//     let signY2 = Math.sign(speedY2);
//     let signCos = Math.sign(projectile.cosAngle);
//     let signSin = Math.sign(projectile.sinAngle);
//     if (signCos == 0) {
//         signCos = 1;
//     }
//     if (signSin == 0) {
//         signSin = 1;
//     }
//     for (var y = Math.floor((projectile.y - projectile.collisionBoxHeight / 2) / TILE_SIZE); y < Math.ceil((projectile.y + projectile.collisionBoxHeight / 2) / TILE_SIZE); y++) {
//         if (collisions[projectile.map][projectile.layer][y] == null) {
//             continue;
//         }
//         for (var x = Math.floor((projectile.x - projectile.collisionBoxWidth / 2) / TILE_SIZE); x < Math.ceil((projectile.x + projectile.collisionBoxWidth / 2) / TILE_SIZE); x++) {
//             if (collisions[projectile.map][projectile.layer][y][x] == null) {
//                 continue;
//             }
//             for (let i in collisions[projectile.map][projectile.layer][y][x]) {
//                 let collision = collisions[projectile.map][projectile.layer][y][x][i];
//                 if (collision.slowdown || !collision.collideWithProjectile) {
//                     continue;
//                 }
//                 if (projectile.x - projectile.collisionBoxWidth / 2 < x * TILE_SIZE + collision.x + collision.width / 2 && projectile.x + projectile.collisionBoxWidth / 2 > x * TILE_SIZE + collision.x - collision.width / 2 && projectile.y - projectile.collisionBoxHeight / 2 < y * TILE_SIZE + collision.y + collision.height / 2 && projectile.y + projectile.collisionBoxHeight / 2 > y * TILE_SIZE + collision.y - collision.height / 2) {
//                     // WHAT DO I NAME THE VARIABLES BUH
//                     let distanceX = (projectile.x + projectile.collisionBoxWidth / 2 * signX) - (x * TILE_SIZE + collision.x - collision.width / 2 * signX);

//                     if (Math.abs(projectile.y - distanceX / speedX * speedY - (projectile.height / 2 * projectile.cosAngle * signSin - projectile.width / 2 * projectile.sinAngle * signCos) * signX - (y * TILE_SIZE + collision.y)) < collision.height / 2) {
//                         // console.log(projectile.y, projectile.y - distanceX / speedX * speedY, projectile.width, projectile.height, y * TILE_SIZE + collision.y, collision.height, Math.abs(projectile.y - distanceX / speedX * speedY + (projectile.height * projectile.cosAngle * signSin - projectile.width * projectile.sinAngle * signCos) * signX - (y * TILE_SIZE + collision.y)))
//                         // console.log(projectile.y - distanceX / speedX * speedY + (projectile.height * projectile.cosAngle * signSin - projectile.width * projectile.sinAngle * signCos) * signX)
//                         maxDistanceX = Math.max(maxDistanceX, distanceX * signX);
//                         continue;
//                     }

//                     let distanceY = (projectile.y + projectile.collisionBoxHeight / 2 * signY) - (y * TILE_SIZE + collision.y - collision.height / 2 * signY);

//                     if (Math.abs(projectile.x - distanceY / speedY * speedX + (projectile.width / 2 * projectile.cosAngle * signSin - projectile.height / 2 * projectile.sinAngle * signCos) * signY - (x * TILE_SIZE + collision.x)) < collision.width / 2) {
//                         // console.log(1)
//                         maxDistanceY = Math.max(maxDistanceY, distanceY * signY);
//                         continue;
//                     }
                    
//                     // if (Math.abs(projectile.y - distanceX / speedX * speedY + (projectile.height * projectile.cosAngle * signSin + projectile.width * projectile.sinAngle * signCos) * signX - (y * TILE_SIZE + collision.y)) >= collision.height / 2) {
//                     //     continue;
//                     // }
                    
//                     let distanceX2 = (projectile.x * projectile.cosAngle + projectile.y * projectile.sinAngle + projectile.width / 2 * signX2) - ((x * TILE_SIZE + collision.x) * projectile.cosAngle + (y * TILE_SIZE + collision.y) * projectile.sinAngle - (Math.abs(collision.width / 2 * projectile.cosAngle) + Math.abs(collision.height / 2 * projectile.sinAngle)) * signX2);


//                     if (Math.abs((projectile.y - distanceX2 / speedX2 * speedY) * projectile.cosAngle - (projectile.x - distanceX2 / speedX2 * speedX) * projectile.sinAngle - ((y * TILE_SIZE + collision.y) * projectile.cosAngle - (x * TILE_SIZE + collision.x) * projectile.sinAngle - (collision.height / 2 * projectile.cosAngle * signSin - collision.width / 2 * projectile.sinAngle * signCos) * signX2)) < projectile.height / 2) {

//                     // if (Math.abs(projectile.y - distanceX / speedX * speedY - (projectile.height / 2)) * signX - (y * TILE_SIZE + collision.y)) < collision.height / 2) {

                    

//                     // if (Math.abs(projectile.y - distanceX2 / speedX2 * speedY - ((y * TILE_SIZE + collision.y) + (collision.height / 2) * signX2) < projectile.height / 2)) {
//                         // console.log(2, projectile.y, projectile.y - distanceX2 / speedX2 * speedY, distanceX2)
//                         // console.log((projectile.y - distanceX2 / speedX2 * speedY) * projectile.cosAngle - (projectile.x - distanceX2 / speedX2 * speedX) * projectile.sinAngle - ((y * TILE_SIZE + collision.y) * projectile.cosAngle - (x * TILE_SIZE + collision.x) * projectile.sinAngle))
//                         // console.log(((collision.height / 2 * projectile.cosAngle * signSin - collision.width / 2 * projectile.sinAngle * signCos) * signX2))
//                         // maxDistanceX2 = Math.max(maxDistanceX2, distanceX2 * signX2);
//                         continue;
//                     }

//                     let distanceY2 = (projectile.y * projectile.cosAngle - projectile.x * projectile.sinAngle + projectile.height / 2 * signY2) - ((y * TILE_SIZE + collision.y) * projectile.cosAngle - (x * TILE_SIZE + collision.x) * projectile.sinAngle - (Math.abs(collision.height / 2 * projectile.cosAngle) + Math.abs(collision.width / 2 * projectile.sinAngle)) * signY2);


//                     if (Math.abs((projectile.x - distanceY2 / speedY2 * speedX) * projectile.cosAngle + (projectile.y - distanceY2 / speedY2 * speedY) * projectile.sinAngle - ((x * TILE_SIZE + collision.x) * projectile.cosAngle + (y * TILE_SIZE + collision.y) * projectile.sinAngle - (collision.width / 2 * projectile.cosAngle * signSin - collision.height / 2 * projectile.sinAngle * signCos) * signY2)) < projectile.width / 2) {
//                         maxDistanceY2 = Math.max(maxDistanceY2, distanceY2 * signY2);
//                         continue;
//                     }

//                     // // console.log(distanceX, distanceY, distanceX2, distanceY2, signX, signY, signX2, signY2, speedX, speedY, speedX2, speedY2)

//                     // if (distanceX * signX < 0 || distanceY * signY < 0 || distanceX2 * signX2 < 0 || distanceY2 * signY2 < 0) {
//                     //     continue;
//                     // }

//                     // // let timeX = distanceX / speedX;
//                     // // let timeY = distanceY / speedY;
//                     // // if (!isFinite(timeX)) {
//                     // //     timeX = Infinity;
//                     // // }
//                     // // if (!isFinite(timeY)) {
//                     // //     timeY = Infinity;
//                     // // }
//                     // // if (timeX < timeY) {
//                     // //     maxDistanceX = Math.max(maxDistanceX, distanceX * signX);
//                     // // }
//                     // // else {
//                     // //     maxDistanceY = Math.max(maxDistanceY, distanceY * signY);
//                     // // }
//                     // let timeX2 = distanceX2 / speedX2;
//                     // let timeY2 = distanceY2 / speedY2;
//                     // if (!isFinite(timeX2)) {
//                     //     timeX2 = Infinity;
//                     // }
//                     // if (!isFinite(timeY2)) {
//                     //     timeY2 = Infinity;
//                     // }
//                     // if (timeX2 < timeY2) {
//                     //     maxDistanceX2 = Math.max(maxDistanceX2, distanceX2 * signX2);
//                     // }
//                     // else {
//                     //     maxDistanceY2 = Math.max(maxDistanceY2, distanceY2 * signY2);
//                     // }
//                 }
//             }
//         }
//     }
//     if (maxDistanceX > 0 || maxDistanceY > 0 || maxDistanceX2 > 0 || maxDistanceY2 > 0) {
//         let timeX = maxDistanceX * signX / speedX;
//         let timeY = maxDistanceY * signY / speedY;
//         let timeX2 = maxDistanceX2 * signX2 / speedX2;
//         let timeY2 = maxDistanceY2 * signY2 / speedY2;
//         if (!isFinite(timeX)) {
//             timeX = -Infinity;
//         }
//         if (!isFinite(timeY)) {
//             timeY = -Infinity;
//         }
//         if (!isFinite(timeX2)) {
//             timeX2 = -Infinity;
//         }
//         if (!isFinite(timeY2)) {
//             timeY2 = -Infinity;
//         }
//         // console.log(timeX, timeY, timeX2, timeY2)
//         let max = Math.max(timeX, timeY, timeX2, timeY2);
//         if (slide) {
//             if (max == timeX) {
//                 projectile.x -= maxDistanceX * signX;
//             }
//             else if (max == timeY) {
//                 projectile.y -= maxDistanceY * signY;
//             }
//             else if (max == timeX2) {
//                 projectile.x -= maxDistanceX2 * signX2 * projectile.cosAngle;
//                 projectile.y -= maxDistanceX2 * signX2 * projectile.sinAngle;
//             }
//             else {
//                 projectile.x -= -maxDistanceY2 * signY2 * projectile.sinAngle;
//                 projectile.y -= maxDistanceY2 * signY2 * projectile.cosAngle;
//             }
//         }
//         else {
//             projectile.x -= max * speedX;
//             projectile.y -= max * speedY;
//         }
//         // if (max == timeX) {
//         //     if (slide) {
//         //         projectile.x -= maxDistanceX * signX;
//         //     }
//         //     else {
//         //         projectile.x -= maxDistanceX * signX / speedX * speedX;
//         //         projectile.y -= maxDistanceX * signX / speedX * speedY;
//         //     }
//         // }
//         // else if (max == timeY) {
//         //     if (slide) {
//         //         projectile.y -= maxDistanceY * signY;
//         //     }
//         //     else {
//         //         projectile.x -= maxDistanceY * signY / speedY * speedX;
//         //         projectile.y -= maxDistanceY * signY / speedY * speedY;
//         //     }
//         // }
//         // else if (max == timeX2) {
//         //     if (slide) {
//         //         projectile.x -= maxDistanceX2 * signX2 * projectile.cosAngle;
//         //         projectile.y -= maxDistanceX2 * signX2 * projectile.sinAngle;
//         //     }
//         //     else {
//         //         projectile.x -= maxDistanceX2 * signX2 / speedX2 * speedX;
//         //         projectile.y -= maxDistanceX2 * signX2 / speedX2 * speedY;
//         //     }
//         // }
//         // else {
//         //     if (slide) {
//         //         projectile.x -= -maxDistanceY2 * signY2 * projectile.sinAngle;
//         //         projectile.y -= maxDistanceY2 * signY2 * projectile.cosAngle;
//         //     }
//         //     else {
//         //         projectile.x -= maxDistanceY2 * signY2 / speedY2 * speedX;
//         //         projectile.y -= maxDistanceY2 * signY2 / speedY2 * speedY;
//         //     }
//         // }
//         return true;
//     }
//     return false;
// };
Projectile.patterns = [
    {
        id: "spin",
        start: function(projectile, data) {
        },
        during: function(projectile, data) {
            projectile.angle += data.speed;
            Projectile.updateAngle(projectile);
        },
    },
    {
        id: "sin",
        start: function(projectile, data) {
            projectile.startX = projectile.x;
            projectile.startY = projectile.y;
            projectile.startAngle = projectile.angle;
            projectile.startSinAngle = sin(projectile.angle);
            projectile.startCosAngle = cos(projectile.angle);
        },
        during: function(projectile, data) {
            projectile.speedX -= projectile.speed * projectile.cosAngle;
            projectile.speedY -= projectile.speed * projectile.sinAngle;
            var x = (projectile.x - projectile.startX) * projectile.startCosAngle + (projectile.y - projectile.startY) * projectile.startSinAngle;
            projectile.angle = projectile.startAngle + cos(x / data.speed) * data.magnitude;
            Projectile.updateAngle(projectile);
            projectile.speedX += projectile.speed * projectile.cosAngle;
            projectile.speedY += projectile.speed * projectile.sinAngle;
        },
    },
];
Projectile.parsePattern = function(pattern) {
    for (var i = 0; i < Projectile.patterns.length; i++) {
        if (Projectile.patterns[i].id == pattern) {
            return i;
        }
    }
};
Projectile.contactEvents = [
    {
        id: "explosion",
        event: function(rig1, projectile, data) {
            Rig.areaEffect(projectile.x, projectile.y, projectile.map, data.diameter, projectile.parent.type, function(rig) {
                if (rig1.id == rig.id) {
                    return;
                }
                if (rig1.layer != rig.layer) {
                    return;
                }
                if (rig.inSafeRegion || rig.hp == 0 || rig.teleporting || rig.loading || rig.dialogue != null) {
                    return;
                }
                Rig.onDamage(rig, projectile, DAMAGE_EXPLOSION, data);
            });
        },
    },
    {
        id: "areaEffect",
        event: function(rig1, projectile, data) {
            Rig.areaEffect(projectile.x, projectile.y, projectile.map, data.diameter, projectile.parent.type, function(rig) {
                if (rig1.layer != rig.layer) {
                    return;
                }
                if (rig.inSafeRegion || rig.hp == 0 || rig.teleporting || rig.loading || rig.dialogue != null) {
                    return;
                }
                var distanceX = Math.max(Math.abs(rig.x - projectile.x) - data.diameter / 2, 0);
                var distanceY = Math.max(Math.abs(rig.y - projectile.y) - data.diameter / 2, 0);
                var distance = Math.sqrt(Math.pow(distanceX, 2) + Math.pow(distanceY, 2));
                if (distance > data.diameter / 2) {
                    return;
                }
                Rig.addEffect(rig, data.effect, data.duration);
            });
        },
    },
    {
        id: "particle",
        event: function(rig1, projectile, data) {
            Entity.addParticle({
                x: projectile.x,
                y: projectile.y,
                layer: projectile.layer,
                map: projectile.map,
                type: eval(data.particle),
                value: data.value,
            });
        },
    },
];
Projectile.parseContactEvent = function(event) {
    for (var i = 0; i < Projectile.contactEvents.length; i++) {
        if (Projectile.contactEvents[i].id == event.type) {
            event.type = i;
            break;
        }
        if (Projectile.contactEvents[i].id == event.pattern) {
            event.type = i;
            break;
        }
    }
    Rig.parseEvent(event);
};
// Projectile.collisionEvents = {
//     explosion: function(projectile, data) {
//         Rig.areaEffect(projectile.x, projectile.y, projectile.map, data.diameter, projectile.parent.type, function(rig) {
//             if (projectile.layer != rig.layer) {
//                 return;
//             }
//             if (rig.inSafeRegion || rig.hp == 0 || rig.teleporting || rig.loading || rig.dialogue != null) {
//                 return;
//             }
//             Rig.onDamage(rig, projectile, DAMAGE_EXPLOSION, data);
//         });
//     },
//     areaEffect: function(projectile, data) {
//         Rig.areaEffect(projectile.x, projectile.y, projectile.map, data.diameter, projectile.parent.type, function(rig) {
//             if (projectile.layer != rig.layer) {
//                 return;
//             }
//             if (rig.inSafeRegion || rig.hp == 0 || rig.teleporting || rig.loading || rig.dialogue != null) {
//                 return;
//             }
//             var distanceX = Math.max(Math.abs(rig.x - projectile.x) - data.diameter / 2, 0);
//             var distanceY = Math.max(Math.abs(rig.y - projectile.y) - data.diameter / 2, 0);
//             var distance = Math.sqrt(Math.pow(distanceX, 2) + Math.pow(distanceY, 2));
//             if (distance > data.diameter / 2) {
//                 return;
//             }
//             Rig.addEffect(rig, data.effect, data.duration);
//         });
//     },
//     particle: function(projectile, data) {
//         Entity.addParticle({
//             x: projectile.x,
//             y: projectile.y,
//             layer: projectile.layer,
//             map: projectile.map,
//             type: eval(data.particle),
//             value: data.value,
//         });
//     },
// };
Projectile.collisionEvents = [
    {
        id: "explosion",
        event: function(projectile, data) {
            Rig.areaEffect(projectile.x, projectile.y, projectile.map, data.diameter, projectile.parent.type, function(rig) {
                if (projectile.layer != rig.layer) {
                    return;
                }
                if (rig.inSafeRegion || rig.hp == 0 || rig.teleporting || rig.loading || rig.dialogue != null) {
                    return;
                }
                Rig.onDamage(rig, projectile, DAMAGE_EXPLOSION, data);
            });
        },
    },
    {
        id: "areaEffect",
        event: function(projectile, data) {
            Rig.areaEffect(projectile.x, projectile.y, projectile.map, data.diameter, projectile.parent.type, function(rig) {
                if (projectile.layer != rig.layer) {
                    return;
                }
                if (rig.inSafeRegion || rig.hp == 0 || rig.teleporting || rig.loading || rig.dialogue != null) {
                    return;
                }
                var distanceX = Math.max(Math.abs(rig.x - projectile.x) - data.diameter / 2, 0);
                var distanceY = Math.max(Math.abs(rig.y - projectile.y) - data.diameter / 2, 0);
                var distance = Math.sqrt(Math.pow(distanceX, 2) + Math.pow(distanceY, 2));
                if (distance > data.diameter / 2) {
                    return;
                }
                Rig.addEffect(rig, data.effect, data.duration);
            });
        },
    },
    {
        id: "particle",
        event: function(projectile, data) {
            Entity.addParticle({
                x: projectile.x,
                y: projectile.y,
                layer: projectile.layer,
                map: projectile.map,
                type: eval(data.particle),
                value: data.value,
            });
        },
    },
];
Projectile.parseCollisionEvent = function(event) {
    for (var i = 0; i < Projectile.collisionEvents.length; i++) {
        if (Projectile.collisionEvents[i].id == event.type) {
            event.type = i;
            break;
        }
        if (Projectile.collisionEvents[i].id == event.pattern) {
            event.type = i;
            break;
        }
    }
    Rig.parseEvent(event);
};

var getSlope = function(pos1, pos2) {
    return (pos2.y - pos1.y) / (pos2.x - pos1.x);
};
var sinCache = new Map();
var sin = function(angle) {
    return sinCache.has(angle) ? sinCache.get(angle) : sinCache.set(angle, Math.sin(angle / 180 * Math.PI)).get(angle);
};
var cos = function(angle) {
    return sinCache.has(angle + 90) ? sinCache.get(angle + 90) : sinCache.set(angle + 90, Math.cos(angle / 180 * Math.PI)).get(angle + 90);
};

for (var i in Npc.data) {
    for (var j in Npc.data[i].rightClickEvents) {
        // Player.parseCriteria(Npc.data[i].rightClickEvents[j]);
    }
}
for (var i in Monster.data) {
    for (var j in Monster.data[i].stages) {
        for (var k in Monster.data[i].stages[j].contactEvents) {
            Rig.parseContactEvent(Monster.data[i].stages[j].contactEvents[k]);
        }
        for (var k in Monster.data[i].stages[j].startAttacks) {
            for (var l in Monster.data[i].stages[j].startAttacks[k].attacks) {
                Rig.parseAttack(Monster.data[i].stages[j].startAttacks[k].attacks[l]);
            }
        }
        for (var k in Monster.data[i].stages[j].loopedAttacks) {
            for (var l in Monster.data[i].stages[j].loopedAttacks[k].attacks) {
                Rig.parseAttack(Monster.data[i].stages[j].loopedAttacks[k].attacks[l]);
            }
        }
        for (var k in Monster.data[i].stages[j].randomAttacks) {
            for (var l in Monster.data[i].stages[j].randomAttacks[k].attacks) {
                Rig.parseAttack(Monster.data[i].stages[j].randomAttacks[k].attacks[l]);
            }
        }
    }
}
for (var i in Projectile.data) {
    Projectile.data[i].pattern = Projectile.parsePattern(Projectile.data[i].pattern);
    for (var j in Projectile.data[i].contactEvents) {
        Projectile.parseContactEvent(Projectile.data[i].contactEvents[j]);
    }
    for (var j in Projectile.data[i].collisionEvents) {
        Projectile.parseCollisionEvent(Projectile.data[i].collisionEvents[j]);
    }
    for (var j in Projectile.data[i].rangeEvents) {
        Projectile.parseCollisionEvent(Projectile.data[i].rangeEvents[j]);
    }
}
for (var i in Rig.attacks) {
    Rig.attacks[i] = Rig.attacks[i].attack;
}
for (var i in Monster.contactEvents) {
    Monster.contactEvents[i] = Monster.contactEvents[i].event;
}
for (var i in Projectile.contactEvents) {
    Projectile.contactEvents[i] = Projectile.contactEvents[i].event;
}
for (var i in Projectile.collisionEvents) {
    Projectile.collisionEvents[i] = Projectile.collisionEvents[i].event;
}