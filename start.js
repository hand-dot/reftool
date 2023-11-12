#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import open from 'open';

const PORT = 5840;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);

const env = {
    ...process.env,
    VITE_PARAM1: args[0] ? path.resolve(args[0]) : path.resolve('.'),
    VITE_PARAM2: args[1] ? path.resolve(args[1]) : '',
};

const server = spawn('node', [path.join(__dirname, 'build', 'server.js')], { env });

server.stdout.on('data', (data) => {
    console.log(data.toString());
    if (data.toString().startsWith('Ready at ')) {
        open(`http://localhost:${PORT}`)
    }
    console.log(`stdout: ${data}`);
});

server.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
});

server.on('error', (error) => {
    console.error(`error: ${error.message}`);
});

server.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
});

