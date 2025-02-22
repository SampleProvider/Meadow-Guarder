collisions = [];
pathfindCollisions = [];
slopes = [];
teleporters = [];
regions = [];
spawners = [];
areaSpawners = [];
layers = [];

regionData = require("./../client/maps/regions.json");
regionSafety = [];

tileset = [];
loadTileset = function() {
    // let data = Bun.file("./client/maps/tileset.tsx").text();
    let data = JSON.parse(fs.readFileSync("./client/maps/tileset.json"));
    for (let i = 0; i < data.tiles.length; i++) {
        tileset[data.tiles[i].id] = {};
        if (data.tiles[i].objectgroup != null) {
            tileset[data.tiles[i].id].collisions = [];
            for (let j = 0; j < data.tiles[i].objectgroup.objects.length; j++) {
                let collision = {
                    x: data.tiles[i].objectgroup.objects[j].x * TILE_SIZE / 16 + data.tiles[i].objectgroup.objects[j].width * TILE_SIZE / 16 / 2,
                    y: data.tiles[i].objectgroup.objects[j].y * TILE_SIZE / 16 + data.tiles[i].objectgroup.objects[j].height * TILE_SIZE / 16 / 2,
                    width: data.tiles[i].objectgroup.objects[j].width * TILE_SIZE / 16,
                    height: data.tiles[i].objectgroup.objects[j].height * TILE_SIZE / 16,
                    slowdown: false,
                    collideWithProjectile: true,
                };
                if (data.tiles[i].objectgroup.objects[j].properties != null) {
                    for (let k = 0; k < data.tiles[i].objectgroup.objects[j].properties.length; k++) {
                        if (data.tiles[i].objectgroup.objects[j].properties[k].name == "Slowdown") {
                            collision.slowdown = data.tiles[i].objectgroup.objects[j].properties[k].value;
                        }
                        if (data.tiles[i].objectgroup.objects[j].properties[k].name == "Collide With Projectile") {
                            collision.collideWithProjectile = data.tiles[i].objectgroup.objects[j].properties[k].value;
                        }
                    }
                }
                tileset[data.tiles[i].id].collisions.push(collision);
            }
        }
    }
};

loadMap = function(index) {
    let data = JSON.parse(fs.readFileSync("./client/maps/" + maps[index] + ".json"));
    collisions[index] = [];
    pathfindCollisions[index] = [];
    slopes[index] = [];
    teleporters[index] = [];
    regions[index] = [];
    areaSpawners[index] = [];
    layers[index] = [];
    for (let i = 0; i < data.layers.length; i++) {
        let array = data.layers[i].name.split(":");
        // if (array.length == 1) {
        //     continue;
        // }
        if (data.layers[i].name.startsWith("Slope")) {
            let layer = Number(array[1]);
            let slopeLayer = Number(array[2]);
            slopes[index][layer] = [];
            for (let j = 0; j < data.layers[i].chunks.length; j++) {
                let chunk = data.layers[i].chunks[j];
                for (let k = 0; k < chunk.data.length; k++) {
                    let id = chunk.data[k] - 1;
                    if (id == -1) {
                        continue;
                    }
                    if (slopes[index][layer][chunk.y + Math.floor(k / 16)] == null) {
                        slopes[index][layer][chunk.y + Math.floor(k / 16)] = [];
                    }
                    slopes[index][layer][chunk.y + Math.floor(k / 16)][chunk.x + k % 16] = slopeLayer * 5 + id - 5026;
                }
            }
            // for (let j = 0; j < data.layers[i].chunks.length; j++) {
            //     for (let k = 0; k < data.layers[i].chunks[j].data.length; k++) {
            //         if (data.layers[i].chunks[j].data[k] == 0) {
            //             continue;
            //         }
            //         if (slopes[index][layer][data.layers[i].chunks[j].y + Math.floor(k / 16)] == null) {
            //             slopes[index][layer][data.layers[i].chunks[j].y + Math.floor(k / 16)] = [];
            //         }
            //         slopes[index][layer][data.layers[i].chunks[j].y + Math.floor(k / 16)][data.layers[i].chunks[j].x + k % 16] = slopeLayer * 5 + data.layers[i].chunks[j].data[k] - 5027;
            //     }
            // }
        }
        else if (data.layers[i].name.startsWith("Teleporter")) {
            let layer = Number(array[1]);
            let teleportX = Number(array[2]);
            let teleportY = Number(array[3]);
            let teleportLayer = Number(array[4]);
            let teleportMap = array[5];
            for (let j = 0; j < maps.length; j++) {
                if (maps[j] == teleportMap) {
                    teleportMap = j;
                    break;
                }
            }
            if (teleporters[index][layer] == null) {
                teleporters[index][layer] = [];
            }
            for (let j = 0; j < data.layers[i].chunks.length; j++) {
                let chunk = data.layers[i].chunks[j];
                for (let k = 0; k < chunk.data.length; k++) {
                    if (teleporters[index][layer][chunk.y + Math.floor(k / 16)] == null) {
                        teleporters[index][layer][chunk.y + Math.floor(k / 16)] = [];
                    }
                    teleporters[index][layer][chunk.y + Math.floor(k / 16)][chunk.x + k % 16] = (chunk.data[k] == 0) ? null : { direction: chunk.data[k] - 4961, x: teleportX * TILE_SIZE + TILE_SIZE / 2, y: teleportY * TILE_SIZE + TILE_SIZE / 2, layer: teleportLayer, map: teleportMap };
                }
            }
        }
        else if (data.layers[i].name.startsWith("Region")) {
            let region = array[1];
            for (let j = 0; j < regionData.length; j++) {
                if (regionData[j][0] == region) {
                    region = j;
                    break;
                }
            }
            console.log(region)
            regionSafety[region] = array[2] == "safe";
            for (let j = 0; j < data.layers[i].chunks.length; j++) {
                let chunk = data.layers[i].chunks[j];
                for (let k = 0; k < chunk.data.length; k++) {
                    if (regions[index][chunk.y + Math.floor(k / 16)] == null) {
                        regions[index][chunk.y + Math.floor(k / 16)] = [];
                    }
                    if (chunk.data[k] != 0) {
                        regions[index][chunk.y + Math.floor(k / 16)][chunk.x + k % 16] = region;
                    }
                }
            }
        }
        else if (data.layers[i].name.startsWith("Npc")) {
            let layer = Number(array[1]);
            let npcId = array[2];
            for (let j = 0; j < Npc.data.length; j++) {
                if (Npc.data[j].id == npcId) {
                    npcId = j;
                    break;
                }
            }
            for (let j = 0; j < data.layers[i].chunks.length; j++) {
                let chunk = data.layers[i].chunks[j];
                for (let k = 0; k < chunk.data.length; k++) {
                    if (chunk.data[k] != 0) {
                        new Npc(npcId, (chunk.x + k % 16) * TILE_SIZE + TILE_SIZE / 2, (chunk.y + Math.floor(k / 16)) * TILE_SIZE + TILE_SIZE / 2, layer, index);
                    }
                }
            }
        }
        else if (data.layers[i].name.startsWith("Spawner")) {
            let layer = Number(array[1]);
            // let timer = Number(array[2]);
            let monsters = [];
            let totalWeight = 0;
            for (let j = 2; j < array.length; j += 2) {
                let weight = Number(array[j + 1]);
                for (let k = 0; k < Monster.data.length; k++) {
                    if (Monster.data[k].id == array[j]) {
                        monsters.push({
                            id: k,
                            weight: weight,
                        });
                        totalWeight += weight;
                        break;
                    }
                }
            }
            for (let j = 0; j < data.layers[i].chunks.length; j++) {
                let chunk = data.layers[i].chunks[j];
                for (let k = 0; k < chunk.data.length; k++) {
                    if (chunk.data[k] != 0) {
                        spawners.push({
                            x: chunk.x + k % 16,
                            y: chunk.y + Math.floor(k / 16),
                            layer: layer,
                            map: index,
                            timer: 1,
                            monsters: monsters,
                            totalWeight: totalWeight,
                        });
                    }
                }
            }
        }
        else if (data.layers[i].name.startsWith("AreaSpawner")) {
            let density = Number(array[1]);
            let monsters = [];
            let totalWeight = 0;
            for (let j = 2; j < array.length; j += 2) {
                let weight = Number(array[j + 1]);
                for (let k = 0; k < Monster.data.length; k++) {
                    if (Monster.data[k].id == array[j]) {
                        monsters.push({
                            id: k,
                            weight: weight,
                        });
                        totalWeight += weight;
                        break;
                    }
                }
            }
            for (let j = 0; j < data.layers[i].chunks.length; j++) {
                let chunk = data.layers[i].chunks[j];
                for (let k = 0; k < chunk.data.length; k++) {
                    if (chunk.data[k] != 0) {
                        areaSpawners[index].push({
                            x: chunk.x + k % 16,
                            y: chunk.y + Math.floor(k / 16),
                            map: index,
                            density: density,
                            monsters: monsters,
                            totalWeight: totalWeight,
                        });
                    }
                }
            }
        }
        else if (data.layers[i].name.startsWith("Layer")) {
            let layer = Number(array[1]);
            for (let j = 0; j < data.layers[i].chunks.length; j++) {
                let chunk = data.layers[i].chunks[j];
                for (let k = 0; k < chunk.data.length; k++) {
                    if (chunk.data[k] != 0) {
                        let size = 0;
                        let queue = [[chunk.x + k % 16, chunk.y + Math.floor(k / 16)]];
                        if (layers[index][chunk.y + Math.floor(k / 16)] == null) {
                            layers[index][chunk.y + Math.floor(k / 16)] = [];
                        }
                        layers[index][chunk.y + Math.floor(k / 16)][chunk.x + k % 16] = layer;
                        while (queue.length > 0) {
                            size += 1;
                            if (size > ENV.maxLayerSize) {
                                warn("[!] Max Layer Size Exceeded for map: " + maps[index] + ", layer: " + layer + ", x: " + chunk.x + k % 16 + ", y: " + chunk.y + Math.floor(k / 16) + " [!]");
                                break;
                            }
                            let current = queue.pop();
                            let x = current[0];
                            let y = current[1];
                            if (collisions[i] != null && collisions[i][layer] != null && collisions[i][layer][spawnY] != null && collisions[i][layer][spawnY][spawnX] != null) {
                                continue;
                            }
                            if (layers[index][y][x - 1] == null && (collisions[index] == null || collisions[index][layer] == null || collisions[index][layer][y] == null || collisions[index][layer][y][x - 1] == null)) {
                                layers[index][y][x - 1] = layer;
                                queue.push([x - 1, y]);
                            }
                            if (layers[index][y][x + 1] == null && (collisions[index] == null || collisions[index][layer] == null || collisions[index][layer][y] == null || collisions[index][layer][y][x + 1] == null)) {
                                layers[index][y][x + 1] = layer;
                                queue.push([x + 1, y]);
                            }
                            if ((layers[index][y - 1] == null || layers[index][y - 1][x] == null) && (collisions[index] == null || collisions[index][layer] == null || collisions[index][layer][y - 1] == null || collisions[index][layer][y - 1][x] == null)) {
                                if (layers[index][y - 1] == null) {
                                    layers[index][y - 1] = [];
                                }
                                layers[index][y - 1][x] = layer;
                                queue.push([x, y - 1]);
                            }
                            if ((layers[index][y + 1] == null || layers[index][y + 1][x] == null) && (collisions[index] == null || collisions[index][layer] == null || collisions[index][layer][y + 1] == null || collisions[index][layer][y + 1][x] == null)) {
                                if (layers[index][y + 1] == null) {
                                    layers[index][y + 1] = [];
                                }
                                layers[index][y + 1][x] = layer;
                                queue.push([x, y + 1]);
                            }
                        }
                    }
                }
            }
        }
        else {
            let layer = Number(array[1]);
            if (isNaN(layer)) {
                layer = 0;
            }
            if (data.layers[i].name.startsWith("Above")) {
                // layer = -1;
                continue;
            }
            if (data.layers[i].name.includes("NoCollision")) {
                continue;
            }
            if (collisions[index][layer] == null) {
                collisions[index][layer] = {};
                pathfindCollisions[index][layer] = [];
            }
            for (let j = 0; j < data.layers[i].chunks.length; j++) {
                let chunk = data.layers[i].chunks[j];
                for (let k = 0; k < chunk.data.length; k++) {
                    let id = chunk.data[k] - 1;
                    if (tileset[id] == null || tileset[id].collisions == null) {
                        continue;
                    }
                    let x = (k % chunk.width + chunk.x + (data.layers[i].offsetx ?? 0) / 16) * TILE_SIZE;
                    let y = (Math.floor(k / chunk.width) + chunk.y + (data.layers[i].offsety ?? 0) / 16) * TILE_SIZE;
                    for (let l = 0; l < tileset[id].collisions.length; l++) {
                        let collision = {
                            x: x + tileset[id].collisions[l].x,
                            y: y + tileset[id].collisions[l].y,
                            width: tileset[id].collisions[l].width,
                            height: tileset[id].collisions[l].height,
                            slowdown: tileset[id].collisions[l].slowdown,
                            collideWithProjectile: tileset[id].collisions[l].collideWithProjectile,
                        };
                        let minX = x + tileset[id].collisions[l].x;
                        let minY = y + tileset[id].collisions[l].y;
                        let maxX = x + tileset[id].collisions[l].width;
                        let maxY = y + tileset[id].collisions[l].height;
                        let minGridX = Math.floor(minX / TILE_SIZE);
                        let minGridY = Math.floor(minY / TILE_SIZE);
                        let maxGridX = Math.ceil(maxX / TILE_SIZE);
                        let maxGridY = Math.ceil(maxY / TILE_SIZE);
                        for (let y = minGridY; y < maxGridY; y++) {
                            for (let x = minGridX; x < maxGridX; x++) {
                                // TODO p1: maybe crop collisions?
                                if (collisions[index][layer][y] == null) {
                                    collisions[index][layer][y] = [];
                                    pathfindCollisions[index][layer][y] = [];
                                }
                                if (collisions[index][layer][y][x] == null) {
                                    collisions[index][layer][y][x] = [];
                                    pathfindCollisions[index][layer][y][x] = 0;
                                }
                                collisions[index][layer][y][x].push(collision);
                                if (!collision.slowdown) {
                                    pathfindCollisions[index][layer][y][x] = 1;
                                }
                            }
                        }
                    }
                }
                // for (let k = 0; k < data.layers[i].chunks[j].data.length; k++) {
                //     let id = data.layers[i].chunks[j].data[k] - 1;
                //     if (tileset[id] == null || tileset[id].collisions == null) {
                //         continue;
                //     }
                //     if (collisions[index][layer][data.layers[i].chunks[j].y + Math.floor(k / 16)] == null) {
                //         collisions[index][layer][data.layers[i].chunks[j].y + Math.floor(k / 16)] = {};
                //         pathfindCollisions[index][layer][data.layers[i].chunks[j].y + Math.floor(k / 16)] = [];
                //     }
                //     if (collisions[index][layer][data.layers[i].chunks[j].y + Math.floor(k / 16)][data.layers[i].chunks[j].x + k % 16] == null) {
                //         collisions[index][layer][data.layers[i].chunks[j].y + Math.floor(k / 16)][data.layers[i].chunks[j].x + k % 16] = [];
                //         pathfindCollisions[index][layer][data.layers[i].chunks[j].y + Math.floor(k / 16)][data.layers[i].chunks[j].x + k % 16] = 0;
                //     }
                //     let x = (k % chunk.width + chunk.x + (data.layers[i].offsetx ?? 0) / 16) * TILE_SIZE;
                //     let y = (Math.floor(k / chunk.width) + chunk.y + (data.layers[i].offsety ?? 0) / 16) * TILE_SIZE;
                //     for (let l = 0; l < tileset[id].collisions.length; l++) {
                //         let collision = {
                //             x: x + tileset[id].collisions[l].x,
                //             y: y + tileset[id].collisions[l].y,
                //             width: tileset[id].collisions[l].width,
                //             height: tileset[id].collisions[l].height,
                //             slowdown: tileset[id].collisions[l].slowdown,
                //             collideWithProjectile: tileset[id].collisions[l].collideWithProjectile,
                //         };
                //         collisions[index][layer][data.layers[i].chunks[j].y + Math.floor(k / 16)][data.layers[i].chunks[j].x + k % 16].push(collision);
                //         if (!collision.slowdown) {
                //             pathfindCollisions[index][layer][data.layers[i].chunks[j].y + Math.floor(k / 16)][data.layers[i].chunks[j].x + k % 16] = 1;
                //         }
                //     }
                // }
            }
        }
    }
};

maps = require("./../client/maps/maps.json");
loadTileset();