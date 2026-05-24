'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
// IMPORTANTE: Importe o seu cliente do supabase aqui
import { supabase } from '@/services/supabaseClient';

export default function AuthSegura() {
  const router = useRouter();
  
  const [isAnonimo, setIsAnonimo] = useState(true);
  const [nome, setNome] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const PIN_VITIMA_DEFAULT = '2026';
  const PIN_ADMIN = '9999';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(false);

    // Regra do Admin (funciona em qualquer aba)
    if (pin === PIN_ADMIN) {
      router.push('/admin');
      return;
    }

    if (isAnonimo) {
      // Regra Anônima
      if (pin === PIN_VITIMA_DEFAULT) {
        // Limpa possíveis sessões anteriores e vai pra denúncia
        sessionStorage.removeItem('user_nome'); 
        router.push('/denuncia');
      } else {
        setError(true);
        setPin('');
        setTimeout(() => setError(false), 3000);
      }
    } else {
      // Regra Usuário Cadastrado
      if (!nome.trim() || !pin) return;
      setLoading(true);

      try {
        const { data, error: fetchError } = await supabase
          .from('usuarios_seguros')
          .select('*')
          .eq('nome_cadastro', nome.trim())
          .eq('pin_permanente', pin)
          .maybeSingle();

        if (fetchError || !data) {
          setError(true);
          setPin('');
          setTimeout(() => setError(false), 3000);
        } else {
          // Salva o nome na sessão para ser usado na página de denúncia
          sessionStorage.setItem('user_nome', data.nome_cadastro);
          router.push('/denuncia');
        }
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white p-8 rounded-lg shadow-md border border-gray-200">
        <div className="text-center mb-6">
          <div className="bg-blue-600 w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold">
            i
          </div>
          <h2 className="text-xl font-semibold text-gray-700">Intranet Corporativa</h2>
          <p className="text-sm text-gray-500">Área Restrita a Colaboradores</p>
        </div>

        {/* Toggle Anônimo / Cadastrado */}
        <div className="flex bg-gray-100 p-1 rounded-md mb-6 text-sm">
          <button 
            type="button"
            className={`flex-1 py-1.5 rounded transition font-medium ${isAnonimo ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => { setIsAnonimo(true); setNome(''); setPin(''); setError(false); }}
          >
            Acesso Padrão
          </button>
          <button 
            type="button"
            className={`flex-1 py-1.5 rounded transition font-medium ${!isAnonimo ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => { setIsAnonimo(false); setPin(''); setError(false); }}
          >
            Acesso Assinado
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">
              {isAnonimo ? "ID do Usuário" : "Nome Cadastrado"}
            </label>
            {isAnonimo ? (
              <input 
                type="text" 
                disabled
                className="w-full p-3 bg-gray-100 border border-gray-200 rounded text-gray-400 cursor-not-allowed text-sm"
                value="USUARIO_LOGADO"
              />
            ) : (
              <input 
                type="text" 
                placeholder="Ex: Maria da Silva"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none transition text-sm text-gray-700"
                required
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">
              Código de Acesso (PIN)
            </label>
            <input 
              type="password" 
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder={isAnonimo ? "2026" : "****"}
              className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none transition text-sm"
              required
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-blue-700 text-white py-3 rounded font-semibold hover:bg-blue-800 transition disabled:opacity-50"
          >
            {loading ? 'Validando...' : 'Entrar no Sistema'}
          </button>
        </form>

        {error && (
          <p className="mt-4 text-center text-xs text-red-500 animate-pulse font-medium">
            Acesso negado ou credenciais incorretas.
          </p>
        )}
      </div>

      <button 
        onClick={() => window.location.href = 'https://google.com'}
        className="mt-10 text-gray-300 text-xs hover:text-gray-400"
      >
        Voltar para a Home
      </button>
    </main>
  );
}