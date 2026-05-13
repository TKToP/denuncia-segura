'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield } from 'lucide-react'; // Ícone que servirá de gatilho escondido

export default function FakeNewsPage() {
  const router = useRouter();
  const [clickCount, setClickCount] = useState(0);

  // Lógica de Disfarce: O usuário precisa clicar 5 vezes no logo para liberar o acesso
  const handleLogoClick = () => {
    setClickCount(prev => prev + 1);
    if (clickCount + 1 >= 5) {
      router.push('/auth-segura'); // Rota secreta
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 p-4">
      <header className="flex justify-between items-center border-b pb-2 mb-4">
        <h1 className="text-xl font-bold text-blue-900" onClick={handleLogoClick}>
          Portal de Notícias
        </h1>
        <span className="text-xs text-gray-500">13 de Maio, 2026</span>
      </header>

      {/* Conteúdo Fake para disfarce */}
      <section className="space-y-4">
        <div className="bg-white p-4 rounded shadow">
          <div className="h-40 bg-gray-200 rounded mb-2"></div>
          <h2 className="font-bold">Dicas de culinária para o final de semana</h2>
          <p className="text-sm text-gray-600">Confira as melhores receitas...</p>
        </div>
      </section>
    </main>
  );
}
