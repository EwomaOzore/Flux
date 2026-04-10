import { requireOptionalNativeModule } from 'expo-modules-core';

type ExpoTextExtractorNative = {
  extractTextFromImage: (uri: string) => Promise<string[]>;
};

const native = requireOptionalNativeModule<ExpoTextExtractorNative>('ExpoTextExtractor');

/** False in Expo Go, web, or until a dev build includes `expo-text-extractor` native code. */
export const ocrSupported = native != null;

/** Same URI handling as `expo-text-extractor`; no-op when the native module is missing. */
export async function extractTextFromImage(uri: string): Promise<string[]> {
  if (!native?.extractTextFromImage) return [];
  const processedUri = uri.replace(/^file:\/\//, '');
  return native.extractTextFromImage(processedUri);
}
