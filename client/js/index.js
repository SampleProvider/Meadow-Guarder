const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d", { alpha: false });

const customizeCanvas = document.getElementById("customizeCanvas");
const customizeCtx = customizeCanvas.getContext("2d");

const offscreenCanvasDisabled = typeof OffscreenCanvas == "undefined";
var createCanvas = function(width, height) {
    var canvas = document.createElement("canvas");
    canvas.width = width || 1;
    canvas.height = height || 1;
    return canvas;
};
var createOffscreenCanvas = function(width, height) {
    if (offscreenCanvasDisabled) {
        var canvas = document.createElement("canvas");
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

var canvasScale = devicePixelRatio * settings.renderQuality / 100;
var oldCanvasScale = canvasScale;

var windowWidth = window.innerWidth;
var windowHeight = window.innerHeight;

var renderScale = settings.renderQuality * settings.zoom / 10000;
var oldRenderScale = renderScale;

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
            for (var i in Entity.list) {
                if (Entity.list[i].type == DROPPED_ITEM) {
                    DroppedItem.renderStackSize(Entity.list[i]);
                }
                else if (Entity.list[i].type != PROJECTILE) {
                    Rig.renderName(Entity.list[i]);
                }
            }
            for (var i in Particle.layers) {
                for (var j in Particle.layers[i]) {
                    Particle.renderText(Particle.layers[i][j]);
                }
            }
        }
        draggableWindow.updateWidth();
        draggableWindow.updatePosition();
    }
};

var resetCanvas = function(ctx) {
    ctx.imageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    ctx.textRendering = "optimizeSpeed";
};
var resetCanvases = function() {
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

var disconnect = function() {
    document.getElementById("disconnectedContainer").style.display = "block";
    socket.removeAllListeners();
    socket.once("checkReconnect", function() {
        window.location.reload();
    });
};
socket.on("disconnect", disconnect);

var inputs = document.querySelectorAll("input");
for (var i = 0; i < inputs.length; i++) {
    if (inputs[i].type != "text" && inputs[i].type != "password" && inputs[i].type != "number") {
        inputs[i].addEventListener("keydown", function() {
            this.blur();
        });
    }
}
var buttons = document.querySelectorAll("button");
for (var i = 0; i < buttons.length; i++) {
    buttons[i].addEventListener("keydown", function() {
        this.blur();
    });
}
document.addEventListener("contextmenu", function(event) {
    event.preventDefault();
});

var ultraSecretInterval = null;
var UltraSecretFilters = function(filter) {
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
            var hue1 = 0;
            ultraSecretInterval = setInterval(function() {
                hue1 += 1;
                document.body.style.filter = "hue-rotate(" + hue1 + "deg)";
            }, 5);
            break;
        case "spinnyCarrier":
            var rotate = 0;
            var rotateDirection = 1;
            document.body.style.transformOrigin = "center center";
            ultraSecretInterval = setInterval(function() {
                rotate += Math.random() * 10 * rotateDirection;
                if (Math.random() < 0.1) {
                    rotateDirection *= -1;
                }
                var array = document.querySelectorAll("div, p, span, img, a, body");
                for (var i = 0; i < array.length; i++) {
                    array[i].style.transform = "rotate(" + (rotate + Math.random() * 5) + "deg)";
                }
            }, 5);
            break;
        case "texturePack":
            var newImages = {};
            var total = 0;
            for (var i in images) {
                total += 1;
            }
            for (var i in images) {
                var image = Math.random() * total;
                for (var j in images) {
                    image -= 1;
                    if (image < 0) {
                        newImages[i] = images[j];
                        break;
                    }
                }
            }
            images = newImages;
            var randomColor = function() {
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
            var hue = 0;
            var brightness = 1;
            var brightnessDirection = 1;
            var contrast = 1;
            var contrastDirection = -1;
            var saturation = 1;
            var saturationDirection = 1;
            var scale = 1;
            var scaleDirection = 1;
            var blur = 0;
            var invert = 0;
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

var sleep = function(time) {
    return new Promise(function(resolve, reject) {
        setTimeout(resolve, time);
    });
};