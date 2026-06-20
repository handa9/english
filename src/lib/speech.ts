/** 発音再生。録音済み音声ファイルを優先し、無ければ Web Speech にフォールバックする。 */

import { base } from '$app/paths';
import { audioSlug } from './audioSlug';

let voicesReady: Promise<SpeechSynthesisVoice[]> | null = null;

// 同じ語の音声を毎回 fetch しないよう、再生可否を語ごとにキャッシュする。
const audioAvailability = new Map<string, boolean>();
let currentAudio: HTMLAudioElement | null = null;

function audioUrl(word: string): string {
  return `${base}/audio/${audioSlug(word)}.mp3`;
}

/**
 * 録音済み音声ファイル（AI 生成）を再生する。成功したら true。
 * ファイルが無い・再生不可なら false を返し、呼び出し側で Web Speech に切り替える。
 */
async function playAudioFile(word: string): Promise<boolean> {
  if (typeof Audio === 'undefined') return false;
  const slug = audioSlug(word);
  if (!slug) return false;
  if (audioAvailability.get(slug) === false) return false;

  return new Promise<boolean>((resolve) => {
    const audio = new Audio(audioUrl(word));
    // 直前の音声を止める（Web Speech と同様に重複再生を避ける）
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }
    currentAudio = audio;

    const onError = () => {
      audioAvailability.set(slug, false);
      cleanup();
      resolve(false);
    };
    const onPlaying = () => {
      audioAvailability.set(slug, true);
      cleanup();
      resolve(true);
    };
    function cleanup() {
      audio.removeEventListener('error', onError);
      audio.removeEventListener('playing', onPlaying);
    }

    audio.addEventListener('error', onError);
    audio.addEventListener('playing', onPlaying);
    audio.play().catch(onError);
  });
}

function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  if (voicesReady) return voicesReady;
  voicesReady = new Promise((resolve) => {
    const synth = window.speechSynthesis;
    const existing = synth.getVoices();
    if (existing.length) {
      resolve(existing);
      return;
    }
    synth.onvoiceschanged = () => resolve(synth.getVoices());
  });
  return voicesReady;
}

/** 英語テキストを読み上げる。利用不可な環境では黙って何もしない。 */
export async function speak(text: string, lang = 'en-US'): Promise<void> {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  // 録音済み音声が再生中なら止める
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  const synth = window.speechSynthesis;
  const voices = await loadVoices();
  synth.cancel();

  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = lang;
  const enVoice = voices.find((v) => v.lang.startsWith('en'));
  if (enVoice) utter.voice = enVoice;
  utter.rate = 0.95;
  synth.speak(utter);
}

/**
 * リスニング用の単語を再生する。AI 生成の音声ファイルを優先し、
 * 無ければ Web Speech にフォールバックする。リスニングテストで使う。
 */
export async function playWord(word: string): Promise<void> {
  const played = await playAudioFile(word);
  if (!played) await speak(word);
}

/** 録音済み音声ファイルが使えるか（Audio API があるか）。 */
export function audioFileSupported(): boolean {
  return typeof Audio !== 'undefined';
}

/** 読み上げ機能（音声ファイル or Web Speech）が利用可能か。 */
export function speechSupported(): boolean {
  return (
    typeof window !== 'undefined' && ('speechSynthesis' in window || typeof Audio !== 'undefined')
  );
}
