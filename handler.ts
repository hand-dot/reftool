import type { Handler } from 'vite-plugin-mix'


// https://github.com/kucherenko/jscpd
// https://github.com/openai/openai-node

import express from 'express'

const app = express()
// TODO
app.get('/test', (req, res) => {
    res.send('Hello World!')
})

export const handler = app