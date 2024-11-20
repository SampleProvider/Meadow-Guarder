
Filter = {
    words: ["shole", "hhole", "ass", "bastard", "basterd", "bitch", "bich", "beetch", "blowjob", "blow job", "boob", "butthole", "butth0le", "buthole", "buth0le", "clit", "cock", "cokk", "cawk", "cowk", "cawc", "cowc", "clit", "cnt", "crap", " cum", "cum ", "dildo", "dilldo", "dominatrix", "dominatric", "dominatrik", "enema", "fuc", "fuk", "foc", "fok", "phuc", "phuk", "fag", "faig", "hoor", "hor", "hoar", "haor", "jackoff", "jap", "jerkoff", "jisim", "jism", "jsm", "jizim", "jizm", "jzm", "gisim", "gism", "gsm", "gizim", "gizm", "gzm", "knob", "nob", "cunt", "kunt", "masochist", "masokist", "masocist", "masturbat", "masterbat", "masturbait", "masterbait", "massturbat", "massterbat", "massturbait", "massterbait", "mastrbat", "mastrbait", "nigger", "niger", "niggur", "nigur", "niggr", "nigr", "orgasm", "orgasim", "orgasum", "orifice", "orafis", "orifiss", "orafiss", "packie", "packi", "packy", "pakie", "paki", "paky", "pecker", "peker", "penis", "penus", "penas", "peenis", "peenus", "peenas", "peeenis", "peeenus", "peeenas", "pinis", "pinus", "pinas", "peniis", "penuus", "penaas", "peeniis", "peenuus", "peenaas", "peeeniis", "peeenuus", "peeenaas", "polac", "polak", "pric", "prik", "puss", "rectum", "rektum", "recktum", "retard", "sadist", "scank", "schlong", "sclong", "shlong", "screwin", "skrewin", "semen", "seemen", "sex", "secks", "seks", "shit", "shat", "shiit", "shaat", "shyt", "shyyt", "skanc", "skank", "scanc", "scank", "slag", "slut", "tit", "turd", "vagina", "vagiina", "vaigina", "vaigiina", "vajina", "vajiina", "vaijina", "vaijiina", "vulva", "vullva" , "whor", "whoar", "wop", "xrated", "xxx"],
    check: function(string) {
        var checkString = string.toLowerCase();
        checkString = checkString.replaceAll(" ", "");
        checkString = checkString.replaceAll(".", "");
        checkString = checkString.replaceAll("_", "");
        checkString = checkString.replaceAll("-", "");
        checkString = checkString.replaceAll("+", "");
        checkString = checkString.replaceAll("⠀", "");
        checkString = checkString.replaceAll("\"", "");
        checkString = checkString.replaceAll("'", "");
        checkString = checkString.replaceAll("@", "a");
        checkString = checkString.replaceAll("!", "i");
        checkString = checkString.replaceAll("$", "s");
        checkString = checkString.replaceAll("0", "o");
        checkString = checkString.replaceAll("()", "o");
        checkString = checkString.replaceAll("[]", "o");
        checkString = checkString.replaceAll("{}", "o");
        checkString = checkString.replaceAll("|", "i");
        checkString = checkString.replaceAll("/", "i");
        checkString = checkString.replaceAll("\\", "i");
        checkString = checkString.replaceAll("hs", "sh");
        checkString = checkString.replaceAll("hc", "ch");
        for (var i in Filter.words) {
            if (checkString.includes(Filter.words[i])) {
                return true;
            }
        }
        return false;
    },
};

console.log(this);