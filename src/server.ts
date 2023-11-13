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
import { exec } from 'child_process';
import dotenv from 'dotenv';
import chokidar from 'chokidar';
import open from 'open';
import { fileURLToPath } from 'url';
import cors from 'cors';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------SETUP------------------------

dotenv.config();
const app = express()
app.use(express.json());
app.use(cors({ origin: ['http://127.0.0.1:5840'] }));

// --------------SHARED VARIABLE---------------
const projectPaths: string[] = [
    import.meta.env.VITE_PARAM1 || process.env.VITE_PARAM1,
    import.meta.env.VITE_PARAM2 || process.env.VITE_PARAM2
];

const DB: AppData = {
    time: 0,
    ready: false,
    countLinesOfProjects: [{ projectPath: "", SUM: { blank: 0, comment: 0, code: 0, nFiles: 0, } }],
    duplications: [],
    options: {
        excludeDirs: commonOptions.excludeDirs,
        excludeExts: commonOptions.excludeExts,
    }
}

// --------------FUNCTIONS---------------------

const onWatchFileChanges = (paths: string[], cb: (path: string) => void) => {
    const isExcluded = (path: string) => {
        const ext = path.split('.').pop()!;
        const base = path.split('/').pop()!;
        return !ext || !base || DB.options.excludeDirs.includes(base) || DB.options.excludeExts.includes(ext);
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
    const excludeDirs = `--exclude-dir=${DB.options.excludeDirs.join(',')}`;
    const excludeExts = `--exclude-ext=${DB.options.excludeExts.join(',')}`;

    const args = [excludeDirs, excludeExts, '--by-file', '--json', folder];

    return new Promise((resolve, reject) => {
        const clocPath = path.join(__dirname, '..', 'cloc');
        const command = `${clocPath} ${args.join(' ')}`;
        const options = { maxBuffer: 1024 * 1024 * 100 };
        exec(command, options, (error, stdout, stderr) => {
            if (error) {
                console.error(`error: ${error.message}`);
                reject('-------cloc error------');
                return;
            }
            if (stderr) {
                console.error(`stderr: ${stderr}`);
                reject('-------cloc error------');
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
        ...DB.options.excludeDirs.map(dir => `**/${dir}/**`),
        ...DB.options.excludeExts.map(ext => `**/*.${ext}`)
    ];

    try {
        const clones = await detectClones({ path: paths.filter(Boolean), silent: true, gitignore: true, ignore, });
        return clones.map((clone: IClone) => ({
            id: uuid(),
            format: clone.format,
            foundDate: clone.foundDate || 0,
            duplicationA: extractDuplicationDetails(clone.duplicationA),
            duplicationB: extractDuplicationDetails(clone.duplicationB)
        })).sort((a, b) => getPotentialRemovals(b.duplicationA) - getPotentialRemovals(a.duplicationA));
    }
    catch (e) {
        console.error(e);
        throw new Error('-------jscpd error-------');
    }
}


const analyze = async () => {
    if (projectPaths.length === 0) {
        projectPaths.push(process.cwd());
    }

    const promises: [Promise<Duplication[]>, Promise<ClocResult>] = [jscpd(projectPaths), cloc(projectPaths[0])]
    if (projectPaths[1]) {
        promises.push(cloc(projectPaths[1]))
    }

    try {
        console.log('Analyzing...')
        const start = Date.now();
        const [jscpdResult, ...clocResults] = await Promise.all(promises);
        const time = Date.now() - start;
        console.log('Analysis Completed! - ', time, 'ms')

        return { time, jscpdResult, clocResults };
    } catch (e) {
        console.error(e);
        throw new Error('Error while analyzing. Check terminal console for more details and settings');
    }
}

async function* streamChatCompletion(params: { apiKey: string, message: string }) {
    const { apiKey, message } = params;
    const openAi = new OpenAI({ apiKey });
    const stream = await openAi.chat.completions.create({
        stream: true,
        model: "gpt-4-1106-preview",
        messages: [{ role: "user", content: message }],
    }, {
        stream: true,
    });

    for await (const chunk of stream) {
        const finish_reason = chunk.choices[0].finish_reason;
        const content = chunk.choices[0].delta.content;
        if (finish_reason) {
            return;
        } else {
            yield content;
        }
    }
}

function timeoutPromise(ms: number) {
    return new Promise((_, reject) => {
        setTimeout(() => {
            reject(new Error(`Timeout after ${ms} ms. Check your codebase path and settings`));
        }, ms);
    });
}


// --------------APIS-----------------------

app.get('/init', async (_, res) => {
    if (DB.ready) {
        DB.time = 'cache'
        res.json({ ...DB })
        return;
    }

    try {
        DB.ready = true;

        const result = await Promise.race<any>([analyze(), timeoutPromise(10000)]);
        const { time, jscpdResult, clocResults } = result as { time: number, jscpdResult: Duplication[], clocResults: [ClocResult] | [ClocResult, ClocResult] };

        DB.time = time;
        DB.duplications = jscpdResult;
        DB.countLinesOfProjects = clocResults;

        res.json({ ...DB })
    } catch (e: any) {
        console.error(e);
        res.status(500).json({ message: "Internal server error \n" + e.message });
    }
})

app.post('/gpt', async (req, res) => {
    res.setHeader("Content-Type", "text/event-stream;charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("X-Accel-Buffering", "no");

    const { message, apiKey } = req.body;

    if (!message || !apiKey) {
        res.status(400).json({ message: '' })
        return;
    }

    try {
        for await (const data of streamChatCompletion({ message, apiKey })) {
            res.write(data);
        }
    } catch (e) {
        return res.status(500).send({ message: "Internal server error" });
    }
    res.end();
});

app.get('/isFileChanged', (_, res) => {
    res.json({ changed: !DB.ready })
});

app.put('/options', (req, res) => {
    const { excludeDirs, excludeExts } = req.body;

    if (!excludeDirs || !excludeExts) {
        res.status(400).json({ message: 'ng' })
        return;
    }

    DB.options.excludeDirs = excludeDirs.length === 0 ? commonOptions.excludeDirs : excludeDirs as string[];
    DB.options.excludeExts = excludeExts.length === 0 ? commonOptions.excludeExts : excludeExts as string[];
    DB.ready = false;

    res.status(200).json({ message: 'ok' })
});

// --------------START--------------------

export const handler = app;

onWatchFileChanges(projectPaths, () => {
    DB.ready = false;
})


if (import.meta.env.MODE === 'production') {
    open(`http://localhost:${process.env.PORT}`)
}