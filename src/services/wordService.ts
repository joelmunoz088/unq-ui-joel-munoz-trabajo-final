const API_BASE_URL = 'https://word-api-hmlg.vercel.app';

export interface ValidateWordResponse {
  exists: boolean;
}

export async function validateWordInDictionary(word: string): Promise<boolean> {
  const cleanWord = word.trim().toLowerCase();
  const response = await fetch(
    `${API_BASE_URL}/api/validate?word=${encodeURIComponent(cleanWord)}`
  );

  if (!response.ok) {
    throw new Error('Error al conectar con el diccionario. Intentá de nuevo.');
  }

  const data: ValidateWordResponse = await response.json();
  return Boolean(data.exists);
}