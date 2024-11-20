var signInState = AWAITING_PUBLIC_KEY;
var publicKey = null;
// -2: loaded
// -1: awaiting public key
// 0: nothing
// 1: awaiting response
// 2: creating account
// 3: deleting account
// 4: changing password
// 5: credits

const username = document.getElementById("username");
const password = document.getElementById("password");
const retypePassword = document.getElementById("retypePassword");
const newPassword = document.getElementById("newPassword");
const retypeNewPassword = document.getElementById("retypeNewPassword");
const retypePasswordForm = document.getElementById("retypePasswordForm");
const deleteAccount = document.getElementById("deleteAccount");
const newPasswordForm = document.getElementById("newPasswordForm");
const retypeNewPasswordForm = document.getElementById("retypeNewPasswordForm");
const cancelSignIn = document.getElementById("cancelSignIn");
const signInSuccess = document.getElementById("signInSuccess");
const signInError = document.getElementById("signInError");

var awaitSignInState = function() {
    signInState = AWAITING_RESPONSE;
    username.disabled = true;
    password.disabled = true;
    retypePassword.disabled = true;
    newPassword.disabled = true;
    retypeNewPassword.disabled = true;
    cancelSignIn.style.display = "none";
    signInSuccess.innerText = "";
    signInError.innerText = "";
};
var resetSignInState = function() {
    signInState = NONE;
    username.disabled = false;
    password.disabled = false;
    retypePassword.disabled = false;
    newPassword.disabled = false;
    retypeNewPassword.disabled = false;
    retypePasswordForm.style.display = "none";
    retypePasswordForm.value = "";
    deleteAccount.innerHTML = "Delete Account";
    deleteAccount.disabled = false;
    newPasswordForm.style.display = "none";
    newPasswordForm.value = "";
    retypeNewPasswordForm.style.display = "none";
    retypeNewPasswordForm.value = "";
    cancelSignIn.style.display = "none";
    signInSuccess.innerText = "";
    signInError.innerText = "";
};
cancelSignIn.addEventListener("click", function() {
    resetSignInState();
});
document.getElementById("signIn").addEventListener("click", async function() {
    if (signInState != NONE) {
        return;
    }
    if (username.value.length == 0 || password.value.length == 0) {
        return;
    }
    awaitSignInState();
    socket.emit("signIn", {
        state: SIGN_IN,
        username: username.value,
        password: await RSAencode(password.value),
    });
});
document.getElementById("createAccount").addEventListener("click", async function() {
    if (signInState == NONE) {
        signInState = CREATING_ACCOUNT;
        retypePasswordForm.style.display = "table-row";
        cancelSignIn.style.display = "block";
    }
    else if (signInState == CREATING_ACCOUNT) {
        if (password.value != retypePassword.value) {
            signInError.innerText = "Warning: Passwords do not match.";
            return;
        }
        if (username.value.length == 0 || password.value.length == 0) {
            return;
        }
        awaitSignInState();
        socket.emit("signIn", {
            state: CREATE_ACCOUNT,
            username: username.value,
            password: await RSAencode(password.value),
        });
    }
});
deleteAccount.addEventListener("click", async function() {
    if (signInState == NONE) {
        signInState = DELETING_ACCOUNT;
        deleteAccount.innerHTML = "Delete Account - Are you sure? This action is <b>irreversible</b>!";
        deleteAccount.disabled = true;
        setTimeout(function() {
            deleteAccount.disabled = false;
        }, 5000);
        cancelSignIn.style.display = "block";
    }
    else if (signInState == DELETING_ACCOUNT) {
        if (username.value.length == 0 || password.value.length == 0) {
            return;
        }
        awaitSignInState();
        socket.emit("signIn", {
            state: DELETE_ACCOUNT,
            username: username.value,
            password: await RSAencode(password.value),
        });
    }
});
document.getElementById("changePassword").addEventListener("click", async function() {
    if (signInState == NONE) {
        signInState = CHANGING_PASSWORD;
        newPasswordForm.style.display = "table-row";
        retypeNewPasswordForm.style.display = "table-row";
        cancelSignIn.style.display = "block";
    }
    else if (signInState == CHANGING_PASSWORD) {
        if (newPasswordForm.value != retypeNewPasswordForm.value) {
            signInError.innerText = "Warning: Passwords do not match.";
            return;
        }
        if (username.value.length == 0 || password.value.length == 0) {
            return;
        }
        awaitSignInState();
        socket.emit("signIn", {
            state: CHANGE_PASSWORD,
            username: username.value,
            password: await RSAencode(password.value),
            newPassword: await RSAencode(newPassword.value),
        });
    }
});

socket.on("signIn", async function(data) {
    var sanitizedUsername = username.value.replaceAll("<", "&lt").replaceAll(">", "&gt");
    switch (data.state) {
        case SIGN_IN_SUCCESS:
            // loading
            document.getElementById("loadingContainer").style.display = "block";
            document.getElementById("loadingContainer").offsetHeight;
            document.getElementById("loadingContainer").style.opacity = 1;
            await sleep(500);
            var loadingBarText = document.getElementById("loadingBarText");
            var loadingBarInner = document.getElementById("loadingBarInner");
            document.getElementById("loadingBar").style.display = "block";
            insertChat("Meadow Guarder " + data.version, "color: #00ff00; font-weight: bold;");
            // insertChat(sanitizedUsername + " joined the game.", "login");
            var updateLoadingBar = function() {
                var percent = Math.floor(loadedAssets / data.totalAssets * 100) + "%";
                loadingBarText.innerText = loadedAssets + "/" + data.totalAssets + " (" + percent + ")";
                loadingBarInner.style.width = percent;
                if (loadedAssets >= data.totalAssets) {
                    clearInterval(updateLoadingBar);
                    document.getElementById("loadingIcon").style.opacity = 0;
                    for (var i = 0; i < Inventory.data.crafts.length; i++) {
                        for (var j = 0; j < Inventory.data.items.length; j++) {
                            if (Inventory.data.crafts[i].id == Inventory.data.items[j].id) {
                                Inventory.data.crafts[i].id = j;
                                break;
                            }
                        }
                        for (var j = 0; j < Inventory.data.crafts[i].materials.length; j++) {
                            for (var k = 0; k < Inventory.data.items.length; k++) {
                                if (Inventory.data.crafts[i].materials[j].id == Inventory.data.items[k].id) {
                                    Inventory.data.crafts[i].materials[j].id = k;
                                    break;
                                }
                            }
                        }
                    }
                    Inventory.createCrafts();
                    password.value = "";
                    retypePassword.value = "";
                    newPassword.value = "";
                    retypeNewPassword.value = "";
                    setTimeout(async function() {
                        signInState = LOADING_COMPLETE;
                        socket.emit("signIn", {
                            state: LOADED,
                            username: username.value,
                            password: await RSAencode(password.value),
                        });
                    }, 500);
                }
                else {
                    window.requestAnimationFrame(updateLoadingBar);
                }
            };
            window.requestAnimationFrame(updateLoadingBar);
            Entity.images.player.src = "./../images/player/player.png";
            Entity.images.healthBar.src = "./../images/misc/healthBar.png";
            Entity.images.missingImage.src = "./../images/misc/missingImage.png";
            for (let i in Entity.images) {
                Entity.images[i].onload = function() {
                    loadedAssets += 1;
                    console.log("loaded " + i);
                };
            }
            await loadNpcs();
            await loadMonsters();
            await loadProjectiles();
            await loadItems();
            await loadEnchantments();
            await loadCrafts();
            await loadTileset();
            await loadMaps();
            await loadRegions();
            break;
        case LOADING_SUCCESS:
            selfPlayer = new Rig(data);
            // var getSelfPlayer = setInterval(function() {
            //     if (Entity.list[data.id] != null) {
            // clearInterval(getSelfPlayer);
            // selfPlayer = Entity.list[data.id];
            selfMap = data.map;
            // load customizations
            createCustomizations(data.customizations);
            document.getElementById("menuContainer").style.display = "none";
            document.getElementById("loadingContainer").style.display = "none";
            document.getElementById("gameContainer").style.display = "block";
            document.getElementById("gameContainer").offsetHeight;
            canvasShade.style.transition = "opacity 1000ms linear";
            canvasShade.style.backgroundColor = "#000000";
            canvasShade.style.opacity = 0;
            window.onresize();
            // resize();
            updateTime = performance.now();
            update();
            // updateTick();
            //     }
            // }, 100);
            break;
        case CREATE_ACCOUNT_SUCCESS:
            resetSignInState();
            signInSuccess.innerText = "Successfully created account \"" + sanitizedUsername + "\".";
            break;
        case DELETE_ACCOUNT_SUCCESS:
            resetSignInState();
            signInSuccess.innerText = "Successfully deleted account \"" + sanitizedUsername + "\".";
            break;
        case CHANGE_PASSWORD_SUCCESS:
            resetSignInState();
            signInSuccess.innerText = "Successfully changed password for account \"" + sanitizedUsername + "\".";
            break;
        case USERNAME_INCORRECT:
            resetSignInState();
            signInError.innerText = "Error: No account found with username \"" + sanitizedUsername + "\".";
            break;
        case USERNAME_SHORT:
            resetSignInState();
            signInError.innerText = "Error: Username \"" + sanitizedUsername + "\" must be at least 3 characters.";
            break;
        case USERNAME_LONG:
            resetSignInState();
            signInError.innerText = "Error: Username \"" + sanitizedUsername + "\" exceeds max username length of 30.";
            break;
        case USERNAME_BAD:
            resetSignInState();
            signInError.innerText = "Error: Username \"" + sanitizedUsername + "\" contains a bad word.";
            break;
        case USERNAME_INVALID:
            resetSignInState();
            signInError.innerText = "Error: Username \"" + sanitizedUsername + "\" contains an invalid character. Valid characters are: all letters, numbers, and symbols. Spaces are invalid characters.";
            break;
        case USERNAME_USED:
            resetSignInState();
            signInError.innerText = "Error: Username is already in use.";
            break;
        case PASSWORD_INCORRECT:
            resetSignInState();
            signInError.innerText = "Error: Incorrect password.";
            break;
        case PASSWORD_LONG:
            resetSignInState();
            signInError.innerText = "Error: Password exceeds max password length of 120.";
            break;
        case PASSWORD_INVALID:
            resetSignInState();
            signInError.innerText = "Error: Password is invalid.";
            break;
        case NEW_PASSWORD_LONG:
            resetSignInState();
            signInError.innerText = "Error: New password exceeds max password length of 120.";
            break;
        case NEW_PASSWORD_INVALID:
            resetSignInState();
            signInError.innerText = "Error: New password is invalid.";
            break;
        case ALREADY_LOGGED_IN:
            resetSignInState();
            signInError.innerText = "Error: Account \"" + sanitizedUsername + "\" is already logged in.";
            break;
        case PERMANENTLY_BANNED:
            resetSignInState();
            signInError.innerText = "Error: Account \"" + sanitizedUsername + "\" is permanently banned.";
            break;
        case TEMPORARY_BANNED:
            resetSignInState();
            data.time = Math.ceil(data.time / 1000);
            var seconds = data.time % 60;
            var minutes = Math.floor(data.time / 60) % 60;
            var hours = Math.floor(data.time / 3600) % 24;
            var days = Math.floor(data.time / 86400);
            if (days != 0) {
                signInError.innerText = "Error: Account \"" + sanitizedUsername + "\" is banned for " + days + "d " + hours + "h " + minutes + "m " + seconds + "s.";
            }
            else if (hours != 0) {
                signInError.innerText = "Error: Account \"" + sanitizedUsername + "\" is banned for " + hours + "h " + minutes + "m " + seconds + "s.";
            }
            else if (minutes != 0) {
                signInError.innerText = "Error: Account \"" + sanitizedUsername + "\" is banned for " + minutes + "m " + seconds + "s.";
            }
            else {
                signInError.innerText = "Error: Account \"" + sanitizedUsername + "\" is banned for " + seconds + "s.";
            }
            break;
        case DATABASE_EXPLOIT:
            resetSignInState();
            signInError.innerText = "Error: No exploiting the database.";
            break;
    }
});

var RSAencode = async function(text) {
    if (publicKey != null) {
        return await window.crypto.subtle.encrypt({ name: "RSA-OAEP" }, publicKey, new TextEncoder().encode(text));
    }
    return text;
};
socket.once("publicKey", async function(key) {
    if (window.crypto.subtle == null) {
        document.getElementById("insecureContextWarning").style.display = "block";
    }
    else {
        publicKey = await window.crypto.subtle.importKey("jwk", key, { name: "RSA-OAEP", hash: "SHA-256" }, false, ["encrypt"]);
    }
    signInState = NONE;
});
socket.emit("publicKey");

document.getElementById("creditsLink").addEventListener("click", async function() {
    if (signInState != NONE) {
        return;
    }
    signInState = CREDITS_FADE_IN;
    document.getElementById("creditsContainer").style.display = "block";
    document.getElementById("creditsContainer").offsetHeight;
    document.getElementById("creditsContainer").style.opacity = 1;
});
document.getElementById("creditsContainer").addEventListener("transitionend", async function() {
    if (signInState == CREDITS_FADE_IN) {
        document.getElementById("creditsScroll").style.transform = "translateY(calc(-100% - 110vh))";
    }
    else if (signInState == CREDITS_FADE_OUT) {
        signInState = NONE;
        document.getElementById("creditsContainer").style.display = "none";
        document.getElementById("creditsScroll").style.transform = "translateY(0px)";
        document.getElementById("menuContainer").scrollTop = 0;
    }
});
document.getElementById("creditsScroll").addEventListener("transitionend", async function(event) {
    if (signInState != CREDITS_FADE_IN) {
        return;
    }
    event.stopPropagation();
    await sleep(500);
    signInState = CREDITS_FADE_OUT;
    document.getElementById("creditsContainer").style.opacity = 0;
});