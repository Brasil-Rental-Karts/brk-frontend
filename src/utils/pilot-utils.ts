/**
 * Obtém as iniciais do piloto a partir do nome completo.
 * Retorna as iniciais em maiúsculas (até 2 caracteres).
 * 
 * @param name O nome completo do piloto
 * @returns As iniciais do piloto (até 2 caracteres)
 */
export function getInitials(name: string): string {
  if (!name) return "";
  return name
    .split(' ')
    .map(part => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/**
 * Normaliza um slug a partir do nome.
 * Remove acentos, substitui espaços por hífens, remove caracteres especiais, etc.
 * 
 * @param name O nome a ser convertido em slug
 * @returns O slug normalizado
 */
export function normalizeSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-');
} 