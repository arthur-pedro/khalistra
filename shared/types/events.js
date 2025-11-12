"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildGameEvent = void 0;
const buildGameEvent = (name, payload) => ({
    name,
    payload,
    timestamp: Date.now(),
});
exports.buildGameEvent = buildGameEvent;
