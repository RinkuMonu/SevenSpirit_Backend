import http from 'http';
import mongoose from 'mongoose';
import app from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { initSocket } from './socket.js';
import { sweepExpired } from './services/consultationService.js';

await connectDB();

const server = http.createServer(app);
const io = initSocket(server);
app.set('io', io);

// Server-side authority on timers: close consultations whose time is up.
setInterval(() => sweepExpired(io).catch((e) => console.error('sweep failed:', e.message)), 15_000);

server.listen(env.port, () => console.log(`API + Socket.IO listening on :${env.port}`));

const shutdown = () => server.close(() => mongoose.connection.close(false).then(() => process.exit(0)));
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
