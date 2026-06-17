/** Web Speech API による発音再生。サーバ不要・オフライン動作。 */

let voicesReady: Promise<SpeechSynthesisVoice[]> | null = null;

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

/** 読み上げ機能が利用可能か。 */
export function speechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}
