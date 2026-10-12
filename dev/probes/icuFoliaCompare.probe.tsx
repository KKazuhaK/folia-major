import React, { useEffect, useMemo, useState } from 'react';
import { useMotionValue } from 'framer-motion';
import { DEFAULT_THEME } from '../../src/services/baseThemes';
import { getVisualizerRegistryEntry } from '../../src/components/visualizer/registry';
import { DEFAULT_LUMIERE_TUNING, DEFAULT_PENDOLO_TUNING, DEFAULT_SONNET_TUNING, type Line } from '../../src/types';
import { applyAutoWordSegmentation, loadIcuFolia } from '../../src/utils/lyrics/icuFolia';
import { SONGS, buildSongLines } from './icu-folia/songs';
import type { ProbeDefinition } from './definition';

// dev/probes/icuFoliaCompare.probe.tsx

/**
 * 同一首中文歌、同一时刻，分别用旧的默认分词（Intl.Segmenter）和 icu-folia 渲染一个 visualizer，
 * 用来对比两套分词在凝彩（hero 词、按词入场）等按词排版的模式里的效果。
 *
 * `?probe=icuFoliaCompare&seg=icu|folia&song=wanfeng|songbie&vis=tempera&t=<秒>`
 * 给了 t 就定格在那一刻；不给就按 speed 倍速循环播放。icu-folia 的引擎异步加载，烘焙完成后
 * `document.body.dataset.segReady` 置为 1，截图脚本等它再拍。
 */

const params = new URLSearchParams(window.location.search);
const SEG = params.get('seg') === 'icu' ? 'icu' : 'folia';
const SONG = SONGS.find(song => song.id === params.get('song')) ?? SONGS[1]!;
const MODE = params.get('vis') ?? 'tempera';
const FROZEN_AT = params.has('t') ? Number(params.get('t')) : null;
const SPEED = Number(params.get('speed') ?? '1');
const BASE_LINES = buildSongLines(SONG);
const TOTAL_SECONDS = BASE_LINES.at(-1)!.endTime + 3;

const lineIndexAt = (lines: Line[], time: number) => {
    let index = 0;
    lines.forEach((line, i) => {
        if (line.startTime <= time) index = i;
    });
    return index;
};

const IcuFoliaCompareProbe: React.FC = () => {
    const currentTime = useMotionValue(FROZEN_AT ?? 0);
    const level = useMotionValue(0.4);
    const audioBands = useMemo(() => ({ bass: level, lowMid: level, mid: level, vocal: level, treble: level }), [level]);
    const [lines, setLines] = useState<Line[]>(BASE_LINES);
    const [lineIndex, setLineIndex] = useState(lineIndexAt(BASE_LINES, FROZEN_AT ?? 0));

    useEffect(() => {
        if (SEG === 'icu') {
            document.body.dataset.segReady = '1';
            return;
        }
        void loadIcuFolia().then(() => {
            setLines(applyAutoWordSegmentation({ lines: BASE_LINES })!.lines);
            document.body.dataset.segReady = '1';
        });
    }, []);

    useEffect(() => {
        if (FROZEN_AT !== null) return undefined;
        let raf = 0;
        let last = performance.now();
        let elapsed = 0;
        const tick = (now: number) => {
            elapsed = (elapsed + ((now - last) / 1000) * SPEED) % TOTAL_SECONDS;
            last = now;
            currentTime.set(elapsed);
            setLineIndex(lineIndexAt(BASE_LINES, elapsed));
            raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [currentTime]);

    return (
        <div className="fixed inset-0" data-probe-mode={MODE} data-seg={SEG}>
            {getVisualizerRegistryEntry(MODE).render({
                currentTime,
                currentLineIndex: lineIndex,
                lines,
                theme: DEFAULT_THEME,
                audioPower: level,
                audioBands,
                showText: true,
                paused: false,
                // 同一个 seed：两边的随机排版只因分词不同而不同。
                seed: `icu-folia-compare-${SONG.id}`,
                coverUrl: null,
                songTitle: SONG.title,
                pendoloTuning: DEFAULT_PENDOLO_TUNING,
                sonnetTuning: DEFAULT_SONNET_TUNING,
                lumiereTuning: DEFAULT_LUMIERE_TUNING,
            } as never)}
        </div>
    );
};

const definition: ProbeDefinition = {
    id: 'icuFoliaCompare',
    title: '分词对比 · Intl.Segmenter vs icu-folia',
    description: '同一首中文歌、同一时刻，用旧默认分词或 icu-folia 渲染一个按词排版的 visualizer。'
        + ' 参数：seg=icu|folia song=wanfeng|songbie vis=<mode>（默认 tempera） t=<秒>（定格） speed=<倍速>',
    Component: IcuFoliaCompareProbe,
};

export default definition;
