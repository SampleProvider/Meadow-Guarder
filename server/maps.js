collisions = [];
pathfindCollisions = [];
slopes = [];
teleporters = [];
regions = [];
spawners = [];

regionData = require("./../client/maps/regions.json");
regionSafety = [];

tileset = [];

function loadTileset() {
    // var data = Bun.file("./client/maps/tileset.tsx").text();
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

function loadMap(index) {
// var loadMap = function(index) {
    var data = JSON.parse(fs.readFileSync("./client/maps/" + maps[index] + ".json"));
    collisions[index] = [];
    pathfindCollisions[index] = [];
    slopes[index] = [];
    teleporters[index] = [];
    regions[index] = [];
    for (var i = 0; i < data.layers.length; i++) {
        var array = data.layers[i].name.split(":");
        if (array.length == 1) {
            continue;
        }
        var layer = Number(array[1]);
        // if (array[0] == "Collision") {
        //     if (collisions[index][layer] == null) {
        //         collisions[index][layer] = [];
        //         pathfindCollisions[index][layer] = [];
        //     }
        //     for (var j = 0; j < data.layers[i].chunks.length; j++) {
        //         for (var k = 0; k < data.layers[i].chunks[j].data.length; k++) {
        //             if (collisions[index][layer][data.layers[i].chunks[j].y + Math.floor(k / 16)] == null) {
        //                 collisions[index][layer][data.layers[i].chunks[j].y + Math.floor(k / 16)] = [];
        //                 pathfindCollisions[index][layer][data.layers[i].chunks[j].y + Math.floor(k / 16)] = [];
        //             }
        //             switch (data.layers[i].chunks[j].data[k]) {
        //                 case 
        //             }
        //             collisions[index][layer][data.layers[i].chunks[j].y + Math.floor(k / 16)][data.layers[i].chunks[j].x + k % 16] = data.layers[i].chunks[j].data[k];
        //             if (data.layers[i].chunks[j].data[k] == 0 || data.layers[i].chunks[j].data[k] == 2363 || data.layers[i].chunks[j].data[k] >= 2535) {
        //                 pathfindCollisions[index][layer][data.layers[i].chunks[j].y + Math.floor(k / 16)][data.layers[i].chunks[j].x + k % 16] = 0;
        //             }
        //             else {
        //                 pathfindCollisions[index][layer][data.layers[i].chunks[j].y + Math.floor(k / 16)][data.layers[i].chunks[j].x + k % 16] = 1;
        //             }
        //         }
        //     }
        // }
        if (data.layers[i].name.startsWith("Slope")) {
            var array = data.layers[i].name.split(":");
            var layer = Number(array[1]);
            var slopeLayer = Number(array[2]);
            slopes[index][layer] = [];
            for (var j = 0; j < data.layers[i].chunks.length; j++) {
                var chunk = data.layers[i].chunks[j];
                for (var k = 0; k < chunk.data.length; k++) {
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
            // for (var j = 0; j < data.layers[i].chunks.length; j++) {
            //     for (var k = 0; k < data.layers[i].chunks[j].data.length; k++) {
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
            var array = data.layers[i].name.split(":");
            var layer = Number(array[1]);

            var teleportY = Number(array[3]);
            var teleportLayer = Number(array[4]);
            var teleportMap = array[5];
            for (var j = 0; j < maps.length; j++) {
                if (maps[j] == teleportMap) {
                    teleportMap = j;
                    break;
                }
            }
            if (teleporters[index][layer] == null) {
                teleporters[index][layer] = [];
            }
            for (var j = 0; j < data.layers[i].chunks.length; j++) {
                for (var k = 0; k < data.layers[i].chunks[j].data.length; k++) {
                    if (teleporters[index][layer][data.layers[i].chunks[j].y + Math.floor(k / 16)] == null) {
                        teleporters[index][layer][data.layers[i].chunks[j].y + Math.floor(k / 16)] = [];
                    }
                    teleporters[index][layer][data.layers[i].chunks[j].y + Math.floor(k / 16)][data.layers[i].chunks[j].x + k % 16] = (data.layers[i].chunks[j].data[k] == 0) ? null : { direction: data.layers[i].chunks[j].data[k] - 2200, x: teleportX * TILE_SIZE + TILE_SIZE / 2, y: teleportY * TILE_SIZE + TILE_SIZE / 2, layer: teleportLayer, map: teleportMap };
                }
            }
        }
        else if (data.layers[i].name.startsWith("Region")) {
            var array = data.layers[i].name.split(":");
            var region = array[1];
            for (var j = 0; j < regionData.length; j++) {
                if (regionData[j][0] == region) {
                    region = j;
                    break;
                }
            }
            regionSafety[region] = array[2] == "safe";
            for (var j = 0; j < data.layers[i].chunks.length; j++) {
                for (var k = 0; k < data.layers[i].chunks[j].data.length; k++) {
                    if (regions[index][data.layers[i].chunks[j].y + Math.floor(k / 16)] == null) {
                        regions[index][data.layers[i].chunks[j].y + Math.floor(k / 16)] = [];
                    }
                    if (data.layers[i].chunks[j].data[k] != 0) {
                        regions[index][data.layers[i].chunks[j].y + Math.floor(k / 16)][data.layers[i].chunks[j].x + k % 16] = region;
                    }
                }
            }
        }
        else if (data.layers[i].name.startsWith("Npc")) {
            var array = data.layers[i].name.split(":");
            var layer = Number(array[1]);
            var npcId = array[2];
            for (var j = 0; j < Npc.data.length; j++) {
                if (Npc.data[j].id == npcId) {
                    npcId = j;
                    break;
                }
            }
            for (var j = 0; j < data.layers[i].chunks.length; j++) {
                for (var k = 0; k < data.layers[i].chunks[j].data.length; k++) {
                    if (data.layers[i].chunks[j].data[k] != 0) {
                        new Npc(npcId, (data.layers[i].chunks[j].x + k % 16) * TILE_SIZE + TILE_SIZE / 2, (data.layers[i].chunks[j].y + Math.floor(k / 16)) * TILE_SIZE + TILE_SIZE / 2, layer, index);
                    }
                }
            }
        }
        else if (data.layers[i].name.startsWith("Spawner")) {
            var array = data.layers[i].name.split(":");
            var layer = Number(array[1]);
            array.shift();
            array.shift();
            for (var j in array) {
                for (var k = 0; k < Monster.data.length; k++) {
                    if (Monster.data[k].id == array[j]) {
                        array[j] = k;
                        break;
                    }
                }
            }
            for (var j = 0; j < data.layers[i].chunks.length; j++) {
                for (var k = 0; k < data.layers[i].chunks[j].data.length; k++) {
                    if (data.layers[i].chunks[j].data[k] != 0) {
                        spawners.push({
                            x: data.layers[i].chunks[j].x + k % 16,
                            y: data.layers[i].chunks[j].y + Math.floor(k / 16),
                            layer: layer,
                            map: index,
                            timer: 1,
                            monsters: array,
                        });
                    }
                }
            }
        }
        else {
            if (collisions[index][layer] == null) {
                collisions[index][layer] = {};
                pathfindCollisions[index][layer] = [];
            }
            for (var j = 0; j < data.layers[i].chunks.length; j++) {
                var chunk = data.layers[i].chunks[j];
                for (var k = 0; k < data.layers[i].chunks[j].data.length; k++) {
                    let id = data.layers[i].chunks[j].data[k] - 1;
                    if (tileset[id] == null || tileset[id].collisions == null) {
                        continue;
                    }
                    if (collisions[index][layer][data.layers[i].chunks[j].y + Math.floor(k / 16)] == null) {
                        collisions[index][layer][data.layers[i].chunks[j].y + Math.floor(k / 16)] = {};
                        pathfindCollisions[index][layer][data.layers[i].chunks[j].y + Math.floor(k / 16)] = [];
                    }
                    if (collisions[index][layer][data.layers[i].chunks[j].y + Math.floor(k / 16)][data.layers[i].chunks[j].x + k % 16] == null) {
                        collisions[index][layer][data.layers[i].chunks[j].y + Math.floor(k / 16)][data.layers[i].chunks[j].x + k % 16] = [];
                        pathfindCollisions[index][layer][data.layers[i].chunks[j].y + Math.floor(k / 16)][data.layers[i].chunks[j].x + k % 16] = 0;
                    }
                    var x = (k % chunk.width + chunk.x + (data.layers[i].offsetx ?? 0) / 16) * TILE_SIZE;
                    var y = (Math.floor(k / chunk.width) + chunk.y + (data.layers[i].offsety ?? 0) / 16) * TILE_SIZE;
                    for (let l = 0; l < tileset[id].collisions.length; l++) {
                        let collision = {
                            x: x + tileset[id].collisions[l].x,
                            y: y + tileset[id].collisions[l].y,
                            width: tileset[id].collisions[l].width,
                            height: tileset[id].collisions[l].height,
                            slowdown: tileset[id].collisions[l].slowdown,
                            collideWithProjectile: tileset[id].collisions[l].collideWithProjectile,
                        };
                        collisions[index][layer][data.layers[i].chunks[j].y + Math.floor(k / 16)][data.layers[i].chunks[j].x + k % 16].push(collision);
                        // console.log(layer, tileset[id].collisions[l])
                        // console.log(JSON.stringify(collisions[index][layer][data.layers[i].chunks[j].y + Math.floor(k / 16)][data.layers[i].chunks[j].x + k % 16]))
                        // console.log(index)
                        if (!collision.slowdown) {
                            pathfindCollisions[index][layer][data.layers[i].chunks[j].y + Math.floor(k / 16)][data.layers[i].chunks[j].x + k % 16] = 1;
                        }
                    }
                    // collisions[index][layer][data.layers[i].chunks[j].y + Math.floor(k / 16)][data.layers[i].chunks[j].x + k % 16] = data.layers[i].chunks[j].data[k];
                    // if (data.layers[i].chunks[j].data[k] == 0 || data.layers[i].chunks[j].data[k] == 2363 || data.layers[i].chunks[j].data[k] >= 2535) {
                    //     pathfindCollisions[index][layer][data.layers[i].chunks[j].y + Math.floor(k / 16)][data.layers[i].chunks[j].x + k % 16] = 0;
                    // }
                    // else {
                    //     pathfindCollisions[index][layer][data.layers[i].chunks[j].y + Math.floor(k / 16)][data.layers[i].chunks[j].x + k % 16] = 1;
                    // }
                }
            }
        }
    }
};

maps = require("./../client/maps/maps.json");
loadTileset();
for (var i = 0; i < maps.length; i++) {
    loadMap(i);
}