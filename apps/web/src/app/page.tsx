export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Facturación La Llave</h1>
        <p className="text-xl text-gray-600 mb-2">FLL-SIF v0.1.0</p>
        <p className="text-sm text-gray-500">
          Sistema Informático de Facturación
        </p>
        <p className="text-sm text-gray-500 mb-8">
          100% preparado para VERI*FACTU
        </p>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-8">
          <p className="text-green-800 font-semibold">✅ Sistema inicializado correctamente</p>
          <p className="text-green-600 text-sm mt-2">
            Productor: Búfalo Easy Trade, S.L. (B86634235)
          </p>
        </div>

        <div className="mt-8 text-left bg-gray-50 rounded-lg p-6 max-w-md">
          <h2 className="font-bold mb-3">Próximos pasos:</h2>
          <ol className="text-sm text-gray-700 space-y-2">
            <li>1. Configurar PostgreSQL con Docker Compose</li>
            <li>2. Inicializar Prisma y ejecutar migraciones</li>
            <li>3. Configurar autenticación</li>
            <li>4. Implementar modelos de dominio</li>
          </ol>
        </div>
      </div>
    </main>
  );
}
