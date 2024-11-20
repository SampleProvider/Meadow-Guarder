javascript:
var oldUpdate = update;
update = function() {
    for (var i in Player.list) {
        if (Player.list[i].id != selfPlayer.id) {
            mouseX = Player.list[i].x + cameraX;
            mouseY = Player.list[i].y + cameraY;
            mouseMoved = true;
            break;
        }
    }
    oldUpdate();
};