// src/utils/lyrics/icuFolia/virtualModules.d.ts
// jieba's wasm binary reaches icu-folia through a Vite virtual module built by
// dev/icuFolia/jiebaWasmPlugin.mjs, so TS has no real file to resolve and needs this declaration.

declare module 'virtual:icu-folia-jieba-wasm' {
    /** jieba-wasm's binary, gzipped, as base64. */
    const wasmGzipBase64: string;
    export default wasmGzipBase64;
}
