'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/services/supabaseClient';
import { Building2, ShieldCheck, ChevronRight, AlertCircle } from 'lucide-react';

export default function AuthSegura() {
  const router = useRouter();
  const [isAnonimo, setIsAnonimo] = useState(true);
  const [nome, setNome] = useState('');
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('Credenciais incorretas.');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const pinRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const PIN_VITIMA_DEFAULT = '2026';
  const PIN_ADMIN = '9999';

  const pinStr = pin.join('');

  // Foca o primeiro campo ao trocar de aba
  useEffect(() => {
    setPin(['', '', '', '']);
    setError(false);
    setTimeout(() => pinRefs[0].current?.focus(), 80);
  }, [isAnonimo]);

  const triggerError = (msg = 'Credenciais incorretas.') => {
    setErrorMsg(msg);
    setError(true);
    setShake(true);
    setPin(['', '', '', '']);
    setTimeout(() => pinRefs[0].current?.focus(), 50);
    setTimeout(() => setShake(false), 600);
    setTimeout(() => setError(false), 4000);
  };

  const handlePinChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newPin = [...pin];
    newPin[index] = digit;
    setPin(newPin);
    if (digit && index < 3) {
      pinRefs[index + 1].current?.focus();
    }
  };

  const handlePinKey = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      pinRefs[index - 1].current?.focus();
    }
    if (e.key === 'Enter' && pinStr.length === 4) {
      handleLogin();
    }
  };

  const handlePinPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (pasted.length === 4) {
      setPin(pasted.split(''));
      pinRefs[3].current?.focus();
    }
    e.preventDefault();
  };

  const handleLogin = async () => {
    if (pinStr.length < 4) return;
    setError(false);

    // Acesso Admin
    if (pinStr === PIN_ADMIN) {
      router.push('/admin');
      return;
    }

    if (isAnonimo) {
      if (pinStr === PIN_VITIMA_DEFAULT) {
        sessionStorage.removeItem('user_nome');
        router.push('/denuncia');
      } else {
        triggerError('Código de acesso inválido.');
      }
    } else {
      if (!nome.trim()) return;
      setLoading(true);
      try {
        const { data, error: fetchError } = await supabase
          .from('usuarios_seguros')
          .select('*')
          .eq('nome_cadastro', nome.trim())
          .eq('pin_permanente', pinStr)
          .maybeSingle();

        if (fetchError || !data) {
          triggerError('Nome ou PIN não encontrado.');
        } else {
          sessionStorage.setItem('user_nome', data.nome_cadastro);
          router.push('/denuncia');
        }
      } catch {
        triggerError('Erro de conexão. Tente novamente.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{
        background: 'linear-gradient(145deg, #070d14 0%, #0a1520 50%, #080e18 100%)',
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >
      {/* Ruído de fundo sutil */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px',
        }}
      />

      {/* ── CARD PRINCIPAL ── */}
      <div
        className={`w-full max-w-sm rounded-2xl overflow-hidden transition-all duration-200 ${shake ? 'animate-shake' : ''}`}
        style={{
          background: '#0a1520',
          border: '1px solid #1e2d3d',
          boxShadow: error
            ? '0 0 0 1px #e11d4855, 0 32px 64px #00000088'
            : '0 32px 64px #00000066',
        }}
      >
        {/* Faixa superior */}
        <div
          className="h-1 w-full"
          style={{
            background: error
              ? 'linear-gradient(90deg, #7f1d1d, #e11d48, #7f1d1d)'
              : 'linear-gradient(90deg, #1e3a5f, #2563eb, #1e3a5f)',
          }}
        />

        <div className="px-8 pt-8 pb-6">
          {/* Ícone e título */}
          <div className="flex flex-col items-center mb-7">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{
                background: '#0f1923',
                border: '1px solid #1e2d3d',
                boxShadow: '0 4px 24px #00000055',
              }}
            >
              <Building2 size={26} style={{ color: '#2563eb' }} />
            </div>
            <h1 className="text-lg font-black text-white tracking-tight leading-none mb-1">
              Intranet Corporativa
            </h1>
            <p className="text-[12px] font-mono" style={{ color: '#2a4a6a' }}>
              Área restrita a colaboradores
            </p>
          </div>

          {/* Toggle de modo */}
          <div
            className="flex p-1 rounded-xl mb-6"
            style={{ background: '#0f1923', border: '1px solid #1e2d3d' }}
          >
            {[
              { label: 'Acesso Padrão', value: true },
              { label: 'Acesso Assinado', value: false },
            ].map(({ label, value }) => (
              <button
                key={label}
                type="button"
                onClick={() => { setIsAnonimo(value); setNome(''); setError(false); }}
                className="flex-1 py-2 rounded-lg text-[12px] font-bold tracking-wide transition-all duration-200"
                style={
                  isAnonimo === value
                    ? { background: '#2563eb', color: '#fff', boxShadow: '0 2px 12px #2563eb44' }
                    : { color: '#2a4a6a' }
                }
              >
                {label}
              </button>
            ))}
          </div>

          {/* Campo Nome (só no modo assinado) */}
          <div
            className="overflow-hidden transition-all duration-300"
            style={{ maxHeight: isAnonimo ? '0px' : '80px', opacity: isAnonimo ? 0 : 1 }}
          >
            <div className="mb-4">
              <label
                className="block text-[10px] font-mono font-bold tracking-[2px] uppercase mb-1.5"
                style={{ color: '#2a4a6a' }}
              >
                Nome Cadastrado
              </label>
              <input
                type="text"
                placeholder="Ex: Maria da Silva"
                value={nome}
                onChange={e => setNome(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm font-medium text-white placeholder:text-[#1e3a5a] outline-none transition-all"
                style={{ background: '#0f1923', border: '1px solid #1e2d3d' }}
                onFocus={e => (e.target.style.borderColor = '#2563eb')}
                onBlur={e => (e.target.style.borderColor = '#1e2d3d')}
              />
            </div>
          </div>

          {/* Label ID (só no modo padrão) */}
          {isAnonimo && (
            <div className="mb-4">
              <label
                className="block text-[10px] font-mono font-bold tracking-[2px] uppercase mb-1.5"
                style={{ color: '#2a4a6a' }}
              >
                ID do Usuário
              </label>
              <div
                className="w-full px-4 py-3 rounded-xl text-sm font-mono"
                style={{
                  background: '#080e18',
                  border: '1px solid #141f2d',
                  color: '#2a4a6a',
                }}
              >
                USUARIO_LOGADO
              </div>
            </div>
          )}

          {/* PIN — 4 campos individuais */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-1.5">
              <label
                className="block text-[10px] font-mono font-bold tracking-[2px] uppercase"
                style={{ color: '#2a4a6a' }}
              >
                Código de Acesso (PIN)
              </label>
              <span className="text-[10px] font-mono" style={{ color: '#1e3050' }}>4 dígitos</span>
            </div>

            <div className="flex gap-3 justify-center" onPaste={handlePinPaste}>
              {pin.map((digit, i) => (
                <input
                  key={i}
                  ref={pinRefs[i]}
                  type="password"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handlePinChange(i, e.target.value)}
                  onKeyDown={e => handlePinKey(i, e)}
                  className="w-14 h-14 text-center text-xl font-black rounded-xl outline-none transition-all duration-200 caret-transparent"
                  style={{
                    background: digit ? '#0f2a4a' : '#0f1923',
                    border: `1.5px solid ${
                      error ? '#e11d4866' : digit ? '#2563eb88' : '#1e2d3d'
                    }`,
                    color: '#fff',
                    boxShadow: digit && !error ? '0 0 0 3px #2563eb22' : 'none',
                  }}
                />
              ))}
            </div>

            {/* Barra de progresso do PIN */}
            <div className="flex gap-1.5 mt-3 justify-center">
              {[0, 1, 2, 3].map(i => (
                <div
                  key={i}
                  className="h-0.5 flex-1 rounded-full transition-all duration-300"
                  style={{
                    background: error
                      ? '#e11d48'
                      : pin[i]
                      ? '#2563eb'
                      : '#1e2d3d',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Mensagem de erro */}
          <div
            className="overflow-hidden transition-all duration-300 mb-4"
            style={{ maxHeight: error ? '44px' : '0px', opacity: error ? 1 : 0 }}
          >
            <div
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
              style={{ background: '#1a0808', border: '1px solid #3d1515' }}
            >
              <AlertCircle size={13} style={{ color: '#f87171' }} />
              <p className="text-[12px] font-mono font-medium" style={{ color: '#f87171' }}>
                {errorMsg}
              </p>
            </div>
          </div>

          {/* Botão Entrar */}
          <button
            type="button"
            onClick={handleLogin}
            disabled={loading || pinStr.length < 4 || (!isAnonimo && !nome.trim())}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-[14px] tracking-wide transition-all duration-200 disabled:opacity-30"
            style={{
              background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
              color: 'white',
              boxShadow: pinStr.length === 4 ? '0 8px 24px #2563eb44' : 'none',
            }}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Validando...
              </>
            ) : (
              <>
                Entrar no Sistema
                <ChevronRight size={15} />
              </>
            )}
          </button>

          {/* Crachá de segurança */}
          <div className="flex items-center justify-center gap-1.5 mt-5">
            <ShieldCheck size={11} style={{ color: '#1e3a5a' }} />
            <p className="text-[10px] font-mono" style={{ color: '#1e3a5a' }}>
              Conexão criptografada · Sessão monitorada
            </p>
          </div>
        </div>
      </div>

      {/* Botão de saída (parece link de rodapé corporativo) */}
      <button
        onClick={() => window.location.href = 'https://google.com'}
        className="mt-8 text-[11px] font-mono transition-colors duration-200"
        style={{ color: '#131f2e' }}
        onMouseEnter={e => ((e.target as HTMLElement).style.color = '#2a4a6a')}
        onMouseLeave={e => ((e.target as HTMLElement).style.color = '#131f2e')}
      >
        ← Voltar para a Home
      </button>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          15%       { transform: translateX(-6px); }
          30%       { transform: translateX(6px); }
          45%       { transform: translateX(-4px); }
          60%       { transform: translateX(4px); }
          75%       { transform: translateX(-2px); }
          90%       { transform: translateX(2px); }
        }
        .animate-shake { animation: shake 0.55s cubic-bezier(.36,.07,.19,.97) both; }
      `}</style>
    </main>
  );
}