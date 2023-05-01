import { createServer } from 'http'

import { app } from './app'

const server = createServer((req, res) => app(req, res));

server.listen(3000);