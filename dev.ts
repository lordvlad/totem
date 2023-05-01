import http from 'http';
import { TscWatchClient } from 'tsc-watch';

let watch = new TscWatchClient();


let app: http.RequestListener;


watch.on("first_success", async () => {
    console.log("Loading app ...")
    const mod = await import('./app.js');
    app = mod.app

    const server = http.createServer((req, res) => app(req, res));

    server.listen(3000, () => {
        console.log("started server on port 3000")
    });
})

watch.on("success", async () => {
    console.log('Reloading app ...');
    const mod = await import('./app.js');
    app = mod.app
})

watch.start("--project", "tsconfig.server.json")