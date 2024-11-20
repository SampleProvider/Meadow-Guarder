const main = document.getElementById("main");
const selector = document.getElementById("selector");
let selectorButtons = {};
for (let i = 0; i < selector.children.length; i++) {
    selectorButtons[selector.children[i].innerText.substring(0, selector.children[i].innerText.length - 1).toLowerCase()] = selector.children[i];
}
const assetList = document.getElementById("assetList");
const addAssetName = document.getElementById("addAssetName");
let selectedFile = "npc";
let selectedAsset = 0;
let assets = {};

selector.addEventListener("wheel", function(event) {
    selector.scrollBy({
        left: event.deltaY / 2,
        behavior: "smooth",
    });
});

const assetId = document.getElementById("assetId");
const assetName = document.getElementById("assetName");

const canvasEditor = document.getElementById("canvasEditor");

const pixelArtFrames = document.getElementById("pixelArtFrames");
const mapSettings = document.getElementById("mapSettings");

const playerProperties = document.getElementById("playerProperties");

const pixelArtPaletteContainer = document.getElementById("pixelArtPaletteContainer");
const pixelArtPalette = document.getElementById("pixelArtPalette");
const pixelArtProperties = document.getElementById("pixelArtProperties");

const mapBrushMode = document.getElementById("mapBrushMode");
const mapBrushTool = document.getElementById("mapBrushTool");
const mapLayersContainer = document.getElementById("mapLayersContainer");
const mapLayers = document.getElementById("mapLayers");
let mapLayerDivs = [];
const mapTilesContainer = document.getElementById("mapTilesContainer");
const mapTiles = document.getElementById("mapTiles");
const mapTerrainsContainer = document.getElementById("mapTerrainsContainer");
const mapTerrains = document.getElementById("mapTerrains");
let mapTerrainDivs = [];
const mapProperties = document.getElementById("mapProperties");
const mapRandomInput = document.getElementById("mapRandomInput");
const mapGridInput = document.getElementById("mapGridInput");
const mapHighlightLayerInput = document.getElementById("mapHighlightLayerInput");
const mapHillHeightInput = document.getElementById("mapHillHeightInput");
const mapShowObjectsInput = document.getElementById("mapShowObjectsInput");
const mapObjectsContainer = document.getElementById("mapObjectsContainer");
const mapObjectLayerInput = document.getElementById("mapObjectLayerInput");
const mapObjects = document.getElementById("mapObjects");
const mapCollisions = document.getElementById("mapCollisions");
const mapCollisionsLabel = document.getElementById("mapCollisionsLabel");
const mapObjectsX = document.getElementById("mapObjectsX");
const mapObjectsXLabel = document.getElementById("mapObjectsXLabel");
const mapObjectsY = document.getElementById("mapObjectsY");
const mapObjectsYLabel = document.getElementById("mapObjectsYLabel");
const mapObjectsLayer = document.getElementById("mapObjectsLayer");
const mapObjectsLayerLabel = document.getElementById("mapObjectsLayerLabel");
const mapObjectsMap = document.getElementById("mapObjectsMap");
const mapObjectsMapLabel = document.getElementById("mapObjectsMapLabel");
const mapObjectsId = document.getElementById("mapObjectsId");
const mapObjectsIdLabel = document.getElementById("mapObjectsIdLabel");
const mapObjectsMonstersLabel = document.getElementById("mapObjectsMonsters");
const mapObjectsMonsters = document.getElementById("mapObjectsMonstersLabel");
const mapObjectsType = document.getElementById("mapObjectsType");
const mapObjectsTypeLabel = document.getElementById("mapObjectsTypeLabel");
// MAKE SURE TO FIX BUFFER (RENAME)
// AS WELL AS DRAWCOLOREDPLAYER

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d", { alpha: false });
const tilesCanvas = document.getElementById("tilesCanvas");
const tilesCtx = tilesCanvas.getContext("2d", { alpha: false });
const offscreenCanvasDisabled = typeof OffscreenCanvas == "undefined";
const createCanvas = function(width, height) {
    let canvas = document.createElement("canvas");
    canvas.width = width || 1;
    canvas.height = height || 1;
    return canvas;
};
const createOffscreenCanvas = function(width, height) {
    if (offscreenCanvasDisabled) {
        let canvas = document.createElement("canvas");
        canvas.width = width || 1;
        canvas.height = height || 1;
        return canvas;
    }
    return new OffscreenCanvas(width || 1, height || 1);
};
const resetCanvas = function(ctx) {
    ctx.imageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    ctx.textRendering = "optimizeSpeed";
};
resetCanvas(ctx);
resetCanvas(tilesCtx);

// figure out:
// usetime
// speed
// duraiton

const loadFile = function(file) {
    return new Promise(function(resolve, reject) {
        if (assets[file] != null) {
            resolve();
            return;
        }
        let request = new XMLHttpRequest();
        request.open("GET", "./../data/" + file + ".json", true);
        request.onload = function() {
            if (this.status >= 200 && this.status < 400) {
                assets[file] = JSON.parse(this.response);
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

const selectFile = async function(file) {
    main.style.filter = "blur(4px)";
    document.body.style.pointerEvents = "none";

    selectorButtons[selectedFile].classList.remove("selectorButtonSelected");
    selectorButtons[file].classList.add("selectorButtonSelected");
    await loadFile(file);
    await new Promise(awaitPlayerImageLoad);
    await new Promise(awaitTilesImageLoad);
    await new Promise(loadTileLayers);
    await new Promise(loadTerrains);
    await new Promise(loadObjects);

    let loadFinish = function() {
        addAssetName.innerText = selectorButtons[file].innerText.substring(0, selectorButtons[file].innerText.length - 1);

        selectedFile = file;
        selectAsset(0);

        if (file == "npc" || file == "item" || file == "monster" || file == "projectile") {
            canvasEditor.style.display = "revert-layer";
            pixelArtFrames.style.display = "revert-layer";
            mapSettings.style.display = "none";
            mapLayersContainer.style.display = "none";
            mapProperties.style.display = "none";
            mapTilesContainer.style.display = "none";
            mapTerrainsContainer.style.display = "none";
            mapObjectsContainer .style.display = "none";
        }
        else if (file == "map") {
            canvasEditor.style.display = "revert-layer";
            pixelArtFrames.style.display = "none";
            mapSettings.style.display = "revert-layer";
            playerProperties.style.display = "none";
            pixelArtPaletteContainer.style.display = "none";
            pixelArtProperties.style.display = "none";
            mapLayersContainer.style.display = "revert-layer";
            mapProperties.style.display = "revert-layer";
            mapTilesContainer.style.display = "revert-layer";
            mapTerrainsContainer.style.display = "revert-layer";
            mapObjectsContainer.style.display = "revert-layer";
        }
        else {
            canvasEditor.style.display = "none";
        }

        main.style.filter = "revert-layer";
        document.body.style.pointerEvents = "revert-layer";
    };

    assetList.innerHTML = "";

    let loadedAssets = 0;
    let totalAssets = 0;
    for (let i = 0; i < assets[file].length; i++) {
        const asset = document.createElement("div");
        asset.classList.add("asset");
        if (file == "npc" || file == "item" || file == "monster" || file == "projectile") {
            const image = new Image();
            image.classList.add("assetImage");
            if (assets[file][i].customizations != null) {
                ctx.clearRect(0, 0, 8, 16);
                ctx.drawImage(drawColoredPlayer(0, assets[file][i].customizations.body), 0, 0);
                ctx.drawImage(drawColoredPlayer(1, assets[file][i].customizations.shirt), 0, 0);
                ctx.drawImage(drawColoredPlayer(2, assets[file][i].customizations.pants), 0, 0);
                ctx.drawImage(drawColoredPlayer(3, assets[file][i].customizations.eyes), 0, 0);
                if (assets[file][i].customizations.gloves[4] == 1) {
                    ctx.drawImage(drawColoredPlayer(4, assets[file][i].customizations.gloves), 0, 0);
                }
                if (assets[file][i].customizations.boots[4] == 1) {
                    ctx.drawImage(drawColoredPlayer(5, assets[file][i].customizations.boots), 0, 0);
                }
                if (assets[file][i].customizations.pouch[4] == 1) {
                    ctx.drawImage(drawColoredPlayer(6, assets[file][i].customizations.pouch), 0, 0);
                }
                if (assets[file][i].customizations.hair[4] > 0) {
                    ctx.drawImage(drawColoredPlayer(assets[file][i].customizations.hair[4] + 6, assets[file][i].customizations.hair), 0, 0);
                }
                image.src = canvas.toDataURL("image/png");
                image.addEventListener("load", function() {
                    loadedAssets += 1;
                    if (loadedAssets == totalAssets) {
                        loadFinish();
                    }
                });
                image.style.width = "16px";
            }
            else {
                if (assets[file][i].imageData == null) {
                    image.src = "./../images/" + file + "/" + assets[file][i].image + ".png";
                    image.addEventListener("load", function() {
                        if (assets[file][i].imageData == null) {
                            let width = file == "item" ? 16 : assets[file][i].imageWidth * assets[file][i].animationLength;
                            let height = file == "item" ? 16 : assets[file][i].imageHeight * (assets[file][i].animationDirections ?? 1) * assets[file][i].animationPhases;
                            let canvas = createCanvas(width, height);
                            let ctx = canvas.getContext("2d");
                            resetCanvas(ctx);
                            ctx.drawImage(image, 0, 0, width, height);
                            assets[file][i].imageData = ctx.getImageData(0, 0, width, height).data;
                            if (file == "item") {
                                loadedAssets += 1;
                                if (loadedAssets == totalAssets) {
                                    loadFinish();
                                }
                            }
                            else {
                                let canvas = createCanvas(assets[file][i].imageWidth, assets[file][i].imageHeight);
                                let ctx = canvas.getContext("2d");
                                resetCanvas(ctx);
                                ctx.drawImage(image, 0, 0, assets[file][i].imageWidth, assets[file][i].imageHeight, 0, 0, assets[file][i].imageWidth, assets[file][i].imageHeight);
                                image.src = canvas.toDataURL("image/png");
                            }
                        }
                        else {
                            loadedAssets += 1;
                            if (loadedAssets == totalAssets) {
                                loadFinish();
                            }
                        }
                    });
                }
                else {
                    let canvas = createCanvas(assets[file][i].imageWidth, assets[file][i].imageHeight);
                    let ctx = canvas.getContext("2d");
                    resetCanvas(ctx);
                    for (let y = 0; y < assets[file][i].imageHeight; y++) {
                        for (let x = 0; x < assets[file][i].imageWidth; x++) {
                            ctx.fillStyle = "rgba(" + assets[file][i].imageData[(y * assets[file].imageWidth * assets[file].animationLength + x) * 4] + ", " + assets[file][i].imageData[(y * assets[file].imageWidth * assets[file].animationLength + x) * 4 + 1] + ", " + assets[file][i].imageData[(y * assets[file].imageWidth * assets[file].animationLength + x) * 4 + 2] + ", " + assets[file][i].imageData[(y * assets[file].imageWidth * assets[file].animationLength + x) * 4 + 3] + ")";
                        }
                    }
                    image.src = canvas.toDataURL("image/png");
                    image.addEventListener("load", function() {
                        loadedAssets += 1;
                        if (loadedAssets == totalAssets) {
                            loadFinish();
                        }
                    });
                }
                if (file == "item") {
                    image.style.width = "32px";
                }
                else {
                    image.style.width = 32 * assets[file][i].imageWidth / assets[file][i].imageHeight + "px";
                }
            }
            asset.appendChild(image);
        }
        asset.addEventListener("click", function() {
            saveAsset();
            selectAsset(i);
        });
        const label = document.createElement("div");
        label.classList.add("assetLabel");
        label.innerText = assets[file][i].name ?? assets[file][i].id.charAt(0).toUpperCase() + assets[file][i].id.substring(1);
        asset.appendChild(label);
        assetList.appendChild(asset);
        assets[file][i].asset = asset;
        totalAssets += 1;
    }
    if (file == "map") {
        loadFinish();
    }
};
const selectAsset = function(asset) {
    assets[selectedFile][selectedAsset].asset.classList.remove("assetSelected");
    assets[selectedFile][asset].asset.classList.add("assetSelected");

    assetId.value = assets[selectedFile][asset].id;
    assetName.value = assets[selectedFile][asset].name;

    if (selectedFile == "npc" || selectedFile == "item" || selectedFile == "monster" || selectedFile == "projectile") {
        if (assets[selectedFile][asset].customizations != null) {
            playerProperties.style.display = "revert-layer";
            pixelArtPaletteContainer.style.display = "none";
            pixelArtProperties.style.display = "none";
        }
        else {
            playerProperties.style.display = "none";
            pixelArtPaletteContainer.style.display = "revert-layer";
            pixelArtProperties.style.display = "revert-layer";
            pixelArt.data = [];
            for (let i = 0; i < assets[selectedFile][asset].imageData.length; i += 4) {
                let frame = Math.floor(i / 4 / (assets[selectedFile][asset].imageWidth * assets[selectedFile][asset].imageHeight));
                let x = i / 4 % assets[selectedFile][asset].imageWidth;
                let y = Math.floor(i / 4 % (assets[selectedFile][asset].imageWidth * assets[selectedFile][asset].imageHeight) / assets[selectedFile][asset].imageWidth);
                if (pixelArt.data[frame] == null) {
                    pixelArt.data[frame] = [];
                }
                if (pixelArt.data[frame][y] == null) {
                    pixelArt.data[frame][y] = [];
                }
                if (assets[selectedFile][asset].imageData[i + 3] == 0) {
                    pixelArt.data[frame][y][x] = null;
                }
                else {
                    pixelArt.data[frame][y][x] = [assets[selectedFile][asset].imageData[i], assets[selectedFile][asset].imageData[i + 1], assets[selectedFile][asset].imageData[i + 2], assets[selectedFile][asset].imageData[i + 3] / 255];
                }
            }
            pixelArt.width = assets[selectedFile][asset].imageWidth;
            pixelArt.height = assets[selectedFile][asset].imageHeight;
            resetPixelArtCanvas();
            pixelArt.frame = 0;
            createPixelArtFrames(Math.floor(assets[selectedFile][asset].imageData.length / 4 / (assets[selectedFile][asset].imageWidth * assets[selectedFile][asset].imageHeight)));
        }
    }
    else if (selectedFile == "map") {
        map.data = assets[selectedFile][asset].map;
        map.layers = assets[selectedFile][asset].layers;
        map.brush.layer = 0;
        loadLayers();
    }
    selectedAsset = asset;
};
const saveAsset = function() {
    if (selectedFile == "npc" || selectedFile == "item" || selectedFile == "monster" || selectedFile == "projectile") {
        if (assets[selectedFile][selectedAsset].customizations != null) {

        }
        else {
            let canvas = createCanvas(pixelArt.width, pixelArt.height);
            let ctx = canvas.getContext("2d");
            resetCanvas(ctx);
            for (let frame = 0; frame < pixelArt.data.length; frame++) {
                for (let y = 0; y < pixelArt.height; y++) {
                    for (let x = 0; x < pixelArt.width; x++) {
                        let frameX = frame % (selectedFile == "item" ? 1 : assets[selectedFile][selectedAsset].animationLength);
                        let frameY = Math.floor(frame / (selectedFile == "item" ? 1 : (assets[selectedFile][selectedAsset].animationDirections ?? 1) * assets[selectedFile][selectedAsset].animationPhases));
                        if (pixelArt.data[frame][y][x] != null) {
                            ctx.fillStyle = "rgb(" + pixelArt.data[frame][y][x][0] + ", " + pixelArt.data[frame][y][x][1] + ", " + pixelArt.data[frame][y][x][2] + ", " + pixelArt.data[frame][y][x][3] + ")";
                            ctx.fillRect(x + frameX * (selectedFile == "item" ? 16 : assets[selectedFile][selectedAsset].imageWidth), y + frameY * (selectedFile == "item" ? 16 : assets[selectedFile][selectedAsset].imageHeight), 1, 1);
                        }
                    }
                }
            }
            assets[selectedFile][selectedAsset].imageData = ctx.getImageData(0, 0, pixelArt.width, pixelArt.height).data;
            assets[selectedFile][selectedAsset].imageDataURL = canvas.toDataURL("image/png").replace("data:image/png;base64,", "");
        }
    }
    socket.emit("saveAsset", {
        file: selectedFile,
        asset: selectedAsset,
        data: assets[selectedFile][selectedAsset],
    });
};

for (let i in selectorButtons) {
    selectorButtons[i].addEventListener("click", function() {
        saveAsset();
        selectFile(i);
    });
}
selectFile(selectedFile);

let mouseX = 0;
let mouseY = 0;

let cameraX = 0;
let cameraY = 0;
let cameraZoom = 1;
let cameraDragging = false;

let pixelArt = {
    data: [],
    width: 0,
    height: 0,
    frame: 0,
    brush: {
        x: 0,
        y: 0,
        leftMouseDown: false,
        rightMouseDown: false,
        size: 1,
        color: [0, 0, 0, 0],
    },
};

const createPaletteColor = function(r, g, b) {
    const button = document.createElement("button");
    button.classList.add("pixelArtPaletteColor");
    button.style.backgroundColor = "rgb(" + r + ", " + g + ", " + b + ")";
    button.addEventListener("click", function() {
        for (let i = 0; i < pixelArtPalette.children.length; i++) {
            if (pixelArtPalette.children[i].classList.contains("pixelArtPaletteelected")) {
                pixelArtPalette.children[i].classList.remove("pixelArtPaletteelected");
            }
        }
        pixelArt.brush.color = [r, g, b, 1];
        button.classList.add("pixelArtPaletteelected");
    });
    pixelArtPalette.appendChild(button);
};

let paletteImage = new Image();
paletteImage.src = "./../images/palette.png";
paletteImage.addEventListener("load", function() {
    ctx.drawImage(paletteImage, 0, 0);
    let data = ctx.getImageData(0, 0, 19, 20).data;
    for (let i = 0; i < 17; i++) {
        createPaletteColor(255, 255, 255);
        for (let j = 0; j < 10; j++) {
            createPaletteColor(data[(i * 19 + j) * 4], data[(i * 19 + j) * 4 + 1], data[(i * 19 + j) * 4 + 2]);
        }
    }
    for (let i = 0; i < 17; i++) {
        createPaletteColor(0, 0, 0);
        for (let j = 18; j >= 9; j--) {
            createPaletteColor(data[(i * 19 + j) * 4], data[(i * 19 + j) * 4 + 1], data[(i * 19 + j) * 4 + 2]);
        }
    }
    for (let j = 0; j <= 10; j++) {
        createPaletteColor(data[(17 * 19 + j) * 4], data[(17 * 19 + j) * 4 + 1], data[(17 * 19 + j) * 4 + 2]);
    }
});

let playerImage = new Image();
playerImage.src = "./../images/player/player.png";
let playerImageLoaded = false;
playerImage.addEventListener("load", function() {
    playerImageLoaded = true;
});
const drawColoredPlayer = function(layer, color) {
    let buffer = createOffscreenCanvas(8 * 6, 16 * 8);
    let bufferCtx = buffer.getContext("2d");
    resetCanvas(bufferCtx);
    bufferCtx.drawImage(playerImage, 0, layer * 16 * 8, 8 * 6, 16 * 8, 0, 0, 8 * 6, 16 * 8);
    bufferCtx.fillStyle = "rgba(" + color[0] + ", " + color[1] + ", " + color[2] + ", " + color[3] + ")";
    bufferCtx.globalCompositeOperation = "multiply";
    bufferCtx.fillRect(0, 0, 8 * 6, 16 * 8);
    bufferCtx.globalCompositeOperation = "destination-in";
    bufferCtx.drawImage(playerImage, 0, layer * 16 * 8, 8 * 6, 16 * 8, 0, 0, 8 * 6, 16 * 8);
    return buffer;
};
const awaitPlayerImageLoad = function(resolve, reject) {
    if (playerImageLoaded) {
        resolve();
    }
    else {
        setTimeout(function() {
            awaitPlayerImageLoad(resolve, reject);
        }, 10);
    }
};

const createPixelArtFrames = function(frames) {
    pixelArtFrames.innerHTML = "";
    for (let i = 0; i < frames; i++) {
        const frame = document.createElement("button");
        frame.classList.add("pixelArt.frame");
        frame.innerText = i + 1;
        frame.addEventListener("click", function() {
            selectPixelArtFrame(i);
        });
        pixelArtFrames.appendChild(frame);
    }
    selectPixelArtFrame(0);
};
const selectPixelArtFrame = function(frame) {
    pixelArtFrames.children[pixelArt.frame].classList.remove("pixelArtFrameSelected");
    pixelArtFrames.children[frame].classList.add("pixelArtFrameSelected");
    pixelArt.frame = frame;
};
selectPixelArtFrame(0);

const resetPixelArtCanvas = function() {
    canvas.width = pixelArt.width;
    canvas.height = pixelArt.height;
    resetCanvas(ctx);
    document.body.style.setProperty("--pixel-art-aspect-ratio", pixelArt.width / pixelArt.height);
};
const updatePixelArtMouse = function() {
    if (pixelArt.brush.x >= 0 && pixelArt.brush.x < pixelArt.width && pixelArt.brush.y >= 0 && pixelArt.brush.y < pixelArt.height) {
        if (pixelArt.brush.rightMouseDown) {
            for (let y = Math.max(pixelArt.brush.y - pixelArt.brush.size + 1, 0); y < Math.min(pixelArt.brush.y + pixelArt.brush.size, pixelArt.height); y++) {
                for (let x = Math.max(pixelArt.brush.x - pixelArt.brush.size + 1, 0); x < Math.min(pixelArt.brush.x + pixelArt.brush.size, pixelArt.width); x++) {
                    pixelArt.data[pixelArt.frame][y][x] = null;
                }
            }
        }
        else if (pixelArt.brush.leftMouseDown) {
            for (let y = Math.max(pixelArt.brush.y - pixelArt.brush.size + 1, 0); y < Math.min(pixelArt.brush.y + pixelArt.brush.size, pixelArt.height); y++) {
                for (let x = Math.max(pixelArt.brush.x - pixelArt.brush.size + 1, 0); x < Math.min(pixelArt.brush.x + pixelArt.brush.size, pixelArt.width); x++) {
                    pixelArt.data[pixelArt.frame][y][x] = pixelArt.brush.color;
                }
            }
        }
    }
};
const drawPixelArtBackground = function() {
    ctx.fillStyle = "#aaaaaa";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < pixelArt.height; y += 4) {
        for (let x = 0; x < pixelArt.width; x += 4) {
            ctx.fillStyle = (x + y) % 2 == 0 ? "#ffffff" : "#bbbbbb";
            ctx.fillRect(x, y, 4, 4);
        }
    }
};
const drawPixelArt = function() {
    for (let y = 0; y < pixelArt.height; y++) {
        for (let x = 0; x < pixelArt.width; x++) {
            if (pixelArt.data[pixelArt.frame][y][x] == null) {
                continue;
            }
            ctx.fillStyle = "rgb(" + pixelArt.data[pixelArt.frame][y][x][0] + ", " + pixelArt.data[pixelArt.frame][y][x][1] + ", " + pixelArt.data[pixelArt.frame][y][x][2] + ", " + pixelArt.data[pixelArt.frame][y][x][3] + ")";
            ctx.fillRect(x, y, 1, 1);
        }
    }
};
const drawPixelArtMouse = function() {
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.fillRect(pixelArt.brush.x - pixelArt.brush.size + 1, pixelArt.brush.y - pixelArt.brush.size + 1, pixelArt.brush.size * 2 - 1, pixelArt.brush.size * 2 -1);
};

const GROUND = 0;
const HILL = 1;
const BELOW = 2;
const ABOVE = 3;

const TILES = 0;
const TERRAINS = 1;
const OBJECTS = 2;

const BRUSH = 0;
const LINE = 1;
const RECT = 2;
const FILL = 3;

const CORNER = 0;
const EDGE = 1;
const BOTH = 2;

const COLLISION = 0;
const PROJECTILE_COLLISION = 1;
const SLOWDOWN = 2;
const SLOPE = 3;
const TELEPORTER = 4;
const REGION = 5;
const NPC = 6;
const SPAWNER = 7;
const LIGHT = 8;
const PARTICLE_GENERATOR = 9;

let map = {
    data: [],
    objectData: [
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
    ],
    layers: [],
    groundLayers: [],
    hillLayers: [],
    objectLayers: 1,
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
    brush: {
        mode: TILES,
        changeMode: function(mode) {
            this.mode = mode;
            mapBrushMode.value = mode;
        },
        tool: BRUSH,
        changeTool: function(tool) {
            this.tool = tool;
            mapBrushTool.value = tool;
        },
        object: COLLISION,
        changeObject: function(object) {
            this.object = object;
            mapObjects.value = object;
            if (object == COLLISION) {
                mapCollisions.style.display = "revert-layer";
                mapCollisionsLabel.style.display = "revert-layer";
            }
            else {
                mapCollisions.style.display = "none";
                mapCollisionsLabel.style.display = "none";
            }
            if (object == SLOPE || object == TELEPORTER) {
                mapObjectsLayer.style.display = "revert-layer";
                mapObjectsLayerLabel.style.display = "revert-layer";
            }
            else {
                mapObjectsLayer.style.display = "none";
                mapObjectsLayerLabel.style.display = "none";
            }
            if (object == TELEPORTER) {
                mapObjectsX.style.display = "revert-layer";
                mapObjectsXLabel.style.display = "revert-layer";
                mapObjectsY.style.display = "revert-layer";
                mapObjectsYLabel.style.display = "revert-layer";
                mapObjectsMap.style.display = "revert-layer";
                mapObjectsMapLabel.style.display = "revert-layer";
            }
            else {
                mapObjectsX.style.display = "none";
                mapObjectsXLabel.style.display = "none";
                mapObjectsY.style.display = "none";
                mapObjectsYLabel.style.display = "none";
                mapObjectsMap.style.display = "none";
                mapObjectsMapLabel.style.display = "none";
            }
            if (object == REGION || object == NPC) {
                mapObjectsId.style.display = "revert-layer";
                mapObjectsIdLabel.style.display = "revert-layer";
            }
            else {
                mapObjectsId.style.display = "none";
                mapObjectsIdLabel.style.display = "none";
            }
            if (object == SPAWNER) {
                mapObjectsMonsters.style.display = "revert-layer";
                mapObjectsMonstersLabel.style.display = "revert-layer";
            }
            else {
                mapObjectsMonsters.style.display = "none";
                mapObjectsMonstersLabel.style.display = "none";
            }
            if (object == LIGHT || object == PARTICLE_GENERATOR) {
                mapObjectsType.style.display = "revert-layer";
                mapObjectsTypeLabel.style.display = "revert-layer";
            }
            else {
                mapObjectsType.style.display = "none";
                mapObjectsTypeLabel.style.display = "none";
            }
        },
        startX: 0,
        startY: 0,
        endX: 0,
        endY: 0,
        layer: 0,
        objectLayer: 0,
        leftMouseDown: false,
        rightMouseDown: false,
        controlDown: false,
        tileStartX: 0,
        tileStartY: 0,
        tileEndX: 0,
        tileEndY: 0,
        tilesMouseDown: false,
        terrainGroup: 0,
        terrain: 0,
        random: false,
        grid: true,
        highlightLayer: false,
        hillHeight: 1,
        showObjects: true,
        place: function(x, y) {
            let chunkX = Math.floor(x / 16);
            let chunkY = Math.floor(y / 16);
            if (chunkX < map.startX || chunkX >= map.endX || chunkY < map.startY || chunkY >= map.endY) {
                return;
            }
            if (map.data[chunkY][chunkX][this.layer] == null) {
                return;
            }
            switch (this.mode) {
                case TILES:
                    if (!this.rightMouseDown) {
                        if (this.random) {
                            let chunkX = Math.floor(x / 16);
                            let chunkY = Math.floor(y / 16);
                            map.data[chunkY][chunkX][this.layer][y - chunkY * 16][x - chunkX * 16] = this.tileStartX + Math.floor(Math.random() * (this.tileEndX - this.tileStartX + 1)) + (this.tileStartY + Math.floor(Math.random() * (this.tileEndY - this.tileStartY + 1))) * tilesWidth;
                        }
                        else {
                            for (let tileY = this.tileStartY; tileY <= this.tileEndY; tileY++) {
                                let chunkY = Math.floor((y + tileY - this.tileStartY) / 16);
                                if (chunkY < map.startY || chunkY >= map.endY) {
                                    continue;
                                }
                                for (let tileX = this.tileStartX; tileX <= this.tileEndX; tileX++) {
                                    let chunkX = Math.floor((x + tileX - this.tileStartX) / 16);
                                    if (chunkX < map.startX || chunkX >= map.endX) {
                                        continue;
                                    }
                                    map.data[chunkY][chunkX][this.layer][y + tileY - this.tileStartY - chunkY * 16][x + tileX - this.tileStartX - chunkX * 16] = tileX + tileY * tilesWidth;
                                }
                            }
                        }
                    }
                    else {
                        map.data[chunkY][chunkX][this.layer][y - chunkY * 16][x - chunkX * 16] = null;
                    }
                    break;
                case TERRAINS:
                    let terrain = 0;
                    if (!this.rightMouseDown) {
                        terrain = this.terrainGroup >= this.terrain ? this.terrainGroup * this.terrainGroup + this.terrainGroup + this.terrain : this.terrain * this.terrain + this.terrainGroup;
                        terrain += 1;
                    }
                    switch (terrains[this.terrainGroup].type) {
                        case "corner":
                            if (this.controlDown) {
                                let tiles = [
                                    [8, 12, 4],
                                    [10, 15, 5],
                                    [2, 3, 1],
                                ];
                                for (let tileY = Math.max(y - 1, map.startY * 16); tileY <= Math.min(y + 1, map.endY * 16 - 1); tileY++) {
                                    let chunkY = Math.floor(tileY / 16);
                                    for (let tileX = Math.max(x - 1, map.startX * 16); tileX <= Math.min(x + 1, map.endX * 16 - 1); tileX++) {
                                        let chunkX = Math.floor(tileX / 16);
                                        let tile = [0, 0, 0, 0];
                                        if (terrainsTileMap[CORNER].has(map.data[chunkY][chunkX][this.layer][tileY - chunkY * 16][tileX - chunkX * 16])) {
                                            tile = structuredClone(terrainsTileMap[CORNER].get(map.data[chunkY][chunkX][this.layer][tileY - chunkY * 16][tileX - chunkX * 16]));
                                        }
                                        if (tiles[tileY - y + 1][tileX - x + 1] % 2 == 1) {
                                            tile[0] = terrain;
                                        }
                                        if (Math.floor(tiles[tileY - y + 1][tileX - x + 1] / 2) % 2 == 1) {
                                            tile[1] = terrain;
                                        }
                                        if (Math.floor(tiles[tileY - y + 1][tileX - x + 1] / 4) % 2 == 1) {
                                            tile[2] = terrain;
                                        }
                                        if (Math.floor(tiles[tileY - y + 1][tileX - x + 1] / 8) % 2 == 1) {
                                            tile[3] = terrain;
                                        }
                                        if (terrainsMap[CORNER].has(tile.toString())) {
                                            map.data[chunkY][chunkX][this.layer][tileY - chunkY * 16][tileX - chunkX * 16] = terrainsMap[CORNER].get(tile.toString())[Math.floor(Math.random() * terrainsMap[CORNER].get(tile.toString()).length)];
                                        }
                                    }
                                }
                            }
                            else {
                                let tiles = [
                                    [8, 4],
                                    [2, 1],
                                ];
                                for (let tileY = Math.max(y - 1, map.startY * 16); tileY <= Math.min(y, map.endY * 16 - 1); tileY++) {
                                    let chunkY = Math.floor(tileY / 16);
                                    for (let tileX = Math.max(x - 1, map.startX * 16); tileX <= Math.min(x, map.endX * 16 - 1); tileX++) {
                                        let chunkX = Math.floor(tileX / 16);
                                        let tile = [0, 0, 0, 0];
                                        if (terrainsTileMap[CORNER].has(map.data[chunkY][chunkX][this.layer][tileY - chunkY * 16][tileX - chunkX * 16])) {
                                            tile = structuredClone(terrainsTileMap[CORNER].get(map.data[chunkY][chunkX][this.layer][tileY - chunkY * 16][tileX - chunkX * 16]));
                                        }
                                        if (tiles[tileY - y + 1][tileX - x + 1] % 2 == 1) {
                                            tile[0] = terrain;
                                        }
                                        if (Math.floor(tiles[tileY - y + 1][tileX - x + 1] / 2) % 2 == 1) {
                                            tile[1] = terrain;
                                        }
                                        if (Math.floor(tiles[tileY - y + 1][tileX - x + 1] / 4) % 2 == 1) {
                                            tile[2] = terrain;
                                        }
                                        if (Math.floor(tiles[tileY - y + 1][tileX - x + 1] / 8) % 2 == 1) {
                                            tile[3] = terrain;
                                        }
                                        if (terrainsMap[CORNER].has(tile.toString())) {
                                            map.data[chunkY][chunkX][this.layer][tileY - chunkY * 16][tileX - chunkX * 16] = terrainsMap[CORNER].get(tile.toString())[Math.floor(Math.random() * terrainsMap[CORNER].get(tile.toString()).length)];
                                        }
                                    }
                                }
                            }
                            break;
                        case "edge":
                            let centerChunkX = Math.floor(x / 16);
                            let centerChunkY = Math.floor(y / 16);
                            let centerTile = [0, 0, 0, 0, terrain];
                            if (terrainsTileMap[EDGE].has(map.data[centerChunkY][centerChunkX][this.layer][y - centerChunkY * 16][x - centerChunkX * 16])) {
                                centerTile = structuredClone(terrainsTileMap[EDGE].get(map.data[centerChunkY][centerChunkX][this.layer][y - centerChunkY * 16][x - centerChunkX * 16]));
                                if (centerTile[4] != terrain) {
                                    centerTile = [0, 0, 0, 0, terrain];
                                }
                            }
                            for (let tileX = Math.max(x - 1, map.startX * 16); tileX <= Math.min(x + 1, map.endX * 16 - 1); tileX++) {
                                if (tileX - x == 0) {
                                    continue;
                                }
                                let chunkX = Math.floor(tileX / 16);
                                let chunkY = Math.floor(y / 16);
                                if (terrainsTileMap[EDGE].has(map.data[chunkY][chunkX][this.layer][y - chunkY * 16][tileX - chunkX * 16])) {
                                    let tile = structuredClone(terrainsTileMap[EDGE].get(map.data[chunkY][chunkX][this.layer][y - chunkY * 16][tileX - chunkX * 16]));
                                    if (tile[4] == terrain) {
                                        tile[tileX - x == -1 ? 1 : 0] = terrain;
                                        centerTile[tileX - x == -1 ? 0 : 1] = terrain;
                                        if (terrainsMap[EDGE].has(tile.toString())) {
                                            map.data[chunkY][chunkX][this.layer][y - chunkY * 16][tileX - chunkX * 16] = terrainsMap[EDGE].get(tile.toString())[Math.floor(Math.random() * terrainsMap[EDGE].get(tile.toString()).length)];
                                        }
                                    }
                                    else {
                                        tile[tileX - x == -1 ? 1 : 0] = 0;
                                        if (terrainsMap[EDGE].has(tile.toString())) {
                                            map.data[chunkY][chunkX][this.layer][y - chunkY * 16][tileX - chunkX * 16] = terrainsMap[EDGE].get(tile.toString())[Math.floor(Math.random() * terrainsMap[EDGE].get(tile.toString()).length)];
                                        }
                                    }
                                }
                            }
                            for (let tileY = Math.max(y - 1, map.startY * 16); tileY <= Math.min(y + 1, map.endY * 16 - 1); tileY++) {
                                if (tileY - y == 0) {
                                    continue;
                                }
                                let chunkX = Math.floor(x / 16);
                                let chunkY = Math.floor(tileY / 16);
                                if (terrainsTileMap[EDGE].has(map.data[chunkY][chunkX][this.layer][tileY - chunkY * 16][x - chunkX * 16])) {
                                    let tile = structuredClone(terrainsTileMap[EDGE].get(map.data[chunkY][chunkX][this.layer][tileY - chunkY * 16][x - chunkX * 16]));
                                    if (tile[4] == terrain) {
                                        tile[tileY - y == -1 ? 3 : 2] = terrain;
                                        centerTile[tileY - y == -1 ? 2 : 3] = terrain;
                                        if (terrainsMap[EDGE].has(tile.toString())) {
                                            map.data[chunkY][chunkX][this.layer][tileY - chunkY * 16][x - chunkX * 16] = terrainsMap[EDGE].get(tile.toString())[Math.floor(Math.random() * terrainsMap[EDGE].get(tile.toString()).length)];
                                        }
                                    }
                                    else {
                                        tile[tileY - y == -1 ? 3 : 2] = 0;
                                        if (terrainsMap[EDGE].has(tile.toString())) {
                                            map.data[chunkY][chunkX][this.layer][tileY - chunkY * 16][x - chunkX * 16] = terrainsMap[EDGE].get(tile.toString())[Math.floor(Math.random() * terrainsMap[EDGE].get(tile.toString()).length)];
                                        }
                                    }
                                }
                            }
                            if (terrainsMap[EDGE].has(centerTile.toString())) {
                                map.data[centerChunkY][centerChunkX][this.layer][y - centerChunkY * 16][x - centerChunkX * 16] = terrainsMap[EDGE].get(centerTile.toString())[Math.floor(Math.random() * terrainsMap[EDGE].get(centerTile.toString()).length)];
                            }
                            break;
                        case "both":
                            if (this.controlDown) {
                                // let tiles = [
                                //     [208, 248, 104],
                                //     [214, 255, 107],
                                //     [22, 31, 11],
                                // ];
                                let tiles = [
                                    [208, 104],
                                    [22, 11],
                                ];
                                for (let tileY = Math.max(y - 1, map.startY * 16); tileY <= Math.min(y, map.endY * 16 - 1); tileY++) {
                                    let chunkY = Math.floor(tileY / 16);
                                    for (let tileX = Math.max(x - 1, map.startX * 16); tileX <= Math.min(x, map.endX * 16 - 1); tileX++) {
                                // for (let tileY = Math.max(y - 1, map.startY * 16); tileY <= Math.min(y + 1, map.endY * 16 - 1); tileY++) {
                                //     let chunkY = Math.floor(tileY / 16);
                                //     for (let tileX = Math.max(x - 1, map.startX * 16); tileX <= Math.min(x + 1, map.endX * 16 - 1); tileX++) {
                                        let chunkX = Math.floor(tileX / 16);
                                        let tile = [0, 0, 0, 0, 0, 0, 0, 0, terrain];
                                        if (terrainsTileMap[BOTH].has(map.data[chunkY][chunkX][map.groundLayers[map.layers[this.layer].layer]][tileY - chunkY * 16][tileX - chunkX * 16])) {
                                            tile = structuredClone(terrainsTileMap[BOTH].get(map.data[chunkY][chunkX][map.groundLayers[map.layers[this.layer].layer]][tileY - chunkY * 16][tileX - chunkX * 16]));
                                        }
                                        if (tiles[tileY - y + 1][tileX - x + 1] % 2 == 1) {
                                            tile[0] = terrain;
                                        }
                                        if (Math.floor(tiles[tileY - y + 1][tileX - x + 1] / 2) % 2 == 1) {
                                            tile[1] = terrain;
                                        }
                                        if (Math.floor(tiles[tileY - y + 1][tileX - x + 1] / 4) % 2 == 1) {
                                            tile[2] = terrain;
                                        }
                                        if (Math.floor(tiles[tileY - y + 1][tileX - x + 1] / 8) % 2 == 1) {
                                            tile[3] = terrain;
                                        }
                                        if (Math.floor(tiles[tileY - y + 1][tileX - x + 1] / 16) % 2 == 1) {
                                            tile[4] = terrain;
                                        }
                                        if (Math.floor(tiles[tileY - y + 1][tileX - x + 1] / 32) % 2 == 1) {
                                            tile[5] = terrain;
                                        }
                                        if (Math.floor(tiles[tileY - y + 1][tileX - x + 1] / 64) % 2 == 1) {
                                            tile[6] = terrain;
                                        }
                                        if (Math.floor(tiles[tileY - y + 1][tileX - x + 1] / 128) % 2 == 1) {
                                            tile[7] = terrain;
                                        }
                                        if (terrainsMap[BOTH].has(tile.toString())) {
                                            map.data[chunkY][chunkX][map.groundLayers[map.layers[this.layer].layer]][tileY - chunkY * 16][tileX - chunkX * 16] = terrainsMap[BOTH].get(tile.toString())[Math.floor(Math.random() * terrainsMap[BOTH].get(tile.toString()).length)];
                                        }
                                        else if (terrainsMap[BOTH].has([terrain, terrain, terrain, terrain, terrain, terrain, terrain, terrain, terrain].toString())) {
                                            map.data[chunkY][chunkX][map.groundLayers[map.layers[this.layer].layer]][tileY - chunkY * 16][tileX - chunkX * 16] = terrainsMap[BOTH].get([terrain, terrain, terrain, terrain, terrain, terrain, terrain, terrain, terrain].toString())[Math.floor(Math.random() * terrainsMap[BOTH].get([terrain, terrain, terrain, terrain, terrain, terrain, terrain, terrain, terrain].toString()).length)];
                                        }
                                        this.placeHill(tileX, tileY, terrain, tile);
                                    }
                                }
                            }
                            else {
                                let centerChunkX = Math.floor(x / 16);
                                let centerChunkY = Math.floor(y / 16);
                                let centerTile = [0, 0, 0, 0, 0, 0, 0, 0, terrain];
                                if (terrainsTileMap[BOTH].has(map.data[centerChunkY][centerChunkX][this.layer][y - centerChunkY * 16][x - centerChunkX * 16])) {
                                    centerTile = structuredClone(terrainsTileMap[BOTH].get(map.data[centerChunkY][centerChunkX][this.layer][y - centerChunkY * 16][x - centerChunkX * 16]));
                                    if (centerTile[8] != terrain) {
                                        centerTile = [0, 0, 0, 0, 0, 0, 0, 0, terrain];
                                    }
                                }
                                for (let tileX = Math.max(x - 1, map.startX * 16); tileX <= Math.min(x + 1, map.endX * 16 - 1); tileX++) {
                                    if (tileX - x == 0) {
                                        continue;
                                    }
                                    let chunkX = Math.floor(tileX / 16);
                                    let chunkY = Math.floor(y / 16);
                                    if (terrainsTileMap[BOTH].has(map.data[chunkY][chunkX][this.layer][y - chunkY * 16][tileX - chunkX * 16])) {
                                        let tile = structuredClone(terrainsTileMap[BOTH].get(map.data[chunkY][chunkX][this.layer][y - chunkY * 16][tileX - chunkX * 16]));
                                        if (tile[8] == terrain) {
                                            tile[tileX - x == -1 ? 4 : 3] = terrain;
                                            centerTile[tileX - x == -1 ? 3 : 4] = terrain;
                                            if (terrainsMap[BOTH].has(tile.toString())) {
                                                map.data[chunkY][chunkX][this.layer][y - chunkY * 16][tileX - chunkX * 16] = terrainsMap[BOTH].get(tile.toString())[Math.floor(Math.random() * terrainsMap[BOTH].get(tile.toString()).length)];
                                            }
                                            this.placeHill(tileX, y, terrain, tile);
                                        }
                                        else {
                                            tile[tileX - x == -1 ? 4 : 3] = 0;
                                            if (terrainsMap[BOTH].has(tile.toString())) {
                                                map.data[chunkY][chunkX][this.layer][y - chunkY * 16][tileX - chunkX * 16] = terrainsMap[BOTH].get(tile.toString())[Math.floor(Math.random() * terrainsMap[BOTH].get(tile.toString()).length)];
                                            }
                                            this.placeHill(tileX, y, tile[4], tile);
                                        }
                                    }
                                }
                                for (let tileY = Math.max(y - 1, map.startY * 16); tileY <= Math.min(y + 1, map.endY * 16 - 1); tileY++) {
                                    if (tileY - y == 0) {
                                        continue;
                                    }
                                    let chunkX = Math.floor(x / 16);
                                    let chunkY = Math.floor(tileY / 16);
                                    if (terrainsTileMap[BOTH].has(map.data[chunkY][chunkX][this.layer][tileY - chunkY * 16][x - chunkX * 16])) {
                                        let tile = structuredClone(terrainsTileMap[BOTH].get(map.data[chunkY][chunkX][this.layer][tileY - chunkY * 16][x - chunkX * 16]));
                                        if (tile[8] == terrain) {
                                            tile[tileY - y == -1 ? 6 : 1] = terrain;
                                            centerTile[tileY - y == -1 ? 1 : 6] = terrain;
                                            if (terrainsMap[BOTH].has(tile.toString())) {
                                                map.data[chunkY][chunkX][this.layer][tileY - chunkY * 16][x - chunkX * 16] = terrainsMap[BOTH].get(tile.toString())[Math.floor(Math.random() * terrainsMap[BOTH].get(tile.toString()).length)];
                                            }
                                            this.placeHill(x, tileY, terrain, tile);
                                        }
                                        else {
                                            tile[tileY - y == -1 ? 6 : 1] = 0;
                                            if (terrainsMap[BOTH].has(tile.toString())) {
                                                map.data[chunkY][chunkX][this.layer][tileY - chunkY * 16][x - chunkX * 16] = terrainsMap[BOTH].get(tile.toString())[Math.floor(Math.random() * terrainsMap[BOTH].get(tile.toString()).length)];
                                            }
                                            this.placeHill(x, tileY, terrain, tile);
                                        }
                                    }
                                }
                                if (terrainsMap[BOTH].has(centerTile.toString())) {
                                    map.data[centerChunkY][centerChunkX][this.layer][y - centerChunkY * 16][x - centerChunkX * 16] = terrainsMap[BOTH].get(centerTile.toString())[Math.floor(Math.random() * terrainsMap[BOTH].get(centerTile.toString()).length)];
                                }
                                this.placeHill(x, y, terrain, centerTile);
                            }
                            break;
                    }
                    break;
                case OBJECTS:
                    if ((this.object == COLLISION && mapCollisions.value == "0") || this.object == PROJECTILE_COLLISION || this.object == SLOWDOWN || this.object == SLOPE) {
                        if (this.controlDown) {
                            map.objectData[this.object][chunkY][chunkX][this.objectLayer][y - chunkY * 16][x - chunkX * 16] = this.rightMouseDown ? 0 : 15;
                        }
                        else {
                            let tile = [0, 0, 0, 0];
                            let object = map.objectData[this.object][chunkY][chunkX][this.objectLayer][Math.floor(y) - chunkY * 16][Math.floor(x) - chunkX * 16];
                            if (object % 2 == 1) {
                                tile[0] = true;
                            }
                            if (Math.floor(object / 2) % 2 == 1) {
                                tile[1] = true;
                            }
                            if (Math.floor(object / 4) % 2 == 1) {
                                tile[2] = true;
                            }
                            if (Math.floor(object / 8) % 2 == 1) {
                                tile[3] = true;
                            }
                            if ((x * 2) % 2 == 0) {
                                if ((y * 2) % 2 == 0) {
                                    tile[0] = !this.rightMouseDown;
                                }
                                else {
                                    tile[2] = !this.rightMouseDown;
                                }
                            }
                            else {
                                if ((y * 2) % 2 == 0) {
                                    tile[1] = !this.rightMouseDown;
                                }
                                else {
                                    tile[3] = !this.rightMouseDown;
                                }
                            }
                            map.objectData[this.object][chunkY][chunkX][this.objectLayer][Math.floor(y) - chunkY * 16][Math.floor(x) - chunkX * 16] = 0;
                            if (tile[0]) {
                                map.objectData[this.object][chunkY][chunkX][this.objectLayer][Math.floor(y) - chunkY * 16][Math.floor(x) - chunkX * 16] += 1;
                            }
                            if (tile[1]) {
                                map.objectData[this.object][chunkY][chunkX][this.objectLayer][Math.floor(y) - chunkY * 16][Math.floor(x) - chunkX * 16] += 2;
                            }
                            if (tile[2]) {
                                map.objectData[this.object][chunkY][chunkX][this.objectLayer][Math.floor(y) - chunkY * 16][Math.floor(x) - chunkX * 16] += 4;
                            }
                            if (tile[3]) {
                                map.objectData[this.object][chunkY][chunkX][this.objectLayer][Math.floor(y) - chunkY * 16][Math.floor(x) - chunkX * 16] += 8;
                            }
                        }
                    }
                    break;
            }
        },
        placeHill: function(x, y, terrain, tile) {
            let sideTerrain = terrainsHillMap.get(terrain);
            sideTerrain += 1;
            let chunkX = Math.floor(x / 16);
            if (tile[6] != terrain) {
                for (let layer = map.layers[this.layer].layer; layer < map.layers[this.layer].layer + this.hillHeight; layer++) {
                    if (Math.floor((y + map.layers[this.layer].layer + this.hillHeight - layer - 1) / 16) < map.endY) {
                        map.data[Math.floor((y + map.layers[this.layer].layer + this.hillHeight - layer - 1) / 16)][chunkX][map.hillLayers[layer]][y + map.layers[this.layer].layer + this.hillHeight - layer - 1 - Math.floor((y + map.layers[this.layer].layer + this.hillHeight - layer - 1) / 16) * 16][x - chunkX * 16] = null;
                    }
                    let chunkY = Math.floor((y + map.layers[this.layer].layer + this.hillHeight - layer) / 16);
                    if (chunkY < map.endY) {
                        let sideTile = [0, 0, 0, 0, sideTerrain];
                        if (terrainsTileMap[EDGE].has(map.data[chunkY][chunkX][map.hillLayers[layer]][y + map.layers[this.layer].layer + this.hillHeight - layer - chunkY * 16][x - chunkX * 16])) {
                            sideTile = structuredClone(terrainsTileMap[EDGE].get(map.data[chunkY][chunkX][map.hillLayers[layer]][y + map.layers[this.layer].layer + this.hillHeight - layer - chunkY * 16][x - chunkX * 16]));
                            if (sideTile[4] != sideTerrain) {
                                sideTile = [0, 0, 0, 0, sideTerrain];
                            }
                        }
                        sideTile[2] = sideTerrain;
                        if (layer > 0 && Math.floor((y + map.layers[this.layer].layer + this.hillHeight - layer + 1) / 16) < map.endY && terrainsTileMap[EDGE].has(map.data[Math.floor((y + map.layers[this.layer].layer + this.hillHeight - layer + 1) / 16)][chunkX][map.hillLayers[layer - 1]][y + map.layers[this.layer].layer + this.hillHeight - layer + 1 - Math.floor((y + map.layers[this.layer].layer + this.hillHeight - layer + 1) / 16) * 16][x - chunkX * 16]) && terrainsTileMap[EDGE].get(map.data[Math.floor((y + map.layers[this.layer].layer + this.hillHeight - layer + 1) / 16)][chunkX][map.hillLayers[layer - 1]][y + map.layers[this.layer].layer + this.hillHeight - layer + 1 - Math.floor((y + map.layers[this.layer].layer + this.hillHeight - layer + 1) / 16) * 16][x - chunkX * 16])[2] == sideTerrain) {
                            sideTile[3] = sideTerrain;
                        }
                        if (tile[3] == terrain) {
                            sideTile[0] = sideTerrain;
                        }
                        if (tile[4] == terrain) {
                            sideTile[1] = sideTerrain;
                        }
                        if (terrainsMap[EDGE].has(sideTile.toString())) {
                            map.data[chunkY][chunkX][map.hillLayers[layer]][y + map.layers[this.layer].layer + this.hillHeight - layer - chunkY * 16][x - chunkX * 16] = terrainsMap[EDGE].get(sideTile.toString())[Math.floor(Math.random() * terrainsMap[EDGE].get(sideTile.toString()).length)];
                        }
                    }
                }
            }
            else {
                for (let layer = map.layers[this.layer].layer; layer < map.layers[this.layer].layer + this.hillHeight; layer++) {
                    let chunkY = Math.floor((y + map.layers[this.layer].layer + this.hillHeight - layer) / 16);
                    if (chunkY < map.endY) {
                        map.data[chunkY][chunkX][map.hillLayers[layer]][y + map.layers[this.layer].layer + this.hillHeight - layer - chunkY * 16][x - chunkX * 16] = null;
                    }
                }
            }
        },
        draw: function(x, y) {
            switch (this.mode) {
                case TILES:
                    if (!this.rightMouseDown) {
                        if (map.brush.random) {
                            ctx.drawImage(tilesImage, (this.tileStartX + Math.floor(Math.random() * (this.tileEndX - this.tileStartX + 1))) * 17, (this.tileStartY + Math.floor(Math.random() * (this.tileEndY - this.tileStartY + 1))) * 17, 16, 16, x * 16 * cameraZoom + cameraX, y * 16 * cameraZoom + cameraY, 16 * cameraZoom, 16 * cameraZoom);
                        }
                        else {
                            for (let tileY = this.tileStartY; tileY <= this.tileEndY; tileY++) {
                                let chunkY = Math.floor((y + tileY - this.tileStartY) / 16);
                                if (chunkY < map.startY || chunkY >= map.endY) {
                                    continue;
                                }
                                for (let tileX = this.tileStartX; tileX <= this.tileEndX; tileX++) {
                                    let chunkX = Math.floor((x + tileX - this.tileStartX) / 16);
                                    if (chunkX < map.startX || chunkX >= map.endX) {
                                        continue;
                                    }
                                    ctx.drawImage(tilesImage, tileX * 17, tileY * 17, 16, 16, (x + tileX - this.tileStartX) * 16 * cameraZoom + cameraX, (y + tileY - this.tileStartY) * 16 * cameraZoom + cameraY, 16 * cameraZoom, 16 * cameraZoom);
                                }
                            }
                        }
                    }
                    else {
                        ctx.fillStyle = "#ff0000";
                        ctx.fillRect(x * 16 * cameraZoom + cameraX, y * 16 * cameraZoom + cameraY, 16 * cameraZoom, 16 * cameraZoom);
                    }
                    break;
                case TERRAINS:
                    if (!this.rightMouseDown) {
                        let terrain = this.terrainGroup >= this.terrain ? this.terrainGroup * this.terrainGroup + this.terrainGroup + this.terrain : this.terrain * this.terrain + this.terrainGroup;
                        terrain += 1;
                        switch (terrains[this.terrainGroup].type) {
                            case "corner":
                                if (this.controlDown) {
                                    let tiles = [
                                        [8, 12, 4],
                                        [10, 15, 5],
                                        [2, 3, 1],
                                    ];
                                    for (let tileY = Math.max(y - 1, map.startY * 16); tileY <= Math.min(y + 1, map.endY * 16 - 1); tileY++) {
                                        let chunkY = Math.floor(tileY / 16);
                                        for (let tileX = Math.max(x - 1, map.startX * 16); tileX <= Math.min(x + 1, map.endX * 16 - 1); tileX++) {
                                            let chunkX = Math.floor(tileX / 16);
                                            let tile = [0, 0, 0, 0];
                                            if (terrainsTileMap[CORNER].has(map.data[chunkY][chunkX][this.layer][tileY - chunkY * 16][tileX - chunkX * 16])) {
                                                tile = structuredClone(terrainsTileMap[CORNER].get(map.data[chunkY][chunkX][this.layer][tileY - chunkY * 16][tileX - chunkX * 16]));
                                            }
                                            if (tiles[tileY - y + 1][tileX - x + 1] % 2 == 1) {
                                                tile[0] = terrain;
                                            }
                                            if (Math.floor(tiles[tileY - y + 1][tileX - x + 1] / 2) % 2 == 1) {
                                                tile[1] = terrain;
                                            }
                                            if (Math.floor(tiles[tileY - y + 1][tileX - x + 1] / 4) % 2 == 1) {
                                                tile[2] = terrain;
                                            }
                                            if (Math.floor(tiles[tileY - y + 1][tileX - x + 1] / 8) % 2 == 1) {
                                                tile[3] = terrain;
                                            }
                                            if (terrainsMap[CORNER].has(tile.toString())) {
                                                let tileId = terrainsMap[CORNER].get(tile.toString())[Math.floor(Math.random() * terrainsMap[CORNER].get(tile.toString()).length)];
                                                ctx.drawImage(tilesImage, (tileId % 86) * 17, Math.floor(tileId / 86) * 17, 16, 16, tileX * 16 * cameraZoom + cameraX, tileY * 16 * cameraZoom + cameraY, 16 * cameraZoom, 16 * cameraZoom);
                                            }
                                        }
                                    }
                                }
                                else {
                                    let tiles = [
                                        [8, 4],
                                        [2, 1],
                                    ];
                                    for (let tileY = Math.max(y - 1, map.startY * 16); tileY <= Math.min(y, map.endY * 16 - 1); tileY++) {
                                        let chunkY = Math.floor(tileY / 16);
                                        for (let tileX = Math.max(x - 1, map.startX * 16); tileX <= Math.min(x, map.endX * 16 - 1); tileX++) {
                                            let chunkX = Math.floor(tileX / 16);
                                            let tile = [0, 0, 0, 0];
                                            if (terrainsTileMap[CORNER].has(map.data[chunkY][chunkX][this.layer][tileY - chunkY * 16][tileX - chunkX * 16])) {
                                                tile = structuredClone(terrainsTileMap[CORNER].get(map.data[chunkY][chunkX][this.layer][tileY - chunkY * 16][tileX - chunkX * 16]));
                                            }
                                            if (tiles[tileY - y + 1][tileX - x + 1] % 2 == 1) {
                                                tile[0] = terrain;
                                            }
                                            if (Math.floor(tiles[tileY - y + 1][tileX - x + 1] / 2) % 2 == 1) {
                                                tile[1] = terrain;
                                            }
                                            if (Math.floor(tiles[tileY - y + 1][tileX - x + 1] / 4) % 2 == 1) {
                                                tile[2] = terrain;
                                            }
                                            if (Math.floor(tiles[tileY - y + 1][tileX - x + 1] / 8) % 2 == 1) {
                                                tile[3] = terrain;
                                            }
                                            if (terrainsMap[CORNER].has(tile.toString())) {
                                                let tileId = terrainsMap[CORNER].get(tile.toString())[Math.floor(Math.random() * terrainsMap[CORNER].get(tile.toString()).length)];
                                                ctx.drawImage(tilesImage, (tileId % 86) * 17, Math.floor(tileId / 86) * 17, 16, 16, tileX * 16 * cameraZoom + cameraX, tileY * 16 * cameraZoom + cameraY, 16 * cameraZoom, 16 * cameraZoom);
                                            }
                                        }
                                    }
                                }
                                break;
                            case "edge":
                                let centerChunkX = Math.floor(x / 16);
                                let centerChunkY = Math.floor(y / 16);
                                let centerTile = [0, 0, 0, 0, terrain];
                                if (terrainsTileMap[EDGE].has(map.data[centerChunkY][centerChunkX][this.layer][y - centerChunkY * 16][x - centerChunkX * 16])) {
                                    centerTile = structuredClone(terrainsTileMap[EDGE].get(map.data[centerChunkY][centerChunkX][this.layer][y - centerChunkY * 16][x - centerChunkX * 16]));
                                    if (centerTile[4] != terrain) {
                                        centerTile = [0, 0, 0, 0, terrain];
                                    }
                                }
                                for (let tileX = Math.max(x - 1, map.startX * 16); tileX <= Math.min(x + 1, map.endX * 16 - 1); tileX++) {
                                    if (tileX - x == 0) {
                                        continue;
                                    }
                                    let chunkX = Math.floor(tileX / 16);
                                    let chunkY = Math.floor(y / 16);
                                    if (terrainsTileMap[EDGE].has(map.data[chunkY][chunkX][this.layer][y - chunkY * 16][tileX - chunkX * 16])) {
                                        let tile = structuredClone(terrainsTileMap[EDGE].get(map.data[chunkY][chunkX][this.layer][y - chunkY * 16][tileX - chunkX * 16]));
                                        if (tile[4] == terrain) {
                                            tile[tileX - x == -1 ? 1 : 0] = terrain;
                                            centerTile[tileX - x == -1 ? 0 : 1] = terrain;
                                            if (terrainsMap[EDGE].has(tile.toString())) {
                                                let tileId = terrainsMap[EDGE].get(tile.toString())[Math.floor(Math.random() * terrainsMap[EDGE].get(tile.toString()).length)];
                                                ctx.drawImage(tilesImage, (tileId % 86) * 17, Math.floor(tileId / 86) * 17, 16, 16, tileX * 16 * cameraZoom + cameraX, y * 16 * cameraZoom + cameraY, 16 * cameraZoom, 16 * cameraZoom);
                                            }
                                        }
                                        else {
                                            tile[tileX - x == -1 ? 1 : 0] = 0;
                                            if (terrainsMap[EDGE].has(tile.toString())) {
                                                let tileId = terrainsMap[EDGE].get(tile.toString())[Math.floor(Math.random() * terrainsMap[EDGE].get(tile.toString()).length)];
                                                ctx.drawImage(tilesImage, (tileId % 86) * 17, Math.floor(tileId / 86) * 17, 16, 16, tileX * 16 * cameraZoom + cameraX, y * 16 * cameraZoom + cameraY, 16 * cameraZoom, 16 * cameraZoom);
                                            }
                                        }
                                    }
                                }
                                for (let tileY = Math.max(y - 1, map.startY * 16); tileY <= Math.min(y + 1, map.endY * 16 - 1); tileY++) {
                                    if (tileY - y == 0) {
                                        continue;
                                    }
                                    let chunkX = Math.floor(x / 16);
                                    let chunkY = Math.floor(tileY / 16);
                                    if (terrainsTileMap[EDGE].has(map.data[chunkY][chunkX][this.layer][tileY - chunkY * 16][x - chunkX * 16])) {
                                        let tile = structuredClone(terrainsTileMap[EDGE].get(map.data[chunkY][chunkX][this.layer][tileY - chunkY * 16][x - chunkX * 16]));
                                        if (tile[4] == terrain) {
                                            tile[tileY - y == -1 ? 3 : 2] = terrain;
                                            centerTile[tileY - y == -1 ? 2 : 3] = terrain;
                                            if (terrainsMap[EDGE].has(tile.toString())) {
                                                let tileId = terrainsMap[EDGE].get(tile.toString())[Math.floor(Math.random() * terrainsMap[EDGE].get(tile.toString()).length)];
                                                ctx.drawImage(tilesImage, (tileId % 86) * 17, Math.floor(tileId / 86) * 17, 16, 16, x * 16 * cameraZoom + cameraX, tileY * 16 * cameraZoom + cameraY, 16 * cameraZoom, 16 * cameraZoom);
                                            }
                                        }
                                        else {
                                            tile[tileY - y == -1 ? 3 : 2] = 0;
                                            if (terrainsMap[EDGE].has(tile.toString())) {
                                                let tileId = terrainsMap[EDGE].get(tile.toString())[Math.floor(Math.random() * terrainsMap[EDGE].get(tile.toString()).length)];
                                                ctx.drawImage(tilesImage, (tileId % 86) * 17, Math.floor(tileId / 86) * 17, 16, 16, x * 16 * cameraZoom + cameraX, tileY * 16 * cameraZoom + cameraY, 16 * cameraZoom, 16 * cameraZoom);
                                            }
                                        }
                                    }
                                }
                                if (terrainsMap[EDGE].has(centerTile.toString())) {
                                    let tileId = terrainsMap[EDGE].get(centerTile.toString())[Math.floor(Math.random() * terrainsMap[EDGE].get(centerTile.toString()).length)];
                                    ctx.drawImage(tilesImage, (tileId % 86) * 17, Math.floor(tileId / 86) * 17, 16, 16, x * 16 * cameraZoom + cameraX, y * 16 * cameraZoom + cameraY, 16 * cameraZoom, 16 * cameraZoom);
                                }
                                break;
                            case "both":
                                if (this.controlDown) {
                                    let tiles = [
                                        [208, 104],
                                        [22, 11],
                                    ];
                                    for (let tileY = Math.max(y - 1, map.startY * 16); tileY <= Math.min(y, map.endY * 16 - 1); tileY++) {
                                        let chunkY = Math.floor(tileY / 16);
                                        for (let tileX = Math.max(x - 1, map.startX * 16); tileX <= Math.min(x, map.endX * 16 - 1); tileX++) {
                                            let chunkX = Math.floor(tileX / 16);
                                            let tile = [0, 0, 0, 0, 0, 0, 0, 0, terrain];
                                            if (terrainsTileMap[BOTH].has(map.data[chunkY][chunkX][map.groundLayers[map.layers[this.layer].layer]][tileY - chunkY * 16][tileX - chunkX * 16])) {
                                                tile = structuredClone(terrainsTileMap[BOTH].get(map.data[chunkY][chunkX][map.groundLayers[map.layers[this.layer].layer]][tileY - chunkY * 16][tileX - chunkX * 16]));
                                            }
                                            if (tiles[tileY - y + 1][tileX - x + 1] % 2 == 1) {
                                                tile[0] = terrain;
                                            }
                                            if (Math.floor(tiles[tileY - y + 1][tileX - x + 1] / 2) % 2 == 1) {
                                                tile[1] = terrain;
                                            }
                                            if (Math.floor(tiles[tileY - y + 1][tileX - x + 1] / 4) % 2 == 1) {
                                                tile[2] = terrain;
                                            }
                                            if (Math.floor(tiles[tileY - y + 1][tileX - x + 1] / 8) % 2 == 1) {
                                                tile[3] = terrain;
                                            }
                                            if (Math.floor(tiles[tileY - y + 1][tileX - x + 1] / 16) % 2 == 1) {
                                                tile[4] = terrain;
                                            }
                                            if (Math.floor(tiles[tileY - y + 1][tileX - x + 1] / 32) % 2 == 1) {
                                                tile[5] = terrain;
                                            }
                                            if (Math.floor(tiles[tileY - y + 1][tileX - x + 1] / 64) % 2 == 1) {
                                                tile[6] = terrain;
                                            }
                                            if (Math.floor(tiles[tileY - y + 1][tileX - x + 1] / 128) % 2 == 1) {
                                                tile[7] = terrain;
                                            }
                                            if (terrainsMap[BOTH].has(tile.toString())) {
                                                let tileId = terrainsMap[BOTH].get(tile.toString())[Math.floor(Math.random() * terrainsMap[BOTH].get(tile.toString()).length)];
                                                ctx.drawImage(tilesImage, (tileId % 86) * 17, Math.floor(tileId / 86) * 17, 16, 16, tileX * 16 * cameraZoom + cameraX, tileY * 16 * cameraZoom + cameraY, 16 * cameraZoom, 16 * cameraZoom);
                                            }
                                            else if (terrainsMap[BOTH].has([terrain, terrain, terrain, terrain, terrain, terrain, terrain, terrain, terrain].toString())) {
                                                let tileId = terrainsMap[BOTH].get([terrain, terrain, terrain, terrain, terrain, terrain, terrain, terrain, terrain].toString())[Math.floor(Math.random() * terrainsMap[BOTH].get([terrain, terrain, terrain, terrain, terrain, terrain, terrain, terrain, terrain].toString()).length)];
                                                ctx.drawImage(tilesImage, (tileId % 86) * 17, Math.floor(tileId / 86) * 17, 16, 16, tileX * 16 * cameraZoom + cameraX, tileY * 16 * cameraZoom + cameraY, 16 * cameraZoom, 16 * cameraZoom);
                                            }
                                            this.drawHill(tileX, tileY, terrain, tile);
                                        }
                                    }
                                }
                                else {
                                    let centerChunkX = Math.floor(x / 16);
                                    let centerChunkY = Math.floor(y / 16);
                                    let centerTile = [0, 0, 0, 0, 0, 0, 0, 0, terrain];
                                    if (terrainsTileMap[BOTH].has(map.data[centerChunkY][centerChunkX][this.layer][y - centerChunkY * 16][x - centerChunkX * 16])) {
                                        centerTile = structuredClone(terrainsTileMap[BOTH].get(map.data[centerChunkY][centerChunkX][this.layer][y - centerChunkY * 16][x - centerChunkX * 16]));
                                        if (centerTile[8] != terrain) {
                                            centerTile = [0, 0, 0, 0, 0, 0, 0, 0, terrain];
                                        }
                                    }
                                    for (let tileX = Math.max(x - 1, map.startX * 16); tileX <= Math.min(x + 1, map.endX * 16 - 1); tileX++) {
                                        if (tileX - x == 0) {
                                            continue;
                                        }
                                        let chunkX = Math.floor(tileX / 16);
                                        let chunkY = Math.floor(y / 16);
                                        if (terrainsTileMap[BOTH].has(map.data[chunkY][chunkX][this.layer][y - chunkY * 16][tileX - chunkX * 16])) {
                                            let tile = structuredClone(terrainsTileMap[BOTH].get(map.data[chunkY][chunkX][this.layer][y - chunkY * 16][tileX - chunkX * 16]));
                                            if (tile[8] == terrain) {
                                                tile[tileX - x == -1 ? 4 : 3] = terrain;
                                                centerTile[tileX - x == -1 ? 3 : 4] = terrain;
                                                if (terrainsMap[BOTH].has(tile.toString())) {
                                                    let tileId = terrainsMap[BOTH].get(tile.toString())[Math.floor(Math.random() * terrainsMap[BOTH].get(tile.toString()).length)];
                                                    ctx.drawImage(tilesImage, (tileId % 86) * 17, Math.floor(tileId / 86) * 17, 16, 16, tileX * 16 * cameraZoom + cameraX, y * 16 * cameraZoom + cameraY, 16 * cameraZoom, 16 * cameraZoom);
                                                }
                                                this.drawHill(tileX, y, terrain, tile);
                                            }
                                            else {
                                                tile[tileX - x == -1 ? 4 : 3] = 0;
                                                if (terrainsMap[BOTH].has(tile.toString())) {
                                                    let tileId = terrainsMap[BOTH].get(tile.toString())[Math.floor(Math.random() * terrainsMap[BOTH].get(tile.toString()).length)];
                                                    ctx.drawImage(tilesImage, (tileId % 86) * 17, Math.floor(tileId / 86) * 17, 16, 16, tileX * 16 * cameraZoom + cameraX, y * 16 * cameraZoom + cameraY, 16 * cameraZoom, 16 * cameraZoom);
                                                }
                                                this.drawHill(tileX, y, tile[4], tile);
                                            }
                                        }
                                    }
                                    for (let tileY = Math.max(y - 1, map.startY * 16); tileY <= Math.min(y + 1, map.endY * 16 - 1); tileY++) {
                                        if (tileY - y == 0) {
                                            continue;
                                        }
                                        let chunkX = Math.floor(x / 16);
                                        let chunkY = Math.floor(tileY / 16);
                                        if (terrainsTileMap[BOTH].has(map.data[chunkY][chunkX][this.layer][tileY - chunkY * 16][x - chunkX * 16])) {
                                            let tile = structuredClone(terrainsTileMap[BOTH].get(map.data[chunkY][chunkX][this.layer][tileY - chunkY * 16][x - chunkX * 16]));
                                            if (tile[8] == terrain) {
                                                tile[tileY - y == -1 ? 6 : 1] = terrain;
                                                centerTile[tileY - y == -1 ? 1 : 6] = terrain;
                                                if (terrainsMap[BOTH].has(tile.toString())) {
                                                    let tileId = terrainsMap[BOTH].get(tile.toString())[Math.floor(Math.random() * terrainsMap[BOTH].get(tile.toString()).length)];
                                                    ctx.drawImage(tilesImage, (tileId % 86) * 17, Math.floor(tileId / 86) * 17, 16, 16, x * 16 * cameraZoom + cameraX, tileY * 16 * cameraZoom + cameraY, 16 * cameraZoom, 16 * cameraZoom);
                                                }
                                                this.drawHill(x, tileY, terrain, tile);
                                            }
                                            else {
                                                tile[tileY - y == -1 ? 6 : 1] = 0;
                                                if (terrainsMap[BOTH].has(tile.toString())) {
                                                    let tileId = terrainsMap[BOTH].get(tile.toString())[Math.floor(Math.random() * terrainsMap[BOTH].get(tile.toString()).length)];
                                                    ctx.drawImage(tilesImage, (tileId % 86) * 17, Math.floor(tileId / 86) * 17, 16, 16, x * 16 * cameraZoom + cameraX, tileY * 16 * cameraZoom + cameraY, 16 * cameraZoom, 16 * cameraZoom);
                                                }
                                                this.drawHill(x, tileY, terrain, tile);
                                            }
                                        }
                                    }
                                    if (terrainsMap[BOTH].has(centerTile.toString())) {
                                        let tileId = terrainsMap[BOTH].get(centerTile.toString())[Math.floor(Math.random() * terrainsMap[BOTH].get(centerTile.toString()).length)];
                                        ctx.drawImage(tilesImage, (tileId % 86) * 17, Math.floor(tileId / 86) * 17, 16, 16, x * 16 * cameraZoom + cameraX, y * 16 * cameraZoom + cameraY, 16 * cameraZoom, 16 * cameraZoom);
                                    }
                                    this.drawHill(x, y, terrain, centerTile);
                                }
                                break;
                        }
                    }
                    else {
                        if ((!map.brush.controlDown && terrains[map.brush.terrainGroup].type != "corner") || (map.brush.controlDown && terrains[map.brush.terrainGroup].type != "both")) {
                            ctx.fillStyle = "#ff0000";
                            ctx.fillRect(x * 16 * cameraZoom + cameraX, y * 16 * cameraZoom + cameraY, 16 * cameraZoom, 16 * cameraZoom);
                        }
                        else {
                            ctx.fillStyle = "#ff0000";
                            ctx.fillRect((x - 0.5) * 16 * cameraZoom + cameraX, (y - 0.5) * 16 * cameraZoom + cameraY, 16 * cameraZoom, 16 * cameraZoom);
                        }
                    }
                    break;
                case OBJECTS:
                    break;
            }
        },
        drawHill: function(x, y, terrain, tile) {
            let sideTerrain = terrainsHillMap.get(terrain);
            sideTerrain += 1;
            let chunkX = Math.floor(x / 16);
            if (tile[6] != terrain) {
                for (let layer = map.layers[this.layer].layer; layer < map.layers[this.layer].layer + this.hillHeight; layer++) {
                    // if (Math.floor((y + map.layers[this.layer].layer + this.hillHeight - layer - 1) / 16) < map.endY) {
                    //     map.data[Math.floor((y + map.layers[this.layer].layer + this.hillHeight - layer - 1) / 16)][chunkX][map.hillLayers[layer]][y + map.layers[this.layer].layer + this.hillHeight - layer - 1 - Math.floor((y + map.layers[this.layer].layer + this.hillHeight - layer - 1) / 16) * 16][x - chunkX * 16] = null;
                    // }
                    let chunkY = Math.floor((y + map.layers[this.layer].layer + this.hillHeight - layer) / 16);
                    if (chunkY < map.endY) {
                        let sideTile = [0, 0, 0, 0, sideTerrain];
                        if (terrainsTileMap[EDGE].has(map.data[chunkY][chunkX][map.hillLayers[layer]][y + map.layers[this.layer].layer + this.hillHeight - layer - chunkY * 16][x - chunkX * 16])) {
                            sideTile = structuredClone(terrainsTileMap[EDGE].get(map.data[chunkY][chunkX][map.hillLayers[layer]][y + map.layers[this.layer].layer + this.hillHeight - layer - chunkY * 16][x - chunkX * 16]));
                            if (sideTile[4] != sideTerrain) {
                                sideTile = [0, 0, 0, 0, sideTerrain];
                            }
                        }
                        sideTile[2] = sideTerrain;
                        if (layer > 0 && Math.floor((y + map.layers[this.layer].layer + this.hillHeight - layer + 1) / 16) < map.endY && terrainsTileMap[EDGE].has(map.data[Math.floor((y + map.layers[this.layer].layer + this.hillHeight - layer + 1) / 16)][chunkX][map.hillLayers[layer - 1]][y + map.layers[this.layer].layer + this.hillHeight - layer + 1 - Math.floor((y + map.layers[this.layer].layer + this.hillHeight - layer + 1) / 16) * 16][x - chunkX * 16]) && terrainsTileMap[EDGE].get(map.data[Math.floor((y + map.layers[this.layer].layer + this.hillHeight - layer + 1) / 16)][chunkX][map.hillLayers[layer - 1]][y + map.layers[this.layer].layer + this.hillHeight - layer + 1 - Math.floor((y + map.layers[this.layer].layer + this.hillHeight - layer + 1) / 16) * 16][x - chunkX * 16])[2] == sideTerrain) {
                            sideTile[3] = sideTerrain;
                        }
                        if (tile[3] == terrain) {
                            sideTile[0] = sideTerrain;
                        }
                        if (tile[4] == terrain) {
                            sideTile[1] = sideTerrain;
                        }
                        if (terrainsMap[EDGE].has(sideTile.toString())) {
                            let tileId = terrainsMap[EDGE].get(sideTile.toString())[Math.floor(Math.random() * terrainsMap[EDGE].get(sideTile.toString()).length)];
                            ctx.drawImage(tilesImage, (tileId % 86) * 17, Math.floor(tileId / 86) * 17, 16, 16, x * 16 * cameraZoom + cameraX, (y + map.layers[this.layer].layer + this.hillHeight - layer) * 16 * cameraZoom + cameraY, 16 * cameraZoom, 16 * cameraZoom);
                        }
                    }
                }
            }
            else {
                for (let layer = map.layers[this.layer].layer; layer < map.layers[this.layer].layer + this.hillHeight; layer++) {
                    let chunkY = Math.floor((y + map.layers[this.layer].layer + this.hillHeight - layer) / 16);
                    if (chunkY < map.endY) {
                        // map.data[chunkY][chunkX][map.hillLayers[layer]][y + map.layers[this.layer].layer + this.hillHeight - layer - chunkY * 16][x - chunkX * 16] = null;
                    }
                }
            }
        },
    },
};

map.brush.changeObject(COLLISION);

mapBrushMode.addEventListener("input", function() {
    map.brush.mode = Number(mapBrushMode.value);
});
mapBrushTool.addEventListener("input", function() {
    map.brush.tool = Number(mapBrushTool.value);
});
mapRandomInput.addEventListener("input", function() {
    map.brush.random = mapRandomInput.checked;
});
mapGridInput.addEventListener("input", function() {
    map.brush.grid = mapGridInput.checked;
});
mapHighlightLayerInput.addEventListener("input", function() {
    map.brush.highlightLayer = mapHighlightLayerInput.checked;
});
mapHillHeightInput.addEventListener("input", function() {
    map.brush.height = Number(mapHillHeightInput.value);
});
mapShowObjectsInput.addEventListener("input", function() {
    map.brush.showObjects = mapShowObjectsInput.checked;
});
mapObjectLayerInput.addEventListener("input", function() {
    map.brush.objectLayer = Number(mapObjectLayerInput.value);
    if (map.brush.objectLayer >= map.objectLayers) {
        for (let object = COLLISION; object <= PARTICLE_GENERATOR; object++) {
            for (let chunkY = map.startY; chunkY < map.endY; chunkY++) {
                for (let chunkX = map.startX; chunkX < map.endX; chunkX++) {
                    for (let layer = map.objectLayers; layer <= map.brush.objectLayer; layer++) {
                        map.objectData[object][chunkY][chunkX][layer] = [];
                        for (let y = 0; y < 16; y++) {
                            map.objectData[object][chunkY][chunkX][layer][y] = [];
                            for (let x = 0; x < 16; x++) {
                                map.objectData[object][chunkY][chunkX][layer][y][x] = null;
                            }
                        }
                    }
                }
            }
        }
        map.objectLayers = map.brush.objectLayer + 1;
    }
});
mapObjects.addEventListener("input", function() {
    map.brush.changeObject(mapObjects.value);
});

// ground terrain layer 0
// ground overlay
// hill below
// hill above
// below
// above

// loop through layers for terrains

const loadLayers = function() {
    mapLayers.innerHTML = "";
    mapLayerDivs = [];
    for (let i = 0; i < map.layers.length; i++) {
        const label = document.createElement("div");
        label.classList.add("mapLayer");
        label.addEventListener("click", function() {
            mapLayerDivs[map.brush.layer].classList.remove("mapLayerSelected");
            map.brush.layer = i;
            label.classList.add("mapLayerSelected");
        });
        mapLayerDivs[i] = label;
        const nameInput = document.createElement("input");
        nameInput.classList.add("mapLayerNameInput");
        nameInput.type = "text";
        nameInput.value = map.layers[i].name;
        nameInput.addEventListener("input", function() {
            map.layers[i].name = nameInput.value;
            updateLayers();
        });
        label.appendChild(nameInput);
        const buttonUp = document.createElement("button");
        buttonUp.classList.add("mapLayerButtonUp");
        buttonUp.innerText = "V";
        buttonUp.addEventListener("click", function(event) {
            event.stopPropagation();
            if (i == 0) {
                return;
            }
            let layer = map.layers[i];
            map.layers[i] = map.layers[i - 1];
            map.layers[i - 1] = layer;
            for (let chunkY = map.startY; chunkY < map.endY; chunkY++) {
                for (let chunkX = map.startX; chunkX < map.endX; chunkX++) {
                    let data = map.data[chunkY][chunkX][i];
                    map.data[chunkY][chunkX][i] = map.data[chunkY][chunkX][i - 1];
                    map.data[chunkY][chunkX][i - 1] = data;
                }
            }
            if (map.brush.layer == i) {
                map.brush.layer = i - 1;
            }
            else if (map.brush.layer == i - 1) {
                map.brush.layer = i;
            }
            loadLayers();
        });
        label.appendChild(buttonUp);
        const buttonDown = document.createElement("button");
        buttonDown.classList.add("mapLayerButtonDown");
        buttonDown.innerText = "V";
        buttonDown.addEventListener("click", function(event) {
            event.stopPropagation();
            if (i == map.layers.length - 1) {
                return;
            }
            let layer = map.layers[i];
            map.layers[i] = map.layers[i + 1];
            map.layers[i + 1] = layer;
            for (let chunkY = map.startY; chunkY < map.endY; chunkY++) {
                for (let chunkX = map.startX; chunkX < map.endX; chunkX++) {
                    let data = map.data[chunkY][chunkX][i];
                    map.data[chunkY][chunkX][i] = map.data[chunkY][chunkX][i + 1];
                    map.data[chunkY][chunkX][i + 1] = data;
                }
            }
            if (map.brush.layer == i) {
                map.brush.layer = i + 1;
            }
            else if (map.brush.layer == i + 1) {
                map.brush.layer = i;
            }
            loadLayers();
        });
        label.appendChild(buttonDown);
        const layerInput = document.createElement("input");
        layerInput.classList.add("mapLayerInput");
        layerInput.type = "number";
        layerInput.value = map.layers[i].layer;
        layerInput.addEventListener("input", function() {
            map.layers[i].layer = Number(layerInput.value);
            updateLayers();
        });
        label.appendChild(layerInput);
        mapLayers.appendChild(label);
    }
    mapLayerDivs[map.brush.layer].classList.add("mapLayerSelected");
    updateLayers();
};
const updateLayers = function() {
    map.groundLayers = [];
    map.hillLayers = [];
    for (let i = 0; i < map.layers.length; i++) {
        if (map.layers[i].name == "Ground") {
            map.groundLayers[map.layers[i].layer] = i;
        }
        else if (map.layers[i].name == "Hill") {
            map.hillLayers[map.layers[i].layer] = i;
        }
    }
};

let tilesCameraX = 0;
let tilesCameraY = 0;
let tilesCameraZoom = 1;
let tilesCameraDragging = false;

let tilesWidth = 0;
let tilesHeight = 0;

const tilesOffscreenCanvas = createOffscreenCanvas();
const tilesOffscreenCtx = tilesOffscreenCanvas.getContext("2d");
let tilesImage = new Image();
tilesImage.src = "./../maps/tiles.png";
let tilesImageLoaded = false;
tilesImage.addEventListener("load", function() {
    tilesImageLoaded = true;

    tilesWidth = Math.floor((tilesImage.width + 1) / 17);
    tilesHeight = Math.floor((tilesImage.height + 1) / 17);
    tilesOffscreenCanvas.width = tilesWidth * 16;
    tilesOffscreenCanvas.height = tilesHeight * 16;
    resetCanvas(tilesOffscreenCtx);

    for (let y = 0; y < tilesHeight; y++) {
        for (let x = 0; x < tilesWidth; x++) {
            tilesOffscreenCtx.drawImage(tilesImage, x * 17, y * 17, 16, 16, x * 16, y * 16, 16, 16);
        }
    }
});
const awaitTilesImageLoad = function(resolve, reject) {
    if (tilesImageLoaded) {
        resolve();
    }
    else {
        setTimeout(function() {
            awaitTilesImageLoad(resolve, reject);
        }, 10);
    }
};
let tileLayers = null;
const loadTileLayers = function(resolve, reject) {
    if (tileLayers == null) {
        let request = new XMLHttpRequest();
        request.open("GET", "./../maps/tiles.json", true);
        request.onload = function() {
            if (this.status >= 200 && this.status < 400) {
                tileLayers = JSON.parse(this.response);
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
    }
    else {
        resolve();
    }
};

let terrains = null;
let terrainsMap = [new Map(), new Map(), new Map()];
let terrainsTileMap = [new Map(), new Map(), new Map()];
let terrainsHillMap = new Map();

const loadTerrains = async function(resolve, reject) {
    if (terrains == null) {
        await new Promise(awaitTilesImageLoad);
        let request = new XMLHttpRequest();
        request.open("GET", "./../maps/terrains.json", true);
        request.onload = function() {
            if (this.status >= 200 && this.status < 400) {
                terrains = JSON.parse(this.response);
                const terrainsCanvas = createCanvas(16, 16);
                const terrainsCtx = terrainsCanvas.getContext("2d");
                resetCanvas(terrainsCtx);
                for (let i = 0; i < terrains.length; i++) {
                    const groupLabel = document.createElement("b");
                    groupLabel.innerText = terrains[i].name;
                    mapTerrains.appendChild(groupLabel);
                    const group = document.createElement("div");
                    mapTerrains.appendChild(group);
                    mapTerrainDivs[i] = [];
                    for (let j = 0; j < terrains[i].terrains.length; j++) {
                        const div = document.createElement("div");
                        div.classList.add("mapTerrain");
                        div.addEventListener("click", function() {
                            map.brush.changeMode(TERRAINS);
                            mapTerrainDivs[map.brush.terrainGroup][map.brush.terrain].classList.remove("mapTerrainSelected");
                            map.brush.terrainGroup = i;
                            map.brush.terrain = j;
                            div.classList.add("mapTerrainSelected");
                        });
                        mapTerrainDivs[i][j] = div;
                        group.appendChild(div);
                        const image = document.createElement("img");
                        terrainsCtx.clearRect(0, 0, 16, 16);
                        terrainsCtx.drawImage(tilesImage, terrains[i].terrains[j].image % tilesWidth * 17, Math.floor(terrains[i].terrains[j].image / tilesWidth) * 17, 16, 16, 0, 0, 16, 16);
                        image.src = terrainsCanvas.toDataURL("image/png");
                        image.classList.add("mapTerrainsImage");
                        div.appendChild(image);
                        const label = document.createElement("div");
                        label.innerText = terrains[i].terrains[j].name;
                        div.appendChild(label);
                    }
                }
                mapTerrainDivs[map.brush.terrainGroup][map.brush.terrain].classList.add("mapTerrainSelected");
                for (let i = 0; i < terrains.length; i++) {
                    for (let j = 0; j < terrains[i].terrains.length; j++) {
                        let terrain = i >= j ? i * i + i + j : j * j + i;
                        terrain += 1;
                        switch (terrains[i].type) {
                            case "corner":
                                for (let k = 1; k < 16; k++) {
                                    if (terrains[i].terrains[j][k] == null) {
                                        continue;
                                    }
                                    for (let l = 0; l < terrains[i].terrains[j][k].length; l++) {
                                        if (!terrainsTileMap[CORNER].has(terrains[i].terrains[j][k][l])) {
                                            terrainsTileMap[CORNER].set(terrains[i].terrains[j][k][l], [0, 0, 0, 0]);
                                        }
                                        else if (k == 15) {
                                            let value = [terrain, terrain, terrain, terrain].toString();
                                            if (!terrainsMap[CORNER].has(value)) {
                                                terrainsMap[CORNER].set(value, []);
                                            }
                                            let tiles = terrainsMap[CORNER].get(value);
                                            tiles.push(terrains[i].terrains[j][k][l]);
                                            terrainsMap[CORNER].set(value, tiles);
                                            continue;
                                        }
                                        let tile = terrainsTileMap[CORNER].get(terrains[i].terrains[j][k][l]);
                                        if (k % 2 == 1) {
                                            tile[0] = terrain;
                                        }
                                        if (Math.floor(k / 2) % 2 == 1) {
                                            tile[1] = terrain;
                                        }
                                        if (Math.floor(k / 4) % 2 == 1) {
                                            tile[2] = terrain;
                                        }
                                        if (Math.floor(k / 8) % 2 == 1) {
                                            tile[3] = terrain;
                                        }
                                        terrainsTileMap[CORNER].set(terrains[i].terrains[j][k][l], tile);
                                    }
                                }
                                break;
                            case "edge":
                                for (let k = 1; k < 16; k++) {
                                    if (terrains[i].terrains[j][k] == null) {
                                        continue;
                                    }
                                    for (let l = 0; l < terrains[i].terrains[j][k].length; l++) {
                                        if (!terrainsTileMap[EDGE].has(terrains[i].terrains[j][k][l])) {
                                            terrainsTileMap[EDGE].set(terrains[i].terrains[j][k][l], [0, 0, 0, 0, terrain]);
                                        }
                                        let tile = terrainsTileMap[EDGE].get(terrains[i].terrains[j][k][l]);
                                        if (k % 2 == 1) {
                                            tile[0] = terrain;
                                        }
                                        if (Math.floor(k / 2) % 2 == 1) {
                                            tile[1] = terrain;
                                        }
                                        if (Math.floor(k / 4) % 2 == 1) {
                                            tile[2] = terrain;
                                        }
                                        if (Math.floor(k / 8) % 2 == 1) {
                                            tile[3] = terrain;
                                        }
                                        tile[4] = terrain;
                                        terrainsTileMap[EDGE].set(terrains[i].terrains[j][k][l], tile);
                                    }
                                }
                                for (let k = 0; k < terrains[i].terrains[j][-1].length; k++) {
                                    terrainsTileMap[EDGE].set(terrains[i].terrains[j][-1][k], [0, 0, 0, 0, terrain]);
                                }
                                break;
                            case "both":
                                for (let k = 0; k < 256; k++) {
                                    if (terrains[i].terrains[j][k] == null) {
                                        continue;
                                    }
                                    for (let l = 0; l < terrains[i].terrains[j][k].length; l++) {
                                        if (!terrainsTileMap[BOTH].has(terrains[i].terrains[j][k][l])) {
                                            terrainsTileMap[BOTH].set(terrains[i].terrains[j][k][l], [0, 0, 0, 0, 0, 0, 0, 0, terrain]);
                                        }
                                        else if (k == 255) {
                                            let value = [terrain, terrain, terrain, terrain, terrain, terrain, terrain, terrain, terrain].toString();
                                            if (!terrainsMap[BOTH].has(value)) {
                                                terrainsMap[BOTH].set(value, []);
                                            }
                                            let tiles = terrainsMap[BOTH].get(value);
                                            tiles.push(terrains[i].terrains[j][k][l]);
                                            terrainsMap[BOTH].set(value, tiles);
                                            continue;
                                        }
                                        let tile = terrainsTileMap[BOTH].get(terrains[i].terrains[j][k][l]);
                                        if (k % 2 == 1) {
                                            tile[0] = terrain;
                                        }
                                        if (Math.floor(k / 2) % 2 == 1) {
                                            tile[1] = terrain;
                                        }
                                        if (Math.floor(k / 4) % 2 == 1) {
                                            tile[2] = terrain;
                                        }
                                        if (Math.floor(k / 8) % 2 == 1) {
                                            tile[3] = terrain;
                                        }
                                        if (Math.floor(k / 16) % 2 == 1) {
                                            tile[4] = terrain;
                                        }
                                        if (Math.floor(k / 32) % 2 == 1) {
                                            tile[5] = terrain;
                                        }
                                        if (Math.floor(k / 64) % 2 == 1) {
                                            tile[6] = terrain;
                                        }
                                        if (Math.floor(k / 128) % 2 == 1) {
                                            tile[7] = terrain;
                                        }
                                        tile[8] = terrain;
                                        terrainsTileMap[BOTH].set(terrains[i].terrains[j][k][l], tile);
                                    }
                                }
                                for (let k = 0; k < terrains[i].terrains[j][-1].length; k++) {
                                    terrainsTileMap[BOTH].set(terrains[i].terrains[j][-1][k], [0, 0, 0, 0, 0, 0, 0, 0, terrain]);
                                }
                                if (terrains[i].terrains[j].side != null) {
                                    for (let k = 0; k < terrains[2].terrains.length; k++) {
                                        if (terrains[i].terrains[j].side == terrains[2].terrains[k].name) {
                                            terrains[i].terrains[j].side = k;
                                        }
                                    }
                                    terrainsHillMap.set(terrain, 2 >= terrains[i].terrains[j].side ? 6 + terrains[i].terrains[j].side : terrains[i].terrains[j].side * terrains[i].terrains[j].side + 2);
                                }
                                break;
                        }
                    }
                }
                terrainsMap[CORNER].set([0, 0, 0, 0].toString(), [null]);
                terrainsMap[EDGE].set([0, 0, 0, 0, 0].toString(), [null]);
                terrainsMap[BOTH].set([0, 0, 0, 0, 0, 0, 0, 0, 0].toString(), [null]);
                for (let i = CORNER; i <= BOTH; i++) {
                    for (let [key, value] of terrainsTileMap[i]) {
                        value = value.toString();
                        if (!terrainsMap[i].has(value)) {
                            terrainsMap[i].set(value, []);
                        }
                        let tiles = terrainsMap[i].get(value);
                        tiles.push(key);
                        terrainsMap[i].set(value, tiles);
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
    }
    else {
        resolve();
    }
};

let objects = null;
let objectsMap = new Map();
let objectsTileMap = new Map();

const loadObjects = async function(resolve, reject) {
    if (objects == null) {
        await new Promise(awaitTilesImageLoad);
        let request = new XMLHttpRequest();
        request.open("GET", "./../maps/objects.json", true);
        request.onload = function() {
            if (this.status >= 200 && this.status < 400) {
                objects = JSON.parse(this.response);
                for (let i = 0; i < objects.length; i++) {
                    for (let j = 1; j < 16; j++) {
                        if (objects[i][j] == null) {
                            continue;
                        }
                        if (!objectsTileMap.has(objects[i][j])) {
                            objectsTileMap.set(objects[i][j], [0, 0, 0, 0]);
                        }
                        let tile = objectsTileMap.get(objects[i][j]);
                        if (j % 2 == 1) {
                            tile[0] = i + 1;
                        }
                        if (Math.floor(j / 2) % 2 == 1) {
                            tile[1] = i + 1;
                        }
                        if (Math.floor(j / 4) % 2 == 1) {
                            tile[2] = i + 1;
                        }
                        if (Math.floor(j / 8) % 2 == 1) {
                            tile[3] = i + 1;
                        }
                        objectsTileMap.set(objects[i][j], tile);
                    }
                }
                objectsMap.set([0, 0, 0, 0].toString(), [null]);
                for (let [key, value] of objectsTileMap) {
                    value = value.toString();
                    if (!objectsMap.has(value)) {
                        objectsMap.set(value, []);
                    }
                    let tiles = objectsMap.get(value);
                    tiles.push(key);
                    objectsMap.set(value, tiles);
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
    }
    else {
        resolve();
    }
};

const createMapChunks = function(chunkStartX, chunkStartY, chunkEndX, chunkEndY) {
    if (chunkStartX < map.startX) {
        for (let chunkY = map.startY; chunkY < map.endY; chunkY++) {
            for (let chunkX = chunkStartX; chunkX < map.startX; chunkX++) {
                map.data[chunkY][chunkX] = [];
                for (let object = COLLISION; object <= PARTICLE_GENERATOR; object++) {
                    map.objectData[object][chunkY][chunkX] = [];
                }
                createMapChunk(chunkX, chunkY);
            }
        }
        map.startX = chunkStartX;
    }
    if (chunkEndX >= map.endX) {
        for (let chunkY = map.startY; chunkY < map.endY; chunkY++) {
            for (let chunkX = map.endX; chunkX < chunkEndX; chunkX++) {
                map.data[chunkY][chunkX] = [];
                for (let object = COLLISION; object <= PARTICLE_GENERATOR; object++) {
                    map.objectData[object][chunkY][chunkX] = [];
                }
                createMapChunk(chunkX, chunkY);
            }
        }
        map.endX = chunkEndX;
    }
    if (chunkStartY < map.startY) {
        for (let chunkY = chunkStartY; chunkY < map.startY; chunkY++) {
            map.data[chunkY] = [];
            for (let object = COLLISION; object <= PARTICLE_GENERATOR; object++) {
                map.objectData[object][chunkY] = [];
            }
            for (let chunkX = map.startX; chunkX < map.endX; chunkX++) {
                map.data[chunkY][chunkX] = [];
                for (let object = COLLISION; object <= PARTICLE_GENERATOR; object++) {
                    map.objectData[object][chunkY][chunkX] = [];
                }
                createMapChunk(chunkX, chunkY);
            }
        }
        map.startY = chunkStartY;
    }
    if (chunkEndY >= map.endY) {
        for (let chunkY = map.endY; chunkY < chunkEndY; chunkY++) {
            map.data[chunkY] = [];
            for (let object = COLLISION; object <= PARTICLE_GENERATOR; object++) {
                map.objectData[object][chunkY] = [];
            }
            for (let chunkX = map.startX; chunkX < map.endX; chunkX++) {
                map.data[chunkY][chunkX] = [];
                for (let object = COLLISION; object <= PARTICLE_GENERATOR; object++) {
                    map.objectData[object][chunkY][chunkX] = [];
                }
                createMapChunk(chunkX, chunkY);
            }
        }
        map.endY = chunkEndY;
    }
};
const createMapChunk = function(chunkX, chunkY) {
    for (let layer = 0; layer < map.layers.length; layer++) {
        if (map.data[chunkY][chunkX][layer] == null) {
            map.data[chunkY][chunkX][layer] = [];
            for (let y = 0; y < 16; y++) {
                map.data[chunkY][chunkX][layer][y] = [];
                for (let x = 0; x < 16; x++) {
                    map.data[chunkY][chunkX][layer][y][x] = null;
                }
            }
        }
    }
    for (let object = COLLISION; object <= PARTICLE_GENERATOR; object++) {
        for (let layer = 0; layer < map.objectLayers; layer++) {
            if (map.objectData[object][chunkY][chunkX][layer] == null) {
                map.objectData[object][chunkY][chunkX][layer] = [];
                for (let y = 0; y < 16; y++) {
                    map.objectData[object][chunkY][chunkX][layer][y] = [];
                    for (let x = 0; x < 16; x++) {
                        map.objectData[object][chunkY][chunkX][layer][y][x] = null;
                    }
                }
            }
        }
    }
};
const reloadChunks = function() {
    
};
const updateMapMouse = function() {
    let chunkX = Math.floor(map.brush.endX / 16);
    let chunkY = Math.floor(map.brush.endY / 16);
    if (map.brush.leftMouseDown) {
        createMapChunks(chunkX, chunkY, chunkX + 1, chunkY + 1);
    }
    if (map.brush.leftMouseDown || map.brush.rightMouseDown) {
        if (map.brush.mode == TILES || (map.brush.mode == TERRAINS && ((!map.brush.controlDown && terrains[map.brush.terrainGroup].type != "corner") || (map.brush.controlDown && terrains[map.brush.terrainGroup].type != "both")))) {
            switch (map.brush.tool) {
                case BRUSH:
                    map.brush.place(Math.floor(map.brush.endX), Math.floor(map.brush.endY));
                    break;
                case FILL:
                    let fillTile = map.data[chunkY][chunkX][map.brush.layer][Math.floor(map.brush.endY) - chunkY * 16][Math.floor(map.brush.endX) - chunkX * 16];
                    let fillingTiles = [];
                    const recursive = function(x, y) {
                        map.data[Math.floor(y / 16)][Math.floor(x / 16)][map.brush.layer][y - Math.floor(y / 16) * 16][x - Math.floor(x / 16) * 16] = -1;
                        if (x != map.startX * 16 && map.data[Math.floor(y / 16)][Math.floor((x - 1) / 16)][map.brush.layer][y - Math.floor(y / 16) * 16][x - 1 - Math.floor((x - 1) / 16) * 16] == fillTile) {
                            recursive(x - 1, y);
                        }
                        if (x != map.endX * 16 - 1 && map.data[Math.floor(y / 16)][Math.floor((x + 1) / 16)][map.brush.layer][y - Math.floor(y / 16) * 16][x + 1 - Math.floor((x + 1) / 16) * 16] == fillTile) {
                            recursive(x + 1, y);
                        }
                        if (y != map.startY * 16 && map.data[Math.floor((y - 1) / 16)][Math.floor(x / 16)][map.brush.layer][y - 1 - Math.floor((y - 1) / 16) * 16][x - Math.floor(x / 16) * 16] == fillTile) {
                            recursive(x, y - 1);
                        }
                        if (y != map.endY * 16 - 1 && map.data[Math.floor((y + 1) / 16)][Math.floor(x / 16)][map.brush.layer][y + 1 - Math.floor((y + 1) / 16) * 16][x - Math.floor(x / 16) * 16] == fillTile) {
                            recursive(x, y + 1);
                        }
                        fillingTiles.push([x, y]);
                    };
                    recursive(Math.floor(map.brush.endX), Math.floor(map.brush.endY));
                    for (let i = 0; i < fillingTiles.length; i++) {
                        map.brush.place(fillingTiles[i][0], fillingTiles[i][1]);
                    }
                    break;
            }
        }
        else if (map.brush.mode == TERRAINS) {
            switch (map.brush.tool) {
                case BRUSH:
                    map.brush.place(Math.round(map.brush.endX), Math.round(map.brush.endY));
                    break;
            }
        }
        else {
            if ((map.brush.object == COLLISION && mapCollisions.value == "0") || map.brush.object == PROJECTILE_COLLISION || map.brush.object == SLOWDOWN || map.brush.object == SLOPE) {
                if (map.brush.controlDown) {
                    map.brush.place(Math.floor(map.brush.endX), Math.floor(map.brush.endY));
                }
                else {
                    map.brush.place(Math.floor(map.brush.endX * 2) / 2, Math.floor(map.brush.endY * 2) / 2);
                }
            }
        }
    }
};
const drawMapBackground = function() {
    ctx.fillStyle = "#aaaaaa";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // for (let i = 0; i < 255; i++) {
    //     ctx.fillStyle = "rgb(" + i + ", 0, 0)";
    //     ctx.fillRect(0, 0, canvas.width, canvas.height);
    // }
    // for (let i = 0; i < 25500; i++) {
    //     ctx.drawImage(tilesCanvas, 0, 0);
    // }
};
const drawMap = function() {
    for (let chunkY = Math.max(Math.floor(-cameraY / 256 / cameraZoom), map.startY); chunkY < Math.min(Math.ceil((-cameraY + canvas.height) / 256 / cameraZoom) + 1, map.endY); chunkY++) {
        for (let chunkX = Math.max(Math.floor(-cameraX / 256 / cameraZoom), map.startX); chunkX < Math.min(Math.ceil((-cameraX + canvas.width) / 256 / cameraZoom) + 1, map.endX); chunkX++) {
            for (let layer = 0; layer < map.layers.length; layer++) {
                if (map.data[chunkY][chunkX][layer] == null) {
                    continue;
                }
                if (layer == map.brush.layer && map.brush.highlightLayer) {
                    ctx.fillStyle = "#00000099";
                    ctx.fillRect(chunkX * 256 * cameraZoom + cameraX, chunkY * 256 * cameraZoom + cameraY, 256 * cameraZoom, 256 * cameraZoom);
                }
                for (let y = 0; y < 16; y++) {
                    for (let x = 0; x < 16; x++) {
                        if (map.data[chunkY][chunkX][layer][y][x] == null) {
                            continue;
                        }
                        ctx.drawImage(tilesImage, map.data[chunkY][chunkX][layer][y][x] % tilesWidth * 17, Math.floor(map.data[chunkY][chunkX][layer][y][x] / tilesWidth) * 17, 16, 16, (chunkX * 16 + x) * 16 * cameraZoom + cameraX, (chunkY * 16 + y) * 16 * cameraZoom + cameraY, 16 * cameraZoom, 16 * cameraZoom);
                    }
                }
                if (layer == map.brush.layer && map.brush.highlightLayer) {
                    break;
                }
            }
        }
    }
    if (map.brush.showObjects) {
        for (let object = COLLISION; object <= PARTICLE_GENERATOR; object++) {
            for (let chunkY = Math.max(Math.floor(-cameraY / 256 / cameraZoom), map.startY); chunkY < Math.min(Math.ceil((-cameraY + canvas.height) / 256 / cameraZoom) + 1, map.endY); chunkY++) {
                for (let chunkX = Math.max(Math.floor(-cameraX / 256 / cameraZoom), map.startX); chunkX < Math.min(Math.ceil((-cameraX + canvas.width) / 256 / cameraZoom) + 1, map.endX); chunkX++) {
                    for (let layer = 0; layer < map.objectLayers; layer++) {
                        if (map.objectData[object][chunkY][chunkX][layer] == null) {
                            continue;
                        }
                        for (let y = 0; y < 16; y++) {
                            for (let x = 0; x < 16; x++) {
                                if (map.objectData[object][chunkY][chunkX][layer][y][x] == null) {
                                    continue;
                                }
                                if (object == COLLISION || object == PROJECTILE_COLLISION || object == SLOWDOWN || object == SLOPE) {
                                    let tileId = objects[object][map.objectData[object][chunkY][chunkX][layer][y][x]] ?? map.objectData[object][chunkY][chunkX][layer][y][x];
                                    ctx.drawImage(tilesImage, tileId % tilesWidth * 17, Math.floor(tileId / tilesWidth) * 17, 16, 16, (chunkX * 16 + x) * 16 * cameraZoom + cameraX, (chunkY * 16 + y) * 16 * cameraZoom + cameraY, 16 * cameraZoom, 16 * cameraZoom);
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    ctx.fillStyle = "#000000";
    ctx.fillRect(map.startX * 256 * cameraZoom - 1 + cameraX, map.startY * 256 * cameraZoom - 1 + cameraY, (map.endX - map.startX) * 256 * cameraZoom + 2, 1);
    ctx.fillRect(map.startX * 256 * cameraZoom - 1 + cameraX, map.endY * 256 * cameraZoom + cameraY, (map.endX - map.startX) * 256 * cameraZoom + 2, 1);
    ctx.fillRect(map.startX * 256 * cameraZoom - 1 + cameraX, map.startY * 256 * cameraZoom + cameraY, 1, (map.endY - map.startY) * 256 * cameraZoom);
    ctx.fillRect(map.endX * 256 * cameraZoom + cameraX, map.startY * 256 * cameraZoom + cameraY, 1, (map.endY - map.startY) * 256 * cameraZoom);
    if (map.brush.grid) {
        ctx.fillStyle = "#00000055";
        for (let x = Math.max(Math.floor(-cameraX / 16 / cameraZoom), map.startX * 16 + 1); x < Math.min(Math.ceil((-cameraX + canvas.width) / 16 / cameraZoom) + 16, map.endX * 16); x++) {
            ctx.fillRect(x * 16 * cameraZoom + cameraX, map.startY * 256 * cameraZoom + cameraY, 1, (map.endY - map.startY) * 256 * cameraZoom);
        }
        for (let y = Math.max(Math.floor(-cameraY / 16 / cameraZoom), map.startY * 16 + 1); y < Math.min(Math.ceil((-cameraY + canvas.height) / 16 / cameraZoom) + 16, map.endY * 16); y++) {
            ctx.fillRect(map.startX * 256 * cameraZoom - 1 + cameraX, y * 16 * cameraZoom + cameraY, (map.endX - map.startX) * 256 * cameraZoom + 2, 1);
        }
    }
};
const drawMapMouse = function() {
    ctx.globalAlpha = 0.5;
    let chunkX = Math.floor(map.brush.endX / 16);
    let chunkY = Math.floor(map.brush.endY / 16);
    let startX = Math.floor(Math.min(map.brush.startX, map.brush.endX));
    let startY = Math.floor(Math.min(map.brush.startY, map.brush.endY));
    let endX = Math.floor(Math.max(map.brush.startX, map.brush.endX));
    let endY = Math.floor(Math.max(map.brush.startY, map.brush.endY));
    if (map.brush.mode == TILES || (map.brush.mode == TERRAINS && ((!map.brush.controlDown && terrains[map.brush.terrainGroup].type != "corner") || (map.brush.controlDown && terrains[map.brush.terrainGroup].type != "both")))) {
        switch (map.brush.tool) {
            case BRUSH:
                if (chunkX < map.startX || chunkX >= map.endX || chunkY < map.startY || chunkY >= map.endY) {
                    break;
                }
                map.brush.draw(Math.floor(map.brush.endX), Math.floor(map.brush.endY));
                break;
            case LINE:
                if (!map.brush.leftMouseDown && !map.brush.rightMouseDown) {
                    break;
                }
                let differenceX = Math.floor(map.brush.startX) - Math.floor(map.brush.endX);
                let differenceY = Math.floor(map.brush.startY) - Math.floor(map.brush.endY);
                if (Math.abs(differenceX) >= Math.abs(differenceY)) {
                    let slope = differenceY / differenceX;
                    let y = slope > 0 ? startY : endY;
                    for (let x = startX; x <= endX; x++) {
                        map.brush.draw(x, Math.round(y));
                        y += slope;
                    }
                }
                else {
                    let slope = differenceX / differenceY;
                    let x = slope > 0 ? startX : endX;
                    for (let y = startY; y <= endY; y++) {
                        map.brush.draw(Math.round(x), y);
                        x += slope;
                    }
                }
                break;
            case RECT:
                if (!map.brush.leftMouseDown && !map.brush.rightMouseDown) {
                    break;
                }
                for (let y = startY; y <= endY; y++) {
                    for (let x = startX; x <= endX; x++) {
                        map.brush.draw(x, y);
                    }
                }
                break;
            case FILL:
                if (chunkX < map.startX || chunkX >= map.endX || chunkY < map.startY || chunkY >= map.endY) {
                    break;
                }
                let fillTile = map.data[chunkY][chunkX][map.brush.layer][Math.floor(map.brush.endY) - chunkY * 16][Math.floor(map.brush.endX) - chunkX * 16];
                let fillingTiles = [];
                const recursive = function(x, y) {
                    const tile = map.data[Math.floor(y / 16)][Math.floor(x / 16)][map.brush.layer][y - Math.floor(y / 16) * 16][x - Math.floor(x / 16) * 16];
                    map.data[Math.floor(y / 16)][Math.floor(x / 16)][map.brush.layer][y - Math.floor(y / 16) * 16][x - Math.floor(x / 16) * 16] = -1;
                    if (x != map.startX * 16 && map.data[Math.floor(y / 16)][Math.floor((x - 1) / 16)][map.brush.layer][y - Math.floor(y / 16) * 16][x - 1 - Math.floor((x - 1) / 16) * 16] == fillTile) {
                        recursive(x - 1, y);
                    }
                    if (x != map.endX * 16 - 1 && map.data[Math.floor(y / 16)][Math.floor((x + 1) / 16)][map.brush.layer][y - Math.floor(y / 16) * 16][x + 1 - Math.floor((x + 1) / 16) * 16] == fillTile) {
                        recursive(x + 1, y);
                    }
                    if (y != map.startY * 16 && map.data[Math.floor((y - 1) / 16)][Math.floor(x / 16)][map.brush.layer][y - 1 - Math.floor((y - 1) / 16) * 16][x - Math.floor(x / 16) * 16] == fillTile) {
                        recursive(x, y - 1);
                    }
                    if (y != map.endY * 16 - 1 && map.data[Math.floor((y + 1) / 16)][Math.floor(x / 16)][map.brush.layer][y + 1 - Math.floor((y + 1) / 16) * 16][x - Math.floor(x / 16) * 16] == fillTile) {
                        recursive(x, y + 1);
                    }
                    fillingTiles.push([x, y, tile]);
                };
                recursive(Math.floor(map.brush.endX), Math.floor(map.brush.endY));
                for (let i = 0; i < fillingTiles.length; i++) {
                    map.data[Math.floor(fillingTiles[i][1] / 16)][Math.floor(fillingTiles[i][0] / 16)][map.brush.layer][fillingTiles[i][1] - Math.floor(fillingTiles[i][1] / 16) * 16][fillingTiles[i][0] - Math.floor(fillingTiles[i][0] / 16) * 16] = fillingTiles[i][2];
                    map.brush.draw(fillingTiles[i][0], fillingTiles[i][1]);
                }
                break;
        }
    }
    else if (map.brush.mode == TERRAINS) {
        switch (map.brush.tool) {
            case BRUSH:
                map.brush.draw(Math.round(map.brush.endX), Math.round(map.brush.endY));
                break;
        }
    }
    ctx.globalAlpha = 1;
};
const drawTilesBackground = function() {
    tilesCtx.fillStyle = "#aaaaaa";
    tilesCtx.fillRect(0, 0, tilesCanvas.width, tilesCanvas.height);
};
const drawTiles = function() {
    tilesCtx.drawImage(tilesOffscreenCanvas, 0, 0, tilesOffscreenCanvas.width, tilesOffscreenCanvas.height, tilesCameraX, tilesCameraY, tilesOffscreenCanvas.width * tilesCameraZoom, tilesOffscreenCanvas.height * tilesCameraZoom);
};
const drawTilesMouse = function() {
    tilesCtx.lineWidth = 1;
    tilesCtx.fillStyle = "#99aaff99";
    tilesCtx.strokeStyle = "#99aaff";
    tilesCtx.fillRect(tilesCameraX + Math.min(map.brush.tileStartX, map.brush.tileEndX) * 16 * tilesCameraZoom, tilesCameraY + Math.min(map.brush.tileStartY, map.brush.tileEndY) * 16 * tilesCameraZoom, (Math.abs(map.brush.tileStartX - map.brush.tileEndX) + 1) * 16 * tilesCameraZoom, (Math.abs(map.brush.tileStartY - map.brush.tileEndY) + 1) * 16 * tilesCameraZoom);
    tilesCtx.strokeRect(tilesCameraX + Math.min(map.brush.tileStartX, map.brush.tileEndX) * 16 * tilesCameraZoom, tilesCameraY + Math.min(map.brush.tileStartY, map.brush.tileEndY) * 16 * tilesCameraZoom, (Math.abs(map.brush.tileStartX - map.brush.tileEndX) + 1) * 16 * tilesCameraZoom, (Math.abs(map.brush.tileStartY - map.brush.tileEndY) + 1) * 16 * tilesCameraZoom);
};

canvas.addEventListener("mousedown", function(event) {
    if (event.button == 0 || event.button == 2) {
        let rect = canvas.getBoundingClientRect();
        map.brush.startX = (mouseX - rect.left - cameraX) / 16 / cameraZoom;
        map.brush.startY = (mouseY - rect.top - cameraY) / 16 / cameraZoom;
    }
    if (event.button == 0) {
        if (selectedFile == "npc" || selectedFile == "item" || selectedFile == "monster" || selectedFile == "projectile") {
            pixelArt.brush.leftMouseDown = true;
        }
        else {
            map.brush.leftMouseDown = true;
        }
    }
    else if (event.button == 2) {
        if (selectedFile == "npc" || selectedFile == "item" || selectedFile == "monster" || selectedFile == "projectile") {
            pixelArt.brush.rightMouseDown = true;
        }
        else {
            map.brush.rightMouseDown = true;
        }
    }
    else if (event.button == 1) {
        event.preventDefault();
        if (event.ctrlKey) {
            if (selectedFile == "npc" || selectedFile == "item" || selectedFile == "monster" || selectedFile == "projectile") {
                if (pixelArt.brush.x < 0 || pixelArt.brush.x >= pixelArt.width || pixelArt.brush.y < 0 || pixelArt.brush.y >= pixelArt.height) {
                    return;
                }
                if (pixelArt.data[pixelArt.frame][pixelArt.brush.y][pixelArt.brush.x] != null) {
                    pixelArt.brush.color = pixelArt.data[pixelArt.frame][pixelArt.brush.y][pixelArt.brush.x];
                    for (let i = 0; i < pixelArtPalette.children.length; i++) {
                        if (pixelArtPalette.children[i].style.backgroundColor == "rgb(" + pixelArt.brush.color[0] + ", " + pixelArt.brush.color[1] + ", " + pixelArt.brush.color[2] + ")") {
                            pixelArtPalette.children[i].classList.add("pixelArtPaletteelected");
                        }
                        else if (pixelArtPalette.children[i].classList.contains("pixelArtPaletteelected")) {
                            pixelArtPalette.children[i].classList.remove("pixelArtPaletteelected");
                        }
                    }
                }
            }
            else if (selectedFile == "map") {
                let chunkX = Math.floor(map.brush.endX / 16);
                let chunkY = Math.floor(map.brush.endY / 16);
                if (chunkX < map.startX || chunkX >= map.endX || chunkY < map.startY || chunkY >= map.endY) {
                    return;
                }
                let tile = map.data[chunkY][chunkX][map.brush.layer][Math.floor(map.brush.endY) - chunkY * 16][Math.floor(map.brush.endX) - chunkX * 16];
                if (tile != null) {
                    map.brush.tileStartX = tile % tilesWidth;
                    map.brush.tileStartY = Math.floor(tile / tilesWidth);
                    map.brush.tileEndX = tile % tilesWidth;
                    map.brush.tileEndY = Math.floor(tile / tilesWidth);
                }
            }
        }
        else {
            cameraDragging = true;
            canvas.style.cursor = "grabbing";
        }
    }
});
tilesCanvas.addEventListener("mousedown", function(event) {
    if (event.button == 0 || event.button == 2) {
        map.brush.changeMode(TILES);
        let rect = tilesCanvas.getBoundingClientRect();
        let scale = (rect.width - devicePixelRatio * 4) / tilesCanvas.width;
        map.brush.tileStartX = Math.max(Math.min(Math.floor(((mouseX - rect.left - devicePixelRatio * 2) / scale - tilesCameraX) / 16 / tilesCameraZoom), tilesWidth), 0);
        map.brush.tileStartY = Math.max(Math.min(Math.floor(((mouseY - rect.top - devicePixelRatio * 2) / scale - tilesCameraY) / 16 / tilesCameraZoom), tilesHeight), 0);
        map.brush.tileEndX = Math.max(Math.min(Math.floor(((mouseX - rect.left - devicePixelRatio * 2) / scale - tilesCameraX) / 16 / tilesCameraZoom), tilesWidth), 0);
        map.brush.tileEndY = Math.max(Math.min(Math.floor(((mouseY - rect.top - devicePixelRatio * 2) / scale - tilesCameraY) / 16 / tilesCameraZoom), tilesHeight), 0);
        map.brush.tilesMouseDown = true;
    }
    else if (event.button == 1) {
        event.preventDefault();
        tilesCameraDragging = true;
        tilesCanvas.style.cursor = "grabbing";
    }
});
document.addEventListener("mouseup", function(event) {
    if ((map.brush.leftMouseDown || map.brush.rightMouseDown) && (!map.brush.leftMouseDown || event.button == 0) && (!map.brush.rightMouseDown || event.button == 2)) {
        let startX = Math.floor(Math.min(map.brush.startX, map.brush.endX));
        let startY = Math.floor(Math.min(map.brush.startY, map.brush.endY));
        let endX = Math.floor(Math.max(map.brush.startX, map.brush.endX));
        let endY = Math.floor(Math.max(map.brush.startY, map.brush.endY));
        if (map.brush.leftMouseDown) {
            createMapChunks(Math.floor(startX / 16), Math.floor(startY / 16), Math.floor(endX / 16), Math.floor(endY / 16));
        }
        switch (map.brush.mode) {
            case TILES:
            case TERRAINS:
                switch (map.brush.tool) {
                    case LINE:
                        let differenceX = Math.floor(map.brush.startX) - Math.floor(map.brush.endX);
                        let differenceY = Math.floor(map.brush.startY) - Math.floor(map.brush.endY);
                        if (Math.abs(differenceX) >= Math.abs(differenceY)) {
                            let slope = differenceY / differenceX;
                            let y = slope > 0 ? startY : endY;
                            for (let x = startX; x <= endX; x++) {
                                map.brush.place(x, Math.round(y));
                                y += slope;
                            }
                        }
                        else {
                            let slope = differenceX / differenceY;
                            let x = slope > 0 ? startX : endX;
                            for (let y = startY; y <= endY; y++) {
                                map.brush.place(Math.round(x), y);
                                x += slope;
                            }
                        }
                        break;
                    case RECT:
                        for (let y = startY; y <= endY; y++) {
                            for (let x = startX; x <= endX; x++) {
                                map.brush.place(x, y);
                            }
                        }
                        break;
                }
                break;
        }
    }
    if (event.button == 0) {
        pixelArt.brush.leftMouseDown = false;
        map.brush.leftMouseDown = false;
        map.brush.tilesMouseDown = false;
    }
    else if (event.button == 2) {
        pixelArt.brush.rightMouseDown = false;
        map.brush.rightMouseDown = false;
        map.brush.tilesMouseDown = false;
    }
    else if (event.button == 1) {
        cameraDragging = false;
        canvas.style.cursor = "revert-layer";
        tilesCameraDragging = false;
        tilesCanvas.style.cursor = "revert-layer";
    }
});
document.addEventListener("mousemove", function(event) {
    if (cameraDragging) {
        cameraX += event.clientX - mouseX;
        cameraY += event.clientY - mouseY;
    }
    else if (tilesCameraDragging) {
        let rect = tilesCanvas.getBoundingClientRect();
        let scale = (rect.width - devicePixelRatio * 4) / tilesCanvas.width;
        tilesCameraX += (event.clientX - mouseX) / scale;
        tilesCameraY += (event.clientY - mouseY) / scale;
    }
    mouseX = event.clientX;
    mouseY = event.clientY;
    let rect = canvas.getBoundingClientRect();
    pixelArt.brush.x = Math.floor((mouseX - rect.left) * pixelArt.width / rect.width);
    pixelArt.brush.y = Math.floor((mouseY - rect.top) * pixelArt.width / rect.width);
    map.brush.endX = (mouseX - rect.left - cameraX) / 16 / cameraZoom;
    map.brush.endY = (mouseY - rect.top - cameraY) / 16 / cameraZoom;
    if (map.brush.tilesMouseDown) {
        let rect = tilesCanvas.getBoundingClientRect();
        let scale = (rect.width - devicePixelRatio * 4) / tilesCanvas.width;
        map.brush.tileEndX = Math.max(Math.min(Math.floor(((mouseX - rect.left - devicePixelRatio * 2) / scale - tilesCameraX) / 16 / tilesCameraZoom), tilesWidth), 0);
        map.brush.tileEndY = Math.max(Math.min(Math.floor(((mouseY - rect.top - devicePixelRatio * 2) / scale - tilesCameraY) / 16 / tilesCameraZoom), tilesHeight), 0);
    }
});
canvas.addEventListener("wheel", function(event) {
    event.preventDefault();
    if (event.ctrlKey) {
        let rect = canvas.getBoundingClientRect();
        if (event.deltaY > 0) {
            if (cameraZoom == 0.125) {
                return;
            }
            cameraX = (rect.left - mouseX + cameraX) / 2 - (rect.left - mouseX);
            cameraY = (rect.top - mouseY + cameraY) / 2 - (rect.top - mouseY);
            cameraZoom /= 2;
        }
        else {
            cameraX = (rect.left - mouseX + cameraX) * 2 - (rect.left - mouseX);
            cameraY = (rect.top - mouseY + cameraY) * 2 - (rect.top - mouseY);
            cameraZoom *= 2;
        }
    }
    else {
        if (event.deltaY > 0) {
            pixelArt.brush.size = Math.max(pixelArt.brush.size - 1, 1);
        }
        else {
            pixelArt.brush.size = Math.min(pixelArt.brush.size + 1, 4);
        }
    }
});
tilesCanvas.addEventListener("wheel", function(event) {
    event.preventDefault();
    if (event.ctrlKey) {
        let rect = tilesCanvas.getBoundingClientRect();
        let scale = (rect.width - devicePixelRatio * 4) / tilesCanvas.width;
        if (event.deltaY > 0) {
            if (tilesCameraZoom == 0.125) {
                return;
            }
            tilesCameraX = ((rect.left + devicePixelRatio * 2 - mouseX) / scale + tilesCameraX) / 2 - (rect.left + devicePixelRatio * 2 - mouseX) / scale;
            tilesCameraY = ((rect.top + devicePixelRatio * 2 - mouseY) / scale + tilesCameraY) / 2 - (rect.top + devicePixelRatio * 2 - mouseY) / scale;
            tilesCameraZoom /= 2;
        }
        else {
            tilesCameraX = ((rect.left + devicePixelRatio * 2 - mouseX) / scale + tilesCameraX) * 2 - (rect.left + devicePixelRatio * 2 - mouseX) / scale;
            tilesCameraY = ((rect.top + devicePixelRatio * 2 - mouseY) / scale + tilesCameraY) * 2 - (rect.top + devicePixelRatio * 2 - mouseY) / scale;
            tilesCameraZoom *= 2;
        }
    }
    else {

    }
});
document.addEventListener("contextmenu", function(event) {
    event.preventDefault();
});

document.addEventListener("keydown", function(event) {
    switch (event.key) {
        case "Control":
            map.brush.controlDown = true;
            break;
    }
});
document.addEventListener("keyup", function(event) {
    switch (event.key) {
        case "Control":
            map.brush.controlDown = false;
            break;
    }
});

// var fps = [];

const update = function() {
    if (selectedFile == "npc" || selectedFile == "item" || selectedFile == "monster" || selectedFile == "projectile" || selectedFile == "map") {
        let rect = canvas.getBoundingClientRect();
        if (canvas.width != rect.width || canvas.height != rect.height) {
            canvas.width = rect.width;
            canvas.height = rect.height;
            resetCanvas(ctx);
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let tilesRect = mapTiles.getBoundingClientRect();
        if (tilesCanvas.width != tilesRect.width - devicePixelRatio * 2 || tilesCanvas.height != tilesRect.height - devicePixelRatio * 2) {
            tilesCanvas.style.left = tilesRect.left + "px";
            tilesCanvas.style.top = tilesRect.top + "px";
            tilesCanvas.width = tilesRect.width - devicePixelRatio * 2;
            tilesCanvas.height = tilesRect.height - devicePixelRatio * 2;
            resetCanvas(tilesCtx);
        }
        // fps.push(performance.now())
        // while (performance.now() - fps[0] > 1000) {
        //     fps.shift();
        // }
        // console.log(fps.length)
        if (selectedFile == "npc" || selectedFile == "item" || selectedFile == "monster" || selectedFile == "projectile") {
            updatePixelArtMouse();
            drawPixelArtBackground();
            drawPixelArt();
            drawPixelArtMouse();
        }
        else {
            updateMapMouse();
            drawMapBackground();
            drawMap();
            drawMapMouse();
            drawTilesBackground();
            drawTiles();
            drawTilesMouse();
        }
    }
    window.requestAnimationFrame(update);
};
window.requestAnimationFrame(update);
// setInterval(update, 1000)