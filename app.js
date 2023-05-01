import { telefunc } from "telefunc";
import express from "express";
import ViteExpress from "vite-express";
const app = express();
app.use(express.text());
app.all("/_telefunc", async (req, res) => {
    const { body, statusCode, contentType } = await telefunc({
        url: req.originalUrl,
        method: req.method,
        body: req.body,
    });
    res.status(statusCode).type(contentType).send(body);
});
const closeCallbacks = [];
var server = {
    on: (event, callback) => {
        if (event === "close")
            closeCallbacks.push(callback);
    }
};
ViteExpress.bind(app, server);
export { app };
