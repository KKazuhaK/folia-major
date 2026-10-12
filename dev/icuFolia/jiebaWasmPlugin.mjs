import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { createRequire } from 'node:module';

// dev/icuFolia/jiebaWasmPlugin.mjs
// Serves jieba-wasm's binary to icu-folia as a gzipped base64 string in a Vite virtual module.
//
// Why not let jieba-wasm fetch its own .wasm the usual way: the desktop app loads its pages from
// file://, and fetch() does not support that scheme, so the default `init()` fails there. A JS chunk
// loads from file:// like every other chunk. Why gzipped: the binary is 3.7 MB, and as plain base64
// it would come out just over the PWA precache's 5 MB per-file limit, so the web build would drop it
// from the offline cache. jieba's dictionary inside the binary gzips to 2.7 MB (3.6 MB as base64).
// The chunk is only imported when icu-folia loads, so it never sits in the startup bundle.

export const VIRTUAL_MODULE_ID = 'virtual:icu-folia-jieba-wasm';
const RESOLVED_VIRTUAL_MODULE_ID = `\0${VIRTUAL_MODULE_ID}`;

const require = createRequire(import.meta.url);

// The package's exports map hides both package.json and the .wasm, but `./web` is exported and the
// binary sits next to it.
const resolveWasmPath = () => path.join(path.dirname(require.resolve('jieba-wasm/web')), 'jieba_rs_wasm_bg.wasm');

// The glue's own default path, which icu-folia never takes (it always passes the bytes in). Left in,
// Vite sees the `new URL(..., import.meta.url)` and emits the 4 MB binary a second time as an asset,
// which the PWA would then precache next to the copy in the virtual module.
const DEFAULT_WASM_URL = "new URL('jieba_rs_wasm_bg.wasm', import.meta.url)";
const GLUE_MODULE = /[\\/]jieba-wasm[\\/]pkg[\\/]web[\\/]jieba_rs_wasm\.js$/;

export const jiebaWasmPlugin = () => ({
    name: 'icu-folia-jieba-wasm',
    // Before Vite's own asset handling, which is what picks up the `new URL` reference.
    enforce: 'pre',
    resolveId(id) {
        return id === VIRTUAL_MODULE_ID ? RESOLVED_VIRTUAL_MODULE_ID : null;
    },
    transform(code, id) {
        if (!GLUE_MODULE.test(id.split('?')[0])) return null;
        if (!code.includes(DEFAULT_WASM_URL)) {
            // A jieba-wasm upgrade changed its glue; fail the build rather than ship the binary twice.
            this.error(`jieba-wasm glue no longer contains ${DEFAULT_WASM_URL}; update dev/icuFolia/jiebaWasmPlugin.mjs`);
        }
        return { code: code.replace(DEFAULT_WASM_URL, 'undefined'), map: null };
    },
    load(id) {
        if (id !== RESOLVED_VIRTUAL_MODULE_ID) return null;
        const wasmPath = resolveWasmPath();
        this.addWatchFile(wasmPath);
        const gzipped = zlib.gzipSync(fs.readFileSync(wasmPath), { level: 9 });
        return `export default ${JSON.stringify(gzipped.toString('base64'))};\n`;
    },
});
