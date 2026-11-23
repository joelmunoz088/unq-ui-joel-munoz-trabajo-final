export function normalizeText(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function getRequiredStartingLetter(previousWord: string): string {
  const normalized = normalizeText(previousWord);
  return normalized.charAt(normalized.length - 1);
}

export function validateChainLocally(
  rawInput: string,
  usedWords: string[]
): { valid: boolean; error?: string; cleanWord: string } {
  const cleanWord = rawInput.trim().toLowerCase();

  if (!cleanWord) {
    return { valid: false, error: 'Ingresá una palabra.', cleanWord };
  }

  if (!/^[a-záéíóúüñ]+$/i.test(cleanWord)) {
    return {
      valid: false,
      error: 'Ingresá solo una palabra sin espacios ni números.',
      cleanWord,
    };
  }

  const normalizedInput = normalizeText(cleanWord);

  // Regla 1: Verificar encadenamiento a partir de la segunda palabra
  if (usedWords.length > 0) {
    const lastWord = usedWords[usedWords.length - 1];
    const expectedLetter = getRequiredStartingLetter(lastWord);
    const firstLetter = normalizedInput.charAt(0);

    if (firstLetter !== expectedLetter) {
      return {
        valid: false,
        error: `La palabra no respeta la regla de encadenamiento (debe empezar con "${expectedLetter.toUpperCase()}").`,
        cleanWord,
      };
    }
  }

  // Regla 2: Verificar que no haya sido utilizada antes en la partida
  const alreadyUsed = usedWords.some(
    (w) => normalizeText(w) === normalizedInput
  );
  if (alreadyUsed) {
    return {
      valid: false,
      error: 'La palabra ya fue utilizada.',
      cleanWord,
    };
  }

  return { valid: true, cleanWord };
}