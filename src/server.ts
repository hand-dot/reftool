import { IClone } from '@jscpd/core';
import { detectClones } from 'jscpd';
import OpenAI from 'openai';
import express from 'express';
import type { AppData, Duplication, ClocResult } from './types';
import { uuid, getPotentialRemovals } from './utils';
import { commonOptions } from './constants';
import { readFileSync } from 'fs';
import { ITokenLocation } from '@jscpd/core';
import path from 'path';
import { execa } from 'execa';
import { exec } from 'child_process';
import which from 'which';
import dotenv from 'dotenv';
import chokidar from 'chokidar';
import open from 'open';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------SETUP------------------------

dotenv.config();
const app = express()
app.use(express.json());

// --------------SHARED VARIABLE---------------
const projectPaths: string[] = [
    import.meta.env.VITE_PARAM1 || process.env.VITE_PARAM1,
    import.meta.env.VITE_PARAM2 || process.env.VITE_PARAM2
];

const DB: AppData = {
    ready: false,
    countLinesOfProjects: [{ projectPath: "", SUM: { blank: 0, comment: 0, code: 0, nFiles: 0, } }],
    duplications: []
}

// --------------FUNCTIONS---------------------

const onWatchFileChanges = (paths: string[], cb: (path: string) => void) => {
    const isExcluded = (path: string) => {
        const ext = path.split('.').pop()!;
        const base = path.split('/').pop()!;
        return !ext || !base || commonOptions.excludeDirs.includes(base) || commonOptions.excludeExts.includes(ext);
    }
    const watcher = chokidar.watch(paths.filter(Boolean), {
        ignored: (path) => isExcluded(path),
        persistent: true,
        ignoreInitial: true
    });

    watcher
        .on('add', path => {
            console.log(`File ${path} has been added`)
            cb(path);
        })
        .on('change', path => {
            console.log(`File ${path} has been changed`)
            cb(path);
        })
        .on('unlink', path => {
            console.log(`File ${path} has been removed`)
            cb(path);
        });
}



const extractDuplicationDetails = (duplication: { start: ITokenLocation, end: ITokenLocation, sourceId: string, fragment?: string, }) => ({
    start: duplication.start,
    end: duplication.end,
    path: duplication.sourceId,
    fragment: duplication.fragment || '',
    content: readFileSync(path.join(duplication.sourceId), 'utf-8')
})

const cloc = async (folder: string): Promise<ClocResult> => {
    const excludeDirs = `--exclude-dir=${commonOptions.excludeDirs.join(',')}`;
    const excludeExts = `--exclude-ext=${commonOptions.excludeExts.join(',')}`;

    const args = [excludeDirs, excludeExts, '--by-file', '--json', folder];

    return new Promise((resolve) => {
        const clocPath = path.join(__dirname, '..', 'node_modules/.bin/cloc');
        const command = `${clocPath} ${args.join(' ')}`;
        console.log('command:', command);
        const options = { maxBuffer: 1024 * 1024 * 100 };
        exec(command, options, (error, stdout, stderr) => {
            if (error) {
                console.error(`error: ${error.message}`);
                return;
            }
            if (stderr) {
                console.error(`stderr: ${stderr}`);
                return;
            }
            const result = JSON.parse(stdout) as ClocResult
            result.projectPath = folder;
            resolve(result);
        });
    })

}

const jscpd = async (paths: string[]): Promise<Duplication[]> => {
    const ignore = [
        ...commonOptions.excludeDirs.map(dir => `**/${dir}/**`),
        ...commonOptions.excludeExts.map(ext => `**/*.${ext}`)
    ];

    const clones = await detectClones({ path: paths.filter(Boolean), silent: true, gitignore: true, ignore, });

    return clones.map((clone: IClone) => ({
        id: uuid(),
        format: clone.format,
        foundDate: clone.foundDate || 0,
        duplicationA: extractDuplicationDetails(clone.duplicationA),
        duplicationB: extractDuplicationDetails(clone.duplicationB)
    })).sort((a, b) => getPotentialRemovals(b.duplicationA) - getPotentialRemovals(a.duplicationA));
}


const scan = async () => {
    if (projectPaths.length === 0) {
        projectPaths.push(process.cwd());
    }

    const promises: [Promise<Duplication[]>, Promise<ClocResult>] = [jscpd(projectPaths), cloc(projectPaths[0])]
    if (projectPaths[1]) {
        promises.push(cloc(projectPaths[1]))
    }

    const [jscpdResult, ...clocResults] = await Promise.all(promises);
    return { jscpdResult, clocResults };
}

// --------------APIS-----------------------

app.get('/init', async (req, res) => {
    if (DB.ready) {
        res.json({ ...DB })
        return;
    }
    DB.ready = true;

    const { jscpdResult, clocResults } = await scan();

    DB.duplications = jscpdResult;
    DB.countLinesOfProjects = clocResults;

    res.json({ ...DB })
})

app.post('/gpt', async (req, res) => {
    const { message } = req.body;
    const openAi = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openAi.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: message }],
    });
    // FIXME ストリームにしたい
    res.json({ message: completion.choices[0].message.content })
});

app.get('/isFileChanged', (req, res) => {
    res.json({ changed: !DB.ready })
});

// --------------START--------------------

export const handler = app;

onWatchFileChanges(projectPaths, () => {
    DB.ready = false;
})


if (import.meta.env.MODE === 'production') {
    open(`http://localhost:${process.env.PORT}`)
}