import path from 'path';
import express from 'express';
import socketIO from 'socket.io';
import { Lib } from 'lance-gg';
import SLServerEngine from './server/SLServerEngine.js';
import SLGameEngine from './common/SLGameEngine.js';

const PORT = process.env.PORT || 3000;
const INDEX = path.join(__dirname, '../dist/index.html');

// define routes and socket
const server = express();
server.get('/', (req, res) => { res.sendFile(INDEX); });
server.use('/', express.static(path.join(__dirname, '../dist/')));
const requestHandler = server.listen(PORT, () => console.log(`Listening on ${PORT}`));
const io = socketIO(requestHandler);

// Game Instances
const gameEngine = new SLGameEngine({ traceLevel: Lib.Trace.TRACE_NONE });
const serverEngine = new SLServerEngine(io, gameEngine, { debug: {}, updateRate: 6, timeoutInterval: 20 });

// start the game
serverEngine.start();
