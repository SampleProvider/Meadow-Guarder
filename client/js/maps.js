
const TILES_WIDTH = 61;
// const WALLS_WIDTH = 35;

var tilesetImage = new Image();
tilesetImage.src = "./../maps/tileset.png";
// var walls = new Image();
// walls.src = "./../maps/walls.png";

var tileset = [];

var maps = [];
var regions = [];
var loadMap = async function(name, index) {
    await new Promise(async function(resolve, reject) {
        var request = new XMLHttpRequest();
        request.open("GET", "./../maps/" + name + ".json", true);
        request.onload = function() {
            if (this.status >= 200 && this.status < 400) {
                var data = JSON.parse(this.response);
                maps[index] = {
                    width: 0,
                    height: 0,
                    canvases: [],
                    collisions: [],
                    slopes: [],
                    lights: [],
                    particleGenerators: [],
                    animatedTiles: [],
                    data: [],
                    darkness: 0,
                };
                for (var i in data.layers) {
                    if (data.layers[i].name.startsWith("Darkness:")) {
                        maps[index].darkness = Number(data.layers[i].name.split(":")[1]);
                    }
                    else if (data.layers[i].name.startsWith("Light:")) {
                        var array = data.layers[i].name.split(":");
                        for (var j in data.layers[i].chunks) {
                            var chunk = data.layers[i].chunks[j];
                            for (var k in chunk.data) {
                                if (chunk.data[k] != 0) {
                                    if (maps[index].lights[chunk.y / chunk.width] == null) {
                                        maps[index].lights[chunk.y / chunk.width] = [];
                                    }
                                    if (maps[index].lights[chunk.y / chunk.width][chunk.x / chunk.width] == null) {
                                        maps[index].lights[chunk.y / chunk.width][chunk.x / chunk.width] = [];
                                    }
                                    var x = (k % chunk.width + chunk.x + (data.layers[i].offsetx ?? 0) / 16) * TILE_SIZE + TILE_SIZE / 2;
                                    var y = (Math.floor(k / chunk.width) + chunk.y + (data.layers[i].offsety ?? 0) / 16) * TILE_SIZE + TILE_SIZE / 2;
                                    if (array.length == 3) {
                                        // new Light(x, y, index, Number(array[1]), Number(array[2]), false);
                                        maps[index].lights[chunk.y / chunk.width][chunk.x / chunk.width].push({
                                            x: x,
                                            y: y,
                                            map: index,
                                            size: Number(array[1]),
                                            alpha: Number(array[2]),
                                            colored: false,
                                        });
                                    }
                                    else {
                                        // new Light(x, y, index, Number(array[1]), Number(array[2]), true, Number(array[3]), Number(array[4]), Number(array[5]));x
                                        maps[index].lights[chunk.y / chunk.width][chunk.x / chunk.width].push({
                                            x: x,
                                            y: y,
                                            map: index,
                                            size: Number(array[1]),
                                            alpha: Number(array[2]),
                                            colored: true,
                                            r: Number(array[3]),
                                            g: Number(array[4]),
                                            b: Number(array[5]),
                                        });
                                    }
                                }
                            }
                        }
                    }
                    else if (data.layers[i].name.startsWith("ParticleGenerator:")) {
                        var array = data.layers[i].name.split(":");
                        let layer = Number(array[1]);
                        for (var j in data.layers[i].chunks) {
                            var chunk = data.layers[i].chunks[j];
                            for (var k in chunk.data) {
                                if (chunk.data[k] != 0) {
                                    if (maps[index].particleGenerators[chunk.y / chunk.width] == null) {
                                        maps[index].particleGenerators[chunk.y / chunk.width] = [];
                                    }
                                    if (maps[index].particleGenerators[chunk.y / chunk.width][chunk.x / chunk.width] == null) {
                                        maps[index].particleGenerators[chunk.y / chunk.width][chunk.x / chunk.width] = [];
                                    }
                                    var x = (k % chunk.width + chunk.x + (data.layers[i].offsetx ?? 0) / 16) * TILE_SIZE + TILE_SIZE / 2;
                                    var y = (Math.floor(k / chunk.width) + chunk.y + (data.layers[i].offsety ?? 0) / 16) * TILE_SIZE + TILE_SIZE / 2;
                                    maps[index].particleGenerators[chunk.y / chunk.width][chunk.x / chunk.width].push({
                                        x: x,
                                        y: y,
                                        layer: layer,
                                        map: index,
                                        type: eval(array[2]),
                                        value: Number(array[3]),
                                        speed: Number(array[4]),
                                        spread: Number(array[5]),
                                    });
                                    // new ParticleGenerator(x, y, Number(array[1]), index, eval(array[2]), Number(array[3]), Number(array[4]), Number(array[5]));
                                }
                            }
                        }
                    }
                    else if (data.layers[i].name.startsWith("Slope")) {
                        var array = data.layers[i].name.split(":");
                        var layer = Number(array[1]);
                        var slopeLayer = Number(array[2]);
                        maps[index].slopes[layer] = [];
                        for (var j = 0; j < data.layers[i].chunks.length; j++) {
                            var chunk = data.layers[i].chunks[j];
                            for (var k = 0; k < chunk.data.length; k++) {
                                let id = chunk.data[k] - 1;
                                if (id == -1) {
                                    continue;
                                }
                                if (maps[index].slopes[layer][chunk.y + Math.floor(k / 16)] == null) {
                                    maps[index].slopes[layer][chunk.y + Math.floor(k / 16)] = [];
                                }
                                maps[index].slopes[layer][chunk.y + Math.floor(k / 16)][chunk.x + k % 16] = slopeLayer * 5 + id - 5026;
                            }
                        }
                    }
                    else {
                        var layer = data.layers[i].name.includes(":") ? Number(data.layers[i].name.split(":")[1]) : 0;
                        if (isNaN(layer)) {
                            layer = 0;
                        }
                        if (data.layers[i].name == "Ground Terrain") {
                            maps[index].width = data.layers[i].width;
                            maps[index].height = data.layers[i].height;
                        }
                        if (data.layers[i].name.startsWith("Above")) {
                            layer = -1;
                        }
                        if (data.layers[i].visible) {
                            for (var j in data.layers[i].chunks) {
                                var chunk = data.layers[i].chunks[j];
                                if (maps[index].data[chunk.y / chunk.width] == null) {
                                    maps[index].data[chunk.y / chunk.width] = [];
                                }
                                if (maps[index].data[chunk.y / chunk.width][chunk.x / chunk.width] == null) {
                                    maps[index].data[chunk.y / chunk.width][chunk.x / chunk.width] = [];
                                }
                                if (maps[index].data[chunk.y / chunk.width][chunk.x / chunk.width][layer] == null) {
                                    maps[index].data[chunk.y / chunk.width][chunk.x / chunk.width][layer] = [];
                                }
                                maps[index].data[chunk.y / chunk.width][chunk.x / chunk.width][layer].push({
                                    data: chunk.data,
                                    offsetX: data.layers[i].offsetx ?? 0,
                                    offsetY: data.layers[i].offsety ?? 0,
                                });
                            }
                        }
                        for (var j = 0; j < data.layers[i].chunks.length; j++) {
                            var chunk = data.layers[i].chunks[j];
                            for (var k = 0; k < chunk.data.length; k++) {
                                let id = chunk.data[k] - 1;
                                if (tileset[id] == null || tileset[id].collisions == null) {
                                    continue;
                                }
                                if (maps[index].collisions[chunk.y + Math.floor(k / 16)] == null) {
                                    maps[index].collisions[chunk.y + Math.floor(k / 16)] = [];
                                }
                                if (maps[index].collisions[chunk.y + Math.floor(k / 16)][chunk.x + k % 16] == null) {
                                    maps[index].collisions[chunk.y + Math.floor(k / 16)][chunk.x + k % 16] = [];
                                }
                                if (maps[index].collisions[chunk.y + Math.floor(k / 16)][chunk.x + k % 16][layer] == null) {
                                    maps[index].collisions[chunk.y + Math.floor(k / 16)][chunk.x + k % 16][layer] = [];
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
                                    maps[index].collisions[chunk.y + Math.floor(k / 16)][chunk.x + k % 16][layer].push(collision);
                                }
                            }
                        }
                    }
                }
                resolve();
            }
            else {
                reject("Error: Server returned status " + this.status);
            }
        };
        request.onerror = function(err) {
            reject(err);
        };
        request.send();
    });
};
var updateRenderedChunks = async function() {
    // delete chunks in different maps
    for (var i = 0; i < maps.length; i++) {
        if (i != selfMap && maps[i].canvases.length > 0) {
            maps[i].canvases = [];
        }
    }
    for (var i in maps[selfMap].canvases) {
        for (var j in maps[selfMap].canvases[i]) {
            if (Math.abs(selfPlayer.chunkX - j) > settings.renderDistance || Math.abs(selfPlayer.chunkY - i) > settings.renderDistance) {
                delete maps[selfMap].canvases[i][j];
            }
        }
    }
    for (var i = selfPlayer.chunkY - settings.renderDistance; i <= selfPlayer.chunkY + settings.renderDistance; i++) {
        for (var j = selfPlayer.chunkX - settings.renderDistance; j <= selfPlayer.chunkX + settings.renderDistance; j++) {
            if (maps[selfMap].canvases[i] == null) {
                if (maps[selfMap].data[i] != null && maps[selfMap].data[i][j] != null) {
                    renderChunk(j, i);
                }
            }
            else if (maps[selfMap].canvases[i][j] == null) {
                if (maps[selfMap].data[i] != null && maps[selfMap].data[i][j] != null) {
                    renderChunk(j, i);
                }
            }
        }
    }
};
var renderChunk = function(x, y) {
    var chunkCanvas = [];
    var chunkCtx = [];
    for (var i in maps[selfMap].data[y][x]) {
        if (chunkCanvas[Number(i)] == null) {
            chunkCanvas[Number(i)] = createOffscreenCanvas((CHUNK_SIZE + TILE_SIZE) / 4, (CHUNK_SIZE + TILE_SIZE) / 4);
            chunkCtx[Number(i)] = chunkCanvas[Number(i)].getContext("2d");
            resetCanvas(chunkCtx[Number(i)]);
        }
        for (var j in maps[selfMap].data[y][x][i]) {
            for (var k in maps[selfMap].data[y][x][i][j].data) {
                var tileId = maps[selfMap].data[y][x][i][j].data[k] - 1;
                if (tileId != -1) {
                    var tileX = k % 16;
                    var tileY = Math.floor(k / 16);
                    if (settings.animatedTiles && tileset[tileId] != null && tileset[tileId].animation != null) {
                        new AnimatedTile(tileX + x * 16 + maps[selfMap].data[y][x][i][j].offsetX, tileY + y * 16 + maps[selfMap].data[y][x][i][j].offsetY, Number(i), tileId);
                    }
                    else {
                        chunkCtx[Number(i)].drawImage(tilesetImage, (tileId % TILES_WIDTH) * 17, Math.floor(tileId / TILES_WIDTH) * 17, 16, 16, tileX * 16 + maps[selfMap].data[y][x][i][j].offsetX, tileY * 16 + maps[selfMap].data[y][x][i][j].offsetY, 16, 16);
                        // if (tileId >= 5762) {
                        //     tileId -= 5762;
                        //     chunkCtx[Number(i)].drawImage(walls, (tileId % WALLS_WIDTH) * 17, Math.floor(tileId / WALLS_WIDTH) * 17, 16, 16, tileX * 16 + maps[selfMap].data[y][x][i][j].offsetX, tileY * 16 + maps[selfMap].data[y][x][i][j].offsetY, 16, 16);
                        // }
                        // else {
                        //     chunkCtx[Number(i)].drawImage(tileset, (tileId % TILES_WIDTH) * 17, Math.floor(tileId / TILES_WIDTH) * 17, 16, 16, tileX * 16 + maps[selfMap].data[y][x][i][j].offsetX, tileY * 16 + maps[selfMap].data[y][x][i][j].offsetY, 16, 16);
                        // }
                    }
                }
            }
        }
    }
    if (maps[selfMap].canvases[y] == null) {
        maps[selfMap].canvases[y] = [];
    }
    maps[selfMap].canvases[y][x] = chunkCanvas;
    if (maps[selfMap].lights[y] != null && maps[selfMap].lights[y][x] != null) {
        for (var i in maps[selfMap].lights[y][x]) {
            let light = maps[selfMap].lights[y][x][i];
            if (light.colored) {
                new Light(light.x, light.y, light.map, light.size, light.alpha, light.colored, light.r, light.g, light.b);
            }
            else {
                new Light(light.x, light.y, light.map, light.size, light.alpha, light.colored);
            }
        }
    }
    if (maps[selfMap].particleGenerators[y] != null && maps[selfMap].particleGenerators[y][x] != null) {
        for (var i in maps[selfMap].particleGenerators[y][x]) {
            let particleGenerator = maps[selfMap].particleGenerators[y][x][i];
            new ParticleGenerator(particleGenerator.x, particleGenerator.y, particleGenerator.layer, particleGenerator.map, particleGenerator.type, particleGenerator.value, particleGenerator.speed, particleGenerator.spread);
        }
    }
};


var loadTileset = async function() {
    await new Promise(async function(resolve, reject) {
        var request = new XMLHttpRequest();
        // request.open("GET", "./../maps/tileset.tsx", true);
        request.open("GET", "./../maps/tileset.json", true);
        request.onload = async function() {
            if (this.status >= 200 && this.status < 400) {
                var data = JSON.parse(this.response);
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
                    if (data.tiles[i].animation != null) {
                        let animation = {
                            ids: [],
                            timings: [],
                            image: new Image(),
                        };
                        for (var j = 0; j < data.tiles[i].animation.length; j++) {
                            animation.ids.push(data.tiles[i].animation[j].tileid);
                            animation.timings.push(data.tiles[i].animation[j].duration);
                        }
                        var tileCanvas = createCanvas(animation.ids.length * 16, 16);
                        var tileCtx = tileCanvas.getContext("2d");
                        resetCanvas(tileCtx);
                        for (var j in animation.ids) {
                            var tileId = animation.ids[j];
                            tileCtx.drawImage(tilesetImage, (tileId % TILES_WIDTH) * 17, Math.floor(tileId / TILES_WIDTH) * 17, 16, 16, Number(j) * 16, 0, 16, 16);
                        }
                        animation.image.src = tileCanvas.toDataURL("image/png");
                        animation.image.onload = function() {
                            loadedAssets += 1;
                            console.log("loaded animated tile " + i);
                        };
                        tileset[data.tiles[i].id].animation = animation;
                    }
                }
                // var parser = new DOMParser();
                // var raw = parser.parseFromString(this.response, "text/xml");
                // for (var i = 0; i < raw.documentElement.children.length; i++) {
                //     if (raw.documentElement.children[i].tagName == "tile") {
                //         for (var j = 0; j < raw.documentElement.children[i].children.length; j++) {
                //             if (raw.documentElement.children[i].children[j].tagName == "animation") {
                //                 var animation = raw.documentElement.children[i].children[j];
                //                 var tile = {
                //                     tileIds: [],
                //                     tileTimings: [],
                //                     tileImage: new Image(),
                //                 };
                //                 for (var k = 0; k < animation.children.length; k++) {
                //                     if (animation.children[k].tagName == "frame") {
                //                         tile.tileIds.push(Number(animation.children[k].getAttribute("tileid")));
                //                         tile.tileTimings.push(Number(animation.children[k].getAttribute("duration")));
                //                     }
                //                 }
                //                 var tileCanvas = createCanvas(tile.tileIds.length * 16, 16);
                //                 var tileCtx = tileCanvas.getContext("2d");
                //                 resetCanvas(tileCtx);
                //                 for (var k in tile.tileIds) {
                //                     var tileId = tile.tileIds[k];
                //                     tileCtx.drawImage(tileset, (tileId % TILES_WIDTH) * 17, Math.floor(tileId / TILES_WIDTH) * 17, 16, 16, Number(k) * 16, 0, 16, 16);
                //                 }
                //                 tile.tileImage.src = tileCanvas.toDataURL("image/png");
                //                 tile.tileImage.onload = function() {
                //                     loadedAssets += 1;
                //                 };
                //                 AnimatedTile.tiles[Number(raw.documentElement.children[i].getAttribute("id"))] = tile;
                //             }
                //         }
                //     }
                // }
                loadedAssets += 1;
                console.log("loaded tileset");
                resolve();
            }
            // if (this.status >= 200 && this.status < 400) {
            //     var parser = new DOMParser();
            //     var raw = parser.parseFromString(this.response, "text/xml");
            //     for (var i = 0; i < raw.documentElement.children.length; i++) {
            //         if (raw.documentElement.children[i].tagName == "tile") {
            //             for (var j = 0; j < raw.documentElement.children[i].children.length; j++) {
            //                 if (raw.documentElement.children[i].children[j].tagName == "animation") {
            //                     var animation = raw.documentElement.children[i].children[j];
            //                     var tile = {
            //                         tileIds: [],
            //                         tileTimings: [],
            //                         tileImage: new Image(),
            //                     };
            //                     for (var k = 0; k < animation.children.length; k++) {
            //                         if (animation.children[k].tagName == "frame") {
            //                             tile.tileIds.push(Number(animation.children[k].getAttribute("tileid")));
            //                             tile.tileTimings.push(Number(animation.children[k].getAttribute("duration")));
            //                         }
            //                     }
            //                     var tileCanvas = createCanvas(tile.tileIds.length * 16, 16);
            //                     var tileCtx = tileCanvas.getContext("2d");
            //                     resetCanvas(tileCtx);
            //                     for (var k in tile.tileIds) {
            //                         var tileId = tile.tileIds[k];
            //                         tileCtx.drawImage(tileset, (tileId % TILES_WIDTH) * 17, Math.floor(tileId / TILES_WIDTH) * 17, 16, 16, Number(k) * 16, 0, 16, 16);
            //                     }
            //                     tile.tileImage.src = tileCanvas.toDataURL("image/png");
            //                     tile.tileImage.onload = function() {
            //                         loadedAssets += 1;
            //                     };
            //                     AnimatedTile.tiles[Number(raw.documentElement.children[i].getAttribute("id"))] = tile;
            //                 }
            //             }
            //         }
            //     }
            //     resolve();
            // }
            else {
                reject("Error: Server returned status " + this.status);
            }
        };
        request.onerror = function(err) {
            reject(err);
        };
        request.send();
    });
};
var loadMaps = async function() {
    await new Promise(async function(resolve, reject) {
        var request = new XMLHttpRequest();
        request.open("GET", "./../maps/maps.json", true);
        request.onload = async function() {
            if (this.status >= 200 && this.status < 400) {
                var data = JSON.parse(this.response);
                for (let i in data) {
                    await loadMap(data[i], Number(i));
                    loadedAssets += 1;
                    console.log("loaded map " + i);
                }
                resolve();
            }
            else {
                reject("Error: Server returned status " + this.status);
            }
        };
        request.onerror = function(err) {
            reject(err);
        };
        request.send();
    });
};
var loadRegions = async function() {
    await new Promise(async function(resolve, reject) {
        var request = new XMLHttpRequest();
        request.open("GET", "./../maps/regions.json", true);
        request.onload = async function() {
            if (this.status >= 200 && this.status < 400) {
                regions = JSON.parse(this.response);
                loadedAssets += 1;
                console.log("loaded regions");
                resolve();
            }
            else {
                reject("Error: Server returned status " + this.status);
            }
        };
        request.onerror = function(err) {
            reject(err);
        };
        request.send();
    });
};