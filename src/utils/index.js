"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pushStringToZsh = pushStringToZsh;
var node_child_process_1 = require("node:child_process");
function pushStringToZsh(cmdStr) {
    try {
        (0, node_child_process_1.execSync)("echo ".concat(cmdStr, " >> ~/.zshrc"));
        return true;
    }
    catch (_a) {
        return false;
    }
}
