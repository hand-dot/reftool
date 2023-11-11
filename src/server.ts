import { IClone, ITokenLocation } from '@jscpd/core';
import { detectClones } from 'jscpd';
import OpenAI from 'openai';
import express from 'express';
import type { Duplication } from './types';
import { uuid } from './utils';
import dotenv from 'dotenv';

dotenv.config();

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
    content: duplication.fragment || ''
})

const app = express()
app.use(express.json());

app.get('/duplications', async (req, res) => {

    // 必要に応じてリフレッシュできるようにする
    if (DB.duplications.length > 0) {
        res.json({ duplications: DB.duplications })
        return;
    }


    // TODO pathをクエリパラメータを使って変えられるようにする
    const path = ['/Users/kyohei/Develop/next-labelmake.jp/src'];
    const clones = await detectClones({
        path,
        silent: true,
        gitignore: true,
        ignore: [
            '**/node_modules/**',
            '**/dist/**',
            '**/build/**',
            '**/coverage/**',
            '**/__tests__/**',
            '**/tests/**',
            '**/test/**',
            '**/__mocks__/**',
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
        ]
    });

    const duplications: Duplication[] = clones.map((clone: IClone) => ({
        id: uuid(),
        format: clone.format,
        foundDate: clone.foundDate || 0,
        duplicationA: extractDuplicationDetails(clone.duplicationA),
        duplicationB: extractDuplicationDetails(clone.duplicationB)
    }));

    DB.duplications = duplications;

    res.json({ duplications })
})

app.post('/gpt', async (req, res) => {
    const { message } = req.body;

    const openAi = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await openAi.chat.completions.create({
        model: "gpt-4-1106-preview",
        messages: [
            {
                role: "user",
                content: message,
            },
        ],
    });

    res.json({ message: completion.choices[0].message.content })
});

export const handler = app