const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d", { alpha: false });

const customizeCanvas = document.getElementById("customizeCanvas");
const customizeCtx = customizeCanvas.getContext("2d");

const offscreenCanvasDisabled = typeof OffscreenCanvas == "undefined";
let createCanvas = function(width, height) {
    let canvas = document.createElement("canvas");
    canvas.width = width || 1;
    canvas.height = height || 1;
    return canvas;
};
let createOffscreenCanvas = function(width, height) {
    if (offscreenCanvasDisabled) {
        let canvas = document.createElement("canvas");
        canvas.width = width || 1;
        canvas.height = height || 1;
        return canvas;
    }
    else {
        return new OffscreenCanvas(width || 1, height || 1);
    }
};

const offscreenCanvas = createOffscreenCanvas();
const offscreenCtx = offscreenCanvas.getContext("2d", { alpha: false });
const offscreenLightCanvas = createOffscreenCanvas();
const offscreenLightCtx = offscreenLightCanvas.getContext("2d");

let canvasScale = devicePixelRatio * settings.renderQuality / 100;
let oldCanvasScale = canvasScale;

let windowWidth = window.innerWidth;
let windowHeight = window.innerHeight;

let renderScale = settings.renderQuality * settings.zoom / 10000;
let oldRenderScale = renderScale;

window.onresize = function() {
    if (selfPlayer != null) {
        canvasScale = devicePixelRatio * settings.renderQuality / 100;
        renderScale = settings.renderQuality * settings.zoom / 10000;
        if (canvasScale != oldCanvasScale || windowWidth != window.innerWidth || windowHeight != window.innerHeight) {
            oldCanvasScale = canvasScale;
            windowWidth = window.innerWidth;
            windowHeight = window.innerHeight;
            resetCanvases();
        }
        if (renderScale != oldRenderScale) {
            oldRenderScale = renderScale;
            for (let i in Entity.list) {
                if (Entity.list[i].type == DROPPED_ITEM) {
                    DroppedItem.renderStackSize(Entity.list[i]);
                }
                else if (Entity.list[i].type != PROJECTILE) {
                    Rig.renderName(Entity.list[i]);
                }
            }
            for (let i in Particle.layers) {
                for (let j in Particle.layers[i]) {
                    Particle.renderText(Particle.layers[i][j]);
                }
            }
        }
        draggableWindow.updateWidth();
        draggableWindow.updatePosition();
    }
};

let resetCanvas = function(ctx) {
    ctx.imageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    ctx.textRendering = "optimizeSpeed";
};
let resetCanvases = function() {
    offscreenCanvas.width = windowWidth * canvasScale;
    offscreenCanvas.height = windowHeight * canvasScale;
    resetCanvas(offscreenCtx);
    offscreenLightCanvas.width = windowWidth * canvasScale;
    offscreenLightCanvas.height = windowHeight * canvasScale;
    resetCanvas(offscreenLightCtx);
    canvas.width = windowWidth * canvasScale;
    canvas.height = windowHeight * canvasScale;
    resetCanvas(ctx);
};
resetCanvases();

let disconnect = function() {
    document.getElementById("disconnectedContainer").style.display = "block";
    socket.removeAllListeners();
    socket.once("checkReconnect", function() {
        window.location.reload();
    });
};
socket.on("disconnect", disconnect);

let inputs = document.querySelectorAll("input");
for (let i = 0; i < inputs.length; i++) {
    if (inputs[i].type != "text" && inputs[i].type != "password" && inputs[i].type != "number") {
        inputs[i].addEventListener("keydown", function() {
            this.blur();
        });
    }
}
let buttons = document.querySelectorAll("button");
for (let i = 0; i < buttons.length; i++) {
    buttons[i].addEventListener("keydown", function() {
        this.blur();
    });
}
document.addEventListener("contextmenu", function(event) {
    event.preventDefault();
});

let ultraSecretInterval = null;
let UltraSecretFilters = function(filter) {
    document.body.style.filter = "";
    document.body.style.transform = "";
    if (ultraSecretInterval) {
        clearInterval(ultraSecretInterval);
        ultraSecretInterval = null;
    }
    switch (filter) {
        case "bright":
            document.body.style.filter = "brightness(2)";
            break;
        case "contrast":
            document.body.style.filter = "contrast(3)";
            break;
        case "saturated":
            document.body.style.filter = "saturate(10)";
            break;
        case "grayscale":
            document.body.style.filter = "grayscale(100%)";
            break;
        case "blurry":
            document.body.style.filter = "blur(1px)";
            break;
        case "inverted":
            document.body.style.filter = "invert(100%)";
            break;
        case "lag":
            ultraSecretInterval = setInterval(function() {
                while (Math.random() > 0.001) {
                    console.log("LAG");
                }
            }, 5);
            break;
        case "rainbow":
            let hue1 = 0;
            ultraSecretInterval = setInterval(function() {
                hue1 += 1;
                document.body.style.filter = "hue-rotate(" + hue1 + "deg)";
            }, 5);
            break;
        case "spinnyCarrier":
            let rotate = 0;
            let rotateDirection = 1;
            document.body.style.transformOrigin = "center center";
            ultraSecretInterval = setInterval(function() {
                rotate += Math.random() * 10 * rotateDirection;
                if (Math.random() < 0.1) {
                    rotateDirection *= -1;
                }
                let array = document.querySelectorAll("div, p, span, img, a, body");
                for (let i = 0; i < array.length; i++) {
                    array[i].style.transform = "rotate(" + (rotate + Math.random() * 5) + "deg)";
                }
            }, 5);
            break;
        case "texturePack":
            let newImages = {};
            let total = 0;
            for (let i in images) {
                total += 1;
            }
            for (let i in images) {
                let image = Math.random() * total;
                for (let j in images) {
                    image -= 1;
                    if (image < 0) {
                        newImages[i] = images[j];
                        break;
                    }
                }
            }
            images = newImages;
            let randomColor = function() {
                return "#" + Math.floor(Math.random() * Math.pow(16, 6)).toString(16);
            };
            document.body.style.setProperty("--border-dark", "1px solid " + randomColor());
            document.body.style.setProperty("--border-medium", "1px solid " + randomColor());
            document.body.style.setProperty("--border-light", "1px solid " + randomColor());
            document.body.style.setProperty("--color-light", randomColor());
            document.body.style.setProperty("--color-medium-light", randomColor());
            document.body.style.setProperty("--color-medium-dark", randomColor());
            document.body.style.setProperty("--color-dark", randomColor());
            document.body.style.setProperty("--color-disabled", randomColor());
            document.body.style.setProperty("--font-color", randomColor());
            document.body.style.setProperty("--font-color-success", randomColor());
            document.body.style.setProperty("--font-color-warn", randomColor());
            document.body.style.setProperty("--font-color-error", randomColor());
            break;
        case "lsd":
            let hue = 0;
            let brightness = 1;
            let brightnessDirection = 1;
            let contrast = 1;
            let contrastDirection = -1;
            let saturation = 1;
            let saturationDirection = 1;
            let scale = 1;
            let scaleDirection = 1;
            let blur = 0;
            let invert = 0;
            document.body.style.transformOrigin = "center center";
            ultraSecretInterval = setInterval(function() {
                hue += Math.random() * 2;
                brightness += Math.random() * 0.01 * brightnessDirection;
                contrast += Math.random() * 0.01 * contrastDirection;
                saturation += Math.random() * 0.01 * saturationDirection;
                scale += Math.random() * 0.01 * scaleDirection;
                if (brightness > Math.random() * 0.5 + 1) {
                    brightnessDirection = -1;
                }
                else if (brightness < Math.random() * 0.5 + 0.5) {
                    brightnessDirection = 1;
                }
                if (contrast > Math.random() * 0.5 + 1) {
                    contrastDirection = -1;
                }
                else if (contrast < Math.random() * 0.5 + 0.5) {
                    contrastDirection = 1;
                }
                if (saturation > Math.random() * 0.5 + 1) {
                    saturationDirection = -1;
                }
                else if (saturation < Math.random() * 0.5 + 0.5) {
                    saturationDirection = 1;
                }
                if (scale > Math.random() * 5 + 1) {
                    scaleDirection = -1;
                }
                else if (scale < 1) {
                    scale = 1;
                    scaleDirection = 1;
                }
                blur = Math.random();
                if (Math.random() < 0.5) {
                    invert = Math.min(1, invert + 0.05);
                }
                else {
                    invert = Math.max(0, invert - 0.05);
                }
                document.body.style.filter = "hue-rotate(" + hue + "deg) brightness(" + brightness + ") contrast(" + contrast + ") saturate(" + saturation + ") invert(" + Math.round(invert) + ") blur(" + blur + "px)";
                document.body.style.transform = "scale(" + scale + ") rotate(" + (Math.random() * 10 - 5) + "deg) translate(" + (Math.random() * 30 - 15) + "px, " + (Math.random() * 30 - 15) + "px)";
            }, 5);
            break;
        default:
            break;
    }
};
socket.on("ultraSecretFilters", function(data) {
    UltraSecretFilters(data);
});

let sleep = function(time) {
    return new Promise(function(resolve, reject) {
        setTimeout(resolve, time);
    });
};