'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabaseClient';
import { criptografarRelato } from '@/services/crypto';
import { ShieldCheck, Lock, Eye, EyeOff, MapPin, AlertTriangle, Send } from 'lucide-react';

export default function ReportingForm() {
  const [loading, setLoading] = useState(false);
  const [tiposBanco, setTiposBanco] = useState<string[]>([]);
  const [tipo, setTipo] = useState('');
  const [relato, setRelato] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [userNome, setUserNome] = useState('Anônimo (Não rastreável)');
  const [locHabilitada, setLocHabilitada] = useState(false);
  const [locStatus, setLocStatus] = useState<'idle' | 'solicitando' | 'ok' | 'negada'>('idle');
  const [ocultarTela, setOcultarTela] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const CHAVE = 'CHAVE_SECRETA_DO_CRAM';

  useEffect(() => {
    setIsMounted(true);
    setUserNome(sessionStorage.getItem('user_nome') || 'Anônimo (Não rastreável)');
    async function carregarTipos() {
      const { data } = await supabase.from('tipos_violencia').select('nome');
      if (data && data.length > 0) {
        setTiposBanco(data.map((d: any) => d.nome));
        setTipo(data[0].nome);
      }
    }
    carregarTipos();
  }, []);

  // Solicitar localização proativamente se habilitada
  useEffect(() => {
    if (!locHabilitada) return;
    setLocStatus('solicitando');
    navigator.geolocation.getCurrentPosition(
      () => setLocStatus('ok'),
      () => setLocStatus('negada'),
    );
  }, [locHabilitada]);

  // SAÍDA DE PÂNICO — apaga tudo e vai para o Google
  const acionarPanico = () => {
    sessionStorage.clear();
    localStorage.clear();
    window.location.replace('https://www.google.com');
  };

  const handleEnviar = async () => {
    setLoading(true);
    try {
      const nomeLogado = sessionStorage.getItem('user_nome') || 'Anônimo';
      const dadosDisfarce = JSON.parse(sessionStorage.getItem('dadosDisfarce') || '{}');

      let localizacao = 'Não permitida/Indisponível';
      if (locHabilitada) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject)
          );
          localizacao = `Lat: ${position.coords.latitude}, Lng: ${position.coords.longitude}`;
        } catch { /* silencioso */ }
      }

      const [relatoCifrado, emailCifrado, celularCifrado, cepCifrado, localizacaoCifrada] =
        await Promise.all([
          criptografarRelato(relato || '', CHAVE),
          criptografarRelato(dadosDisfarce.email || 'Sem email', CHAVE),
          criptografarRelato(dadosDisfarce.celular || 'Sem celular', CHAVE),
          criptografarRelato(dadosDisfarce.cep || '00000-000', CHAVE),
          criptografarRelato(localizacao, CHAVE),
        ]);

      const { error } = await supabase.from('denuncias').insert([{
        tipo_ocorrencia: tipo,
        relato_criptografado: relatoCifrado,
        nome_completo: nomeLogado,
        email_criptografado: emailCifrado,
        celular_criptografado: celularCifrado,
        cep_criptografado: cepCifrado,
        cidade: dadosDisfarce.cidade || 'Desconhecida',
        localizacao_real_criptografada: localizacaoCifrada,
        verificacao_humana: true,
      }]);

      if (error) throw error;

      setEnviado(true);
      // Após 4 segundos de confirmação, aciona a saída de pânico automaticamente
      setTimeout(() => acionarPanico(), 4000);
    } catch (err: any) {
      console.error('Erro ao enviar:', err);
      alert(`Erro ao enviar. Tente novamente.\n${err.message || ''}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isMounted) return null;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: 'linear-gradient(160deg, #0a0f1a 0%, #0e1520 60%, #091018 100%)',
        fontFamily: "'DM Sans', system-ui, sans-serif",
        filter: ocultarTela ? 'brightness(0)' : 'brightness(1)',
        transition: 'filter 0.2s',
      }}
    >
      {/* ── BOTÃO DE PÂNICO FIXO ─────────────────────────────────── */}
      {/*
        Aparência de botão "Fechar" comum — para um observador casual,
        parece apenas o X de fechar uma aba ou janela.
        Aciona limpeza total e redireciona ao Google.
      */}
      <button
        onClick={acionarPanico}
        aria-label="Fechar"
        className="fixed top-4 right-4 z-50 w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200"
        style={{
          background: 'rgba(239,68,68,0.15)',
          border: '1px solid rgba(239,68,68,0.35)',
          color: '#f87171',
        }}
        title="Saída Rápida"
      >
        <span className="text-lg font-black leading-none select-none">×</span>
      </button>

      {/* ── HEADER ────────────────────────────────────────────────── */}
      <header className="px-6 pt-10 pb-0 max-w-lg mx-auto w-full">
        <div className="flex items-center gap-2 mb-5">
          <div
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ background: '#4ade80', boxShadow: '0 0 8px #4ade8088' }}
          />
          <span className="text-[10px] font-mono tracking-[3px] uppercase font-bold" style={{ color: '#4ade80' }}>
            Canal Seguro Ativo
          </span>
        </div>

        <h1 className="text-3xl font-black text-white leading-tight mb-1">
          Você não<br />está sozinha.
        </h1>
        <p className="text-sm leading-relaxed" style={{ color: '#5a7a96' }}>
          Este relato é <strong className="text-[#7dd3b0]">criptografado</strong> e{' '}
          <strong className="text-[#7dd3b0]">não fica salvo neste dispositivo</strong>.
          Somente profissionais autorizados terão acesso.
        </p>
      </header>

      {/* ── FORMULÁRIO ────────────────────────────────────────────── */}
      <main className="flex-1 px-6 py-8 max-w-lg mx-auto w-full space-y-5">

        {/* Tela de confirmação pós-envio */}
        {enviado ? (
          <div className="flex flex-col items-center justify-center gap-5 py-12 text-center animate-fadein">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: '#4ade8022', border: '2px solid #4ade8055' }}
            >
              <ShieldCheck size={32} style={{ color: '#4ade80' }} />
            </div>
            <div>
              <p className="text-xl font-black text-white mb-1">Relato enviado.</p>
              <p className="text-sm" style={{ color: '#5a7a96' }}>
                Suas informações foram protegidas. Esta tela será fechada automaticamente em instantes.
              </p>
            </div>
            <div className="w-48 h-1 rounded-full overflow-hidden" style={{ background: '#1e2d3d' }}>
              <div className="h-full rounded-full bg-[#4ade80] animate-[shrink_4s_linear_forwards]" />
            </div>
          </div>
        ) : (
          <>
            {/* BADGE DE IDENTIDADE */}
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ background: '#0f1923', border: '1px solid #1e2d3d' }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{ background: '#7dd3b022', border: '1px solid #7dd3b044' }}
              >
                <Lock size={14} style={{ color: '#7dd3b0' }} />
              </div>
              <div>
                <p className="text-[10px] font-mono tracking-[2px] uppercase font-bold" style={{ color: '#2a4a5e' }}>
                  Enviando como
                </p>
                <p className="text-[13px] font-bold" style={{ color: '#7dd3b0' }}>{userNome}</p>
              </div>
            </div>

            {/* TIPO DE OCORRÊNCIA */}
            <div className="space-y-2">
              <label className="block text-[11px] font-mono tracking-[2px] uppercase font-bold" style={{ color: '#2a4a5e' }}>
                Tipo de Violência
              </label>
              <div className="relative">
                <select
                  value={tipo}
                  onChange={e => setTipo(e.target.value)}
                  className="w-full appearance-none px-4 py-3 rounded-xl text-sm font-medium text-white outline-none cursor-pointer transition-all"
                  style={{
                    background: '#0f1923',
                    border: '1px solid #1e2d3d',
                    WebkitAppearance: 'none',
                  }}
                  onFocus={e => (e.target.style.borderColor = '#7dd3b0')}
                  onBlur={e => (e.target.style.borderColor = '#1e2d3d')}
                >
                  {tiposBanco.length === 0
                    ? <option>Carregando...</option>
                    : tiposBanco.map(t => <option key={t} value={t}>{t}</option>)
                  }
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                    <path d="M1 1L5 5L9 1" stroke="#3a5a6e" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
            </div>

            {/* RELATO */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-mono tracking-[2px] uppercase font-bold" style={{ color: '#2a4a5e' }}>
                  Relato <span style={{ color: '#1e3a4a' }}>(opcional)</span>
                </label>
                <span className="text-[10px] font-mono" style={{ color: '#1e3a4a' }}>
                  {relato.length} caracteres
                </span>
              </div>
              <textarea
                value={relato}
                onChange={e => setRelato(e.target.value)}
                placeholder="Descreva o ocorrido com suas próprias palavras. Não há resposta errada."
                rows={5}
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-[#2a4a5e] outline-none resize-none leading-relaxed transition-all"
                style={{ background: '#0f1923', border: '1px solid #1e2d3d' }}
                onFocus={e => (e.target.style.borderColor = '#7dd3b0')}
                onBlur={e => (e.target.style.borderColor = '#1e2d3d')}
              />
              <p className="text-[11px]" style={{ color: '#1e3a4a' }}>
                ✦ Este campo é completamente opcional. O simples envio do tipo já registra a ocorrência.
              </p>
            </div>

            {/* LOCALIZAÇÃO */}
            <div
              className="flex items-start gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all"
              style={{
                background: locHabilitada ? '#0b2010' : '#0f1923',
                border: `1px solid ${locHabilitada ? '#4ade8044' : '#1e2d3d'}`,
              }}
              onClick={() => setLocHabilitada(v => !v)}
            >
              <div
                className="w-9 h-5 rounded-full flex items-center transition-all duration-300 shrink-0 mt-0.5"
                style={{
                  background: locHabilitada ? '#4ade80' : '#1e2d3d',
                  padding: '2px',
                  justifyContent: locHabilitada ? 'flex-end' : 'flex-start',
                }}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-white shadow" />
              </div>
              <div>
                <p className="text-[13px] font-bold text-white flex items-center gap-1.5">
                  <MapPin size={12} style={{ color: locHabilitada ? '#4ade80' : '#3a5a6e' }} />
                  Incluir minha localização
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: '#2a4a5e' }}>
                  {locStatus === 'ok' && '✓ Localização obtida e será criptografada'}
                  {locStatus === 'negada' && '✗ Permissão negada pelo dispositivo'}
                  {locStatus === 'solicitando' && 'Solicitando acesso ao GPS...'}
                  {locStatus === 'idle' && 'Ajuda as autoridades a localizar você se necessário'}
                </p>
              </div>
            </div>

            {/* OCULTAR TELA */}
            <button
              type="button"
              onClick={() => setOcultarTela(v => !v)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12px] font-mono font-bold tracking-wide transition-all"
              style={{
                background: '#0f1923',
                border: '1px solid #1e2d3d',
                color: '#3a5a6e',
              }}
            >
              {ocultarTela ? <Eye size={13} /> : <EyeOff size={13} />}
              {ocultarTela ? 'Mostrar tela' : 'Ocultar tela (alguém se aproximou?)'}
            </button>

            {/* AVISO DE PRIVACIDADE */}
            <div
              className="flex items-start gap-2.5 px-4 py-3 rounded-xl"
              style={{ background: '#0c1a14', border: '1px solid #1e3a28' }}
            >
              <ShieldCheck size={14} className="mt-0.5 shrink-0" style={{ color: '#4ade80' }} />
              <p className="text-[11px] leading-relaxed" style={{ color: '#2a6a44' }}>
                Seus dados são criptografados com AES-256 antes de sair do dispositivo.
                Nada é salvo no histórico do navegador. Somente a equipe autorizada do CRAM tem acesso.
              </p>
            </div>

            {/* BOTÃO ENVIAR */}
            <button
              type="button"
              onClick={handleEnviar}
              disabled={loading || !tipo}
              className="w-full flex items-center justify-center gap-2.5 py-4 rounded-xl font-black text-[15px] tracking-wide transition-all duration-200 disabled:opacity-40"
              style={{
                background: loading ? '#1e3a28' : 'linear-gradient(135deg, #16a34a 0%, #4ade80 100%)',
                color: loading ? '#4ade80' : '#0a1a0e',
                boxShadow: loading ? 'none' : '0 8px 32px #4ade8033',
              }}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#4ade80] border-t-transparent rounded-full animate-spin" />
                  Criptografando e enviando...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Enviar Relato com Segurança
                </>
              )}
            </button>
          </>
        )}
      </main>

      {/* ── RODAPÉ COM SAÍDA DE PÂNICO ────────────────────────────── */}
      {!enviado && (
        <footer className="px-6 pb-8 max-w-lg mx-auto w-full">
          <div className="h-px mb-6" style={{ background: '#1e2d3d' }} />
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={11} style={{ color: '#f87171' }} />
            <p className="text-[10px] font-mono tracking-[2px] uppercase font-bold" style={{ color: '#3a2020' }}>
              Saída de emergência
            </p>
          </div>
          <button
            type="button"
            onClick={acionarPanico}
            className="w-full py-3 rounded-xl text-[13px] font-bold tracking-wide transition-all duration-200 active:scale-95"
            style={{
              background: '#1a0a0a',
              border: '1px solid #3d1515',
              color: '#f87171',
            }}
          >
            ⚡ SAÍDA RÁPIDA — Limpar e ir para o Google
          </button>
          <p className="text-center text-[10px] mt-2" style={{ color: '#2a1515' }}>
            Apaga todos os dados desta sessão instantaneamente
          </p>
        </footer>
      )}

      <style>{`
        @keyframes fadein {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fadein { animation: fadein 0.4s ease both; }

        @keyframes shrink {
          from { width: 100%; }
          to   { width: 0%; }
        }
        .animate-\\[shrink_4s_linear_forwards\\] {
          animation: shrink 4s linear forwards;
        }

        select option {
          background: #0f1923;
          color: white;
        }
      `}</style>
    </div>
  );
}