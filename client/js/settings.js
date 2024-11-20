// use html template

var draggableWindow = {
    x: 0,
    y: 0,
    state: WINDOW_HIDDEN,
    dragging: false,
    dragOffsetX: 0,
    dragOffsetY: 0,
    window: document.getElementById("window"),
    windowBar: document.getElementById("windowBar"),
    windowName: document.getElementById("windowName"),
    windowMinimize: document.getElementById("windowMinimize"),
    windowMinimizeSvg: document.getElementById("windowMinimizeSvg"),
    windowClose: document.getElementById("windowClose"),
    tabs: [],
    tabSelectButtons: document.getElementById("windowTabSelect").children,
    currentTab: 0,
    updatePosition: function() {
        this.x = Math.max(Math.min(this.x, windowWidth - this.window.clientWidth - 2 / devicePixelRatio), 0);
        this.y = Math.max(Math.min(this.y, windowHeight - 28), 0);
        this.window.style.left = this.x + "px";
        this.window.style.top = this.y + "px";
    },
    updateWidth: function() {
        // var borderSize = (this.window.getBoundingClientRect().width - this.window.clientWidth) / 2;
        // var borderSize = 1 / devicePixelRatio;
        // var borderSize = devicePixelRatio;
        var borderSize = Number(window.getComputedStyle(this.window).getPropertyValue("border-width").split("px")[0]);
        // var inventoryWidth = (18 * 5 + 2) * settings.itemSize / 16 + borderSize * 10 + 8;
        var inventoryWidth = (18 * 5 + 2) * settings.itemSize / 16 + borderSize * 10 + 8 - 2 * settings.itemSize / 16;
        var equipWidth = (18 * 4 + 2) * settings.itemSize / 16 + borderSize * 8 + 8 - 2 * settings.itemSize / 16;
        // var inventoryWidth = (18 * 5 + 2) * settings.itemSize / 16 + borderSize * 10;
        // var equipWidth = (18 * 3 + 2) * settings.itemSize / 16 + borderSize * 6;
        this.window.style.width = inventoryWidth + equipWidth + 4 * settings.itemSize / 16 - 12 + 8 + 106 + 4 + 4 * 4 + borderSize * 6 + 2 + "px";
        inventoryTab.style.width = inventoryWidth + "px";
        equipTab.style.width = equipWidth + "px";
        craftTab.style.width = equipWidth + "px";
    },
    show: function() {
        this.window.style.display = "block";
        this.window.state = WINDOW_VISIBLE;
    },
    hide: function() {
        this.window.style.display = "none";
        this.window.state = WINDOW_HIDDEN;
    },
    toggleVisible: function() {
        if (this.window.state == WINDOW_HIDDEN) {
            this.show();
        }
        else {
            this.hide();
        }
    },
    minimize: function() {
        this.window.style.maxHeight = "26px";
        this.window.style.resize = "none";
        this.windowMinimizeSvg.style.transform = "translate(-50%, -50%) rotate(180deg)";
        this.window.state = WINDOW_MINIMIZED;
    },
    maximize: function() {
        this.window.style.maxHeight = "100vh";
        this.window.style.resize = "vertical";
        this.windowMinimizeSvg.style.transform = "translate(-50%, -50%) rotate(0deg)";
        this.window.state = WINDOW_VISIBLE;
    },
    toggleMinimized: function() {
        if (this.window.state == WINDOW_VISIBLE) {
            this.minimize();
        }
        else {
            this.maximize();
        }
    },
    changeTab: function(tab) {
        if (this.currentTab == TAB_INVENTORY || this.currentTab == TAB_CRAFTING) {
            document.getElementById("inventoryTab").style.display = "none";
        }
        this.tabs[this.currentTab].style.display = "none";
        this.currentTab = tab;
        this.tabs[this.currentTab].style.display = "block";
        this.tabs[this.currentTab].scrollTop = 0;
        this.windowName.innerText = this.tabSelectButtons[this.currentTab].innerText;
        if (this.currentTab == TAB_INVENTORY || this.currentTab == TAB_CRAFTING) {
            document.getElementById("inventoryTab").style.display = "block";
            document.getElementById("inventoryTab").scrollTop = 0;
        }
    },
};
var tabs = document.getElementById("windowTabs").children;
for (var i = 0; i < tabs.length; i++) {
    if (tabs[i].id == "inventoryTab") {
        continue;
    }
    draggableWindow.tabs.push(tabs[i]);
}
for (let i = 0; i < draggableWindow.tabSelectButtons.length; i++) {
    draggableWindow.tabSelectButtons[i].addEventListener("click", function() {
        draggableWindow.changeTab(i);
    });
}
draggableWindow.changeTab(0);
draggableWindow.window.addEventListener("mousedown", function(event) {
    if (changingKeybind != null) {
        changeKeybind(event.button);
    }
    event.stopPropagation();
});
draggableWindow.windowBar.addEventListener("mousedown", function(event) {
    draggableWindow.dragging = true;
    draggableWindow.dragOffsetX = event.clientX - draggableWindow.x;
    draggableWindow.dragOffsetY = event.clientY - draggableWindow.y;
});
document.addEventListener("mousemove", function(event) {
    if (draggableWindow.dragging) {
        draggableWindow.x = event.clientX - draggableWindow.dragOffsetX;
        draggableWindow.y = event.clientY - draggableWindow.dragOffsetY;
        draggableWindow.updatePosition();
    }
});
document.addEventListener("mouseup", function() {
    draggableWindow.dragging = false;
});
draggableWindow.windowMinimize.addEventListener("click", function(event) {
    draggableWindow.toggleMinimized();
});
draggableWindow.windowClose.addEventListener("click", function(event) {
    draggableWindow.hide();
});

draggableWindow.show();


const settingsTable = document.getElementById("settingsTable");
var settings = {};
var settingData = {
    // performance
    fps: {name: "Target FPS:", min: 10, max: 120, step: 10, default: 60, update: function() {
        interpolationSteps = settings.fps / 20;
        this.indicator.innerText = settings.fps + "fps";
    }, label: "Performance"},
    renderDistance: {name: "Render Distance:", min: 1, max: 10, step: 1, default: 2, update: function() {
        socket.emit("settings", {
            id: "renderDistance",
            value: settings.renderDistance,
        });
        if (selfPlayer != null) {
            updateRenderedChunks();
        }
        this.indicator.innerText = settings.renderDistance + " chunk" + (settings.renderDistance == 1 ? "" : "s");
    }},
    renderQuality: {name: "Render Quality:", min: 50, max: 200, step: 10, default: 100, update: function() {
        if (selfPlayer != null) {
            window.onresize();
        }
        this.indicator.innerText = settings.renderQuality + "%";
    }},
    zoom: {name: "Zoom:", min: 50, max: 200, step: 10, default: 100, update: function() {
        if (selfPlayer != null) {
            window.onresize();
        }
        this.indicator.innerText = settings.zoom + "%";
    }},
    // effects
    animatedTiles: {name: "Animated Tiles:", default: true, update: function() {
        if (selfPlayer != null) {
            maps[selfMap].chunks = [];
            if (!settings.animatedTiles) {
                AnimatedTile.list = {};
            }
            updateRenderedChunks();
        }
        this.indicator.innerText = settings.animatedTiles ? "on" : "off";
    }, label: "Effects"},
    particles: {name: "Particles:", default: true, update: function() {
        socket.emit("settings", {
            id: "particles",
            value: settings.particles,
        });
        if (!settings.particles) {
            Particle.list = {};
            Particle.layers = {};
            if (settingData.fastParticles.input != null) {
                settings.fastParticles = false;
                settingData.fastParticles.input.checked = false;
                settingData.fastParticles.update();
            }
            else {
                settingData.fastParticles.default = false;
            }
        }
        this.indicator.innerText = settings.particles ? "on" : "off";
    }},
    fastParticles: {name: "Fast Particles:", default: false, update: function() {
        if (settings.fastParticles && !settings.particles) {
            settings.particles = true;
            settingData.particles.input.checked = true;
            settingData.particles.update();
        }
        this.indicator.innerText = settings.fastParticles ? "on" : "off";
    }},
    lights: {name: "Lights:", default: true, update: function() {
        if (!settings.lights) {
            if (settingData.coloredLights.input != null) {
                settings.coloredLights = false;
                settingData.coloredLights.input.checked = false;
                settingData.coloredLights.update();
            }
            else {
                settingData.coloredLights.default = false;
            }
            if (settingData.flickeringLights.input != null) {
                settings.flickeringLights = false;
                settingData.flickeringLights.input.checked = false;
                settingData.flickeringLights.update();
            }
            else {
                settingData.flickeringLights.default = false;
            }
        }
        this.indicator.innerText = settings.lights ? "on" : "off";
    }},
    coloredLights: {name: "Colored Lights:", default: true, update: function() {
        if (settings.coloredLights && !settings.lights) {
            settings.lights = true;
            settingData.lights.input.checked = true;
            settingData.lights.update();
        }
        this.indicator.innerText = settings.coloredLights ? "on" : "off";
    }},
    flickeringLights: {name: "Flickering Lights:", default: true, update: function() {
        if (settings.flickeringLights && !settings.lights) {
            settings.lights = true;
            settingData.lights.input.checked = true;
            settingData.lights.update();
        }
        this.indicator.innerText = settings.flickeringLights ? "on" : "off";
    }},
    cameraEffects: {name: "Camera Effects:", default: true, update: function() {
        socket.emit("settings", {
            id: "cameraEffects",
            value: settings.cameraEffects,
        });
        if (!settings.cameraEffects) {
            if (settingData.cameraShake.input != null) {
                settings.cameraShake = false;
                settingData.cameraShake.input.checked = false;
                settingData.cameraShake.update();
            }
            else {
                settingData.cameraShake.default = false;
            }
            if (settingData.cameraFlash.input != null) {
                settings.cameraFlash = false;
                settingData.cameraFlash.input.checked = false;
                settingData.cameraFlash.update();
            }
            else {
                settingData.cameraFlash.default = false;
            }
        }
        this.indicator.innerText = settings.cameraEffects ? "on" : "off";
    }},
    cameraShake: {name: "Camera Shake:", default: true, update: function() {
        if (!settings.cameraShake) {
            cameraShakeMagnitude = 0;
            cameraShakeDecay = 0;
        }
        if (settings.cameraShake && !settings.cameraEffects) {
            settings.cameraEffects = true;
            settingData.cameraEffects.input.checked = true;
            settingData.cameraEffects.update();
        }
        this.indicator.innerText = settings.cameraShake ? "on" : "off";
    }},
    cameraFlash: {name: "Camera Flash:", default: true, update: function() {
        if (!settings.cameraShake) {
            canvasFlash.innerHTML = "";
        }
        if (settings.cameraFlash && !settings.cameraEffects) {
            settings.cameraEffects = true;
            settingData.cameraEffects.input.checked = true;
            settingData.cameraEffects.update();
        }
        this.indicator.innerText = settings.cameraFlash ? "on" : "off";
    }},
    // accessibility
    fullscreen: {name: "Fullscreen:", default: false, update: function() {
        if (document.hasFocus()) {
            if (settings.fullscreen) {
                if (document.fullscreenElement == null) {
                    document.body.requestFullscreen();
                }
            }
            else {
                if (document.fullscreenElement != null) {
                    document.exitFullscreen();
                }
            }
        }
        this.indicator.innerText = settings.fullscreen ? "on" : "off";
    }, label: "Accessibility"},
    highContrast: {name: "High Contrast:", default: false, update: function() {
        canvas.style.filter = settings.highContrast ? "brightness(90%) saturate(130%) contrast(120%)" : "";
        this.indicator.innerText = settings.highContrast ? "on" : "off";
    }},
    dialogueSpeed: {name: "Dialogue Speed:", min: 1, max: 10, step: 1, default: 5, update: function() {
        this.indicator.innerText = settings.dialogueSpeed;
    }},
    statsSize: {name: "Stats Size:", min: 25, max: 400, step: 25, default: 100, update: function() {
        document.body.style.setProperty("--stats-size", settings.statsSize / 100);
        this.indicator.innerText = settings.statsSize + "%";
    }},
    chatSize: {name: "Chat Size:", min: 25, max: 400, step: 25, default: 100, update: function() {
        document.body.style.setProperty("--chat-size", settings.chatSize / 100);
        this.indicator.innerText = settings.chatSize + "%";
    }},
    chatFontSize: {name: "Chat Font Size:", min: 1, max: 30, step: 1, default: 16, update: function() {
        document.body.style.setProperty("--chat-font-size", settings.chatFontSize + "px");
        this.indicator.innerText = settings.chatFontSize + "px";
    }},
    chatBackground: {name: "Chat Background:", default: false, update: function() {
        chat.style.backgroundColor = settings.chatBackground ? "#00000055" : "transparent";
        this.indicator.innerText = settings.chatBackground ? "on" : "off";
    }},
    itemSize: {name: "Item Size:", min: 16, max: 128, step: 16, default: 64, update: function() {
        document.body.style.setProperty("--item-size", settings.itemSize / 16);
        draggableWindow.updateWidth();
        this.indicator.innerText = settings.itemSize + "px";
    }},
    droppedItemSize: {name: "Dropped Item Size:", min: 16, max: 128, step: 16, default: 48, update: function() {
        this.indicator.innerText = settings.droppedItemSize + "px";
    }},
    tooltipAbbreviations: {name: "Tooltip Abbreviations:", default: false, update: function() {
        this.indicator.innerText = settings.tooltipAbbreviations ? "on" : "off";
    }},
    // debug
    debug: {name: "Debug:", default: false, update: function() {
        socket.emit("settings", {
            id: "debug",
            value: settings.debug,
        });
        document.getElementById("debugOverlay").style.display = settings.debug ? "block" : "none";
        this.indicator.innerText = settings.debug ? "on" : "off";
    }, label: "Debug"},
    desyncBuffer: {name: "Desync Buffer:", min: 0, max: 64, step: 16, default: 0, update: function() {
        socket.emit("settings", {
            id: "desyncBuffer",
            value: settings.desyncBuffer,
        });
        this.indicator.innerText = settings.desyncBuffer + "px";
    }},
};
document.addEventListener("fullscreenchange", function() {
    if (!document.fullscreenElement) {
        settings.fullscreen = false;
        settingData.fullscreen.input.checked = false;
        settingData.fullscreen.update();
        saveSettings();
    }
});

var saveSettings = function() {
    localStorage.setItem("settings", JSON.stringify(settings));
};
var loadSettings = function() {
    var data = JSON.parse(localStorage.getItem("settings"));
    if (data != null) {
        for (var i in data) {
            if (settingData[i] != null && typeof settingData[i].default == typeof data[i]) {
                settings[i] = data[i];
            }
        }
    }
};
loadSettings();
for (let i in settingData) {
    if (settingData[i].label != null) {
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        const div = document.createElement("div");
        div.classList.add("settingsGroupLabel");
        div.innerText = settingData[i].label;
        td.appendChild(div);
        tr.appendChild(td);
        settingsTable.appendChild(tr);
    }
    if (typeof settingData[i].default == "boolean") {
        const tr = document.createElement("tr");
        const td1 = document.createElement("td");
        const label = document.createElement("label");
        label.htmlFor = i + "Setting";
        label.classList.add("settingsLabel");
        label.innerText = settingData[i].name;
        td1.appendChild(label);
        tr.appendChild(td1);
        const td2 = document.createElement("td");
        const toggle = document.createElement("label");
        toggle.classList.add("toggle");
        const input = document.createElement("input");
        input.id = i + "Setting";
        input.classList.add("toggleInput");
        input.type = "checkbox";
        input.checked = settingData[i].default;
        const slider = document.createElement("span");
        slider.classList.add("toggleSlider");
        toggle.appendChild(input);
        toggle.appendChild(slider);
        td2.appendChild(toggle);
        tr.appendChild(td2);
        const td3 = document.createElement("td");
        const indicator = document.createElement("div");
        // ???
        input.addEventListener("input", function() {
            settings[i] = input.checked;
            settingData[i].update();
            saveSettings();
        });
        td3.appendChild(indicator);
        tr.appendChild(td3);
        settingsTable.appendChild(tr);
        if (settings[i] == null) {
            settings[i] = settingData[i].default;
        }
        input.checked = settings[i];
        settingData[i].input = input;
        settingData[i].indicator = indicator;
        settingData[i].update();
    }
    else if (typeof settingData[i].default == "number") {
        const tr = document.createElement("tr");
        const td1 = document.createElement("td");
        const label = document.createElement("div");
        label.classList.add("settingsLabel");
        label.innerText = settingData[i].name;
        td1.appendChild(label);
        tr.appendChild(td1);
        const td2 = document.createElement("td");
        const input = document.createElement("input");
        input.classList.add("slider");
        input.type = "range";
        input.min = settingData[i].min;
        input.max = settingData[i].max;
        input.step = settingData[i].step;
        input.value = settingData[i].default;
        td2.appendChild(input);
        tr.appendChild(td2);
        const td3 = document.createElement("td");
        const indicator = document.createElement("div");
        input.addEventListener("input", function() {
            settings[i] = parseFloat(input.value, 10);
            settingData[i].update();
            saveSettings();
        });
        td3.appendChild(indicator);
        tr.appendChild(td3);
        settingsTable.appendChild(tr);
        if (settings[i] == null) {
            settings[i] = settingData[i].default;
        }
        input.value = settings[i];
        settingData[i].input = input;
        settingData[i].indicator = indicator;
        settingData[i].update();
    }
}

const keybindsTable = document.getElementById("keybindsTable");
var keybinds = {};
var keybindData = {
    left: {name: "Move Left:", default: "a", label: "Movement"},
    right: {name: "Move Right:", default: "d"},
    up: {name: "Move Up:", default: "w"},
    down: {name: "Move Down:", default: "s"},
    attack: {name: "Use Item:", default: 0},
    defend: {name: "Interact:", default: 2},
    heal: {name: "Heal:", default: " "},
    drop: {name: "Drop Item:", default: "q", label: "Windows"},
    equip: {name: "Equip Item:", default: "f"},
    chat: {name: "Open Chat:", default: "t"},
    settings: {name: "Settings:", default: null},
    inventory: {name: "Inventory:", default: "i"},
    map: {name: "World Map:", default: "m"},
    debug: {name: "Debug:", default: "\\", label: "Debug"},
};

var changingKeybind = null;

var saveKeybinds = function() {
    localStorage.setItem("keybinds", JSON.stringify(keybinds));
};
var loadKeybinds = function() {
    var data = JSON.parse(localStorage.getItem("keybinds"));
    if (data != null) {
        for (var i in data) {
            if (keybindData[i] != null) {
                keybinds[i] = data[i];
            }
        }
    }
};
loadKeybinds();
var updateKeybindButton = function(keybind) {
    var text = keybinds[keybind];
    switch (keybinds[keybind]) {
        case null:
            text = "Not Bound";
            break;
        case 0:
            text = "LMB";
            break;
        case 1:
            text = "MMB";
            break;
        case 2:
            text = "RMB";
            break;
        case " ":
            text = "Space";
            break;
    }
    keybindData[keybind].button.innerText = text;
};
var changeKeybind = function(value) {
    if (value == "Escape") {
        value = null;
    }
    var duplicateKeybind = null;
    for (var i in keybinds) {
        if (i != changingKeybind && typeof keybinds[i] == typeof keybinds[changingKeybind] && keybinds[i] == keybinds[changingKeybind]) {
            if (duplicateKeybind == null) {
                duplicateKeybind = i;
            }
            else {
                duplicateKeybind = null;
                break;
            }
        }
    }
    if (duplicateKeybind != null) {
        keybindData[duplicateKeybind].button.style.color = "var(--font-color)";
    }
    keybinds[changingKeybind] = value;
    keybindData[changingKeybind].button.style.color = "var(--font-color)";
    updateKeybindButton(changingKeybind);
    if (value != null) {
        for (var i in keybinds) {
            if (i != changingKeybind && typeof keybinds[i] == typeof keybinds[changingKeybind] && keybinds[i] == keybinds[changingKeybind]) {
                keybindData[i].button.style.color = "var(--font-color-error)";
                keybindData[changingKeybind].button.style.color = "var(--font-color-error)";
            }
        }
    }
    changingKeybind = null;
    saveKeybinds();
};
for (let i in keybindData) {
    if (keybindData[i].label != null) {
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        const label = document.createElement("div");
        label.classList.add("keybindsGroupLabel");
        label.innerText = keybindData[i].label;
        td.appendChild(label);
        tr.appendChild(td);
        keybindsTable.appendChild(tr);
    }
    const tr = document.createElement("tr");
    const td1 = document.createElement("td");
    const label = document.createElement("div");
    label.classList.add("keybindsLabel");
    label.innerText = keybindData[i].name;
    td1.appendChild(label);
    tr.appendChild(td1);
    const td2 = document.createElement("td");
    const button = document.createElement("button");
    button.classList.add("button");
    button.classList.add("keybindsButton");
    button.addEventListener("click", function() {
        if (changingKeybind != null) {
            keybindData[changingKeybind].button.style.color = "var(--font-color)";
        }
        changingKeybind = i;
        button.style.color = "var(--font-color-warn)";
    });
    td2.appendChild(button);
    tr.appendChild(td2);
    keybindsTable.appendChild(tr);
    if (keybinds[i] == null) {
        keybinds[i] = keybindData[i].default;
    }
    keybindData[i].button = button;
    updateKeybindButton(i);
}
var duplicateKeybinds = {};
for (var i in keybinds) {
    if (keybinds[i] == null) {
        continue;
    }
    for (var j in keybinds) {
        if (i != j && typeof keybinds[i] == typeof keybinds[j] && keybinds[i] == keybinds[j]) {
            keybindData[i].button.style.color = "var(--font-color-error)";
            keybindData[j].button.style.color = "var(--font-color-error)";
        }
    }
}

const customizeTable = document.getElementById("customizeTable");
var customizeData = {
    body: { name: "Body:" },
    shirt: { name: "Shirt:" },
    pants: { name: "Pants:" },
    eyes: { name: "Eyes:" },
    gloves: { name: "Gloves:", types: 1 },
    boots: { name: "Boots:", types: 1 },
    pouch: { name: "Pouch:", types: 1 },
    hair: { name: "Hair:", types: 8 },
};
var createCustomizations = function(customizations) {
    for (let i in customizeData) {
        const tr = document.createElement("tr");
        const td1 = document.createElement("td");
        const label = document.createElement("div");
        label.classList.add("customizeLabel");
        label.innerText = customizeData[i].name;
        td1.appendChild(label);
        tr.appendChild(td1);
        
        const td2 = document.createElement("td");
        const colorSelect = document.createElement("input");
        colorSelect.classList.add("colorSelect");
        colorSelect.type = "color";
        var r = customizations[i][0].toString(16);
        if (r.length == 1) {
            r = "0" + r;
        }
        var g = customizations[i][1].toString(16);
        if (g.length == 1) {
            g = "0" + g;
        }
        var b = customizations[i][2].toString(16);
        if (b.length == 1) {
            b = "0" + b;
        }
        colorSelect.value = "#" + r + g + b;
        colorSelect.addEventListener("input", function() {
            var color = [parseInt(colorSelect.value.substring(1, 3), 16), parseInt(colorSelect.value.substring(3, 5), 16), parseInt(colorSelect.value.substring(5, 7), 16)];
            socket.emit("customize", {
                id: i,
                type: CUSTOMIZE_COLOR,
                value: color,
            });
            if (selfPlayer.customizations[i][0] != color[0] || selfPlayer.customizations[i][1] != color[1] || selfPlayer.customizations[i][2] != color[2]) {
                selfPlayer.customizations[i][0] = color[0];
                selfPlayer.customizations[i][1] = color[1];
                selfPlayer.customizations[i][2] = color[2];
                Rig.renderCustomizations(selfPlayer);
            }
        });
        td2.appendChild(colorSelect);
        tr.appendChild(td2);
    
        const td3 = document.createElement("td");
        const label1 = document.createElement("label");
        label1.htmlFor = i + "CustomizeAlpha";
        label1.classList.add("customizeLabel");
        label1.innerText = "A:";
        td3.appendChild(label1);
        tr.appendChild(td3);
        
        const td4 = document.createElement("td");
        const input1 = document.createElement("input");
        input1.id = i + "CustomizeAlpha";
        input1.classList.add("input");
        input1.type = "number";
        input1.min = 0;
        input1.max = 1;
        input1.step = 0.05;
        input1.value = customizations[i][3];
        input1.addEventListener("input", function() {
            let alpha = parseFloat(input1.value, 10);
            socket.emit("customize", {
                id: i,
                type: CUSTOMIZE_ALPHA,
                value: alpha,
            });
            if (selfPlayer.customizations[i][3] != alpha) {
                selfPlayer.customizations[i][3] = alpha;
                Rig.renderCustomizations(selfPlayer);
            }
        });
        td4.appendChild(input1);
        tr.appendChild(td4);
    
        if (customizeData[i].types != null) {
            const td5 = document.createElement("td");
            const label2 = document.createElement("label");
            label2.htmlFor = i + "CustomizeType";
            label2.classList.add("customizeLabel");
            label2.innerText = "Type:";
            td5.appendChild(label2);
            tr.appendChild(td5);
            
            const td6 = document.createElement("td");
            const input2 = document.createElement("input");
            input2.id = i + "CustomizeType";
            input2.classList.add("input");
            input2.type = "number";
            input2.min = 0;
            input2.max = customizeData[i].types;
            input2.step = 1;
            input2.value = customizations[i][4];
            input2.addEventListener("input", function() {
                let type = Number(input2.value);
                socket.emit("customize", {
                    id: i,
                    type: CUSTOMIZE_TYPE,
                    value: type,
                });
                if (selfPlayer.customizations[i][4] != type) {
                    selfPlayer.customizations[i][4] = type;
                    Rig.renderCustomizations(selfPlayer);
                }
            });
            td6.appendChild(input2);
            tr.appendChild(td6);
        }
        customizeTable.appendChild(tr);
    }
};

var interpolationSteps = 3;