const API_BASE_URL = 'https://word-api-hmlg.vercel.app';
const validationCache = new Map<string, boolean>();

export interface ValidateWordResponse {
  exists: boolean;
}

export function warmUpDictionaryApi(): void {
  fetch(`${API_BASE_URL}/api/validate?word=hola`).catch(() => {
    // Ignorar errores en el pre-calentamiento inicial
  });
}

export async function validateWordInDictionary(word: string): Promise<boolean> {
  const cleanWord = word.trim().toLowerCase();

  if (validationCache.has(cleanWord)) {
    return validationCache.get(cleanWord)!;
  }

  const response = await fetch(
    `${API_BASE_URL}/api/validate?word=${encodeURIComponent(cleanWord)}`
  );

  if (!response.ok) {
    throw new Error('Error al conectar con el diccionario. Intentá de nuevo.');
  }

  const data: ValidateWordResponse = await response.json();
  const exists = Boolean(data.exists);
  validationCache.set(cleanWord, exists);
  return exists;
}