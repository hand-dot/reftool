import { readFileSync } from 'fs';
import * as path from 'path';
import { IClone, ITokenLocation } from '@jscpd/core';
import { detectClones } from 'jscpd';
import OpenAI from 'openai';
import express from 'express';
import type { Duplication } from './types';
import { uuid, getPotentialRemovals } from './utils';
import dotenv from 'dotenv';

dotenv.config();

const projects: string[] = [import.meta.env.VITE_PARAM1, import.meta.env.VITE_PARAM2].filter(Boolean) as string[];

const DB: {
    duplications: Duplication[]
} = {
    duplications: []
}

const extractDuplicationDetails = (duplication: {
    start: ITokenLocation,
    end: ITokenLocation
    sourceId: string
    fragment?: string
}) => ({
    start: duplication.start,
    end: duplication.end,
    path: duplication.sourceId,
    fragment: duplication.fragment || '',
    content: readFileSync(path.join(duplication.sourceId), 'utf-8')
})

const app = express()
app.use(express.json());

app.get('/duplications', async (req, res) => {
    // FIXME 必要に応じてリフレッシュできるようにする いや、むしろ変更があれば勝手にリフレッシュするべき
    if (DB.duplications.length > 0) {
        res.json({ duplications: DB.duplications })
        return;
    }

    const clones = await detectClones({
        path: projects,
        minLines: 10,
        minTokens: 75,
        silent: true,
        gitignore: true,
        ignore: [
            '**/node_modules/**',
            '**/dist/**',
            '**/build/**',
            '**/coverage/**',
            '**/__snapshots__/**',
            '**/__fixtures__/**',
            '**/*.json',
            '**/*.md',
            '**/*.yml',
            '**/*.yaml',
            '**/*.lock',
            '**/*.log',
            '**/*.txt',
            '**/*.png',
            '**/*.jpg',
            '**/*.jpeg',
            '**/*.gif',
            '**/*.svg',
            '**/*.ico',
            '**/*.ttf',
            '**/*.woff',
            '**/*.woff2',
            '**/*.eot',
            '**/*.map',
        ],
    });

    const duplications: Duplication[] = clones.map((clone: IClone) => ({
        id: uuid(),
        format: clone.format,
        foundDate: clone.foundDate || 0,
        duplicationA: extractDuplicationDetails(clone.duplicationA),
        duplicationB: extractDuplicationDetails(clone.duplicationB)
    })).sort((a, b) => getPotentialRemovals(b.duplicationA) - getPotentialRemovals(a.duplicationA));

    DB.duplications = duplications;

    res.json({ duplications })
})

app.post('/gpt', async (req, res) => {
    const { message } = req.body;

    const openAi = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await openAi.chat.completions.create({
        model: "gpt-4",
        messages: [
            {
                role: "user",
                content: message,
            },
        ],
    });

    // FIXME ストリームにしたい
    res.json({ message: completion.choices[0].message.content })
});

export const handler = app