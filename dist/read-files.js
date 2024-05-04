"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readFileFromDisk = void 0;
const fs_1 = __importDefault(require("fs"));
function readFileFromDisk(location) {
    if (!location)
        return undefined;
    return fs_1.default.readFileSync(location);
}
exports.readFileFromDisk = readFileFromDisk;
//# sourceMappingURL=read-files.js.map