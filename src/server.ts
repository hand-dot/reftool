import { IClone, ITokenLocation } from '@jscpd/core';
import { detectClones } from 'jscpd';
import express from 'express';
import type { Duplication } from './types';
import { uuid } from './utils';

// https://github.com/kucherenko/jscpd
// https://github.com/openai/openai-node

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
app.get('/detectClones', async (req, res) => {
    // TODO pathをクエリパラメータを使って変えられるようにする
    const path = ['/Users/kyohei/Develop/pdfme/packages'];
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

    // console.log(clones[0])

    const duplications: Duplication[] = clones.map((clone: IClone) => ({
        id: uuid(),
        format: clone.format,
        foundDate: clone.foundDate || 0,
        duplicationA: extractDuplicationDetails(clone.duplicationA),
        duplicationB: extractDuplicationDetails(clone.duplicationB)
    }));

    res.json({ duplications })
})

export const handler = app