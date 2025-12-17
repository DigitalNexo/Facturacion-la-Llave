import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Facturación La Llave',
  description: 'Sistema Informático de Facturación 100% VERI*FACTU compliant',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
