
// all monsters and items will use number ids

// const e = require("express");

// TODO: replace for i in with for i = 0; I < length

const pathfinder = new PF.JumpPointFinder(PF.JPFMoveDiagonallyIfNoObstacles);

let globalId = 0;
entityPack = [];
particlePack = [];
droppedItemPack = [];
debugPack = [];

Entity = function() {
    let self = {
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
    // TODO p1: why not globalid
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
            error("Invalid type " + entity.type + " for Entity.init.");
            break;
    }
};
Entity.update = function() {
    for (let i in maps) {
        entityPack[i] = {};
        particlePack[i] = {};
        droppedItemPack[i] = {};
        debugPack[i] = {};
    }
    // update order
    // projectiles
    // player
    // monster
    for (let i in spawners) {
        // TODO: change spawners to be based on density and stuff
        spawners[i].timer -= 1;
        if (spawners[i].timer == 0) {
            let totalWeight = spawners[i].totalWeight;
            let monsterId = Math.floor(Math.random() * totalWeight);
            for (let j in spawners[i].monsters) {
                totalWeight -= spawners[i].monsters[j].weight * barycentric3;
                if (monsterId >= totalWeight) {
                    monsterId = spawners[i].monsters[j].id;
                    break;
                }
            }
            new Monster(monsterId, spawners[i].x * TILE_SIZE + TILE_SIZE / 2, spawners[i].y * TILE_SIZE + TILE_SIZE / 2, spawners[i].layer, spawners[i].map, SPAWNER, i);
            Entity.addParticle({
                x: spawners[i].x * TILE_SIZE + TILE_SIZE / 2,
                y: spawners[i].y * TILE_SIZE + TILE_SIZE / 2,
                layer: spawners[i].layer,
                map: spawners[i].map,
                type: PARTICLE_SPAWN,
            });
        }
    }
    let chunks = [];
    for (let i in Player.list) {
        let player = Player.list[i];
        if (chunks[player.map] == null) {
            chunks[player.map] = [];
        }
        for (let y = player.chunkY - player.renderDistance; y <= player.chunkY + player.renderDistance; y++) {
            if (chunks[player.map][y] == null) {
                chunks[player.map][y] = [];
            }
            for (let x = player.chunkX - player.renderDistance; x <= player.chunkX + player.renderDistance; x++) {
                chunks[player.map][y][x] = true;
            }
        }
    }
    for (let i in chunks) {
        if (layers[i] == null) {
            continue;
        }
        if (areaSpawners[i] == null) {
            continue;
        }
        for (let y in chunks[i]) {
            for (let x in chunks[i][y]) {
                let spawnX = x * 16 + Math.floor(Math.random() * 16);
                let spawnY = y * 16 + Math.floor(Math.random() * 16);
                if (layers[i][spawnY] == null || layers[i][spawnY][spawnX] == null) {
                    continue;
                }
                let layer = layers[i][spawnY][spawnX];
                if (collisions[i] != null && collisions[i][layer] != null && collisions[i][layer][spawnY] != null && collisions[i][layer][spawnY][spawnX] != null) {
                    continue;
                }
                if (regions[i] != null && regions[i][spawnY] != null && regions[i][spawnY][spawnX] != null && regionSafety[regions[i][spawnY][spawnX]]) {
                    continue;
                }
                // TODO p2: nearest?
                // actually all these variables are kinda bad
                let spawner1 = null;
                let spawner1DistanceSquared = null;
                for (let j in areaSpawners[i]) {
                    let distanceSquared = Math.pow(areaSpawners[i][j].x - spawnX, 2) + Math.pow(areaSpawners[i][j].y - spawnY, 2);
                    if (spawner1 == null || distanceSquared < spawner1DistanceSquared) {
                        spawner1 = areaSpawners[i][j];
                        spawner1DistanceSquared = distanceSquared;
                    }
                }
                let spawner2 = null;
                let spawner2DistanceSquared = null;
                for (let j in areaSpawners[i]) {
                    if (areaSpawners[i][j] == spawner1) {
                        continue;
                    }
                    let distanceSquared = Math.pow(areaSpawners[i][j].x - spawnX, 2) + Math.pow(areaSpawners[i][j].y - spawnY, 2);
                    if ((spawner2 == null || distanceSquared < spawner2DistanceSquared) && dot(spawner1.x - spawnX, spawner1.y - spawnY, areaSpawners[i][j].x - spawnX, areaSpawners[i][j].y - spawnY) < spawner1DistanceSquared) {
                        spawner2 = areaSpawners[i][j];
                        spawner2DistanceSquared = distanceSquared;
                    }
                }
                let spawner3 = null;
                let spawner3DistanceSquared = null;
                if (spawner2 != null) {
                    let spawnCross = cross(spawner1.x, spawner1.y, spawner2.x, spawner2.y, spawnX, spawnY);
                    for (let j in areaSpawners[i]) {
                        if (areaSpawners[i][j] == spawner1 || areaSpawners[i][j] == spawner2) {
                            continue;
                        }
                        let distanceSquared = Math.pow(areaSpawners[i][j].x - spawnX, 2) + Math.pow(areaSpawners[i][j].y - spawnY, 2);
                        if ((spawner3 == null || distanceSquared < spawner3DistanceSquared) && Math.sign(spawnCross) == Math.sign(cross(spawner1.x, spawner1.y, spawner2.x, spawner2.y, areaSpawners[i][j].x, areaSpawners[i][j].y))) {
                            spawner3 = areaSpawners[i][j];
                            spawner3DistanceSquared = distanceSquared;
                        }
                    }
                }
                // use barycentric coordinates to determine ratio of which spawner to take
                let barycentric1;
                let barycentric2;
                let barycentric3;
                if (spawner2 == null) {
                    barycentric1 = 1;
                }
                else if (spawner3 == null) {
                    barycentric1 = dot(spawnX - spawner2.x, spawnY - spawner2.y, spawner1.x - spawner2.x, spawner1.y - spawner2.y) / (Math.pow(spawner1.x - spawner2.x, 2) + Math.pow(spawner1.y - spawner2.y, 2));
                    barycentric2 = 1 - barycentric1;
                }
                else {
                    barycentric1 = ((spawner2.y - spawner3.y) * (spawnX - spawner3.x) + (spawner3.x - spawner2.x) * (spawnY - spawner3.y)) / ((spawner2.y - spawner3.y) * (spawner1.x - spawner3.x) + (spawner3.x - spawner2.x) * (spawner1.y - spawner3.y));
                    barycentric2 = ((spawner3.y - spawner1.y) * (spawnX - spawner3.x) + (spawner1.x - spawner3.x) * (spawnY - spawner3.y)) / ((spawner2.y - spawner3.y) * (spawner1.x - spawner3.x) + (spawner3.x - spawner2.x) * (spawner1.y - spawner3.y));
                    barycentric3 = 1 - barycentric1 - barycentric2;
                }
                // get density of chunk and density of spawner
                let chunkDensity = 0;
                if (Monster.density[i] != null && Monster.density[i][y] != null && Monster.density[i][y][x] != null) {
                    chunkDensity = Monster.density[i][y][x];
                    // chunkDensity = Object.keys(Monster.chunks[i][y][x]).length;
                }
                // TODO p1: why is Monster.density even a thing.. oh wait5
                let spawnerDensity = spawner1.density * barycentric1;
                if (spawner2 != null) {
                    spawnerDensity += spawner2.density * barycentric2;
                }
                if (spawner3 != null) {
                    spawnerDensity += spawner3.density * barycentric3;
                }
                if (chunkDensity >= spawnerDensity) {
                    continue;
                }
                // if (Object.keys(Monster.list).length > 0) {
                //     continue;
                // }
                // get total spawn weights and choose a monster to spawn
                let totalWeight = spawner1.totalWeight * barycentric1;
                if (spawner2 != null) {
                    totalWeight += spawner2.totalWeight * barycentric2;
                }
                if (spawner3 != null) {
                    totalWeight += spawner3.totalWeight * barycentric3;
                }
                let monsterId = Math.random() * totalWeight;
                search: {
                    if (totalWeight <= spawner1.totalWeight * barycentric1) {
                        for (let j in spawner1.monsters) {
                            totalWeight -= spawner1.monsters[j].weight * barycentric1;
                            if (monsterId >= totalWeight) {
                                monsterId = spawner1.monsters[j].id;
                                break search;
                            }
                        }
                    }
                    else {
                        totalWeight -= spawner1.totalWeight * barycentric1;
                    }
                    if (totalWeight <= spawner2.totalWeight * barycentric2) {
                        for (let j in spawner2.monsters) {
                            totalWeight -= spawner2.monsters[j].weight * barycentric2;
                            if (monsterId >= totalWeight) {
                                monsterId = spawner2.monsters[j].id;
                                break search;
                            }
                        }
                    }
                    else {
                        totalWeight -= spawner2.totalWeight * barycentric2;
                    }
                    for (let j in spawner3.monsters) {
                        totalWeight -= spawner3.monsters[j].weight * barycentric3;
                        if (monsterId >= totalWeight) {
                            monsterId = spawner3.monsters[j].id;
                            break search;
                        }
                    }
                }
                new Monster(monsterId, spawnX * TILE_SIZE + TILE_SIZE / 2, spawnY * TILE_SIZE + TILE_SIZE / 2, layer, i, AREA_SPAWNER, {
                    x: x,
                    y: y,
                    map: i,
                });
                // TODO p0: spawning in collision
                Entity.addParticle({
                    x: spawnX * TILE_SIZE + TILE_SIZE / 2,
                    y: spawnY * TILE_SIZE + TILE_SIZE / 2,
                    layer: layer,
                    map: i,
                    type: PARTICLE_SPAWN,
                });
            }
        }
    }
    let totalStart = performance.now();
    let playerStart = performance.now();
    for (let i in Player.list) {
        Player.list[i].cameraShakeMagnitude = 0;
        Player.list[i].cameraShakeDecay = 0;
        Player.list[i].cameraFlash = [];
    }
    for (let i in Player.list) {
        let player = Player.list[i];
        // TODO
        if (player.tick < tick - ENV.desyncBuffer && player.tick != -1) {
            player.tick += 1;
            Player.update(player);
        }
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
                heldItem: player.heldItem,
                heldItemAngle: player.heldItemAngle,
                hp: player.hp,
                hpMax: player.hpMax,
            });
        }
    }
    let playerEnd = performance.now();
    let monsterStart = performance.now();
    for (let i in Monster.list) {
        Monster.update(Monster.list[i]);
    }
    let monsterEnd = performance.now();
    playerStart += performance.now() - playerEnd;
    for (let i in Player.list) {
        Player.updateCollisions(Player.list[i]);
    }
    playerEnd = performance.now();
    monsterStart += performance.now() - monsterEnd;
    for (let i in Monster.list) {
        Monster.updateCollisions(Monster.list[i]);
    }
    monsterEnd = performance.now();
    for (let i in Npc.list) {
        Npc.update(Npc.list[i]);
    }
    let projectileStart = performance.now();
    for (let i in Projectile.list) {
        Projectile.update(Projectile.list[i]);
    }
    let projectileEnd = performance.now();
    for (let i in DroppedItem.list) {
        DroppedItem.update(DroppedItem.list[i]);
    }
    let totalEnd = performance.now();
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
    let chunks = null;
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
            error("Invalid type " + entity.type + " for Entity.addChunks.");
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
                error("Invalid type " + entity.type + " for Entity.updateChunks.");
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
            error("Invalid type " + entity.type + " for Entity.delete.");
            break;
    }
};
Entity.addEntity = function(entity, data) {
    for (let y = Math.floor((entity.y - entity.height / 2) / CHUNK_SIZE); y < Math.ceil((entity.y + entity.height / 2) / CHUNK_SIZE); y++) {
        if (entityPack[entity.map][y] == null) {
            entityPack[entity.map][y] = [];
        }
        for (let x = Math.floor((entity.x - entity.width / 2) / CHUNK_SIZE); x < Math.ceil((entity.x + entity.width / 2) / CHUNK_SIZE); x++) {
            if (entityPack[entity.map][y][x] == null) {
                entityPack[entity.map][y][x] = [];
            }
            entityPack[entity.map][y][x].push(data);
        }
    }
};
Entity.addDroppedItem = function(droppedItem, data) {
    for (let y = Math.floor((droppedItem.y - droppedItem.height / 2) / CHUNK_SIZE); y < Math.ceil((droppedItem.y + droppedItem.height / 2) / CHUNK_SIZE); y++) {
        if (droppedItemPack[droppedItem.map][y] == null) {
            droppedItemPack[droppedItem.map][y] = [];
        }
        for (let x = Math.floor((droppedItem.x - droppedItem.width / 2) / CHUNK_SIZE); x < Math.ceil((droppedItem.x + droppedItem.width / 2) / CHUNK_SIZE); x++) {
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
Entity.addEntityDebug = function(entity, data) {
    // TODO p1: also naming
    for (let y = Math.floor((entity.y - entity.height / 2) / CHUNK_SIZE); y < Math.ceil((entity.y + entity.height / 2) / CHUNK_SIZE); y++) {
        if (debugPack[entity.map][y] == null) {
            debugPack[entity.map][y] = [];
        }
        for (let x = Math.floor((entity.x - entity.width / 2) / CHUNK_SIZE); x < Math.ceil((entity.x + entity.width / 2) / CHUNK_SIZE); x++) {
            if (debugPack[entity.map][y][x] == null) {
                debugPack[entity.map][y][x] = [];
            }
            debugPack[entity.map][y][x].push(data);
        }
    }
};
Entity.searchChunks = function(chunks, x, y, map, range, callback) {
    if (chunks[map] == null) {
        return;
    }
    for (let i = y - range + 1; i < y + range; i++) {
        if (chunks[map][i] == null) {
            continue;
        }
        for (let j = x - range + 1; j < x + range; j++) {
            if (chunks[map][i][j] == null) {
                continue;
            }
            for (let k in chunks[map][i][j]) {
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
    for (let i = Math.floor((y - height / 2 - ENV.hitboxBuffer) / CHUNK_SIZE); i < Math.ceil((y + height / 2 + ENV.hitboxBuffer) / CHUNK_SIZE); i++) {
        if (chunks[map][i] == null) {
            continue;
        }
        for (let j = Math.floor((x - width / 2 - ENV.hitboxBuffer) / CHUNK_SIZE); j < Math.ceil((x + width / 2 + ENV.hitboxBuffer) / CHUNK_SIZE); j++) {
            if (chunks[map][i][j] == null) {
                continue;
            }
            for (let k in chunks[map][i][j]) {
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
    return Math.min(entity1.x - entity2.x, entity1.y - entity2.y);
};
Entity.move = function(entity, slide) {
    let collided = false;
    // let max = Math.ceil(Math.max(Math.abs(entity.speedX), Math.abs(entity.speedY)) / entity.physicsInaccuracy / ENV.physicsInaccuracy);
    let max = Math.ceil(Math.max(Math.abs(entity.speedX) / entity.width, Math.abs(entity.speedY) / entity.height));
    if (max != 0) {
        let speedX = entity.speedX / max;
        let speedY = entity.speedY / max;
        for (let i = 0; i < max; i += 1) {
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
            if (Entity.collideWithMapEffects(entity, speedX, speedY)) {
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
Entity.collideWithPoint = function(entity, x, y) {
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
Entity.collideWithMap = function(entity, speedX, speedY, slide) {
    if (collisions[entity.map] == null || collisions[entity.map][entity.layer] == null) {
        return false;
    }
    let maxDistanceX = 0;
    let maxDistanceY = 0;
    let signX = Math.sign(speedX);
    let signY = Math.sign(speedY);
    let minX = Math.min(Math.floor((entity.x - entity.width / 2) / TILE_SIZE), Math.floor((entity.lastX - entity.width / 2) / TILE_SIZE));
    let minY = Math.min(Math.floor((entity.y - entity.height / 2) / TILE_SIZE), Math.floor((entity.lastY - entity.height / 2) / TILE_SIZE));
    let maxX = Math.max(Math.ceil((entity.x + entity.width / 2) / TILE_SIZE), Math.ceil((entity.lastX + entity.width / 2) / TILE_SIZE));
    let maxY = Math.max(Math.ceil((entity.y + entity.height / 2) / TILE_SIZE), Math.ceil((entity.lastY + entity.height / 2) / TILE_SIZE));
    // TODO p2: make the collisions only check when lined up with grid
    for (let y = minY; y < maxY; y++) {
        if (collisions[entity.map][entity.layer][y] == null) {
            continue;
        }
        for (let x = minX; x < maxX; x++) {
            if (collisions[entity.map][entity.layer][y][x] == null) {
                continue;
            }
            for (let i in collisions[entity.map][entity.layer][y][x]) {
                let collision = collisions[entity.map][entity.layer][y][x][i];
                if (collision.slowdown) {
                    continue;
                }
                let distanceX = (entity.x + entity.width / 2 * signX) - (collision.x - collision.width / 2 * signX);
                let distanceLastX = (entity.lastX + entity.width / 2 * signX) - (collision.x - collision.width / 2 * signX);

                if (distanceX * signX > 0 && distanceLastX * signX <= 0 && Math.abs(entity.y - distanceX / speedX * speedY - collision.y) < entity.height / 2 + collision.height / 2) {
                    maxDistanceX = Math.max(maxDistanceX, distanceX * signX);
                    continue;
                }

                let distanceY = (entity.y + entity.height / 2 * signY) - (collision.y - collision.height / 2 * signY);
                let distanceLastY = (entity.lastY + entity.height / 2 * signY) - (collision.y - collision.height / 2 * signY);

                if (distanceY * signY > 0 && distanceLastY * signY <= 0 && Math.abs(entity.x - distanceY / speedY * speedX - collision.x) < entity.width / 2 + collision.width / 2) {
                    maxDistanceY = Math.max(maxDistanceY, distanceY * signY);
                    continue;
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
        let max = Math.max(timeX, timeY);
        if (slide) {
            if (max == timeX) {
                entity.x -= maxDistanceX * signX;
            }
            else {
                entity.y -= maxDistanceY * signY;
            }
        }
        else {
            entity.x -= max * speedX;
            entity.y -= max * speedY;
        }
        return true;
    }
    return false;
};
Entity.collideWithMapEffects = function(entity, speedX, speedY) {
    entity.slowedDown = false;
    let signX = Math.sign(speedX);
    let signY = Math.sign(speedY);
    let minX = Math.min(Math.floor((entity.x - entity.width / 2) / TILE_SIZE), Math.floor((entity.lastX - entity.width / 2) / TILE_SIZE));
    let minY = Math.min(Math.floor((entity.y - entity.height / 2) / TILE_SIZE), Math.floor((entity.lastY - entity.height / 2) / TILE_SIZE));
    let maxX = Math.max(Math.ceil((entity.x + entity.width / 2) / TILE_SIZE), Math.ceil((entity.lastX + entity.width / 2) / TILE_SIZE));
    let maxY = Math.max(Math.ceil((entity.y + entity.height / 2) / TILE_SIZE), Math.ceil((entity.lastY + entity.height / 2) / TILE_SIZE));
    if (collisions[entity.map] != null && collisions[entity.map][entity.layer] != null) {
        search: for (let y = minY; y < maxY; y++) {
            if (collisions[entity.map][entity.layer][y] == null) {
                continue;
            }
            for (let x = minX; x < maxX; x++) {
                if (collisions[entity.map][entity.layer][y][x] == null) {
                    continue;
                }
                for (let i in collisions[entity.map][entity.layer][y][x]) {
                    let collision = collisions[entity.map][entity.layer][y][x][i];
                    if (!collision.slowdown) {
                        continue;
                    }
                    let distanceX = (entity.x + entity.width / 2 * signX) - (collision.x - collision.width / 2 * signX);
                    let distanceLastX = (entity.lastX + entity.width / 2 * signX) - (collision.x - collision.width / 2 * signX);

                    if (distanceX * signX > 0 && distanceLastX * signX <= 0 && Math.abs(entity.y - distanceX / speedX * speedY - collision.y) < entity.height / 2 + collision.height / 2) {
                        entity.slowedDown = true;
                        break search;
                    }

                    let distanceY = (entity.y + entity.height / 2 * signY) - (collision.y - collision.height / 2 * signY);
                    let distanceLastY = (entity.lastY + entity.height / 2 * signY) - (collision.y - collision.height / 2 * signY);

                    if (distanceY * signY > 0 && distanceLastY * signY <= 0 && Math.abs(entity.x - distanceY / speedY * speedX - collision.x) < entity.width / 2 + collision.width / 2) {
                        entity.slowedDown = true;
                        break search;
                    }
                }
            }
        }
    }
    if (slopes[entity.map] != null && slopes[entity.map][entity.layer] != null) {
        // TODO: fix slopes, teleporters by making them perfect
        slope: for (let y = Math.floor((entity.y - entity.height / 2) / TILE_SIZE); y < Math.ceil((entity.y + entity.height / 2) / TILE_SIZE); y++) {
            if (slopes[entity.map][entity.layer][y] == null) {
                continue;
            }
            for (let x = Math.floor((entity.x - entity.width / 2) / TILE_SIZE); x < Math.ceil((entity.x + entity.width / 2) / TILE_SIZE); x++) {
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
        for (let y = Math.floor((entity.y - entity.height / 2) / TILE_SIZE); y < Math.ceil((entity.y + entity.height / 2) / TILE_SIZE); y++) {
            if (teleporters[entity.map][entity.layer][y] == null) {
                continue;
            }
            for (let x = Math.floor((entity.x - entity.width / 2) / TILE_SIZE); x < Math.ceil((entity.x + entity.width / 2) / TILE_SIZE); x++) {
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
    let self = new Entity();

    self.slowedDown = false;

    self.hp = 0;
    self.hpMax = 0;
    self.hpRegen = 0;
    self.hpRegenAmount = 0;
    self.hpRegenSpeed = 0;
    self.hpRegenAccelerationRate = 0;
    self.hpRegenAccelerationCap = 0;

    self.mana = 0;
    self.manaMax = 0;
    self.manaRegen = 0;
    self.manaRegenAmount = 0;
    self.manaRegenSpeed = 0;
    self.manaRegenAccelerationRate = 0;
    self.manaRegenAccelerationCap = 0;

    self.defense = 0;
    self.damageReduction = 0;
    self.knockbackResistance = 0;
    self.projectileDamage = 0;
    self.projectileSpeed = 1;
    self.projectileRange = 1;
    self.projectileAccuracy = 0;
    self.projectileKnockback = 1;
    self.projectilePierce = 0;
    self.critChance = 0;
    self.critPower = 1;
    // self.critKnockback = 1;
    self.shieldDefense = 0;
    self.shieldDamageReduction = 0;
    self.shieldKnockbackResistance = 0;
    self.shieldBlockAngle = 0;
    self.shieldBlockChance = 0;
    self.shieldReflectionChance = 0;
    self.contactDamage = 0;
    self.contactEvents = [];
    self.contactKnockback = 1;

    self.swingTime = 0;

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

    self.invincible = false;

    self.invincibilityFrames = {};

    self.effects = [];
    self.immuneEffects = [];

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
    self.dashDecay = 0;

    self.heldItem = ITEM_NULL;

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
                if (TEST_PING == 0) {
                    rig.socket.emit("teleportEnd", {
                        x: rig.x,
                        y: rig.y,
                        layer: rig.layer,
                        map: rig.map,
                        knockbackX: rig.knockbackX,
                        knockbackY: rig.knockbackY,
                    });
                }
                else {
                    setTimeout(function() {
                        rig.socket.emit("teleportEnd", {
                            x: rig.x,
                            y: rig.y,
                            layer: rig.layer,
                            map: rig.map,
                            knockbackX: rig.knockbackX,
                            knockbackY: rig.knockbackY,
                        });
                    }, TEST_PING);
                }
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
                    if (pathfindCollisions[rig.map] == null || pathfindCollisions[rig.map][rig.layer] == null) {
                        rig.movePath = Rig.pathfind(rig, rig.moveX + Math.floor(Math.random() * 9 - 4), rig.moveY + Math.floor(Math.random() * 9 - 4));
                        rig.movePathIndex = 0;
                        rig.moveCooldown = Math.floor(Math.random() * 200) + 100;
                    }
                    else {
                        let totalSpots = 0;
                        for (let i = -4; i <= 4; i++) {
                            for (let j = -4; j <= 4; j++) {
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
                            let spot = Math.floor(Math.random() * totalSpots);
                            search: for (let i = -4; i <= 4; i++) {
                                for (let j = -4; j <= 4; j++) {
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
                // TODO p2: naming?
                // rig.moveCooldown -= 1;
                // if (rig.moveCooldown < 0) {
                if (rig.movePath.length == 0) {
                    let totalWeight = 0;
                    for (let i in Rig.waypoints[rig.moveWaypoint]) {
                        // TODO p1: potential bug with using moveX and moveY?
                        if (Rig.waypoints[rig.moveWaypoint].x == rig.moveX && Rig.waypoints[rig.moveWaypoint].y == rig.moveY) {
                            continue;
                        }
                        totalWeight += Rig.waypoints[rig.moveWaypoint][i].weight;
                    }
                    let weight = Math.floor(Math.random() * totalWeight);
                    for (let i in Rig.waypoints[rig.moveWaypoint][rig.moveWaypointLocation].paths) {
                        if (Rig.waypoints[rig.moveWaypoint].x == rig.moveX && Rig.waypoints[rig.moveWaypoint].y == rig.moveY) {
                            continue;
                        }
                        totalWeight -= Rig.waypoints[rig.moveWaypoint][i].weight;
                        if (weight >= totalWeight) {
                            rig.moveX = Rig.waypoints[rig.moveWaypoint][i].x;
                            rig.moveY = Rig.waypoints[rig.moveWaypoint][i].y;
                            rig.movePath = Rig.pathfind(rig, rig.moveX, rig.moveY);
                            rig.movePathIndex = 0;
                            break;
                        }
                    }
                }
            }
        }
        if (rig.movePath.length > rig.movePathIndex) {
            let x = rig.movePath[rig.movePathIndex][0] * TILE_SIZE + TILE_SIZE / 2;
            let y = rig.movePath[rig.movePathIndex][1] * TILE_SIZE + TILE_SIZE / 2;
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
    if (rig.dashTime < 0 && !rig.teleporting) {
        rig.dashX *= 1 - rig.dashDecay;
        rig.dashY *= 1 - rig.dashDecay;
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
    let x = rig.x;
    let y = rig.y;
    // Entity.collisionSlide(rig);
    Entity.move(rig, true);
    rig.speedX = rig.x - x;
    rig.speedY = rig.y - y;
};
Rig.updateRegen = function(rig) {
    let multiplier = 1;
    if (Math.abs(rig.speedX) < 0.5 && Math.abs(rig.speedY) < 0.5) {
        multiplier *= 1.5;
    }
    if (rig.knockbackX != 0 || rig.knockbackY != 0) {
        multiplier *= 0.75;
    }
    // TODO p0: remove acceleration?
    if (rig.hpRegen != 0) {
        rig.hpRegenSpeed += rig.hpRegenAccelerationRate * multiplier;
        rig.hpRegenAmount += rig.hpRegen * Math.min(rig.hpRegenSpeed, rig.hpRegenAccelerationCap);
        if (rig.hpRegenAmount >= 1) {
            let hp = rig.hp;
            rig.hp += Math.floor(rig.hpRegenAmount);
            rig.hpRegenAmount -= Math.floor(rig.hpRegenAmount);
            if (hp < rig.hpMax) {
                Entity.addParticle({
                    x: rig.x,
                    y: rig.y,
                    layer: rig.layer,
                    map: rig.map,
                    type: PARTICLE_HEAL,
                    value: Math.floor(rig.hpRegenAmount),
                });
            }
            if (rig.hp > rig.hpMax) {
                rig.hp = rig.hpMax;
            }
        }
    }
    if (rig.manaRegenSpeed != 0) {
        rig.manaRegenSpeed += rig.manaRegenAccelerationRate * multiplier;
        rig.manaRegenAmount += rig.manaRegen * Math.min(rig.manaRegenSpeed, rig.manaRegenAccelerationCap);
        if (rig.manaRegenAmount >= 1) {
            rig.mana += Math.floor(rig.manaRegenAmount);
            rig.manaRegenAmount -= Math.floor(rig.manaRegenAmount);
            if (rig.mana > rig.manaMax) {
                rig.mana = rig.manaMax;
            }
        }
    }
    if (rig.poiseRegenSpeed != 0) {
        rig.poiseRegenAcceleration += rig.poiseRegenAccelerationRate * multiplier;
        rig.poiseRegenCooldown -= Math.min(rig.poiseRegenAcceleration, rig.poiseRegenAccelerationCap);
        if (rig.poise >= rig.poiseMax) {
            rig.poiseRegenCooldown = 0;
        }
        let regenTimes = Math.ceil(-rig.poiseRegenCooldown / rig.poiseRegenSpeed);
        if (regenTimes > 0) {
            rig.poiseRegenCooldown += rig.poiseRegenSpeed * regenTimes;
            rig.poise += rig.poiseRegen * regenTimes;
            if (rig.poise > rig.poiseMax) {
                rig.poise = rig.poiseMax;
            }
        }
    }
};
Rig.updateAnimation = function(rig) {
    let speed = rig.animationSpeed;
    if (rig.animationChangeBySpeed) {
        // speed *= Math.sqrt(Math.pow(rig.speedX, 2) + Math.pow(rig.speedY, 2));
        speed *= Math.max(Math.abs(rig.speedX), Math.abs(rig.speedY));
    }
    rig.animationStage = (rig.animationStage + speed) % rig.animationLength;
    if (rig.animationType == DIRECTIONAL_8) {
        let angle = null;
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
        let angle = null;
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
    for (let i in rig.invincibilityFrames) {
        rig.invincibilityFrames[i] -= 1;
        if (rig.invincibilityFrames[i] <= 0) {
            delete rig.invincibilityFrames[i];
        }
    }
};
Rig.updateSwing = function(rig) {
    if (rig.hp == 0 || rig.poise == 0 || rig.teleporting || rig.dialogue != null) {
        rig.swingTime = 0;
        return;
    }
    return;
    rig.swingTime -= 1;
    if (rig.swingTime >= 0) {
        if (rig.swingProjectile.firstTick) {
            // rig.swingProjectile.x = rig.x;
            // rig.swingProjectile.y = rig.y;
            // rig.swingProjectile.speedX = 0;
            // rig.swingProjectile.speedY = 0;
            // rig.heldItemAngle = rig.swingAngle;
            return;
        }
        console.log("update swing")
        rig.swingAngle = (rig.swingTargetAngle - rig.swingMaxAngle / 2 * rig.swingDirection) * rig.swingSpeed + rig.swingAngle * (1 - rig.swingSpeed);
        let angle = rig.swingAngle + rig.swingOffsetAngle;
        // rig.swingProjectile.x = rig.x;
        // rig.swingProjectile.y = rig.y;
        // rig.swingProjectile.speedX = 0;
        // rig.swingProjectile.speedY = 0;
        // rig.swingProjectile.x = rig.x + rig.swingOffsetX * cos(angle) + rig.swingOffsetY * sin(angle) - rig.swingProjectile.x;
        // rig.swingProjectile.y = rig.y + rig.swingOffsetX * sin(angle) - rig.swingOffsetY * cos(angle) - rig.swingProjectile.y;
        rig.swingProjectile.speedX = rig.x + rig.swingOffsetX * cos(angle) + rig.swingOffsetY * sin(angle) - rig.swingProjectile.x;
        rig.swingProjectile.speedY = rig.y + rig.swingOffsetX * sin(angle) - rig.swingOffsetY * cos(angle) - rig.swingProjectile.y;
        rig.swingProjectile.angle = angle;
        Projectile.updateAngle(rig.swingProjectile);
        console.log(rig.swingProjectile.x, rig.swingProjectile.y)
        console.log(rig.x + rig.swingOffsetX * cos(angle) + rig.swingOffsetY * sin(angle), rig.y + rig.swingOffsetX * sin(angle) - rig.swingOffsetY * cos(angle))
        // rig.heldItemAngle = rig.swingAngle;
    }
    else if (rig.swingProjectile != null) {
        Entity.delete(rig.swingProjectile);
        rig.swingProjectile = null;
    }
};
Rig.addEffect = function(rig, effect, duration) {
    if (rig.immuneEffects[effect]) {
        return;
    }
    // TODO p0: stacking dot effects as well as tracking effect owner
    if (rig.effects[effect] == null) {
        rig.effects[effect] = duration;
        Rig.effects[effect].start(rig);
    }
    else {
        rig.effects[effect] = Math.max(duration, rig.effects[effect]);
    }
};
Rig.updateEffects = function(rig) {
    for (let i in rig.effects) {
        // TODO p0: send effect data
        if (rig.immuneEffects[i]) {
            Rig.effects[i].end(rig);
            delete rig.effects[i];
            continue;
        }
        Rig.effects[i].during(rig);
        if (rig.hp == 0) {
            return;
        }
        rig.effects[i] -= 1;
        if (rig.effects[i] <= 0) {
            Rig.effects[i].end(rig);
            delete rig.effects[i];
        }
    }
};
Rig.pathfind = function(rig, x, y) {
    let left = Math.min(rig.gridX - ENV.pathfindBuffer, x - ENV.pathfindBuffer);
    let right = Math.max(rig.gridX + ENV.pathfindBuffer, x + ENV.pathfindBuffer);
    let top = Math.min(rig.gridY - ENV.pathfindBuffer, y - ENV.pathfindBuffer);
    let bottom = Math.max(rig.gridY + ENV.pathfindBuffer, y + ENV.pathfindBuffer);
    // TODO p0: out of bounds?
    let grid = new PF.Grid(right - left, bottom - top);
    for (let i = top; i < bottom; i++) {
        for (let j = left; j < right; j++) {
            if ((j == rig.gridX && i == rig.gridY) || (j == x && i == y)) {
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
    let path = pathfinder.findPath(rig.gridX - left, rig.gridY - top, x - left, y - top, grid);
    path.shift();
    path = PF.Util.compressPath(path);
    for (let i in path) {
        path[i][0] += left;
        path[i][1] += top;
    }
    return path;
};
Rig.retreat = function(rig, x, y) {
    let left = rig.gridX - ENV.pathfindBuffer;
    let right = rig.gridX + ENV.pathfindBuffer;
    let top = rig.gridY - ENV.pathfindBuffer;
    let bottom = rig.gridY + ENV.pathfindBuffer;
    let best = null;
    let bestX = null;
    let bestY = null;
    for (let i = top; i < bottom; i++) {
        for (let j = left; j < right; j++) {
            if (j == rig.gridX && i == rig.gridY) {
                continue;
            }
            if (pathfindCollisions[rig.map] != null && pathfindCollisions[rig.map][rig.layer] != null && pathfindCollisions[rig.map][rig.layer][i] != null && pathfindCollisions[rig.map][rig.layer][i][j] == 1) {
                continue;
            }
            if (rig.type == MONSTER && regions[rig.map] != null && regions[rig.map][rig.layer] != null && regions[rig.map][rig.layer][i] != null && regionSafety[regions[rig.map][rig.layer][i][j]]) {
                continue;
            }
            let weight = Math.pow(rig.gridX - j, 2) + Math.pow(rig.gridY - i, 2) + Math.pow(x - j, 2) + Math.pow(y - i, 2);
            if (best == null || weight > best) {
                best = weight;
                bestX = j;
                bestY = i;
            }
        }
    }
    if (best != null) {
        return Rig.pathfind(rig, bestX, bestY);
    }
    return [];
};
Rig.escapeSafeRegion = function(rig) {
    let left = rig.gridX - ENV.pathfindBuffer;
    let right = rig.gridX + ENV.pathfindBuffer;
    let top = rig.gridY - ENV.pathfindBuffer;
    let bottom = rig.gridY + ENV.pathfindBuffer;
    let best = null;
    let bestX = null;
    let bestY = null;
    for (let i = top; i < bottom; i++) {
        for (let j = left; j < right; j++) {
            if (j == rig.gridX && i == rig.gridY) {
                continue;
            }
            if (pathfindCollisions[rig.map] != null && pathfindCollisions[rig.map][rig.layer] != null && pathfindCollisions[rig.map][rig.layer][i] != null && pathfindCollisions[rig.map][rig.layer][i][j] == 1) {
                continue;
            }
            if (rig.type == MONSTER && regions[rig.map] != null && regions[rig.map][rig.layer] != null && regions[rig.map][rig.layer][i] != null && regionSafety[regions[rig.map][rig.layer][i][j]]) {
                continue;
            }
            let weight = Math.pow(rig.gridX - j, 2) + Math.pow(rig.gridY - i, 2);
            if (best == null || weight < best) {
                best = weight;
                bestX = j;
                bestY = i;
            }
        }
    }
    if (best == null) {
        return Rig.pathfind(rig, bestX, bestY);
    }
    return [];
};
Rig.dodgeProjectiles = function(rig) {
    // TODO p1: actually make this work, idk what this is doing
    if (rig.movePath.length == 0) {
        return;
    }
    let projectiles = [];
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
    let x = rig.gridX;
    let y = rig.gridY;
    let index = rig.movePathIndex;
    for (let i = 0; i < ENV.dodgeProjectileSearchLength; i++) {
        let indexChanged = false;
        if (rig.movePath[index][0] == x && rig.movePath[index][1] == y) {
            index += 1;
            indexChanged = true;
            if (index == rig.movePath.length) {
                break;
            }
        }
        let lastX = x;
        let lastY = y;
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
        for (let i in projectiles) {
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
                let clockwise = true;
                let counterClockwise = true;
                let newX = lastX + y - lastY;
                let newY = lastY - x + lastX;
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
    // TODO p2: rename variables?
    if (pathfindCollisions[map] == null || pathfindCollisions[map][layer] == null) {
        return false;
    }
    if (pathfindCollisions[map][layer][Math.floor(y2 / TILE_SIZE)] != null && pathfindCollisions[map][layer][Math.floor(y2 / TILE_SIZE)][Math.floor(x2 / TILE_SIZE)]) {
        return true;
    }
    x1 /= TILE_SIZE;
    y1 /= TILE_SIZE;
    x2 /= TILE_SIZE;
    y2 /= TILE_SIZE;
    let dx = x2 - x1;
    let dy = y2 - y1;
    let yLonger = Math.abs(dy) > Math.abs(dx);

    let shortLen = yLonger ? dx : dy;
    let longLen = yLonger ? dy : dx;

    let sign = Math.sign(longLen);

    let slope = shortLen / longLen;

    let x = x1;
    let y = y1;
    if (yLonger) {
        for (let i = sign; y <= y2; i += sign) {
            x = x1 + Math.round(i * slope);
            y = y1 + i;
            if (pathfindCollisions[map][layer][Math.floor(y)] != null && pathfindCollisions[map][layer][Math.floor(y)][Math.floor(x)] == 1) {
                return true;
            }
        }
    }
    else {
        for (let i = sign; x <= x2; i += sign) {
            x = x1 + i;
            y = y1 + Math.round(i * slope);
            if (pathfindCollisions[map][layer][Math.floor(y)] != null && pathfindCollisions[map][layer][Math.floor(y)][Math.floor(x)] == 1) {
                return true;
            }
        }
    }
    // let angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
    // let speedX = cos(angle) * 16;
    // let speedY = sin(angle) * 16;
    // let distance = Math.ceil(Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)));
    // for (let i = 0; i < distance; i++) {
    //     x1 += speedX;
    //     y1 += speedY;
    //     if (pathfindCollisions[map][layer][Math.floor(y1 / TILE_SIZE)] != null && pathfindCollisions[map][layer][Math.floor(y1 / TILE_SIZE)][Math.floor(x1 - TILE_SIZE)] == 1) {
    //         return true;
    //     }
    // }
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
        if (TEST_PING == 0) {
            rig.socket.emit("teleportStart");
        }
        else {
            setTimeout(function() {
                rig.socket.emit("teleportStart");
            }, TEST_PING);
        }
    }
    return true;
};
Rig.onDamage = function(rig, entity, type, data) {
    if (rig.invincible) {
        return;
    }
    let owner = null;
    if (entity != null) {
        if (rig.invincibilityFrames[entity.id] >= 1) {
            // rig.invincibilityFrames[entity.id] = 2;
            return;
        }
        rig.invincibilityFrames[entity.id] = 5;
        owner = entity.owner ?? entity;
    }
    let multiplier = Math.random() * 0.4 + 0.8;
    let knockbackMultiplier = multiplier;
    let damage = null;
    let crit = false;
    let blockState = NOT_BLOCKED;
    switch (type) {
        case DAMAGE_CONTACT:
            if (Math.random() < entity.critChance) {
                // crit power starts at 0
                // damage = Math.max(Math.min(Math.floor(entity.contactDamage * multiplier - rig.defense) * (1 - rig.damageReduction) * entity.critDamage * (1 - rig.defense) * (1 - rig.contactDefense) - rig.damageReduction - rig.contactDamageReduction), rig.hp), 0);
                damage = Math.floor(Math.ceil(entity.contactDamage * multiplier * (1 - rig.damageReduction) - rig.defense) * (1 + entity.critPower));
                knockbackMultiplier *= (1 + entity.critPower);
                crit = true;
            }
            else {
                // damage = Math.max(Math.min(Math.floor(entity.contactDamage * multiplier * (1 - rig.defense) * (1 - rig.contactDefense) - rig.damageReduction - rig.contactDamageReduction), rig.hp), 0);
                damage = Math.ceil(entity.contactDamage * multiplier * (1 - rig.damageReduction) - rig.defense);
            }
            knockbackMultiplier *= entity.contactKnockback;
            var angle = Math.atan2(entity.y - rig.y, entity.x - rig.x) * 180 / Math.PI;
            if (rig.heldItem == SHIELD && Math.abs(rig.controls[TARGET_ANGLE] - angle) < rig.shieldBlockAngle / 2) {
                // TODO p0: figure out how shields will work
                // they will always apply shieldDefense and shieldDamageReduction when angled
                // but what about 100% block and projectile reflection?
                // if dashing and reflected, reflect dash
                blockState = BLOCKED;
                knockbackMultiplier *= Math.max((1 - rig.knockbackResistance) * (1 - rig.shieldKnockbackResistance), 0);
                if (entity.dashTime > 0) {
                    let dashAngle = 2 * rig.controls[TARGET_ANGLE] - Math.atan2(entity.dashY, entity.dashX) * 180 / Math.PI;
                    let dashMagnitude = Math.sqrt(Math.pow(entity.dashX, 2), Math.pow(entity.dashY, 2));
                    entity.dashX = cos(dashAngle) * dashMagnitude;
                    entity.dashY = sin(dashAngle) * dashMagnitude;
                }
            }
            else {
                knockbackMultiplier *= Math.max(1 - rig.knockbackResistance, 0);
                rig.hp -= Math.min(damage, rig.hp);
                // particles
                if (rig.hp == 0) {
                    if ((rig.type == PLAYER && ENV.broadcastPlayerDeaths) || (rig.type == MONSTER && ENV.broadcastMonsterDeaths)) {
                        let deathMessages = [];
                        if (entity.type == MONSTER) {
                            deathMessages = Monster.data[entity.monsterId].deathMessages;
                        }
                        else {
                            deathMessages = ["<name1> was killed by <name2>.", "<name1> was smashed by <name2>.", "<name1> was squished by <name2>.", "<name1> was rammed to death by <name2>.", "<name1> was brutally obliterated by <name2>."];
                        }
                        insertChat(deathMessages[Math.floor(Math.random() * deathMessages.length)].replaceAll("<name1>", rig.name).replaceAll("<name2>", entity.name), "death");
                    }
                    // reset effects, dash, knockback
                }
            }
            if (rig.hp > 0) {
                rig.knockbackX += (-cos(angle) * 10 + entity.speedX) * knockbackMultiplier;
                rig.knockbackY += (-sin(angle) * 10 + entity.speedY) * knockbackMultiplier;
            }
            // TODO p1: add onDamage events? like the weird star cloak thingy
            for (let i in entity.contactEvents) {
                Rig.contactEvents[entity.contactEvents[i].type](rig, entity, entity.contactEvents[i].data);
            }
            break;
        case DAMAGE_PROJECTILE:
            if (Math.random() < entity.critChance) {
                // damage = Math.max(Math.min(Math.floor(entity.damage * multiplier * entity.critDamage * (1 - rig.defense) * (1 - rig.projectileDefense) - rig.damageReduction - rig.projectileDamageReduction), rig.hp), 0);
                multiplier *= entity.critKnockback;
                damage = Math.floor(Math.ceil(entity.damage * multiplier * (1 - rig.damageReduction) - rig.defense) * (1 + entity.critPower));
                knockbackMultiplier *= (1 + entity.critPower);
                crit = true;
            }
            else {
                // damage = Math.max(Math.min(Math.floor(entity.damage * multiplier * (1 - rig.defense) * (1 - rig.projectileDefense) - rig.damageReduction - rig.projectileDamageReduction), rig.hp), 0);
                damage = Math.ceil(entity.damage * multiplier * (1 - rig.damageReduction) - rig.defense);
            }
            knockbackMultiplier *= entity.knockback;
            var angle = Math.atan2(-entity.speedY, -entity.speedX) * 180 / Math.PI;
            if (rig.heldItem == SHIELD && Math.abs(rig.controls[TARGET_ANGLE] - angle) < rig.shieldBlockAngle / 2) {
                // if dashing and reflected, reflect dash
                knockbackMultiplier *= Math.max((1 - rig.knockbackResistance) * (1 - rig.shieldKnockbackResistance), 0);
                if (Projectile.data[entity.projectileId].reflectable && Math.random() < rig.shieldReflectionChance) {
                    blockState = REFLECTED;
                    entity.owner = rig;
                    entity.layer = rig.layer;
                    entity.angle = 2 * rig.controls[TARGET_ANGLE] - angle;
                    Projectile.updateAngle(entity);
                    entity.speedX = entity.speed * entity.cosAngle + rig.speedX;
                    entity.speedY = entity.speed * entity.sinAngle + rig.speedY;
                }
                else {
                    blockState = BLOCKED;
                }
            }
            else {
                knockbackMultiplier *= Math.max(1 - rig.knockbackResistance, 0);
                rig.hp -= Math.min(damage, rig.hp);
                entity.pierce -= 1;
                // particles
                if (rig.hp == 0) {
                    if ((rig.type == PLAYER && ENV.broadcastPlayerDeaths) || (rig.type == MONSTER && ENV.broadcastMonsterDeaths)) {
                        let deathMessages = Projectile.data[entity.projectileId].deathMessages;
                        insertChat(deathMessages[Math.floor(Math.random() * deathMessages.length)].replaceAll("<name1>", rig.name).replaceAll("<name2>", entity.owner.name), "death");
                    }
                    // reset effects, dash, knockback
                }
            }
            if (rig.hp > 0) {
                rig.knockbackX += entity.speedX * knockbackMultiplier;
                rig.knockbackY += entity.speedY * knockbackMultiplier;
            }
            for (let i in Projectile.data[entity.projectileId].contactEvents) {
                Projectile.contactEvents[Projectile.data[entity.projectileId].contactEvents[i].type](rig, entity, Projectile.data[entity.projectileId].contactEvents[i].data);
            }
            break;
        case DAMAGE_EXPLOSION:
            let distanceX = Math.max(Math.abs(rig.x - entity.x) - data.diameter / 2, 0);
            let distanceY = Math.max(Math.abs(rig.y - entity.y) - data.diameter / 2, 0);
            let distance = Math.sqrt(Math.pow(distanceX, 2) + Math.pow(distanceY, 2));
            if (distance > data.diameter / 2) {
                return;
            }
            multiplier *= (1.5 - (distance / (data.diameter / 2)));
            var angle = Math.atan2(entity.y - rig.y, entity.x - rig.x) * 180 / Math.PI;
            if (rig.heldItem == SHIELD && Math.abs(rig.controls[TARGET_ANGLE] - angle) < rig.shieldBlockAngle / 2) {
                blockState = BLOCKED;
                if (Math.random() < entity.critChance) {
                    damage = Math.max(Math.min(Math.floor((entity.damage ?? entity.contactDamage) * 0.2 * multiplier * entity.critPower * (1 - rig.defense) * (1 - rig.projectileDefense) - rig.damageReduction - rig.projectileDamageReduction), rig.hp), 0);
                    multiplier *= entity.critKnockback;
                    crit = true;
                }
                else {
                    damage = Math.max(Math.min(Math.floor((entity.damage ?? entity.contactDamage) * 0.2 * multiplier * (1 - rig.defense) * (1 - rig.projectileDefense) - rig.damageReduction - rig.projectileDamageReduction), rig.hp), 0);
                }
                knockbackMultiplier *= entity.knockback ?? entity.contactKnockback;
                knockbackMultiplier *= Math.max((1 - rig.knockbackResistance) * (1 - rig.shieldKnockbackResistance), 0);
            }
            else {
                if (Math.random() < entity.critChance) {
                    damage = Math.floor(Math.ceil((entity.damage ?? entity.contactDamage) * multiplier * (1 - rig.damageReduction) - rig.defense) * (1 + entity.critPower));
                    knockbackMultiplier *= (1 + entity.critPower);
                    crit = true;
                }
                else {
                    damage = Math.ceil((entity.damage ?? entity.contactDamage) * multiplier * (1 - rig.damageReduction) - rig.defense);
                }
                knockbackMultiplier *= entity.knockback ?? entity.contactKnockback;
                knockbackMultiplier *= Math.max(1 - rig.knockbackResistance, 0);
                rig.hp -= Math.min(damage, rig.hp);
                // particles
                if (rig.hp == 0) {
                    if ((rig.type == PLAYER && ENV.broadcastPlayerDeaths) || (rig.type == MONSTER && ENV.broadcastMonsterDeaths)) {
                        let deathMessages = [];
                        switch (entity.projectileId) {
                            case "explosive":
                                deathMessages = ["<name1> was blown up by <name2>.", "<name1> got blown to pieces due to <name2>.", "<name1> exploded due to <name2>.", "<name1> went boom with the help of <name2>."];
                                break;
                            default:
                                deathMessages = ["<name1> was blown up by <name2>.", "<name1> got blown to pieces due to <name2>.", "<name1> exploded due to <name2>.", "<name1> went boom with the help of <name2>."];
                                break;
                        }
                        insertChat(deathMessages[Math.floor(Math.random() * deathMessages.length)].replaceAll("<name1>", rig.name).replaceAll("<name2>", entity.name ?? entity.owner.name), "death");
                    }
                    // reset effects, dash, knockback
                }
            }
            if (rig.hp > 0) {
                rig.knockbackX += -cos(angle) * 10 * knockbackMultiplier;
                rig.knockbackY += -sin(angle) * 10 * knockbackMultiplier;
            }
            break;
        case DAMAGE_EFFECT:
            damage = Math.min(data.damage, rig.hp);
            rig.hp -= damage;
            // particles
            if (rig.hp == 0) {
                if ((rig.type == PLAYER && ENV.broadcastPlayerDeaths) || (rig.type == MONSTER && ENV.broadcastMonsterDeaths)) {
                    let deathMessages = [];
                    switch (data.damageType) {
                        case "fire" :
                            deathMessages = ["<name1> went up in flames.", "<name1> got burnt.", "<name1> played with fire."];
                            break;
                        default:
                            deathMessages = ["<name1> died."];
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
        if (owner != null && owner.id != rig.id) {
            rig.aiState = ATTACK;
            rig.pathfindCooldown = 0;
            rig.target = owner;
            rig.targetLastGridX = null;
            rig.targetLastGridY = null;
            rig.provoked = true;
            rig.moveType = PATH;
        }
    }
    if (owner != null && owner.type == PLAYER) {
        owner.trackedData.damageDealt += damage;
    }
    if (rig.hp == 0) {
        if (rig.type == PLAYER) {
            rig.trackedData.deaths += 1;
        }
        if (owner != null && owner.type == PLAYER) {
            owner.trackedData.kills += 1;
            if (rig.type == MONSTER && owner.trackedData.quest.trackData) {
                owner.trackedData.quest.killMonsters[rig.monsterId] += 1;
            }
        }
        if (rig.type == PLAYER) {
            Player.onDeath(rig, owner);
        }
        else if (rig.type == MONSTER) {
            Monster.onDeath(rig, owner);
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
Rig.areaEffect = function(x, y, map, diameter, type, callback) {
    if (type == MONSTER || ENV.playerFriendlyFire) {
        Entity.searchHitboxChunks(Player.chunks, x, y, diameter, diameter, map, callback);
    }
    if (type == PLAYER || ENV.monsterFriendlyFire) {
        Entity.searchHitboxChunks(Monster.chunks, x, y, diameter, diameter, map, callback);
    }
};
Rig.attacks = [];
Rig.attackData = {
    single: {
        attack: function(rig, attack) {
            // attacks as a parser???
            new Projectile(attack.projectile, rig.x, rig.y, rig.controls[TARGET_ANGLE] + Math.random() * rig.projectileAccuracy - rig.projectileAccuracy / 2, rig, null);
        },
    },
    triple: {
        attack: function(rig, attack) {
            let angle = rig.controls[TARGET_ANGLE] + Math.random() * rig.projectileAccuracy - rig.projectileAccuracy / 2;
            new Projectile(attack.projectile, rig.x, rig.y, angle - attack.deviation, rig);
            new Projectile(attack.projectile, rig.x, rig.y, angle, rig);
            new Projectile(attack.projectile, rig.x, rig.y, angle + attack.deviation, rig);
        },
    },
    buh: {
        attack: function(rig, attack) {
            let angle = rig.controls[TARGET_ANGLE] + Math.random() * rig.projectileAccuracy - rig.projectileAccuracy / 2;
            for (let i = -24; i < 25; i++) {
                new Projectile(attack.projectile, rig.x, rig.y, angle + attack.deviation * i, rig, null);
            }
        },
    },
    swing: {
        attack: function(rig, attack) {
            new Projectile(attack.projectile, rig.x, rig.y, rig.controls[TARGET_ANGLE] + Math.random() * rig.projectileAccuracy - rig.projectileAccuracy / 2, rig, rig);
            // let speed = rig.projectileSpeed * Projectile.data[attack.projectile].speed;
            // let range = Math.min(rig.projectileRange * Projectile.data[attack.projectile].range, rig.attackCooldown);
            // range = 40;
            // rig.swingTime = range;
            // rig.swingTargetAngle = rig.controls[TARGET_ANGLE] + Math.random() * rig.projectileAccuracy - rig.projectileAccuracy / 2;
            // rig.swingMaxAngle = attack.angle;
            // rig.swingSpeed = Math.pow(rig.swingMaxAngle, -speed / rig.swingTime);
            // rig.swingSpeed = 0.1;
            // rig.swingOffsetX = attack.offsetX;
            // rig.swingOffsetY = attack.offsetY;
            // rig.swingOffsetAngle = attack.offsetAngle;
            // rig.swingDirection *= -1;
            // rig.swingAngle = rig.swingTargetAngle + rig.swingMaxAngle / 2 * rig.swingDirection;
            // let angle = rig.swingAngle + rig.swingOffsetAngle;
            // if (rig.swingProjectile != null) {
            //     Entity.delete(rig.swingProjectile);
            // }
            // console.log("attacked")
            // rig.swingProjectile = new Projectile(attack.projectile, rig.x + rig.swingOffsetX * cos(angle) + rig.swingOffsetY * sin(angle), rig.y + rig.swingOffsetX * sin(angle) - rig.swingOffsetY * cos(angle), angle, rig, rig);
            // // rig.swingProjectile.x = rig.x;
            // // rig.swingProjectile.y = rig.y;
        },
    },
    test: {
        attack: function(rig, attack) {
            for (let i = 0; i < 8; i++) {
                new Projectile(attack.projectile, rig.x, rig.y, rig.controls[TARGET_ANGLE] + Math.random() * rig.projectileAccuracy - rig.projectileAccuracy / 2 + 45 * i, rig, null);
            }
        },
    },
    dash: {
        attack: function(rig, data) {
            let angle = rig.controls[TARGET_ANGLE] + Math.random() * rig.projectileAccuracy - rig.projectileAccuracy / 2;
            rig.dashX = cos(angle) * data.speed;
            rig.dashY = sin(angle) * data.speed;
            rig.dashTime = data.duration;
            rig.dashDecay = data.decay;
        },
    },
    cameraShake: {
        attack: function(rig, attack) {
            let radiusSquared = Math.pow(attack.diameter / 2, 2);
            Entity.searchHitboxChunks(Player.chunks, rig.x, rig.y, attack.diameter, attack.diameter, rig.map, function(player) {
                let distanceSquared = Entity.getDistanceSquared(rig, player);
                if (distanceSquared > radiusSquared) {
                    return;
                }
                player.cameraShakeMagnitude += attack.magnitude * (1 - distanceSquared / radiusSquared);
                player.cameraShakeDecay += attack.decay * distanceSquared / radiusSquared;
            });
        },
    },
    cameraFlash: {
        attack: function(rig, attack) {
            let radiusSquared = Math.pow(attack.diameter / 2, 2);
            Entity.searchHitboxChunks(Player.chunks, rig.x, rig.y, attack.diameter, attack.diameter, rig.map, function(player) {
                let distanceSquared = Entity.getDistanceSquared(rig, player);
                if (distanceSquared > radiusSquared) {
                    return;
                }
                let opacity = attack.opacity * (1 - distanceSquared / radiusSquared);
                let duration = attack.duration;
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
};
for (let i in Rig.attackData) {
    Rig.attacks.push(Rig.attackData[i]);
    Rig.attacks[Rig.attacks.length - 1].id = i;
}
Rig.parseAttack = function(attack) {
    for (let i = 0; i < Rig.attacks.length; i++) {
        if (Rig.attacks[i].id == attack.pattern) {
            attack.pattern = i;
            break;
        }
    }
    if (attack.data.projectile != null) {
        for (let i = 0; i < Projectile.data.length; i++) {
            if (Projectile.data[i].id == attack.data.projectile) {
                attack.data.projectile = i;
                break;
            }
        }
    }
};
// Rig.waypoints = require("./../client/data/waypoint.json"); // TODO p0: load waypoitns from maps
Rig.waypoints = {};
Rig.effects = [];
Rig.effectData = {
    fire: {
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
};
for (let i in Rig.effectData) {
    Rig.effects.push(Rig.effectData[i]);
    Rig.effects[Rig.effects.length - 1].id = i;
}
// TODO p0: remvoe this and replace with poise system
// EFFECT_STUNNED = 10;
// EFFECT_FROZEN = 10;
// for (let i = 0; i < Rig.effects.length; i++) {
//     if (Rig.effects[i].id == "stunned") {
//         EFFECT_STUNNED = i;
//     }
//     else if (Rig.effects[i].id == "frozen") {
//         EFFECT_FROZEN = i;
//     }
// }
Rig.contactEvents = [];
Rig.contactEventData = {
    explosion: {
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
    areaEffect: {
        event: function(rig1, rig2, data) {
            Rig.areaEffect(rig2.x, rig2.y, rig2.map, data.diameter, rig2.type, function(rig) {
                if (rig1.layer != rig.layer) {
                    return;
                }
                if (rig.inSafeRegion || rig.hp == 0 || rig.teleporting || rig.loading || rig.dialogue != null) {
                    return;
                }
                let distanceX = Math.max(Math.abs(rig.x - rig2.x) - data.diameter / 2, 0);
                let distanceY = Math.max(Math.abs(rig.y - rig2.y) - data.diameter / 2, 0);
                let distance = Math.sqrt(Math.pow(distanceX, 2) + Math.pow(distanceY, 2));
                if (distance > data.diameter / 2) {
                    return;
                }
                Rig.addEffect(rig, data.effect, data.duration);
            });
        },
    },
    effect: {
        event: function(rig1, rig2, data) {
            Rig.addEffect(rig1, data.effect, data.duration);
        },
    },
    particle: {
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
};
for (let i in Rig.contactEventData) {
    Rig.contactEvents.push(Rig.contactEventData[i]);
    Rig.contactEvents[Rig.contactEvents.length - 1].id = i;
}
Rig.parseEvent = function(event) {
    if (event.data.projectile != null) {
        for (let i = 0; i < Projectile.data.length; i++) {
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
        for (let i = 0; i < Rig.effects.length; i++) {
            if (Rig.effects[i].id == event.data.effect) {
                event.data.effect = i;
                break;
            }
        }
    }
};
Rig.parseContactEvent = function(event) {
    for (let i = 0; i < Rig.contactEvents.length; i++) {
        if (Rig.contactEvents[i].id == event.type) {
            event.type = i;
            break;
        }
    }
    Rig.parseEvent(event);
};
Rig.events = [];
Rig.eventData = {
    explosion: {
        event: function(rig, entity, data) {
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
};

Player = function(socket) {
    let self = new Rig();
    self.type = PLAYER;
    self.socket = socket;
    self.name = null;
    self.loading = true;

    self.ping = 0;
    self.tick = -1;

    self.width = 32;
    self.height = 32;

    self.moveSpeed = 10;
    self.moveType = CONTROLS;

    self.lastControls = [];
    
    self.lastKnockbackX = 0;
    self.lastKnockbackY = 0;

    self.animationType = DIRECTIONAL_8;
    self.animationLength = 6;
    self.animationSpeed = 0.05;
    self.animationChangeBySpeed = true;

    self.attacks = [];
    self.attackIndex = 0;
    self.attackCooldown = 0;
    // TODO p0: top 3 are getting replaced
    self.attackHpCost = 0;
    self.attackManaCost = 0;
    // for (let i = 0; i < 19; i++) {
    //     a = [];
    //     // for (let i = 0; i < 50; i++) {
    //     //     a.push({
    //     //         // pattern: "single",
    //     //         type: 0,
    //     //         data: {
    //     //             projectile: 0,
    //     //         },
    //     //     })
    //     // }
    //     // self.attack.push(a)
    //     self.attack.push(
    //         [
    //             {
    //                 // pattern: "single",
    //                 pattern: 0,
    //                 data: {
    //                     projectile: 0,
    //                     // deviation: 15,
    //                 },
    //             },
    //         ]);
    // }
    // self.attack.push(
    //     [
    //         {
    //             // pattern: "single",
    //             pattern: 0,
    //             data: {
    //                 projectile: 0,
    //                 // deviation: 15,
    //             },
    //         },
    //     ]);
    // self.attack.push(
    //     [
    //         {
    //             // pattern: "single",
    //             type: 1,
    //             data: {
    //                 projectile: 1,
    //                 deviation: 15,
    //             },
    //         },
    //         {
    //             // pattern: "single",
    //             type: 1,
    //             data: {
    //                 projectile: 4,
    //                 deviation: 15,
    //             },
    //         },
    //     ]);
    self.crystal = [];
    self.crystalIndex = 0;
    self.crystalCooldown = 0;
    self.crystalHpCost = 0;
    self.crystalManaCost = 0;

    // TODO p0: crystals and other stuff will use triggers to trigger events
    // just use rig.events

    self.hp = 10000;
    self.hpMax = 10000;
    self.hpRegen = 10;
    self.hpRegenSpeed = 1;
    self.hpRegenAccelerationRate = 0.1;
    self.hpRegenAccelerationCap = 200;

    self.contactDamage = 1000;
    
    self.projectileDamage = 200;
    self.critChance = 0.1;
    self.critPower = 3;
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
    Inventory.addItem(self.inventory, 1, [], 1);
    Inventory.addItem(self.inventory, 2, [], 1);
    Inventory.addItem(self.inventory, 3, [], 1);
    Inventory.addItem(self.inventory, 4, [], 1);

    self.customizations = {
        body: [0, 0, 0, 0],
        shirt: [255, 0, 0, 0.5],
        pants: [0, 125, 255, 0.2],
        eyes: [0, 0, 0, 1],
        gloves: [0, 0, 0, 0, 0],
        boots: [0, 0, 0, 0, 0],
        pouch: [0, 0, 0, 0, 0],
        hair: [125, 75, 0, 0.9, 2],
        shield: "shield1", // TODO p1: what
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
        if (TEST_PING == 0) {
            player.socket.emit("ping", data);
        }
        else {
            setTimeout(function() {
                player.socket.emit("ping", data);
            }, TEST_PING);
        }
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
        let overrideClient = false;
        for (let i in data) {
            if (typeof data[i] != "number") {
                continue;
            }
            if (player[i] != data[i]) {
                // console.log("player " + i + " different. server: " + player[i] + ", client: " + data[i])
                overrideClient = true;
                break;
            }
        }
        let d = Player.getClientData(player, overrideClient);
        if (TEST_PING == 0) {
            player.socket.emit("clientData", d);
        }
        else {
            setTimeout(function() {
                player.socket.emit("clientData", d);
            }, TEST_PING);
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
        let id = data.id;
        if (DroppedItem.list[id] == null) {
            return;
        }
        if (DroppedItem.list[id].owner != null && DroppedItem.list[id].owner != player.id) {
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
            let command = data.substring(1).split(" ").shift();
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
            let valid = false;
            for (let i = 0; i < data.length; i++) {
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
                    let color = "text";
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
                let self = player;
                let npc = null;
                for (let i in Npc.list) {
                    if (npc == null || Entity.getDistance(player, Npc.list[i]) < Entity.getDistance(player, npc)) {
                        npc = Npc.list[i];
                    }
                }
                let monster = null;
                for (let i in Monster.list) {
                    if (monster == null || Entity.getDistance(player, Monster.list[i]) < Entity.getDistance(player, monster)) {
                        monster = Monster.list[i];
                    }
                }
                let projectile = null;
                for (let i in Projectile.list) {
                    if (projectile == null || Entity.getDistance(player, Projectile.list[i]) < Entity.getDistance(player, projectile)) {
                        projectile = Projectile.list[i];
                    }
                }
                let result = eval(data);
                if (result != null) {
                    result = result.toString();
                }
                else {
                    result = "" + result;
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
        let actions = Npc.dialogue[player.dialogue][player.dialogueStage].options[data].action.split("_");
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
    Player.updateCharge(player);
    Inventory.update(player.inventory);
    Player.updateAttack(player);
    Rig.updateSwing(player);
};
// TODO p0: everything from here to loadProgress has not been checked
Player.updateCharge = function(player) {
    player.charging = false;
    if (player.hp == 0 || player.teleporting || player.dialogue != null) {
        return;
    }
    if (player.controls[DEFEND]) {
        return;
    }
    if (player.controls[ATTACK] && player.inventory.items[player.inventory.selectedItem] != ITEM_NULL && player.inventory.items[player.inventory.selectedItem].cooldown <= 0) {
        player.charging = true;
    }
};
Player.updateAttack = function(player) {
    if (player.hp == 0 || player.teleporting || player.dialogue != null) {
        player.chargeTime = 0;
        return;
    }
    player.heldItemAngle = player.controls[TARGET_ANGLE];
    if (player.controls[DEFEND]) {
        if (player.dashTime < -18) {
            player.dashX = cos(player.controls[TARGET_ANGLE]) * 200;
            player.dashY = sin(player.controls[TARGET_ANGLE]) * 200;
            player.dashTime = 2;
        }
        if (player.inventory.items[EQUIP_SHIELD] != ITEM_NULL) {
            player.heldItem = player.inventory.items[EQUIP_SHIELD].id;
        }
        else {
            player.heldItem = ITEM_NULL;
        }
        // player.heldItem = SHIELD;
        player.chargeTime = 0;
        return;
    }
    let selectedItem = player.inventory.items[player.inventory.selectedItem];
    if (selectedItem != ITEM_NULL) {
        player.heldItem = selectedItem.id;
    }
    else {
        player.heldItem = ITEM_NULL;
    }
    if (player.controls[ATTACK] && selectedItem != ITEM_NULL && selectedItem.cooldown <= 0 && player.attacks.length > 0) {
        if (Inventory.items[selectedItem.id].charge) {
            player.chargeTime += 1;
            if (player.chargeManaCost <= player.mana) {
                player.hp -= player.attackHpCost;
                if (player.attackHpCost > 0) {
                    player.hpRegenAcceleration = 0;
                }
                player.mana -= player.attackManaCost;
                if (player.attackManaCost > 0) {
                    player.manaRegenAcceleration = 0;
                }
                player.attackIndex = player.attackIndex % player.attacks.length;
                for (let i in player.attacks[player.attackIndex]) {
                    Rig.attacks[player.attacks[player.attackIndex][i].pattern](player, player.attacks[player.attackIndex][i].data);
                }
                player.attackIndex = (player.attackIndex + 1) % player.attacks.length;
                // player.inventory.items[player.inventory.selectedItem].cooldown = player.attacks.useTime;
                player.inventory.items[player.inventory.selectedItem].cooldown = player.attackCooldown;
                player.inventory.modifiedItems[player.inventory.selectedItem] = true;
            }
        }
        else {
            player.chargeTime = 0;
            if (player.attackManaCost <= player.mana) {
                player.hp -= player.attackHpCost;
                if (player.attackHpCost > 0) {
                    player.hpRegenAcceleration = 0;
                }
                player.mana -= player.attackManaCost;
                if (player.attackManaCost > 0) {
                    player.manaRegenAcceleration = 0;
                }
                player.attackIndex = player.attackIndex % player.attacks.length;
                for (let i in player.attacks[player.attackIndex]) {
                    Rig.attacks[player.attacks[player.attackIndex][i].pattern](player, player.attacks[player.attackIndex][i].data);
                }
                player.attackIndex = (player.attackIndex + 1) % player.attacks.length;
                // player.inventory.items[player.inventory.selectedItem].cooldown = player.attacks.useTime;
                player.inventory.items[player.inventory.selectedItem].cooldown = player.attackCooldown;
                // player.inventory.items[player.inventory.selectedItem].cooldown = 10 * 4;
                player.inventory.modifiedItems[player.inventory.selectedItem] = true;
            }
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
            for (let i in player.crystal[player.crystalIndex]) {
                Rig.attacks[player.crystal[player.crystalIndex][i].pattern](player, player.crystal[player.crystalIndex][i].data);
            }
            player.crystalIndex = (player.crystalIndex + 1) % player.crystal.length;
            // player.inventory.items[player.inventory.selectedItem].cooldown = player.crystal.useTime;
        }
    }
    else {
        player.chargeTime = 0;
    }
};
Player.updateStats = function(player) {
    let hp = player.hp;
    let hpMax = player.hpMax;
    let mana = player.mana;
    let manaMax = player.manaMax;

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
    player.projectileDamage = 0;
    player.projectileSpeed = 1;
    player.projectileRange = 1;
    player.projectileAccuracy = 0;
    player.projectileKnockback = 1;
    player.projectilePierce = 0;
    player.critChance = 0;
    player.critPower = 1;
    // player.critKnockback = 1;
    player.shieldDefense = 0;
    player.shieldDamageReduction = 0;
    player.shieldKnockbackResistance = 0;
    player.shieldBlockAngle = 0;
    player.shieldBlockChance = 0;
    player.shieldReflectionChance = 0;
    player.contactDamage = 0;
    player.contactEvents = [];
    player.contactKnockback = 1;
    
    player.attacks = [];
    player.attackIndex = 0;
    player.attackCooldown = 0;

    player.moveSpeed = 10;

    player.xpScale = 1;

    player.luck = 0;

    let damageType = null;
    if (player.inventory.items[player.inventory.selectedItem] != ITEM_NULL && Inventory.items[player.inventory.items[player.inventory.selectedItem].id].attacks != null) {
        player.attacks = Inventory.items[player.inventory.items[player.inventory.selectedItem].id].attacks;
    }
    let addEffect = function(item, type) {
        if (item == ITEM_NULL) {
            return;
        }
        if (Inventory.items[item.id].effects != null) {
            for (let j in Inventory.items[item.id].effects) {
                let effect = Inventory.items[item.id].effects[j];
                if (effect.type != type) {
                    continue;
                }
                let id = null;
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
    };
    for (let i = EFFECT_BASE; i <= EFFECT_MULTIPLICATIVE; i++) {
        addEffect(player.inventory.items[player.inventory.selectedItem], i);
        for (let j = EQUIP_HELMET; j >= EQUIP_ACCESSORY_2; j--) {
            addEffect(player.inventory.items[j], i);
        }
    }

    if (hp != 0) {
        player.hp = player.hpMax - (hpMax - hp);
        player.mana = player.manaMax - (manaMax - mana);
    
        if (player.hp < 0) {
            if (ENV.broadcastPlayerDeaths) {
                let deathMessages = ["<name1> became too weak.", "<name1> IS WEAK AND NOT SAFE.", "<name1> died to even more magic."];
                insertChat(deathMessages[Math.floor(Math.random() * deathMessages.length)].replaceAll("<name1>", player.name), "death");
            }
            Player.onDeath(player, null);
        }
    }
};
Player.onDeath = function(player, owner) {
    // TODO p2: owner is not a very good name?
    if (ENV.broadcastMonsterTaunts && owner != null && owner.type == MONSTER) {
        let tauntMessages = Monster.data[owner.monsterId].tauntMessages;
        insertChat(owner.name + ": " + tauntMessages[Math.floor(Math.random() * tauntMessages.length)].replaceAll("<name1>", player.name).replaceAll("<name2>", owner.name), "taunt");
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
        // TODO p0: add poise here
        player.invincibilityFrames = {};
        for (let i in player.effects) {
            Rig.effects[i].end(player);
        }
        player.effects = {};
        player.knockbackX = 0;
        player.knockbackY = 0;
        player.dashX = 0;
        player.dashY = 0;
        player.dashTime = 0;
        player.heldItem = ITEM_NULL;
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
            if (Entity.collideWithPoint(npc, player.controls.targetX, player.controls.targetY)) {
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
        let data = [];
        let stage = Npc.quest[player.quest].stages[player.questStage];
        let completed = true;
        if (stage.killMonsters != null) {
            for (let i in stage.killMonsters) {
                if (player.trackedData.quest.killMonsters[i] < stage.killMonsters[i]) {
                    completed = false;
                }
                data.push(player.trackedData.quest.killMonsters[i] || 0);
            }
        }
        if (stage.obtainItems != null) {
            for (let i in stage.obtainItems) {
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
    let array = criteria.split(":");
    for (let i in array) {
        if (array[i].substring(0, 2) == "xp") {
            if (array[i].substring(2, 4) == "<=") {
                let sections = array[i].split("<=");
                if (player.xp > Number(sections[1])) {
                    return false;
                }
            }
            else if (array[i].substring(2, 4) == ">=") {
                let sections = array[i].split(">=");
                if (player.xp < Number(sections[1])) {
                    return false;
                }
            }
            else if (array[i].substring(2, 4) == "==") {
                let sections = array[i].split("==");
                if (player.xp != Number(sections[1])) {
                    return false;
                }
            }
            else if (array[i].substring(2, 3) == "<") {
                let sections = array[i].split("<");
                if (player.xp >= Number(sections[1])) {
                    return false;
                }
            }
            else if (array[i].substring(2, 3) == ">") {
                let sections = array[i].split(">");
                if (player.xp <= Number(sections[1])) {
                    return false;
                }
            }
            continue;
        }
        let sections = array[i].split("_");
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
        for (let i = 0; i < criteria.quests.length; i++) {
            
        }
    }
    let array = criteria.split(":");
    for (let i in array) {
        if (array[i].substring(0, 2) == "xp") {
            continue;
        }
        let sections = array[i].split("_");
        switch (sections[0]) {
            default:
                break;
        }
    }
    return true;
};
Player.runTrigger = function(trigger) {
    let array = criteria.split(":");
    for (let i in array) {
        if (array[i].substring(0, 2) == "xp") {
            continue;
        }
        let sections = array[i].split("_");
        switch (sections[0]) {
            default:
                break;
        }
    }
    return true;
};
Player.saveProgress = function(player) {
    let progress = {};
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
Player.getClientData = function(player, overrideClient) {
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
        heldItem: player.heldItem,
        heldItemAngle: player.heldItemAngle,
        overrideHeldItem: player.swingTime >= 0,
        overrideClient: overrideClient,
        hp: player.hp,
        hpMax: player.hpMax,
        mana: player.mana,
        manaMax: player.manaMax,
        xp: player.xp,
        xpMax: player.xpMax,
        tick: player.tick,
    };
    return data;
};

Npc = function(npcId, x, y, layer, map) {
    let self = new Rig();
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
Npc.data = require("./../client/data/npcs.json");
Npc.dialogue = require("./../client/data/dialogue.json");
Npc.quest = require("./../client/data/quests.json");
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
        heldItem: npc.heldItem,
        heldItemAngle: npc.controls[TARGET_ANGLE],
    });
};
Npc.interact = function(npc, player) {
    for (let i in Npc.data[npc.name].rightClickEvents) {
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

Monster = function(monsterId, x, y, layer, map, spawnerType, spawner) {
    let self = new Rig();
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
        switch (Monster.data[self.monsterId].animationType) {
            case "directional2":
                self.animationType = DIRECTIONAL_2;
                break;
            case "directional4":
                self.animationType = DIRECTIONAL_4;
                break;
            case "directional8":
                self.animationType = DIRECTIONAL_8;
                break;
            case "nonDirectional":
                self.animationType = NON_DIRECTIONAL;
                break;
        }
        // TODO p2: delete comments
        // self.animationType = eval(Monster.data[self.monsterId].animationType);
        self.animationLength = Monster.data[self.monsterId].animationLength;
        self.animationSpeed = Monster.data[self.monsterId].animationSpeed;
        self.animationChangeBySpeed = Monster.data[self.monsterId].animationChangeBySpeed;
    }

    self.moveType = WANDER;

    self.spawnerType = spawnerType;
    self.spawner = spawner;
    if (spawnerType == AREA_SPAWNER) {
        if (Monster.density[spawner.map] == null) {
            Monster.density[spawner.map] = [];
        }
        if (Monster.density[spawner.map][spawner.y] == null) {
            Monster.density[spawner.map][spawner.y] = [];
        }
        if (Monster.density[spawner.map][spawner.y][spawner.x] == null) {
            Monster.density[spawner.map][spawner.y][spawner.x] = 0;
        }
        Monster.density[spawner.map][spawner.y][spawner.x] += 1;
    }

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
    self.circling = false;
    self.smartAim = -1;

    self.attackStage = 0;
    self.attackStageTime = 0;
    self.attack = 0;
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
Monster.density = [];
Monster.data = require("./../client/data/monsters.json");
// scientific name lol
Monster.init = function(monster) {
    Rig.init(monster);
    Monster.updateStats(monster);
};
Monster.update = function(monster) {
    Rig.update(monster);
    Monster.updateAI(monster);
    Monster.updateAttack(monster);
    Rig.updateSwing(monster);
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
        heldItem: monster.heldItem,
        heldItemAngle: monster.controls[TARGET_ANGLE],
        hp: monster.hp,
        hpMax: monster.hpMax,
    });
    Entity.addEntityDebug(monster, {
        id: monster.id,
        movePath: monster.movePath,
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
        let lowest = null;
        let lowestDistance = 0;
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
        if ((monster.pathfindCooldown <= 0 && (monster.target.gridX != monster.targetLastGridX || monster.target.gridY != monster.targetLastGridY)) || monster.movePath.length == monster.movePathIndex || (Entity.getDistance(monster, monster.target) < monster.circleDistance + TILE_SIZE != monster.circling)) {
            if (Entity.getDistance(monster, monster.target) < monster.circleDistance + TILE_SIZE) {
                // circling
                let angle = Math.atan2(monster.y - monster.target.y, monster.x - monster.target.x) * 180 / Math.PI;
                if (monster.circleDirection == CLOCKWISE) {
                    angle += 20;
                }
                else {
                    angle -= 20;
                }
                let x = Math.round(monster.target.x + cos(angle) * monster.circleDistance);
                let y = Math.round(monster.target.y + sin(angle) * monster.circleDistance);
                let changeDirection = false;
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
                    y = Math.round(monster.target.y + sin(angle) * monster.circleDistance);
                }
                monster.movePath = Rig.pathfind(monster, Math.floor(x / TILE_SIZE), Math.floor(y / TILE_SIZE));
                monster.circling = true;
            }
            else {
                monster.movePath = Rig.pathfind(monster, monster.target.gridX, monster.target.gridY);
                monster.circling = false;
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
        monster.attack = null;
        return;
    }
    monster.controls[TARGET_X] = monster.target.x;
    monster.controls[TARGET_Y] = monster.target.y;
    if (monster.smartAim == -1) {
        monster.controls[TARGET_ANGLE] = Math.atan2(monster.target.y - monster.y, monster.target.x - monster.x) * 180 / Math.PI;
    }
    else {
        let targetAngle = Math.atan2(monster.target.y - monster.y, monster.target.x - monster.x) * 180 / Math.PI;
        let targetAngleMultiplier = monster.target.x > monster.x ? 1 : -1;
        let targetSpeed = Math.sqrt(Math.pow(monster.target.speedX - monster.speedX, 2) + Math.pow(monster.target.speedY - monster.speedY, 2));
        let targetSpeedAngle = (180 - Math.atan2(monster.target.speedY - monster.speedY, monster.target.speedX - monster.speedX) * 180 / Math.PI + targetAngle) * targetAngleMultiplier;
        let projectileSpeed = Projectile.data[monster.smartAim].speed * monster.projectileSpeed;
        let projectileAngle = Math.asin(targetSpeed / projectileSpeed * sin(targetSpeedAngle)) * targetAngleMultiplier * 180 / Math.PI;
        if (isNaN(projectileAngle)) {
            projectileAngle = 0;
        }
        monster.controls[TARGET_ANGLE] = projectileAngle + targetAngle;
    }
    monster.attackTime += 1;
    if (monster.attack != null && monster.attackTime == monster.loopedAttacks[monster.attack].duration) {
        monster.attack = null;
    }
    if (monster.attack == null) {
        let totalWeight = 0;
        for (let i in monster.loopedAttacks) {
            totalWeight += monster.loopedAttacks[i].weight;
        }
        let attack = Math.floor(Math.random() * totalWeight);
        for (let i in monster.loopedAttacks) {
            totalWeight -= monster.loopedAttacks[i].weight;
            if (attack >= totalWeight) {
                monster.attack = i;
                monster.attackTime = 0;
                break;
            }
        }
    }
    if (monster.loopedAttacks[monster.attack].attacks[monster.attackTime] != null) {
        for (let i in monster.loopedAttacks[monster.attack].attacks[monster.attackTime]) {
            Rig.attacks[monster.loopedAttacks[monster.attack].attacks[monster.attackTime][i].pattern](monster, monster.loopedAttacks[monster.attack].attacks[monster.attackTime][i].data);
        }
    }
    for (let i in monster.randomAttacks) {
        if (Math.random() <= monster.randomAttacks[i].chance) {
            for (let j in monster.randomAttacks[i].attacks) {
                Rig.attacks[monster.randomAttacks[i].attacks[j].pattern](monster, monster.randomAttacks[i].attacks[j].data);
            }
        }
    }
    monster.attackStageTime += 1;
    switch (monster.endTrigger.type) {
        case "time":
            if (monster.attackStageTime >= monster.endTrigger.data.time) {
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
    monster.attackStageTime = 0;
    monster.attack = null;
    monster.attackTime = 0;
    Monster.updateStats(monster);
    for (let i in monster.startAttacks) {
        Rig.attacks[monster.startAttacks[i].pattern](monster, monster.startAttacks[i].data);
    }
};
Monster.updateStats = function(monster) {
    let data = Monster.data[monster.monsterId].stages[monster.attackStage];

    monster.hp = data.hp;
    monster.hpMax = data.hpMax;
    monster.hpRegen = data.hpRegen;
    monster.hpRegenSpeed = data.hpRegenSpeed;
    monster.hpRegenAccelerationRate = data.hpRegenAccelerationRate;
    monster.hpRegenAccelerationCap = data.hpRegenAccelerationCap;

    monster.defense = data.defense;
    monster.damageReduction = data.damageReduction;
    monster.knockbackResistance = data.knockbackResistance;
    monster.projectileDamage = data.projectileDamage;
    monster.projectileSpeed = data.projectileSpeed;
    monster.projectileRange = data.projectileRange;
    monster.projectileAccuracy = data.projectileAccuracy;
    monster.projectileKnockback = data.projectileKnockback;
    monster.projectilePierce = data.projectilePierce;
    monster.critChance = data.critChance;
    monster.critPower = data.critPower;
    monster.shieldDefense = data.shieldDefense;
    monster.shieldDamageReduction = data.shieldDamageReduction;
    monster.shieldKnockbackResistance = data.shieldKnockbackResistance;
    monster.shieldBlockAngle = data.shieldBlockAngle;
    monster.shieldReflectionChance = data.shieldReflectionChance;
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
Monster.onDeath = function(monster, owner) {
    if (owner != null && owner.type == PLAYER) {
        // spawn items
    }
    if (monster.spawnerType == SPAWNER) {
        spawners[monster.spawner].timer = Math.floor(Math.random() * ENV.monsterSpawnTime) + ENV.monsterSpawnTime;
    }
    else if (monster.spawnerType == AREA_SPAWNER) {
        Monster.density[monster.spawner.map][monster.spawner.y][monster.spawner.x] -= 1;
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

Projectile = function(projectileId, x, y, angle, owner, parent) {
    let self = new Entity();
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

    self.hitCollision = false;

    self.parent = parent;

    // directely use object as owner
    self.owner = owner;

    self.layer = owner.layer;
    self.map = owner.map;

    self.speedX = owner.speedX;
    self.speedY = owner.speedY;

    self.damage = owner.projectileDamage * Projectile.data[self.projectileId].damage;
    self.speed = owner.projectileSpeed * Projectile.data[self.projectileId].speed;
    self.range = owner.projectileRange * Projectile.data[self.projectileId].range;
    self.knockback = owner.projectileKnockback * Projectile.data[self.projectileId].knockback;
    self.pierce = owner.projectilePierce + Projectile.data[self.projectileId].pierce;
    self.critChance = owner.critChance + Projectile.data[self.projectileId].critChance;
    self.critPower = owner.critPower * Projectile.data[self.projectileId].critPower;

    self.animationStage = 0;
    self.animationSpeed = Projectile.data[self.projectileId].animationSpeed ?? 0;
    self.animationLength = Projectile.data[self.projectileId].animationLength ?? 0;
    self.animationPhase = 0;
    
    self.bouncy = Projectile.data[self.projectileId].bouncy;
    self.bounceChangeAngle = Projectile.data[self.projectileId].bounceChangeAngle;
    
    self.pattern = Projectile.data[self.projectileId].pattern;

    self.rangeTimer = 0;

    self.physicsInaccuracy = 4;

    self.firstTick = true;

    Projectile.init(self);
    return self;
};
Projectile.data = require("./../client/data/projectiles.json");
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
        for (let i in Projectile.data[projectile.projectileId].rangeEvents) {
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
        let [time, angle] = Projectile.collideWithMap(projectile, 0, 0, false);
        if (time != 0) {
            if (Projectile.data[projectile.projectileId].stickToCollision) {
                projectile.hitCollision = true;
                projectile.range = Projectile.data[projectile.projectileId].stickToCollisionTime;
            }
            else {
                Entity.delete(projectile);
                return;
            }
        }
    }
    else if (Projectile.data[projectile.projectileId].collision) {
        if (!projectile.hitCollision && Projectile.collisionStop(projectile)) {
            for (let i in Projectile.data[projectile.projectileId].collisionEvents) {
                Projectile.collisionEvents[Projectile.data[projectile.projectileId].collisionEvents[i].type](projectile, Projectile.data[projectile.projectileId].collisionEvents[i].data);
            }
            if (Projectile.data[projectile.projectileId].stickToCollision) {
                projectile.hitCollision = true;
                projectile.range = Projectile.data[projectile.projectileId].stickToCollisionTime;
            }
            else {
                Entity.delete(projectile);
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
    // console.log("wow added entity " + projectile.x + " " + projectile.y)
    let parent = projectile.parent;
    if (projectile.parent != null) {
        parent = projectile.parent.id;
    }
    Projectile.addEntity(projectile, {
        id: projectile.id,
        projectileId: projectile.projectileId,
        type: PROJECTILE,
        x: projectile.x,
        y: projectile.y,
        layer: projectile.layer,
        angle: projectile.angle,
        parent: parent,
        animationStage: Math.floor(projectile.animationStage),
        animationPhase: projectile.animationPhase,
    });
};
Projectile.updateCollisions = function(projectile) {
    let speedX = projectile.x - projectile.lastX;
    let speedY = projectile.y - projectile.lastY;
    if (projectile.owner.type == MONSTER || ENV.playerFriendlyFire) {
        Entity.searchHitboxChunks(Player.chunks, projectile.x, projectile.y, projectile.collisionBoxWidth, projectile.collisionBoxHeight, projectile.map, function(rig) {
            if (rig.id == projectile.owner.id) {
                return;
            }
            if (rig.layer > projectile.layer) {
                return;
            }
            if (rig.inSafeRegion || rig.hp == 0 || rig.teleporting || rig.loading || rig.dialogue != null) {
                return;
            }
            let [time, angle] = Projectile.collideWithEntity(projectile, rig);
            if (time != 0) {
                projectile.layer = rig.layer;
                projectile.x -= time * speedX;
                projectile.y -= time * speedY;
                Rig.onDamage(rig, projectile, DAMAGE_PROJECTILE);
                projectile.x += time * speedX;
                projectile.y += time * speedY;
                if (projectile.pierce == -1) {
                    return true;
                }
            }
        });
        if (projectile.pierce == -1) {
            return true;
        }
    }
    if (projectile.owner.type == PLAYER || ENV.monsterFriendlyFire) {
        Entity.searchHitboxChunks(Monster.chunks, projectile.x, projectile.y, projectile.collisionBoxWidth, projectile.collisionBoxHeight, projectile.map, function(rig) {
            if (rig.id == projectile.owner.id) {
                return;
            }
            if (rig.layer > projectile.layer) {
                return;
            }
            if (rig.inSafeRegion || rig.hp == 0 || rig.teleporting) {
                return;
            }
            let [time, angle] = Projectile.collideWithEntity(projectile, rig);
            if (time != 0) {
                projectile.layer = rig.layer;
                projectile.x -= time * speedX;
                projectile.y -= time * speedY;
                Rig.onDamage(rig, projectile, DAMAGE_PROJECTILE);
                projectile.x += time * speedX;
                projectile.y += time * speedY;
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
};
Projectile.addEntity = function(projectile, data) {
    for (let y = Math.floor((projectile.y - projectile.collisionBoxHeight / 2) / CHUNK_SIZE); y < Math.ceil((projectile.y + projectile.collisionBoxHeight / 2) / CHUNK_SIZE); y++) {
        if (entityPack[projectile.map][y] == null) {
            entityPack[projectile.map][y] = [];
        }
        for (let x = Math.floor((projectile.x - projectile.collisionBoxWidth / 2) / CHUNK_SIZE); x < Math.ceil((projectile.x + projectile.collisionBoxWidth / 2) / CHUNK_SIZE); x++) {
            if (entityPack[projectile.map][y][x] == null) {
                entityPack[projectile.map][y][x] = [];
            }
            entityPack[projectile.map][y][x].push(data);
        }
    }
};
Projectile.bounce = function(projectile, angle) {
    let cosAngle = cos(angle);
    let sinAngle = sin(angle);
    let bounceX = projectile.speedX * cosAngle + projectile.speedY * sinAngle;
    let bounceY = projectile.speedY * cosAngle - projectile.speedX * sinAngle;
    projectile.speedX = -bounceX * cosAngle - bounceY * sinAngle;
    projectile.speedY = bounceY * cosAngle - bounceX * sinAngle;
};
Projectile.collisionStop = function(projectile) {
    projectile.angle = 45;
    // projectile.angle = 0;
    Projectile.updateAngle(projectile);
    let max = Math.ceil(Math.max(Math.abs(projectile.speedX), Math.abs(projectile.speedY)) / projectile.physicsInaccuracy / ENV.physicsInaccuracy);
    max = 1;
    if (max != 0) {
        let speedX = projectile.speedX / max;
        let speedY = projectile.speedY / max;
        for (let i = 0; i < max; i += 1) {
            projectile.lastX = projectile.x;
            projectile.lastY = projectile.y;
            projectile.x += speedX;
            projectile.y += speedY;
            projectile.gridX = Math.floor(projectile.x / TILE_SIZE);
            projectile.gridY = Math.floor(projectile.y / TILE_SIZE);
            // TODO p0: slide is borken, it needs to do each axis seperately
            let [time, angle] = Projectile.collideWithMap(projectile, speedX, speedY, false);
            if (time != 0) {
                if (projectile.bouncy || true) {
                    // projectile.bounceTime = time;
                    // projectile.bounceAngle = angle;
                    // FIX?
                    Projectile.bounce(projectile, angle);
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
Projectile.collideWithEntity = function(projectile, entity) {
    let speedX = projectile.x - projectile.lastX;
    let speedY = projectile.y - projectile.lastY;
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
    if (!(projectile.x - projectile.collisionBoxWidth / 2 < entity.x + entity.width / 2 && projectile.x + projectile.collisionBoxWidth / 2 > entity.x - entity.width / 2 && projectile.y - projectile.collisionBoxHeight / 2 < entity.y + entity.height / 2 && projectile.y + projectile.collisionBoxHeight / 2 > entity.y - entity.height / 2)) {
        return [0, 0];
    }
    let distanceX = (projectile.x + projectile.collisionBoxWidth / 2 * signX) - (entity.x - entity.width / 2 * signX);

    if (distanceX * signX > 0 && Math.abs(projectile.y - distanceX / speedX * speedY - (projectile.height / 2 * projectile.cosAngle * signSin - projectile.width / 2 * projectile.sinAngle * signCos) * signX - entity.y) < entity.height / 2) {

    // if (distanceX * signX > 0 && distanceLastX * signX <= 0 && Math.abs(projectile.y - distanceX / speedX * speedY - (projectile.height / 2 * projectile.cosAngle * signSin - projectile.width / 2 * projectile.sinAngle * signCos) * signX - collision.y) < collision.height / 2) {
        return [distanceX / speedX, 0];
    }

    let distanceY = (projectile.y + projectile.collisionBoxHeight / 2 * signY) - (entity.y - entity.height / 2 * signY);

    if (distanceY * signY > 0 && Math.abs(projectile.x - distanceY / speedY * speedX + (projectile.width / 2 * projectile.cosAngle * signSin - projectile.height / 2 * projectile.sinAngle * signCos) * signY - entity.x) < entity.width / 2) {
        return [distanceY / speedY, 90];
    }
    
    let distanceX2 = (projectile.x * projectile.cosAngle + projectile.y * projectile.sinAngle + projectile.width / 2 * signX2) - (entity.x * projectile.cosAngle + entity.y * projectile.sinAngle - (Math.abs(entity.width / 2 * projectile.cosAngle) + Math.abs(entity.height / 2 * projectile.sinAngle)) * signX2);

    if (distanceX2 * signX2 > 0 && Math.abs((projectile.y - distanceX2 / speedX2 * speedY) * projectile.cosAngle - (projectile.x - distanceX2 / speedX2 * speedX) * projectile.sinAngle - (entity.y * projectile.cosAngle - entity.x * projectile.sinAngle - (entity.height / 2 * projectile.cosAngle * signSin - entity.width / 2 * projectile.sinAngle * signCos) * signX2)) < projectile.height / 2) {
        return [distanceX2 / speedX2, projectile.angle];
    }

    let distanceY2 = (projectile.y * projectile.cosAngle - projectile.x * projectile.sinAngle + projectile.height / 2 * signY2) - (entity.y * projectile.cosAngle - entity.x * projectile.sinAngle - (Math.abs(entity.height / 2 * projectile.cosAngle) + Math.abs(entity.width / 2 * projectile.sinAngle)) * signY2);
    
    if (distanceY2 * signY2 > 0 && Math.abs((projectile.x - distanceY2 / speedY2 * speedX) * projectile.cosAngle + (projectile.y - distanceY2 / speedY2 * speedY) * projectile.sinAngle - (entity.x * projectile.cosAngle + entity.y * projectile.sinAngle + (entity.width / 2 * projectile.cosAngle * signSin - entity.height / 2 * projectile.sinAngle * signCos) * signY2)) < projectile.width / 2) {
        return [distanceY2 / speedY2, projectile.angle + 90];
    }
    return [0, 0];
};
Projectile.collideWithMap = function(projectile, speedX, speedY, slide) {
    if (collisions[projectile.map] == null || collisions[projectile.map][projectile.layer] == null) {
        return [0, 0];
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
    for (let y = Math.floor((projectile.y - projectile.collisionBoxHeight / 2) / TILE_SIZE); y < Math.ceil((projectile.y + projectile.collisionBoxHeight / 2) / TILE_SIZE); y++) {
        if (collisions[projectile.map][projectile.layer][y] == null) {
            continue;
        }
        for (let x = Math.floor((projectile.x - projectile.collisionBoxWidth / 2) / TILE_SIZE); x < Math.ceil((projectile.x + projectile.collisionBoxWidth / 2) / TILE_SIZE); x++) {
            if (collisions[projectile.map][projectile.layer][y][x] == null) {
                continue;
            }
            for (let i in collisions[projectile.map][projectile.layer][y][x]) {
                let collision = collisions[projectile.map][projectile.layer][y][x][i];
                if (collision.slowdown || !collision.collideWithProjectile) {
                    continue;
                }
                // TODO: remove comments
                // if (projectile.x - projectile.collisionBoxWidth / 2 < collision.x + collision.width / 2 && projectile.x + projectile.collisionBoxWidth / 2 > collision.x - collision.width / 2 && projectile.y - projectile.collisionBoxHeight / 2 < collision.y + collision.height / 2 && projectile.y + projectile.collisionBoxHeight / 2 > collision.y - collision.height / 2) {
                    // WHAT DO I NAME THE letIABLES BUH
                    let distanceX = (projectile.x + projectile.collisionBoxWidth / 2 * signX) - (collision.x - collision.width / 2 * signX);
                    let distanceLastX = (projectile.lastX + projectile.collisionBoxWidth / 2 * signX) - (collision.x - collision.width / 2 * signX);

                    if (distanceX * signX > 0 && distanceLastX * signX <= 0 && Math.abs(projectile.y - distanceX / speedX * speedY - (projectile.height / 2 * projectile.cosAngle * signSin - projectile.width / 2 * projectile.sinAngle * signCos) * signX - collision.y) < collision.height / 2) {
                        maxDistanceX = Math.max(maxDistanceX, distanceX * signX);
                        continue;
                    }

                    let distanceY = (projectile.y + projectile.collisionBoxHeight / 2 * signY) - (collision.y - collision.height / 2 * signY);
                    let distanceLastY = (projectile.lastY + projectile.collisionBoxHeight / 2 * signY) - (collision.y - collision.height / 2 * signY);

                    if (distanceY * signY > 0 && distanceLastY * signY <= 0 && Math.abs(projectile.x - distanceY / speedY * speedX + (projectile.width / 2 * projectile.cosAngle * signSin - projectile.height / 2 * projectile.sinAngle * signCos) * signY - collision.x) < collision.width / 2) {
                        maxDistanceY = Math.max(maxDistanceY, distanceY * signY);
                        continue;
                    }
                    
                    let distanceX2 = (projectile.x * projectile.cosAngle + projectile.y * projectile.sinAngle + projectile.width / 2 * signX2) - (collision.x * projectile.cosAngle + collision.y * projectile.sinAngle - (Math.abs(collision.width / 2 * projectile.cosAngle) + Math.abs(collision.height / 2 * projectile.sinAngle)) * signX2);
                    let distanceLastX2 = (projectile.lastX * projectile.cosAngle + projectile.lastY * projectile.sinAngle + projectile.width / 2 * signX2) - (collision.x * projectile.cosAngle + collision.y * projectile.sinAngle - (Math.abs(collision.width / 2 * projectile.cosAngle) + Math.abs(collision.height / 2 * projectile.sinAngle)) * signX2);

                    if (distanceX2 * signX2 > 0 && distanceLastX2 * signX2 <= 0 && Math.abs((projectile.y - distanceX2 / speedX2 * speedY) * projectile.cosAngle - (projectile.x - distanceX2 / speedX2 * speedX) * projectile.sinAngle - (collision.y * projectile.cosAngle - collision.x * projectile.sinAngle - (collision.height / 2 * projectile.cosAngle * signSin - collision.width / 2 * projectile.sinAngle * signCos) * signX2)) < projectile.height / 2) {
                        maxDistanceX2 = Math.max(maxDistanceX2, distanceX2 * signX2);
                        continue;
                    }

                    let distanceY2 = (projectile.y * projectile.cosAngle - projectile.x * projectile.sinAngle + projectile.height / 2 * signY2) - (collision.y * projectile.cosAngle - collision.x * projectile.sinAngle - (Math.abs(collision.height / 2 * projectile.cosAngle) + Math.abs(collision.width / 2 * projectile.sinAngle)) * signY2);
                    let distanceLastY2 = (projectile.lastY * projectile.cosAngle - projectile.lastX * projectile.sinAngle + projectile.height / 2 * signY2) - (collision.y * projectile.cosAngle - collision.x * projectile.sinAngle - (Math.abs(collision.height / 2 * projectile.cosAngle) + Math.abs(collision.width / 2 * projectile.sinAngle)) * signY2);
                    
                    if (distanceY2 * signY2 > 0 && distanceLastY2 * signY2 <= 0 && Math.abs((projectile.x - distanceY2 / speedY2 * speedX) * projectile.cosAngle + (projectile.y - distanceY2 / speedY2 * speedY) * projectile.sinAngle - (collision.x * projectile.cosAngle + collision.y * projectile.sinAngle + (collision.width / 2 * projectile.cosAngle * signSin - collision.height / 2 * projectile.sinAngle * signCos) * signY2)) < projectile.width / 2) {
                        maxDistanceY2 = Math.max(maxDistanceY2, distanceY2 * signY2);
                        continue;
                    }
                // }
            }
        }
    }
    // console.log(maxDistanceX, maxDistanceY, maxDistanceX2, maxDistanceY2)
    if (maxDistanceX > 0 || maxDistanceY > 0 || maxDistanceX2 > 0 || maxDistanceY2 > 0) {
        // TODO: collision buffer?
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
            return [max, 0];
        }
        else if (max == timeY) {
            return [max, 90];
        }
        else if (max == timeX2) {
            return [max, projectile.angle];
        }
        else {
            return [max, projectile.angle + 90];
        }
    }
    return [0, 0];
};
Projectile.patterns = [];
Projectile.patternData = {
    spin: {
        start: function(projectile, data) {
        },
        during: function(projectile, data) {
            projectile.angle += data.speed;
            Projectile.updateAngle(projectile);
        },
    },
    swing: {
        start: function(projectile, data) {
            projectile.startAngle = projectile.angle;
            let angle = projectile.startAngle - data.angle + data.offsetAngle;
            projectile.x = projectile.parent.x + data.offsetX * cos(angle) + data.offsetY * sin(angle);
            projectile.y = projectile.parent.y + data.offsetX * sin(angle) - data.offsetY * cos(angle);
            projectile.speedX = 0;
            projectile.speedY = 0;
            projectile.angle = angle;
            Projectile.updateAngle(projectile);
        },
        during: function(projectile, data) {
            let angle = projectile.startAngle - data.angle + projectile.rangeTimer / projectile.range * data.angle * 2 + data.offsetAngle;
            projectile.speedX = projectile.parent.x + data.offsetX * cos(angle) + data.offsetY * sin(angle) - projectile.x;
            projectile.speedY = projectile.parent.y + data.offsetX * sin(angle) - data.offsetY * cos(angle) - projectile.y;
            // projectile.speedX = 0;
            // projectile.speedY = 0;
            // let angle = 60 - Math.pow(0.8, projectile.rangeTimer) * 120;
            // // let angle = -60 + (40 - projectile.range) * 120;
            // console.log(angle)
            // projectile.x = projectile.parent.x + projectile.width / 2 * cos(angle);
            // projectile.y = projectile.parent.y + projectile.width / 2 * sin(angle);
            projectile.angle = angle;
            Projectile.updateAngle(projectile);
        },
    },
    sin: {
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
            let x = (projectile.x - projectile.startX) * projectile.startCosAngle + (projectile.y - projectile.startY) * projectile.startSinAngle;
            projectile.angle = projectile.startAngle + cos(x / data.speed) * data.magnitude;
            Projectile.updateAngle(projectile);
            projectile.speedX += projectile.speed * projectile.cosAngle;
            projectile.speedY += projectile.speed * projectile.sinAngle;
        },
    },
    homingWeak: {
        start: function(projectile, data) {
        },
        during: function(projectile, data) {
            projectile.angle += 25;
            let target = null;
            let targetDistance = null;
            Entity.searchChunks(Monster.chunks, projectile.chunkX, projectile.chunkY, projectile.map, 2, function(monster) {
                let distanceSquared = Entity.getDistanceSquared(projectile, monster);
                if (target == null || distanceSquared < targetDistance) {
                    target = monster;
                    distanceSquared = targetDistance;
                }
            });
            if (target != null) {
                let angle = Math.atan2(target.y - projectile.y, target.x - projectile.x) * 180 / Math.PI;
                projectile.speedX = projectile.speedX * 0.9 + cos(angle) * projectile.speed * 0.1;
                projectile.speedY = projectile.speedY * 0.9 + sin(angle) * projectile.speed * 0.1;
            }
            Projectile.updateAngle(projectile);
        },
    },
};
for (let i in Projectile.patternData) {
    Projectile.patterns.push(Projectile.patternData[i]);
    Projectile.patterns[Projectile.patterns.length - 1].id = i;
}
Projectile.parsePattern = function(pattern) {
    for (let i = 0; i < Projectile.patterns.length; i++) {
        if (Projectile.patterns[i].id == pattern.type) {
            pattern.type = i;
            return;
        }
    }
};
Projectile.contactEvents = [];
Projectile.contactEventData = {
    explosion: {
        event: function(rig1, projectile, data) {
            Rig.areaEffect(projectile.x, projectile.y, projectile.map, data.diameter, projectile.owner.type, function(rig) {
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
    areaEffect: {
        event: function(rig1, projectile, data) {
            Rig.areaEffect(projectile.x, projectile.y, projectile.map, data.diameter, projectile.owner.type, function(rig) {
                if (rig1.layer != rig.layer) {
                    return;
                }
                if (rig.inSafeRegion || rig.hp == 0 || rig.teleporting || rig.loading || rig.dialogue != null) {
                    return;
                }
                let distanceX = Math.max(Math.abs(rig.x - projectile.x) - data.diameter / 2, 0);
                let distanceY = Math.max(Math.abs(rig.y - projectile.y) - data.diameter / 2, 0);
                let distance = Math.sqrt(Math.pow(distanceX, 2) + Math.pow(distanceY, 2));
                if (distance > data.diameter / 2) {
                    return;
                }
                Rig.addEffect(rig, data.effect, data.duration);
            });
        },
    },
    particle: {
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
};
for (let i in Projectile.contactEventData) {
    Projectile.contactEvents.push(Projectile.contactEventData[i]);
    Projectile.contactEvents[Projectile.contactEvents.length - 1].id = i;
}
Projectile.parseContactEvent = function(event) {
    for (let i = 0; i < Projectile.contactEvents.length; i++) {
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
//         Rig.areaEffect(projectile.x, projectile.y, projectile.map, data.diameter, projectile.owner.type, function(rig) {
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
//         Rig.areaEffect(projectile.x, projectile.y, projectile.map, data.diameter, projectile.owner.type, function(rig) {
//             if (projectile.layer != rig.layer) {
//                 return;
//             }
//             if (rig.inSafeRegion || rig.hp == 0 || rig.teleporting || rig.loading || rig.dialogue != null) {
//                 return;
//             }
//             let distanceX = Math.max(Math.abs(rig.x - projectile.x) - data.diameter / 2, 0);
//             let distanceY = Math.max(Math.abs(rig.y - projectile.y) - data.diameter / 2, 0);
//             let distance = Math.sqrt(Math.pow(distanceX, 2) + Math.pow(distanceY, 2));
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
Projectile.collisionEvents = [];
Projectile.collisionEventData = {
    explosion: {
        event: function(projectile, data) {
            Rig.areaEffect(projectile.x, projectile.y, projectile.map, data.diameter, projectile.owner.type, function(rig) {
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
    areaEffect: {
        event: function(projectile, data) {
            Rig.areaEffect(projectile.x, projectile.y, projectile.map, data.diameter, projectile.owner.type, function(rig) {
                if (projectile.layer != rig.layer) {
                    return;
                }
                if (rig.inSafeRegion || rig.hp == 0 || rig.teleporting || rig.loading || rig.dialogue != null) {
                    return;
                }
                let distanceX = Math.max(Math.abs(rig.x - projectile.x) - data.diameter / 2, 0);
                let distanceY = Math.max(Math.abs(rig.y - projectile.y) - data.diameter / 2, 0);
                let distance = Math.sqrt(Math.pow(distanceX, 2) + Math.pow(distanceY, 2));
                if (distance > data.diameter / 2) {
                    return;
                }
                Rig.addEffect(rig, data.effect, data.duration);
            });
        },
    },
    particle: {
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
};
for (let i in Projectile.collisionEventData) {
    Projectile.collisionEvents.push(Projectile.collisionEventData[i]);
    Projectile.collisionEvents[Projectile.collisionEvents.length - 1].id = i;
}
Projectile.parseCollisionEvent = function(event) {
    for (let i = 0; i < Projectile.collisionEvents.length; i++) {
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

let sinCache = new Map();
let sin = function(angle) {
    return sinCache.has(angle) ? sinCache.get(angle) : sinCache.set(angle, Math.sin(angle / 180 * Math.PI)).get(angle);
};
let cos = function(angle) {
    return sinCache.has(angle + 90) ? sinCache.get(angle + 90) : sinCache.set(angle + 90, Math.cos(angle / 180 * Math.PI)).get(angle + 90);
};
let dot = function(x1, y1, x2, y2) {
    return x1 * x2 + y1 * y2;
};
let cross = function(x1, y1, x2, y2, x3, y3) {
    return (x2 - x1) * (y3 - y1) - (y2 - y1) * (x3 - x1);
};

for (let i in Npc.data) {
    for (let j in Npc.data[i].rightClickEvents) {
        // Player.parseCriteria(Npc.data[i].rightClickEvents[j]);
    }
}
for (let i in Monster.data) {
    for (let j in Monster.data[i].stages) {
        for (let k in Monster.data[i].stages[j].contactEvents) {
            Rig.parseContactEvent(Monster.data[i].stages[j].contactEvents[k]);
        }
        for (let k in Monster.data[i].stages[j].startAttacks) {
            for (let l in Monster.data[i].stages[j].startAttacks[k].attacks) {
                Rig.parseAttack(Monster.data[i].stages[j].startAttacks[k].attacks[l]);
            }
        }
        for (let k in Monster.data[i].stages[j].loopedAttacks) {
            for (let l in Monster.data[i].stages[j].loopedAttacks[k].attacks) {
                for (let m in Monster.data[i].stages[j].loopedAttacks[k].attacks[l]) {
                    Rig.parseAttack(Monster.data[i].stages[j].loopedAttacks[k].attacks[l][m]);
                }
            }
        }
        for (let k in Monster.data[i].stages[j].randomAttacks) {
            for (let l in Monster.data[i].stages[j].randomAttacks[k].attacks) {
                Rig.parseAttack(Monster.data[i].stages[j].randomAttacks[k].attacks[l]);
            }
        }
    }
}
for (let i in Projectile.data) {
    if (Projectile.data[i].pattern != null) {
        Projectile.parsePattern(Projectile.data[i].pattern);
    }
    for (let j in Projectile.data[i].contactEvents) {
        Projectile.parseContactEvent(Projectile.data[i].contactEvents[j]);
    }
    for (let j in Projectile.data[i].collisionEvents) {
        Projectile.parseCollisionEvent(Projectile.data[i].collisionEvents[j]);
    }
    for (let j in Projectile.data[i].rangeEvents) {
        Projectile.parseCollisionEvent(Projectile.data[i].rangeEvents[j]);
    }
}
for (let i in Inventory.items) {
    if (Inventory.items[i].attacks != null) {
        for (let j in Inventory.items[i].attacks) {
            for (let k in Inventory.items[i].attacks[j]) {
                Rig.parseAttack(Inventory.items[i].attacks[j][k]);
            }
        }
    }
}
for (let i in Rig.attacks) {
    Rig.attacks[i] = Rig.attacks[i].attack;
}
for (let i in Monster.contactEvents) {
    Monster.contactEvents[i] = Monster.contactEvents[i].event;
}
for (let i in Projectile.contactEvents) {
    Projectile.contactEvents[i] = Projectile.contactEvents[i].event;
}
for (let i in Projectile.collisionEvents) {
    Projectile.collisionEvents[i] = Projectile.collisionEvents[i].event;
}