let loadedAssets = 0;
let loadNpcs = function() {
    return new Promise(function(resolve, reject) {
        let request = new XMLHttpRequest();
        request.open("GET", "./../data/npcs.json", true);
        request.onload = function() {
            if (this.status >= 200 && this.status < 400) {
                let data = JSON.parse(this.response);
                Rig.data[NPC] = data;
                loadedAssets += 1;
                console.log("loaded npcs");
                for (let i in data) {
                    if (data[i].image != null && Entity.images[data[i].image] == null) {
                        Entity.images[data[i].image] = new Image();
                        Entity.images[data[i].image].src = "./../images/npc/" + data[i].image + ".png";
                        Entity.images[data[i].image].onload = function() {
                            loadedAssets += 1;
                            console.log("loaded " + data[i].image);
                        };
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
let loadMonsters = function() {
    return new Promise(function(resolve, reject) {
        let request = new XMLHttpRequest();
        request.open("GET", "./../data/monsters.json", true);
        request.onload = function() {
            if (this.status >= 200 && this.status < 400) {
                let data = JSON.parse(this.response);
                Rig.data[MONSTER] = data;
                loadedAssets += 1;
                console.log("loaded monsters");
                for (let i in data) {
                    if (data[i].image != null && Entity.images[data[i].image] == null) {
                        Entity.images[data[i].image] = new Image();
                        Entity.images[data[i].image].src = "./../images/monster/" + data[i].image + ".png";
                        Entity.images[data[i].image].onload = function() {
                            loadedAssets += 1;
                            console.log("loaded " + data[i].image);
                        };
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
let loadProjectiles = function() {
    return new Promise(function(resolve, reject) {
        let request = new XMLHttpRequest();
        request.open("GET", "./../data/projectiles.json", true);
        request.onload = function() {
            if (this.status >= 200 && this.status < 400) {
                let data = JSON.parse(this.response);
                Projectile.data = data;
                loadedAssets += 1;
                console.log("loaded projectiles");
                for (let i in data) {
                    if (data[i].image != null && Entity.images[data[i].image] == null) {
                        Entity.images[data[i].image] = new Image();
                        Entity.images[data[i].image].src = "./../images/projectile/" + data[i].image + ".png";
                        Entity.images[data[i].image].onload = function() {
                            loadedAssets += 1;
                            console.log("loaded " + data[i].image);
                        };
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

let loadItems = function() {
    return new Promise(function(resolve, reject) {
        let request = new XMLHttpRequest();
        request.open("GET", "./../data/items.json", true);
        request.onload = function() {
            if (this.status >= 200 && this.status < 400) {
                let data = JSON.parse(this.response);
                Inventory.data.items = data;
                loadedAssets += 1;
                console.log("loaded items");
                for (let i in data) {
                    if (data[i].image != null && Entity.images[data[i].image] == null) {
                        Entity.images[data[i].image] = new Image();
                        Entity.images[data[i].image].src = "./../images/item/" + data[i].image + ".png";
                        Entity.images[data[i].image].onload = function() {
                            loadedAssets += 1;
                            console.log("loaded " + data[i].image);
                        };
                    }
                    if (data[i].image != null && Entity.images[data[i].image + "Selected"] == null) {
                        Entity.images[data[i].image + "Selected"] = new Image();
                        Entity.images[data[i].image + "Selected"].src = "./../images/item/" + data[i].image + "Selected.png";
                        Entity.images[data[i].image + "Selected"].onload = function() {
                            loadedAssets += 1;
                            console.log("loaded " + data[i].image + "Selected");
                        };
                    }
                    if (data[i].equip != null) {
                        switch (data[i].equip) {
                            case "helmet":
                                data[i].equip = EQUIP_HELMET;
                                break;
                            case "chestplate":
                                data[i].equip = EQUIP_CHESTPLATE;
                                break;
                            case "boots":
                                data[i].equip = EQUIP_BOOTS;
                                break;
                            case "shield":
                                data[i].equip = EQUIP_SHIELD;
                                break;
                            case "crystal":
                                data[i].equip = EQUIP_CRYSTAL;
                                break;
                            case "accessory":
                                data[i].equip = EQUIP_ACCESSORY_1;
                                break;
                        }
                    }
                    if (data[i].effects != null) {
                        for (let j in data[i].effects) {
                            switch (data[i].effects[j].type) {
                                case "base":
                                    data[i].effects[j].type = EFFECT_BASE;
                                    break;
                                case "additive":
                                    data[i].effects[j].type = EFFECT_ADDITIVE;
                                    break;
                                case "multiplicative":
                                    data[i].effects[j].type = EFFECT_MULTIPLICATIVE;
                                    break;
                                case "other":
                                    data[i].effects[j].type = EFFECT_OTHER;
                                    break;
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
let loadEnchantments = function() {
    return new Promise(function(resolve, reject) {
        let request = new XMLHttpRequest();
        request.open("GET", "./../data/enchantments.json", true);
        request.onload = function() {
            if (this.status >= 200 && this.status < 400) {
                let data = JSON.parse(this.response);
                Inventory.data.enchantments = data;
                loadedAssets += 1;
                console.log("loaded enchantments");
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
let loadCrafts = function() {
    return new Promise(function(resolve, reject) {
        let request = new XMLHttpRequest();
        request.open("GET", "./../data/crafts.json", true);
        request.onload = function() {
            if (this.status >= 200 && this.status < 400) {
                let data = JSON.parse(this.response);
                Inventory.data.crafts = data;
                loadedAssets += 1;
                console.log("loaded crafts");
                // parse ids into number
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