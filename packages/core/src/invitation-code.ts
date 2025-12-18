/**
 * UTILS - GENERADOR DE CÓDIGOS DE INVITACIÓN
 * Genera códigos únicos alfanuméricos de 8 caracteres
 * Formato: ABC12XYZ (mayúsculas y números)
 */

/**
 * Genera un código de invitación único de 8 caracteres
 * Solo usa caracteres fáciles de leer (excluye 0, O, I, 1)
 */
export function generateInvitationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sin 0, O, I, 1
  let code = '';
  
  for (let i = 0; i < 8; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    code += chars[randomIndex];
  }
  
  return code;
}
