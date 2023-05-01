import { type Server } from "http";
import { telefunc } from "telefunc";
import express from "express";
import ViteExpress from "vite-express";

const app = express();

app.use(express.text())
app.all("/_telefunc", async (req, res) => {
    const { body, statusCode, contentType } = await telefunc({
        url: req.originalUrl,
        method: req.method,
        body: req.body,
    })

    res.status(statusCode).type(contentType).send(body)
})

const closeCallbacks: (() => void)[] = []

var server: { on: (event: "close", callback: () => void) => void } = {
    on: (event, callback) => {
        if (event === "close") closeCallbacks.push(callback)
    }
}

ViteExpress.bind(app, server as unknown as Server)

export { app }