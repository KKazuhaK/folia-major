// src/utils/lyrics/icuFolia/lexicon.ts
// The word lists icu-folia maintains on top of its engines. Everything here is data, so a bad split
// in the test corpus is usually fixed by adding a word here rather than by touching the pipeline.

/**
 * Chinese function words that belong to the word BEFORE them: structural 的/地/得, aspect 了/着/过,
 * the plural 们, sentence-final particles, and their Cantonese counterparts. Attaching them makes a
 * Chinese unit "one content word plus what grammatically hangs off it", which is what a Japanese
 * bunsetsu from BudouX already is (君の, 夜に), so the two languages come out at the same grain.
 *
 * Both script forms are listed: the Chinese engine runs on simplified text, but this list is
 * checked against the original characters.
 */
export const CHINESE_TRAILING_PARTICLES = new Set([
    '的', '地', '得', '了', '着', '著', '过', '過', '们', '們',
    '吗', '嗎', '呢', '吧', '啊', '呀', '啦', '嘛', '哦', '喔', '么', '麼', '哇', '呐', '咯',
    // Cantonese
    '嘅', '咗', '喇', '囉', '咩', '㗎', '噃', '喎', '啫', '吖', '嘞',
]);

/**
 * Words a trailing particle must NOT attach to: prepositions, conjunctions, adverbs and copulas.
 * In 天和地 the 地 is a noun, not the adverbial particle, and 和地 would be nonsense; after these
 * words a "particle" is almost always something else.
 */
export const CHINESE_NON_HOSTS = new Set([
    '和', '与', '與', '跟', '同', '及', '或', '而', '在', '从', '從', '向', '对', '對', '把', '被', '给', '給',
    '让', '讓', '为', '為', '也', '都', '就', '又', '再', '还', '還', '才', '很', '太', '最', '更', '不', '没', '沒',
    '别', '別', '未', '是', '係', '唔', '冇', '啲',
]);

/**
 * Words jieba's dictionary lacks, added at load in SIMPLIFIED form (the engine sees simplified text).
 * Mostly Cantonese, which the stock dictionary barely covers: without these 佢哋 comes out as two
 * unknown characters and 冇人會 glues 人 onto 會.
 */
export const CHINESE_EXTRA_WORDS = [
    '我哋', '你哋', '佢哋', '佢', '冇', '冇人', '唔好', '唔使', '唔系', '唔该', '唔知', '唔会', '唔识',
    '系咪', '喺度', '返嚟', '过嚟', '嚟', '点解', '乜嘢', '咩嘢', '咁样', '钟意', '而家', '依家', '听日',
    '琴日', '边度', '边个', '几时', '嗰度', '嗰个', '呢度', '呢个', '嘢', '心事', '揾', '睇', '攰',
];

/**
 * Dictionary words jieba should almost never choose, re-added at load with the lowest frequency.
 * 的话 ("if") swallows the particle 的 of the far more common 说过的话 ("the words said"), giving
 * 说过/的话. Demoted, the conditional reads 可以的/话, which still keeps 的 on its host.
 */
export const CHINESE_DEMOTED_WORDS = ['的话'];
