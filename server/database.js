// const bcrypt = require("bcrypt");
const salt = 10;
var database = null;

Database = {
    start: function() {
        database = JSON.parse(fs.readFileSync("./database.db"));
    },
    stop: function() {
        fs.writeFileSync("./database.db", JSON.stringify(database));
    },
    save: function() {
        fs.writeFile("./database.db", JSON.stringify(database), function() {});
    },
    backup: async function() {
        var date = new Date();
        var hour = date.getHours().toString();
        if (hour.length == 1) {
            hour = "0" + hour;
        }
        var minute = date.getMinutes().toString();
        if (minute.length == 1) {
            minute = "0" + minute;
        }
        var name = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + hour + "-" + minute + ".db";
        await Bun.write("./server/backups/" + name, JSON.stringify(database));
        // return new Promise(async function(resolve, reject) {
        //     await Bun.write("./server/backups/" + name, JSON.stringify(database));
        //     resolve();
        //     // fs.writeFile("./server/backups/" + name, JSON.stringify(database), function() {
        //     //     console.log("DONE")
        //     //     resolve();
        //     // });
        // });
    },
    compare: function(password1, password2) {
        return new Promise(async function(resolve, reject) {
            resolve(await Bun.password.verify(password1, password2));
            // resolve(await bcrypt.compare(password1, password2));
        });
    },
    hash: function(password) {
        return new Promise(async function(resolve, reject) {
            resolve(await Bun.password.hash(password));
            // resolve(await bcrypt.hash(password, salt));
        });
    },
    signIn: async function(username, password) {
        var valid = Database.checkValidCharacters(username, password, null);
        if (valid != false) {
            return valid;
        }
        var data = database[username];
        if (data == null) {
            return USERNAME_INCORRECT;
        }
        if (!await Database.compare(password, data.password)) {
            return PASSWORD_INCORRECT;
        }
        if (data.banned == true) {
            return PERMANENTLY_BANNED;
        }
        if (typeof data.banned == "number") {
            var date = Date.now();
            if (data.banned > date) {
                return {
                    state: TEMPORARY_BANNED,
                    time: data.banned - date,
                };
            }
            else {
                Database.unban(username);
            }
        }
        for (var i in Player.list) {
            if (Player.list[i].name == username) {
                return ALREADY_LOGGED_IN;
            }
        }
        return SIGN_IN_SUCCESS;
    },
    createAccount: async function(username, password) {
        var valid = Database.checkValidCharacters(username, password, null);
        if (valid != false) {
            return valid;
        }
        var data = database[username];
        if (data != null) {
            return USERNAME_USED;
        }
        for (var i in Player.list) {
            if (Player.list[i].name == username) {
                return ALREADY_LOGGED_IN;
            }
        }
        var encryptedPassword = await Database.hash(password);
        database[username] = {
            password: encryptedPassword,
            progress: {},
            banned: false,
        };
        return CREATE_ACCOUNT_SUCCESS;
    },
    deleteAccount: async function(username, password) {
        var valid = Database.checkValidCharacters(username, password, null);
        if (valid != false) {
            return valid;
        }
        var data = database[username];
        if (data == null) {
            return USERNAME_INCORRECT;
        }
        if (!await Database.compare(password, data.password)) {
            return PASSWORD_INCORRECT;
        }
        if (data.banned == true) {
            return PERMANENTLY_BANNED;
        }
        if (typeof data.banned == "number") {
            var date = Date.now();
            if (data.banned > date) {
                return {
                    state: TEMPORARY_BANNED,
                    time: data.banned - date,
                };
            }
            else {
                Database.unban(username);
            }
        }
        for (var i in Player.list) {
            if (Player.list[i].name == username) {
                return ALREADY_LOGGED_IN;
            }
        }
        delete database[username];
        return DELETE_ACCOUNT_SUCCESS;
    },
    changePassword: async function(username, password, newPassword) {
        var valid = Database.checkValidCharacters(username, password, null);
        if (valid != false) {
            return valid;
        }
        var data = database[username];
        if (data == null) {
            return USERNAME_INCORRECT;
        }
        if (!await Database.compare(password, data.password)) {
            return PASSWORD_INCORRECT;
        }
        for (var i in Player.list) {
            if (Player.list[i].name == username) {
                return ALREADY_LOGGED_IN;
            }
        }
        var encryptedPassword = await Database.hash(password);
        database[username] = {
            password: encryptedPassword,
            progress: data.progress,
            banned: data.banned,
        };
        return CHANGE_PASSWORD_SUCCESS;
    },
    ban: function(username, state) {
        var data = database[username];
        if (data == null) {
            return USERNAME_INCORRECT;
        }
        for (var i in Player.list) {
            if (Player.list[i].name == username) {
                Player.list[i].leave();
            }
        }
        if (typeof state == "number") {
            state *= 1000;
            state += Date.now();
        }
        database[username].banned = state;
        return BAN_SUCCESS;
    },
    unban: function(username) {
        var data = database[username];
        if (data == null) {
            return USERNAME_INCORRECT;
        }
        database[username].banned = false;
        return UNBAN_SUCCESS;
    },
    validCharacters: "abcdefghijklmnopqrstuvwxyz1234567890-=`~!@#$%^&*()_+[]{}\\|;:'\",.<>/?",
    checkValidCharacters: function(username, password, newPassword) {
        if (username == "sp") {
            return false;
        }
        if (username.length < 3) {
            return USERNAME_SHORT;
        }
        if (username.length > 30) {
            return USERNAME_LONG;
        }
        if (password.length > 120) {
            return PASSWORD_LONG;
        }
        if (newPassword != null && newPassword.length > 120) {
            return NEW_PASSWORD_LONG;
        }
        var lowercaseUsername = username.toLowerCase();
        for (var i = 0; i < lowercaseUsername.length; i++) {
            if (!Database.validCharacters.includes(lowercaseUsername.charAt(i))) {
                return USERNAME_INVALID;
            }
        }
        if (Filter.check(username)) {
            return USERNAME_BAD;
        }
        return false;
    },
    saveProgress: function(username, progress) {
        database[username].progress = progress;
    },
    loadProgress: function(username) {
        return database[username].progress;
    },
};
exports.oofStrictMode = 1