Inventory = function(player) {
    var self = {
        items: [],
        modifiedItems: [],
        selectedItem: 0,
        maxItems: 10,
        player: player,
    };
    for (var i = EQUIP_DRAGGING; i < self.maxItems; i++) {
        self.items[i] = ITEM_NULL;
        self.modifiedItems[i] = false;
        self.modifiedItems[i] = true;
    }
    player.socket.on("item", function(data) {
        if (player.loaded) {
            player.leave();
            return;
        }
        if (!data instanceof Object) {
            player.leave();
            return;
        }
        switch (data.action) {
            case ITEM_TAKE:
                if (typeof data.index != "number" || typeof data.stackSize != "number") {
                    break;
                }
                if (data.index == EQUIP_DRAGGING) {
                    break;
                }
                data.stackSize = Math.floor(data.stackSize);
                if (data.stackSize <= 0) {
                    break;
                }
                if (self.items[EQUIP_DRAGGING] != ITEM_NULL) {
                    break;
                }
                var item = self.items[data.index];
                if (item == null) {
                    break;
                }
                if (item.stackSize < data.stackSize) {
                    break;
                }
                self.items[EQUIP_DRAGGING] = {
                    id: item.id,
                    enchantments: item.enchantments,
                    stackSize: data.stackSize,
                    cooldown: item.cooldown,
                };
                item.stackSize -= data.stackSize;
                if (item.stackSize == 0) {
                    self.items[data.index] = ITEM_NULL;
                }
                if (data.index < 0 && data.index >= EQUIP_ACCESSORY_2) {
                    Player.updateStats(self.player);
                }
                break;
            case ITEM_PLACE:
                if (typeof data.index != "number" || typeof data.stackSize != "number") {
                    break;
                }
                if (data.index == EQUIP_DRAGGING) {
                    break;
                }
                data.stackSize = Math.floor(data.stackSize);
                if (data.stackSize <= 0) {
                    break;
                }
                if (self.items[EQUIP_DRAGGING] == ITEM_NULL) {
                    break;
                }
                var draggingItem = self.items[EQUIP_DRAGGING];
                var item = self.items[data.index];
                if (item == null) {
                    break;
                }
                if (data.stackSize > draggingItem.stackSize) {
                    break;
                }
                if (data.index < 0 && ((data.index >= EQUIP_CRYSTAL && Inventory.items[draggingItem.id].equip != data.index) || (data.index <= EQUIP_ACCESSORY_1 && data.index >= EQUIP_ACCESSORY_2 && Inventory.items[draggingItem.id].equip != EQUIP_ACCESSORY_1))) {
                    break;
                }
                if (item == ITEM_NULL || !Inventory.isSameItem(item, draggingItem.id, draggingItem.enchantments)) {
                    self.items[EQUIP_DRAGGING] = item;
                    self.items[data.index] = draggingItem;
                }
                else {
                    draggingItem.stackSize -= data.stackSize;
                    item.stackSize += data.stackSize;
                    if (item.stackSize > Inventory.items[item.id].maxStackSize) {
                        draggingItem.stackSize += item.stackSize - Inventory.items[item.id].maxStackSize;
                        item.stackSize = Inventory.items[item.id].maxStackSize;
                    }
                    if (draggingItem.stackSize == 0) {
                        self.items[EQUIP_DRAGGING] = ITEM_NULL;
                    }
                }
                if (data.index < 0 && data.index >= EQUIP_ACCESSORY_2) {
                    Player.updateStats(self.player);
                }
                break;
            case ITEM_DROP:
                if (typeof data.index != "number" || typeof data.stackSize != "number") {
                    break;
                }
                data.stackSize = Math.floor(data.stackSize);
                if (data.stackSize <= 0) {
                    break;
                }
                var item = self.items[data.index];
                if (item == null) {
                    break;
                }
                if (item == ITEM_NULL || data.stackSize > item.stackSize) {
                    break;
                }
                // create dropped item
                new DroppedItem(item.id, item.enchantments, data.stackSize, player.x, player.y, player.layer, player.map, null);
                item.stackSize -= data.stackSize;
                if (item.stackSize == 0) {
                    self.items[data.index] = ITEM_NULL;
                }
                if (data.index < 0 && data.index >= EQUIP_ACCESSORY_2) {
                    Player.updateStats(self.player);
                }
                break;
            case ITEM_CRAFT:
                if (typeof data.index != "number" || typeof data.stackSize != "number") {
                    break;
                }
                data.stackSize = Math.floor(data.stackSize);
                if (data.stackSize <= 0) {
                    break;
                }
                var craft = Inventory.crafts[data.index];
                if (craft == null) {
                    break;
                }
                var draggingItem = self.items[EQUIP_DRAGGING];
                if (draggingItem != ITEM_NULL && (!Inventory.isSameItem(draggingItem, craft.id, craft.enchantments) || draggingItem.stackSize + craft.stackSize > Inventory.items[craft.id].maxStackSize)) {
                    break;
                }
                for (var i = 0; i < craft.materials.length; i++) {
                    if (!Inventory.hasItem(self, craft.materials[i].id, [], craft.materials[i].stackSize)) {
                        break;
                    }
                }
                for (var i = 0; i < craft.materials.length; i++) {
                    Inventory.removeItem(self, craft.materials[i].id, [], craft.materials[i].stackSize);
                }
                if (draggingItem == ITEM_NULL) {
                    self.items[EQUIP_DRAGGING] = {
                        id: craft.id,
                        enchantments: [],
                        stackSize: craft.stackSize,
                    };
                }
                else {
                    draggingItem.stackSize += craft.stackSize;
                }
                console.log(self.items[EQUIP_DRAGGING])
                Player.updateStats(self.player);
                // if (data.index < 0 && data.index >= EQUIP_ACCESSORY_2) {
                // }
                break;
            case ITEM_SALVAGE:
                break;
        }
    });
    // slot: item
    // each item has id, enchantments, stackSize, cooldown
    return self;
};
Inventory.addItem = function(inventory, id, enchantments, stackSize) {
    for (var i in inventory.items) {
        if (inventory.items[i] == ITEM_NULL) {
            inventory.items[i] = {
                id: id,
                enchantments: enchantments,
                stackSize: stackSize,
                cooldown: 0,
            };
            inventory.modifiedItems[i] = true;
            if (inventory.items[i].stackSize > Inventory.items[id].maxStackSize) {
                stackSize = inventory.items[i].stackSize - Inventory.items[id].maxStackSize;
                inventory.items[i].stackSize = Inventory.items[id].maxStackSize;
            }
            else {
                return true;
            }
        }
        else if (Inventory.isSameItem(inventory.items[i], id, enchantments) && inventory.items[i].stackSize < Inventory.items[id].maxStackSize) {
            inventory.items[i].stackSize += stackSize;
            inventory.modifiedItems[i] = true;
            if (inventory.items[i].stackSize > Inventory.items[id].maxStackSize) {
                stackSize = inventory.items[i].stackSize - Inventory.items[id].maxStackSize;
                inventory.items[i].stackSize = Inventory.items[id].maxStackSize;
            }
            else {
                return true;
            }
        }
    }
    new DroppedItem(id, enchantments, stackSize, inventory.player.x, inventory.player.y, inventory.player.layer, inventory.player.map, inventory.player.id);
    // overflow, drop items
};
Inventory.removeItem = function(inventory, id, enchantments, stackSize) {
    for (var i in inventory.items) {
        if (Inventory.isSameItem(inventory.items[i], id, enchantments)) {
            var min = Math.min(stackSize, inventory.items[i].stackSize);
            stackSize -= min;
            inventory.items[i].stackSize -= min;
            if (inventory.items[i].stackSize == 0) {
                inventory.items[i] = ITEM_NULL;
            }
            inventory.modifiedItems[i] = true;
            if (stackSize == 0) {
                return true;
            }
        }
    }
    return false;
};
Inventory.hasItem = function(inventory, id, enchantments, stackSize) {
    for (var i in inventory.items) {
        if (Inventory.isSameItem(inventory.items[i], id, enchantments)) {
            stackSize -= inventory.items[i].stackSize;
            if (stackSize <= 0) {
                return true;
            }
        }
    }
    return false;
};
Inventory.isSameItem = function(item, id, enchantments) {
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
};
Inventory.update = function(inventory) {
    for (var i in inventory.items) {
        if (inventory.items[i] == ITEM_NULL) {
            continue;
        }
        inventory.items[i].cooldown = Math.max(inventory.items[i].cooldown - 1, 0);
    }
};
Inventory.getClientData = function(inventory) {
    var data = [];
    for (var i in inventory.modifiedItems) {
        if (inventory.modifiedItems[i]) {
            data[i] = inventory.items[i];
            inventory.modifiedItems[i] = false;
        }
    }
    return data;
};
Inventory.saveProgress = function(inventory) {
    
};
Inventory.loadProgress = function(inventory, data) {
    
};
Inventory.items = require("./../client/data/item.json");
Inventory.crafts = require("./../client/data/craft.json");
Inventory.enchantments = require("./../client/data/enchantment.json");
Inventory.parseItem = function(item) {
    if (item.effects != null) {
        for (var i in item.effects) {
            switch (item.effects[i].type) {
                case "base":
                    item.effects[i].type = EFFECT_BASE;
                    break;
                case "additive":
                    item.effects[i].type = EFFECT_ADDITIVE;
                    break;
                case "multiplicative":
                    item.effects[i].type = EFFECT_MULTIPLICATIVE;
                    break;
                case "other":
                    item.effects[i].type = EFFECT_OTHER;
                    break;
            }
        }
    }
};
Inventory.parseCraft = function(craft) {
    for (var i = 0; i < Inventory.items.length; i++) {
        if (craft.id == Inventory.items[i].id) {
            craft.id = i;
            break;
        }
    }
};
// for (var i in Inventory.items) {
for (var i = 0; i < Inventory.items.length; i++) {
    Inventory.parseItem(Inventory.items[i]);
}
for (var i = 0; i < Inventory.crafts.length; i++) {
    Inventory.parseCraft(Inventory.crafts[i]);
}

DroppedItem = function(id, enchantments, stackSize, x, y, layer, map, parent) {
    var self = {
        id: Math.random(),
        x: x,
        y: y,
        width: 32,
        height: 32,
        layer: layer,
        map: map,
        item: {
            id: id,
            enchantments: enchantments,
            stackSize: stackSize,
        },
        parent: parent,
        despawnTimer: ENV.itemDespawnTime * 60 * 20,
        type: DROPPED_ITEM,
    };
    DroppedItem.init(self);
    return self;
};
DroppedItem.list = {};
DroppedItem.chunks = {};
DroppedItem.init = function(droppedItem) {
    Entity.init(droppedItem);
};
DroppedItem.update = function(droppedItem){
    droppedItem.despawnTimer -= 1;
    if (droppedItem.despawnTimer == 0) {
        Entity.delete(droppedItem);
        return;
    }
    Entity.addDroppedItem(droppedItem, {
        id: droppedItem.id,
        type: DROPPED_ITEM,
        x: droppedItem.x,
        y: droppedItem.y,
        layer: droppedItem.layer,
        item: droppedItem.item,
    });
};