/**
 * VERI*FACTU WORKER - Procesador de Cola de Submissions
 * 
 * Este script debe ejecutarse periódicamente mediante cron job
 * para procesar las submissions pendientes de envío a AEAT.
 * 
 * Uso:
 *   npx tsx verifactu-worker.ts
 * 
 * Cron recomendado (cada 5 minutos):
 *   asterisco-slash-5 asterisco asterisco asterisco asterisco
 */

import { PrismaClient } from '@fll/db';
import { processSubmissionQueue } from './packages/core/src/verifactu-submission';

const db = new PrismaClient();

async function main() {
  console.log('🔄 VERI*FACTU Worker iniciado...');
  console.log(`⏰ Fecha: ${new Date().toISOString()}`);
  console.log('');
  
  try {
    // Procesar hasta 50 submissions por ejecución
    const result = await processSubmissionQueue(db, 50);
    
    console.log('📊 Resultados:');
    console.log(`   ✅ Procesadas: ${result.processed}`);
    console.log(`   ✅ Exitosas: ${result.successful}`);
    console.log(`   ❌ Fallidas: ${result.failed}`);
    console.log('');
    
    if (result.errors.length > 0) {
      console.log('⚠️  Errores encontrados:');
      result.errors.forEach((error: { submissionId: string; error: string }, index: number) => {
        console.log(`   ${index + 1}. Submission ${error.submissionId}: ${error.error}`);
      });
      console.log('');
    }
    
    if (result.processed === 0) {
      console.log('ℹ️  No hay submissions pendientes.');
    } else if (result.successful === result.processed) {
      console.log('🎉 Todas las submissions procesadas exitosamente.');
    }
    
  } catch (error: any) {
    console.error('❌ Error crítico en worker:', error.message);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
  
  console.log('');
  console.log('✅ Worker finalizado correctamente.');
}

main();
