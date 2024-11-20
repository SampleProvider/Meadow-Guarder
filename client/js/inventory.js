const inventoryTab = document.getElementById("inventoryTab");
const equipTab = document.getElementById("equipTab");
const craftTab = document.getElementById("craftTab");
const salvageTab = document.getElementById("salvageTab");

const hotbar = document.getElementById("hotbar");

const tooltip = document.getElementById("tooltip");
const tooltipTitle = document.getElementById("tooltipTitle");
const tooltipSubtitle = document.getElementById("tooltipSubtitle");
const tooltipDescription = document.getElementById("tooltipDescription");

const draggingItem = document.getElementById("draggingItem");

var Inventory = {
    items: [],
    itemDivs: [],
    selectedItem: 0,
    hoveredItem: null,
    maxItems: 10,
    data: {
        items: {},
        crafts: {},
        enchantments: {},
    },
    createItems: function() {
        for (var i = inventoryTab.children.length - 1; i >= 0; i++) {
            if (i < this.maxItems) {
                break;
            }
            inventoryTab.children[i].remove();
        }
        for (let i = 0; i < this.maxItems; i++) {
            if (this.items[i] == null) {
                this.items[i] = ITEM_NULL;
            }
            const item = document.createElement("div");
            item.classList.add("item");
            item.addEventListener("mouseover", function() {
                Inventory.hoveredItem = i;
                if (Inventory.items[i] != ITEM_NULL) {
                    Inventory.showTooltip(Inventory.items[i]);
                }
            });
            item.addEventListener("mouseout", function() {
                Inventory.hoveredItem = null;
                Inventory.hideTooltip();
            });
            item.addEventListener("mousemove", function() {
                if (Inventory.items[i] != ITEM_NULL) {
                    Inventory.moveTooltip();
                }
            });
            item.addEventListener("click", function() {
                Inventory.clickItem(i, 0);
                if (Inventory.items[i] != ITEM_NULL) {
                    Inventory.showTooltip(Inventory.items[i]);
                    Inventory.moveTooltip();
                }
                else {
                    Inventory.hideTooltip();
                }
            });
            item.addEventListener("contextmenu", function() {
                Inventory.clickItem(i, 2);
                if (Inventory.items[i] != ITEM_NULL) {
                    Inventory.showTooltip(Inventory.items[i]);
                    Inventory.moveTooltip();
                }
                else {
                    Inventory.hideTooltip();
                }
            });
            const cooldown = document.createElement("div");
            cooldown.classList.add("itemCooldown");
            item.appendChild(cooldown);
            const stackSize = document.createElement("div");
            stackSize.classList.add("itemStackSize");
            item.appendChild(stackSize);
            inventoryTab.appendChild(item);

            if (i < 5) {
                const item = document.createElement("div");
                item.classList.add("item");
                item.addEventListener("mouseover", function() {
                    Inventory.hoveredItem = i;
                    if (Inventory.items[i] != ITEM_NULL) {
                        Inventory.showTooltip(Inventory.items[i]);
                    }
                });
                item.addEventListener("mouseout", function() {
                    Inventory.hoveredItem = null;
                    Inventory.hideTooltip();
                });
                item.addEventListener("mousemove", function() {
                    if (Inventory.items[i] != ITEM_NULL) {
                        Inventory.moveTooltip();
                    }
                });
                item.addEventListener("click", function() {
                    Inventory.clickItem(i, 0);
                    if (Inventory.items[i] != ITEM_NULL) {
                        Inventory.showTooltip(Inventory.items[i]);
                        Inventory.moveTooltip();
                    }
                    else {
                        Inventory.hideTooltip();
                    }
                });
                item.addEventListener("contextmenu", function() {
                    Inventory.clickItem(i, 2);
                    if (Inventory.items[i] != ITEM_NULL) {
                        Inventory.showTooltip(Inventory.items[i]);
                        Inventory.moveTooltip();
                    }
                    else {
                        Inventory.hideTooltip();
                    }
                });
                const cooldown = document.createElement("div");
                cooldown.classList.add("itemCooldown");
                item.appendChild(cooldown);
                const stackSize = document.createElement("div");
                stackSize.classList.add("itemStackSize");
                item.appendChild(stackSize);
                hotbar.appendChild(item);
            }
        }
    },
    createEquips: function() {
        for (let i = EQUIP_HELMET; i >= EQUIP_ACCESSORY_2; i--) {
            this.items[i] = ITEM_NULL;
            const item = document.createElement("div");
            item.classList.add("item");
            item.classList.add("equip" + this.getEquipId(i));
            item.addEventListener("mouseover", function() {
                Inventory.hoveredItem = i;
                if (Inventory.items[i] != ITEM_NULL) {
                    Inventory.showTooltip(Inventory.items[i]);
                }
            });
            item.addEventListener("mouseout", function() {
                Inventory.hoveredItem = null;
                Inventory.hideTooltip();
            });
            item.addEventListener("mousemove", function() {
                if (Inventory.items[i] != ITEM_NULL) {
                    Inventory.moveTooltip();
                }
            });
            item.addEventListener("click", function() {
                Inventory.clickItem(i, 0);
                if (Inventory.items[i] != ITEM_NULL) {
                    Inventory.showTooltip(Inventory.items[i]);
                    Inventory.moveTooltip();
                }
                else {
                    Inventory.hideTooltip();
                }
            });
            item.addEventListener("contextmenu", function() {
                Inventory.clickItem(i, 2);
                if (Inventory.items[i] != ITEM_NULL) {
                    Inventory.showTooltip(Inventory.items[i]);
                    Inventory.moveTooltip();
                }
                else {
                    Inventory.hideTooltip();
                }
            });
            item.addEventListener("keydown", function(event) {
                if (event.key.toLowerCase() == "q") {
                    console.log(event)
                    Inventory.dropItem(i, event.ctrlKey ? 0 : 2);
                    if (Inventory.items[i] != ITEM_NULL) {
                        Inventory.showTooltip(Inventory.items[i]);
                        Inventory.moveTooltip();
                    }
                    else {
                        Inventory.hideTooltip();
                    }
                }
            });
            const cooldown = document.createElement("div");
            cooldown.classList.add("itemCooldown");
            item.appendChild(cooldown);
            const stackSize = document.createElement("div");
            stackSize.classList.add("itemStackSize");
            item.appendChild(stackSize);
            equipTab.appendChild(item);
        }
    },
    createCrafts: function() {
        for (let i = 0; i < this.data.crafts.length; i++) {
            // const craft = document.createElement("div");
            // craft.classList.add("craft");
            const item = document.createElement("div");
            item.classList.add("item");
            item.style.backgroundImage = "url(./../images/item/" + this.data.items[this.data.crafts[i].id].image + ".png)";
            item.addEventListener("mouseover", function() {
                Inventory.showTooltip(Inventory.data.crafts[i], Inventory.data.crafts[i].materials);
            });
            item.addEventListener("mouseout", function() {
                Inventory.hideTooltip();
            });
            item.addEventListener("mousemove", function() {
                Inventory.moveTooltip();
            });
            item.addEventListener("click", function() {
                Inventory.clickCraft(i, 0);
                // Inventory.showTooltip(Inventory.items[i]);
                Inventory.showTooltip(Inventory.data.crafts[i], Inventory.data.crafts[i].materials);
                Inventory.moveTooltip();
            });
            item.addEventListener("contextmenu", function() {
                Inventory.clickCraft(i, 2);
                Inventory.showTooltip(Inventory.items[i]);
                Inventory.moveTooltip();
            });
            const stackSize = document.createElement("div");
            stackSize.classList.add("itemStackSize");
            stackSize.innerText = this.data.crafts[i].stackSize == 1 ? "" : this.data.crafts[i].stackSize;
            item.appendChild(stackSize);
            // these ids will get parsed to number and conversion or do we even need to parse
            // const materials = document.createElement("div");
            // materials.classList.add("craftMaterials");
            // materials.addEventListener("wheel", function(event) {
            //     materials.scrollBy({
            //         left: event.deltaY / 2,
            //         behavior: "auto",
            //     });
            // }, {passive: true});
            // for (let j = 0; j < this.data.crafts[i].materials.length; j++) {
            //     const material = document.createElement("div");
            //     material.classList.add("item");
            //     // do we changef to image???
            //     material.style.backgroundImage = "url(./../images/item/" + this.data.items[this.data.crafts[i].materials[j].id].image + ".png)";
            //     material.addEventListener("mouseover", function() {
            //         Inventory.showTooltip(Inventory.data.crafts[i].materials[j]);
            //     });
            //     material.addEventListener("mouseout", function() {
            //         Inventory.hideTooltip();
            //     });
            //     material.addEventListener("mousemove", function() {
            //         Inventory.moveTooltip();
            //     });
            //     const materialStackSize = document.createElement("div");
            //     materialStackSize.classList.add("itemStackSize");
            //     materialStackSize.innerText = this.data.crafts[i].materials[j].stackSize == 1 ? "" : this.data.crafts[i].materials[j].stackSize;
            //     material.appendChild(materialStackSize);
            //     materials.appendChild(material);
            // }
            // const arrow = document.createElement("div");
            // arrow.classList.add("craftArrow");
            // craft.appendChild(materials);
            // craft.appendChild(arrow);
            // craft.appendChild(item);
            // craftTab.appendChild(craft);
            craftTab.appendChild(item);
        }
    },
    createSalvage: function() {
        
    },
    refreshItem: function(index) {
        // remove .children calls
        // also probably fix the hotbar spaghetti
        console.log(this.items[index], this.data.items)
        var stackSize = this.items[index] == ITEM_NULL ? 0 : this.items[index].stackSize;
        var item = index == EQUIP_DRAGGING ? draggingItem : index < 0 ? equipTab.children[-index] : inventoryTab.children[index + 1];
        if (stackSize == 0) {
            if (index == EQUIP_DRAGGING) {
                this.hideDraggingItem();
            }
            item.style.backgroundImage = "unset";
            item.children[0].style.transition = "unset";
            item.children[0].style.height = "0%";
            item.children[1].innerText = "";
            if (index >= 0 && index < 5) {
                item = hotbar.children[index];
                item.style.backgroundImage = "unset";
                item.children[0].style.transition = "unset";
                item.children[0].style.height = "0%";
                item.children[1].innerText = "";
            }
        }
        else {
            if (index == EQUIP_DRAGGING) {
                this.showDraggingItem();
                this.moveDraggingItem();
            }
            item.style.backgroundImage = "url(./images/item/" + this.data.items[this.items[index].id].image + ".png)";
            item.children[0].style.transition = "unset";
            item.children[0].style.height = this.data.items[this.items[index].id].cooldown == 0 ? "0%" : this.items[index].cooldown / this.data.items[this.items[index].id].cooldown * 100 + "%";
            item.children[0].offsetHeight;
            item.children[0].style.transition = "height " + this.items[index].cooldown * 50 + "ms linear";
            item.children[0].style.height = "0%";
            if (stackSize == 1) {
                item.children[1].innerText = "";
            }
            else {
                item.children[1].innerText = stackSize;
            }
            if (index >= 0 && index < 5) {
                item = hotbar.children[index];
                item.style.backgroundImage = "url(./images/item/" + this.data.items[this.items[index].id].image + ".png)";
                item.children[0].style.transition = "unset";
                item.children[0].style.height = this.data.items[this.items[index].id].cooldown == 0 ? "0%" : this.items[index].cooldown / this.data.items[this.items[index].id].cooldown * 100 + "%";
                item.children[0].offsetHeight;
                item.children[0].style.transition = "height " + this.items[index].cooldown * 50 + "ms linear";
                item.children[0].style.height = "0%";
                if (stackSize == 1) {
                    item.children[1].innerText = "";
                }
                else {
                    item.children[1].innerText = stackSize;
                }
            }
        }
    },
    clickItem: function(index, button) {
        if (this.items[EQUIP_DRAGGING] == ITEM_NULL) {
            var item = this.items[index];
            if (item == ITEM_NULL) {
                return;
            }
            var stackSize = button == 0 ? item.stackSize : Math.ceil(item.stackSize / 2);
            this.items[EQUIP_DRAGGING] = {
                id: item.id,
                enchantments: item.enchantments,
                stackSize: stackSize,
                cooldown: item.cooldown,
            };
            item.stackSize -= stackSize;
            if (item.stackSize == 0) {
                this.items[index] = ITEM_NULL;
            }
            this.refreshItem(EQUIP_DRAGGING);
            this.refreshItem(index);
            socket.emit("item", {
                action: ITEM_TAKE,
                index: index,
                stackSize: stackSize,
            });
        }
        else {
            var draggingItem = this.items[EQUIP_DRAGGING];
            var item = this.items[index];
            if (index < 0 && ((index >= EQUIP_CRYSTAL && this.data.items[draggingItem.id].equip != index) || (index <= EQUIP_ACCESSORY_1 && index >= EQUIP_ACCESSORY_2 && this.data.items[draggingItem.id].equip != EQUIP_ACCESSORY_1))) {
                return;
            }
            if (item == ITEM_NULL) {
                if (button == 0) {
                    this.items[EQUIP_DRAGGING] = item;
                    this.items[index] = draggingItem;
                    socket.emit("item", {
                        action: ITEM_PLACE,
                        index: index,
                        stackSize: draggingItem.stackSize,
                    });
                }
                else {
                    draggingItem.stackSize -= 1;
                    this.items[index] = {
                        id: draggingItem.id,
                        enchantments: draggingItem.enchantments,
                        stackSize: 1,
                        cooldown: draggingItem.cooldown,
                    };
                    if (draggingItem.stackSize == 0) {
                        this.items[EQUIP_DRAGGING] = ITEM_NULL;
                    }
                    socket.emit("item", {
                        action: ITEM_PLACE,
                        index: index,
                        stackSize: 1,
                    });
                }
            }
            else if (!this.isSameItem(item, draggingItem.id, draggingItem.enchantments)) {
                this.items[EQUIP_DRAGGING] = item;
                this.items[index] = draggingItem;
                socket.emit("item", {
                    action: ITEM_PLACE,
                    index: index,
                    stackSize: draggingItem.stackSize,
                });
            }
            else {
                // var stackSize = button == 0 ? draggingItem.stackSize : Math.ceil(draggingItem.stackSize / 2);
                var stackSize = button == 0 ? draggingItem.stackSize : 1;
                draggingItem.stackSize -= stackSize;
                item.stackSize += stackSize;
                if (item.stackSize > this.data.items[item.id].maxStackSize) {
                    draggingItem.stackSize += item.stackSize - this.data.items[item.id].maxStackSize;
                    item.stackSize = this.data.items[item.id].maxStackSize;
                }
                if (draggingItem.stackSize == 0) {
                    this.items[EQUIP_DRAGGING] = ITEM_NULL;
                }
                socket.emit("item", {
                    action: ITEM_PLACE,
                    index: index,
                    stackSize: stackSize,
                });
            }
            this.refreshItem(EQUIP_DRAGGING);
            this.refreshItem(index);
        }
    },
    dropItem: function(index, button) {
        var stackSize = button == 0 ? Inventory.items[index].stackSize : 1;
        Inventory.items[index].stackSize -= stackSize;
        if (Inventory.items[index].stackSize == 0) {
            Inventory.items[index] = ITEM_NULL;
        }
        Inventory.refreshItem(index);
        socket.emit("item", {
            action: ITEM_DROP,
            index: index,
            stackSize: stackSize,
        });
    },
    refreshCraft: function(index) {
        var craft = craftTab.children[index + 1];
        var canCraft = true;
        for (var i = 0; i < this.data.crafts[index].materials.length; i++) {
            if (!this.hasItem(this.data.crafts[index].materials[i].id, [], this.data.crafts[index].materials[i].stackSize)) {
                canCraft = false;
                craft.children[0].children[i].disabled = true;
            }
            else {
                craft.children[0].children[i].disabled = false;
            }
        }
        craft.disabled = false;
    },
    clickCraft: function(index, button) {
        var stackSize = 1;
        var craft = this.data.crafts[index];
        for (var i = 0; i < craft.materials.length; i++) {
            this.removeItem(craft.materials[i].id, [], craft.materials[i].stackSize);
        }
        var draggingItem = this.items[EQUIP_DRAGGING];
        if (draggingItem == ITEM_NULL) {
            this.items[EQUIP_DRAGGING] = {
                id: craft.id,
                enchantments: [],
                stackSize: craft.stackSize,
            };
        }
        else {
            draggingItem.stackSize += craft.stackSize;
        }
        this.refreshItem(EQUIP_DRAGGING);
        socket.emit("item", {
            action: ITEM_CRAFT,
            index: index,
            stackSize: stackSize,
        });
    },
    showTooltip: function(item, materials) {
        tooltip.style.opacity = 1;
        var title = this.data.items[item.id].name;
        if (item.stackSize != 1) {
            title += " x" + item.stackSize;
        }
        switch (this.data.items[item.id].rarity) {
            case 0:
                tooltipTitle.style.color = "white";
                break;
            case 1:
                tooltipTitle.style.color = "yellow";
                break;
            case 2:
                tooltipTitle.style.color = "goldenrod";
                break;
            case 3:
                tooltipTitle.style.color = "royalblue";
                break;
            case 4:
                tooltipTitle.style.color = "seagreen";
                break;
            case 5:
                tooltipTitle.style.color = "violet";
                break;
        }
        // tooltipTitle.style.color = titleColor;
        // tooltipSubtitle.style.color = titleColor;
        tooltipSubtitle.style.color = "yellow";
        var subtitle = this.getEquipName(this.data.items[item.id].equip);
        var description = this.data.items[item.id].description;
        var descriptionPositive = "";
        var descriptionNegative = "";
        for (var i in this.data.items[item.id].effects) {
            var type = this.data.items[item.id].effects[i].type;
            var id = this.data.items[item.id].effects[i].id;
            var value = this.data.items[item.id].effects[i].value;
            var effect = null;
            switch (id) {
                case "projectileAccuracy":
                    effect = "° projectile inaccuracy";
                default:
                    if (effect == null) {
                        effect = " ";
                        for (var j in id) {
                            if (id[j] == id[j].toUpperCase()) {
                                effect += " ";
                            }
                            effect += id[j].toLowerCase();
                        }
                    }
                    break;
            }
            if (effect == null) {
                continue;
            }
            if (!settings.tooltipAbbreviations) {
                effect = effect.replaceAll(" hp", " health");
                effect = effect.replaceAll(" regen", " regeneration");
                effect = effect.replaceAll(" crit", " critical");
            }
            effect = value + effect;
            var positive = null;
            var flipped = id == "hpRegenSpeed" || id == "manaRegenSpeed" || id == "projectileAccuracy";
            switch (type) {
                case EFFECT_BASE:
                    positive = true;
                    break;
                case EFFECT_ADDITIVE:
                    if (value >= 0) {
                        effect = "+" + effect;
                    }
                    if (flipped) {
                        positive = value <= 0;
                    }
                    else {
                        positive = value >= 0;
                    }
                    break;
                case EFFECT_MULTIPLICATIVE:
                    effect = "x" + effect;
                    if (flipped) {
                        positive = value <= 1;
                    }
                    else {
                        positive = value >= 1;
                    }
                    break;
            }
            if (positive) {
                descriptionPositive += "<br>" + effect;
            }
            else {
                descriptionNegative += "<br>" + effect;
            }
        }
        if (descriptionPositive.length > 0 || descriptionNegative.length > 0) {
            description += "<br><div style=\"color: var(--font-color-success)\">" + descriptionPositive + "</div><div style=\"color: var(--font-color-error)\">" + descriptionNegative + "</div>";
        }
        if (materials != null) {
            var descriptionMaterials = "<br>";
            for (var i = 0; i < materials.length; i++) {
                var color = "";
                switch (this.data.items[materials[i].id].rarity) {
                    case 0:
                        color = "white";
                        break;
                    case 1:
                        color = "yellow";
                        break;
                    case 2:
                        color = "goldenrod";
                        break;
                    case 3:
                        color = "royalblue";
                        break;
                    case 4:
                        color = "seagreen";
                        break;
                    case 5:
                        color = "violet";
                        break;
                }
                descriptionMaterials += "<div style=\"color: " + color + "\">" + this.data.items[materials[i].id].name + " x" + materials[i].stackSize + "</div>";
            }
            description += descriptionMaterials;
        }
        tooltipTitle.innerText = title;
        tooltipSubtitle.innerText = subtitle;
        tooltipDescription.innerHTML = description;
    },
    hideTooltip: function() {
        tooltip.style.opacity = 0;
    },
    moveTooltip: function() {
        tooltip.style.left = rawMouseX + "px";
        tooltip.style.right = "unset";
        tooltip.style.top = rawMouseY + "px";
        tooltip.style.bottom = "unset";
        var rect = tooltip.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            tooltip.style.right = (window.innerWidth - rawMouseX) + "px";
            tooltip.style.left = "unset";
        }
        rect = tooltip.getBoundingClientRect();
        if (rect.bottom > window.innerHeight) {
            tooltip.style.bottom = (window.innerHeight - rawMouseY) + "px";
            tooltip.style.top = "unset";
        }
    },
    showDraggingItem: function() {
        if (draggingItem.style.display == "revert-layer") {
            return;
        }
        draggingItem.style.display = "revert-layer";
        document.styleSheets[0].insertRule("* { cursor: grabbing !important; }");
    },
    hideDraggingItem: function() {
        if (draggingItem.style.display == "none") {
            return;
        }
        draggingItem.style.display = "none";
        document.styleSheets[0].deleteRule(0);
    },
    moveDraggingItem: function() {
        draggingItem.style.left = rawMouseX + "px";
        draggingItem.style.top = rawMouseY + "px";
    },
    getEquipId: function(equip) {
        switch (equip) {
            case EQUIP_HELMET:
                return "Helmet";
            case EQUIP_CHESTPLATE:
                return "Chestplate";
            case EQUIP_BOOTS:
                return "Boots";
            case EQUIP_SHIELD:
                return "Shield";
            case EQUIP_CRYSTAL:
                return "Crystal";
            case EQUIP_ACCESSORY_1:
                return "Accessory1";
            case EQUIP_ACCESSORY_2:
                return "Accessory2";
        }
    },
    getEquipName: function(equip) {
        switch (equip) {
            case EQUIP_HELMET:
                return "Helmet";
            case EQUIP_CHESTPLATE:
                return "Chestplate";
            case EQUIP_BOOTS:
                return "Boots";
            case EQUIP_SHIELD:
                return "Shield";
            case EQUIP_CRYSTAL:
                return "Crystal";
            case EQUIP_ACCESSORY_1:
            case EQUIP_ACCESSORY_2:
                return "Accessory";
        }
        return "";
    },
    update: function(items) {
        for (var i in items) {
            var index = Number(i);
            // if (index >= this.maxItems) {
            //     this.maxItems = index + 1;
            //     this.createItems();
            // }
            console.log(this.items[index])
            if (!this.isSameItem(this.items[index], items[i].id, items[i].enchantments) || this.items[index].stackSize != items[i].stackSize) {
                this.items[index] = items[i];
                if (index >= 0) {
                    this.refreshItem(index);
                }
                else {
                    this.refreshEquip(index);
                }
            }
        }
    },
    isSameItem: function(item, id, enchantments) {
        if (item == ITEM_NULL || item.id != id) {
            return false;
        }
        for (var i in item.enchantments) {
            if (item.enchantments[i] != enchantments) {
                return false;
            }
        }
        for (var i in enchantments) {
            if (item.enchantments[i] != enchantments) {
                return false;
            }
        }
        return true;
    },
    hasItem: function(id, enchantments, stackSize) {
        for (var i in this.items) {
            if (this.isSameItem(this.items[i], id, enchantments)) {
                stackSize -= this.items[i].stackSize;
                if (stackSize <= 0) {
                    return true;
                }
            }
        }
        return false;
    },
    removeItem: function(id, enchantments, stackSize) {
        for (var i in this.items) {
            if (this.isSameItem(this.items[i], id, enchantments)) {
                var min = Math.min(stackSize, this.items[i].stackSize);
                stackSize -= min;
                this.items[i].stackSize -= min;
                if (this.items[i].stackSize == 0) {
                    this.items[i] = ITEM_NULL;
                }
                this.refreshItem(Number(i));
                if (stackSize == 0) {
                    return true;
                }
            }
        }
        return false;
    },
};
Inventory.createItems();
Inventory.createEquips();
Inventory.items[EQUIP_DRAGGING] = ITEM_NULL;

// function to create slots (on max item change) (only create necessary, so it will look at current item array) [!] OONLY CREATS DIVS
// one time function to create salvage, crafting, and sell slots

// functinos to pdate divs, like update items, update equips, which is when server sends new data and you update

// additem, removeitem

socket.on("updateInventory", function(data) {
    // Inventory.update(data);
});