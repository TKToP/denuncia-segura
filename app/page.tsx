'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
<<<<<<< HEAD
import { Search, Menu, X } from 'lucide-react'; 
// IMPORTANTE: Importe o seu cliente do supabase aqui
import { supabase } from '@/services/supabaseClient'; 
=======
import { Shield } from 'lucide-react'; // Ícone que servirá de gatilho escondido
>>>>>>> 1e4c165d3bad87eb56901b9aba82e84cd84ded2a

export default function FakeNewsPage() {
  const router = useRouter();
  const [clickCount, setClickCount] = useState(0);
<<<<<<< HEAD
  const [showCadastro, setShowCadastro] = useState(false);
  
  const [formData, setFormData] = useState({ nome: '', email: '', celular: '', cep: '', cidade: '' });
  const [captchaOk, setCaptchaOk] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Novo estado para mostrar o PIN após o cadastro
  const [generatedPin, setGeneratedPin] = useState<string | null>(null);

  const handleLogoClick = () => {
    setClickCount(prev => prev + 1);
    if (clickCount + 1 >= 5) router.push('/auth-segura'); 
  };

  const buscarCEP = async (cep: string) => {
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setFormData({ ...formData, cep, cidade: data.localidade });
        }
      } catch (error) {
        console.error("Erro ao buscar CEP");
      }
    } else {
      setFormData({ ...formData, cep });
    }
  };

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!captchaOk) {
      alert("Por favor, confirme que você não é um robô.");
      return;
    }

    setLoading(true);

    try {
      // 1. Gera um PIN aleatório de 4 dígitos
      const randomPin = Math.floor(1000 + Math.random() * 9000).toString();

      // 2. Salva NOME e PIN na tabela segura
      const { error } = await supabase
        .from('usuarios_seguros')
        .insert([{ 
          nome_cadastro: formData.nome.trim(), 
          pin_permanente: randomPin 
        }]);

      if (error) {
        if (error.code === '23505') { // Código de erro para violação de UNIQUE (nome já existe)
          alert("Este nome já está cadastrado. Por favor, adicione um sobrenome para diferenciá-lo.");
        } else {
          throw error;
        }
        setLoading(false);
        return;
      }

      // 2,5. Salva os dados temporariamente na sessão para o formulário de denúncia puxar depois
      sessionStorage.setItem('dadosDisfarce', JSON.stringify(formData));

      // 3. Oculta o formulário e exibe o PIN gerado
      setGeneratedPin(randomPin);
    } catch (err) {
      console.error(err);
      alert("Erro ao realizar a assinatura. Tente novamente.");
    } finally {
      setLoading(false);
=======

  // Lógica de Disfarce: O usuário precisa clicar 5 vezes no logo para liberar o acesso
  const handleLogoClick = () => {
    setClickCount(prev => prev + 1);
    if (clickCount + 1 >= 5) {
      router.push('/auth-segura'); // Rota secreta
>>>>>>> 1e4c165d3bad87eb56901b9aba82e84cd84ded2a
    }
  };

  return (
<<<<<<< HEAD
    <main className="min-h-screen bg-[#f3f3f3]">
      <div className="bg-white border-b py-2 px-4 text-[10px] text-gray-500 flex justify-between max-w-4xl mx-auto">
        <span>São Paulo, 22 de Maio de 2026</span>
        <div className="flex gap-3">
          <button onClick={() => { setShowCadastro(true); setGeneratedPin(null); }} className="hover:text-blue-600 font-bold">Assine</button>
          <span>Login</span>
        </div>
      </div>

      {showCadastro && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white max-w-md w-full p-6 rounded-lg shadow-xl relative">
            <button onClick={() => setShowCadastro(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700">
              <X size={20} />
            </button>

            {!generatedPin ? (
              <>
                <h2 className="text-xl font-bold mb-1 text-[#002f6c]">Assine o Portal</h2>
                <p className="text-xs text-gray-500 mb-6">Receba as principais notícias da região diretamente no seu e-mail.</p>
                
                <form onSubmit={handleCadastro} className="space-y-3 text-sm">
                  <input required type="text" placeholder="Nome Completo" className="w-full p-2 border rounded" 
                    value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
                  
                  <input required type="email" placeholder="E-mail" className="w-full p-2 border rounded" 
                    value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                  
                  <input required type="tel" placeholder="Número de Celular" className="w-full p-2 border rounded" 
                    value={formData.celular} onChange={e => setFormData({...formData, celular: e.target.value})} />
                  
                  <div className="flex gap-2">
                    <input required type="text" placeholder="CEP" className="w-1/3 p-2 border rounded" 
                      value={formData.cep} onChange={e => buscarCEP(e.target.value)} />
                    <input required type="text" placeholder="Cidade (Automático)" className="w-2/3 p-2 border rounded bg-gray-50" 
                      readOnly value={formData.cidade} />
                  </div>

                  <div className="flex items-center gap-2 bg-gray-50 p-3 border rounded mt-2">
                    <input type="checkbox" id="captcha" required checked={captchaOk} onChange={e => setCaptchaOk(e.target.checked)} className="w-4 h-4 cursor-pointer" />
                    <label htmlFor="captcha" className="text-xs font-medium cursor-pointer">Confirmo que sou humano (Verificação de Segurança)</label>
                  </div>

                  <button type="submit" disabled={loading} className="w-full bg-[#002f6c] text-white py-2 rounded font-bold hover:bg-blue-800 transition mt-4 disabled:opacity-50">
                    {loading ? 'Processando...' : 'Confirmar Assinatura'}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-6">
                <div className="bg-green-100 text-green-800 p-4 rounded-lg mb-4">
                  <h3 className="font-bold text-lg mb-2">Assinatura Concluída!</h3>
                  <p className="text-sm mb-4">Seu código de acesso exclusivo foi gerado. Guarde-o com segurança, pois ele será solicitado em nossos canais.</p>
                  <p className="text-3xl font-mono font-black tracking-widest bg-white py-2 rounded border border-green-300">
                    {generatedPin}
                  </p>
                </div>
                <button onClick={() => setShowCadastro(false)} className="bg-gray-200 text-gray-800 px-6 py-2 rounded font-bold hover:bg-gray-300">
                  Fechar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* header e restante continuam iguais... */}
      <header className="bg-[#002f6c] text-white p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Menu className="sm:hidden" />
            <h1 className="text-2xl font-black italic tracking-tighter cursor-pointer" onClick={handleLogoClick}>
              PORTAL<span className="text-yellow-400">NOTÍCIAS</span>
            </h1>
          </div>
          <div className="hidden sm:flex bg-white rounded overflow-hidden">
            <input className="px-2 py-1 text-black text-sm outline-none" placeholder="Buscar..." />
            <button className="bg-yellow-400 px-2"><Search size={16} className="text-blue-900" /></button>
          </div>
        </div>
      </header>
=======
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
>>>>>>> 1e4c165d3bad87eb56901b9aba82e84cd84ded2a
    </main>
  );
}