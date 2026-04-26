"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const redis_1 = require("redis");
const cors_1 = __importDefault(require("cors"));
const utils_1 = require("./utils");
const publisher = (0, redis_1.createClient)();
publisher.connect();
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cors_1.default)());
app.post('/topic', (req, res) => {
    try {
        const { topic } = req.body;
        if (!topic)
            return res.status(300).json({ message: "Topic is required" });
        console.log(topic);
        const id = (0, utils_1.generateRandomString)();
        publisher.lPush('topic', JSON.stringify({ id, topic }));
        res.status(200);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Internal server error"
        });
    }
});
app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
//# sourceMappingURL=index.js.map