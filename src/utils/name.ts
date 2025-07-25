/**
 * Formata um nome para camel case (primeira letra de cada palavra em maiúscula)
 *
 * Esta função é usada em todo o sistema para garantir consistência na formatação
 * de nomes de usuários. Ela converte nomes como "joão silva" para "João Silva".
 *
 * @param name - O nome a ser formatado
 * @returns O nome formatado em camel case
 *
 * @example
 * formatName("joão silva") // "João Silva"
 * formatName("MARIA DOS SANTOS") // "Maria Dos Santos"
 * formatName("  pedro  costa  ") // "Pedro Costa"
 * formatName("") // ""
 * formatName(null) // ""
 */
export function formatName(name: string): string {
  if (!name || typeof name !== "string") {
    return "";
  }

  return name
    .trim()
    .split(/\s+/)
    .map((word) => {
      if (!word) return "";
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .filter((word) => word.length > 0)
    .join(" ");
}
