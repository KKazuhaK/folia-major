import type { IcuFoliaEngines } from './segmenter';
import { CHINESE_DEMOTED_WORDS, CHINESE_EXTRA_WORDS } from './lexicon';

// src/utils/lyrics/icuFolia/engines.ts
// Loads icu-folia's engines: jieba (Rust, as wasm) for Chinese, BudouX for Japanese, and OpenCC
// for the traditional -> simplified step in front of jieba.
//
// All three load in one lazy chunk, off the startup bundle. jieba's binary arrives as gzipped
// base64 from a virtual module (see dev/icuFolia/jiebaWasmPlugin.mjs for why it is not fetched as a
// .wasm file), and the same code path runs in the browser, the desktop app and the unit tests.

/**
 * Character-by-character, so the simplified text has exactly the original's code-unit offsets and
 * jieba's words map straight back onto the original characters. A conversion that would change a
 * character's length (none in practice, but OpenCC's tables are not ours) keeps the original.
 */
const createLengthPreservingSimplifier = (convert: (text: string) => string) => {
    const memo = new Map<string, string>();
    const simplifyChar = (char: string) => {
        let simplified = memo.get(char);
        if (simplified === undefined) {
            const converted = convert(char);
            simplified = converted.length === char.length ? converted : char;
            memo.set(char, simplified);
        }
        return simplified;
    };
    return (text: string) => Array.from(text, simplifyChar).join('');
};

const decodeGzippedBase64 = async (base64: string): Promise<Uint8Array> => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index);
    }
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
    return new Uint8Array(await new Response(stream).arrayBuffer());
};

export const loadIcuFoliaEngines = async (): Promise<IcuFoliaEngines> => {
    const [jieba, { default: wasmGzipBase64 }, budoux, OpenCC] = await Promise.all([
        import('jieba-wasm/web'),
        import('virtual:icu-folia-jieba-wasm'),
        import('budoux'),
        import('opencc-js'),
    ]);

    await jieba.default({ module_or_path: await decodeGzippedBase64(wasmGzipBase64) });
    CHINESE_EXTRA_WORDS.forEach(word => jieba.add_word(word));
    CHINESE_DEMOTED_WORDS.forEach(word => jieba.add_word(word, 1));

    const simplify = createLengthPreservingSimplifier(OpenCC.Converter({ from: 'tw', to: 'cn' }));
    const japanese = new budoux.Parser(budoux.jaModel);

    return {
        cutChinese(text) {
            // Offsets line up (see the simplifier), so each simplified word's length is also its
            // length in the original text.
            let cursor = 0;
            return jieba.cut(simplify(text), true).map(word => {
                const original = text.slice(cursor, cursor + word.length);
                cursor += word.length;
                return original;
            });
        },
        parseJapanese: text => japanese.parse(text),
    };
};
