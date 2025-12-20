/**
 * SCRIPT: Bloquear trials expirados
 * 
 * Job que debe ejecutarse DIARIAMENTE (cron) para bloquear cuentas
 * cuyo trial haya expirado y no tengan suscripción activa.
 * 
 * Uso:
 *   npx tsx block-expired-trials.ts
 * 
 * Cron recomendado:
 *   0 1 * * * (cada día a las 01:00)
 */

import { PrismaClient } from '@fll/db';
import { blockExpiredTrials } from '@fll/core';

const db = new PrismaClient();

async function main() {
  console.log('🔒 Bloqueando trials expirados...');
  console.log(`⏰ Fecha: ${new Date().toISOString()}`);
  console.log('');
  
  try {
    const blocked = await blockExpiredTrials(db);
    
    console.log(`📊 Resultado: ${blocked} cuenta(s) bloqueada(s)`);
    
    if (blocked === 0) {
      console.log('✅ No hay trials expirados para bloquear.');
    } else {
      console.log(`✅ ${blocked} cuenta(s) bloqueada(s) por trial expirado.`);
    }
    
  } catch (error: any) {
    console.error('❌ Error bloqueando trials:', error.message);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
  
  console.log('');
  console.log('✅ Script finalizado.');
}

main();
