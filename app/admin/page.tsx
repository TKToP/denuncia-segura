'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/services/supabaseClient';
import { descriptografarDado } from '@/services/crypto';
import {
  LayoutDashboard, FileSearch, LogOut, ShieldCheck,
  Users, AlertTriangle, Calendar, MapPin,
  ChevronRight, Lock, Menu, X, TrendingUp
} from 'lucide-react';

// ─── TIPOS ──────────────────────────────────────────────────────────────────
interface Relato {
  id: string;
  created_at: string;
  data_formatada: string;
  nome_completo: string;
  cidade: string;
  tipo_ocorrencia: string;
  relato_limpo: string;
  email_limpo: string;
  celular_limpo: string;
  local_limpo: string;
  cep_limpo: string;
  [key: string]: any;
}

interface GraficoItem { tipo: string; quantidade: number; }

// ─── CONSTANTES ─────────────────────────────────────────────────────────────
const CHAVE = 'CHAVE_SECRETA_DO_CRAM';

const COR_BARRA = [
  '#e11d48', // rose-600
  '#f59e0b', // amber-500
  '#06b6d4', // cyan-500
  '#8b5cf6', // violet-500
  '#10b981', // emerald-500
];

// ─── COMPONENTE DE STAT CARD ─────────────────────────────────────────────────
function StatCard({
  icon: Icon, label, value, sub, accent = '#06b6d4', delay = '0ms',
}: {
  icon: any; label: string; value: string | number; sub?: string;
  accent?: string; delay?: string;
}) {
  return (
    <div
      className="stat-card bg-[#0f1923] border border-[#1e2d3d] rounded-lg p-5 flex flex-col gap-3"
      style={{ animationDelay: delay }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-mono font-bold tracking-[2px] uppercase text-[#4a6580]">{label}</span>
        <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: accent + '22' }}>
          <Icon size={15} style={{ color: accent }} />
        </div>
      </div>
      <p className="text-4xl font-black font-mono tracking-tight text-white leading-none">{value}</p>
      {sub && <p className="text-[11px] text-[#4a6580] font-mono">{sub}</p>}
      <div className="h-px w-full mt-auto" style={{ background: `linear-gradient(90deg, ${accent}44, transparent)` }} />
    </div>
  );
}

// ─── COMPONENTE DE BADGE DE TIPO ─────────────────────────────────────────────
function TipoBadge({ tipo }: { tipo: string }) {
  const mapa: Record<string, string> = {
    'Física': '#e11d48',
    'Psicológica': '#f59e0b',
    'Sexual': '#8b5cf6',
    'Patrimonial': '#06b6d4',
    'Moral': '#10b981',
  };
  const cor = mapa[tipo] || '#4a6580';
  return (
    <span
      className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider"
      style={{ background: cor + '22', color: cor, border: `1px solid ${cor}44` }}
    >
      {tipo}
    </span>
  );
}

// ─── DASHBOARD PRINCIPAL ─────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'historico'>('dashboard');
  const [relatos, setRelatos] = useState<Relato[]>([]);
  const [graficoData, setGraficoData] = useState<GraficoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const [auditExpanded, setAuditExpanded] = useState<string | null>(null);
  const loadedAt = useRef(new Date().toLocaleString('pt-BR'));

  useEffect(() => { carregarDadosBase(); }, []);

  async function carregarDadosBase() {
    setLoading(true);
    try {
      const { data: denuncias, error } = await supabase
        .from('denuncias')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) { console.error('Erro Supabase:', error); return; }

      if (denuncias && denuncias.length > 0) {
        const descriptografados = await Promise.all(
          denuncias.map(async (d) => ({
            ...d,
            data_formatada: d.created_at
              ? new Date(d.created_at).toLocaleDateString('pt-BR')
              : 'Sem data',
            relato_limpo: await descriptografarDado(d.relato_criptografado, CHAVE),
            email_limpo: await descriptografarDado(d.email_criptografado, CHAVE),
            celular_limpo: await descriptografarDado(d.celular_criptografado, CHAVE),
            local_limpo: await descriptografarDado(d.localizacao_real_criptografada, CHAVE),
            cep_limpo: await descriptografarDado(d.cep_criptografado, CHAVE),
          }))
        );
        setRelatos(descriptografados);

        const contagem = descriptografados.reduce((acc: any, curr) => {
          acc[curr.tipo_ocorrencia] = (acc[curr.tipo_ocorrencia] || 0) + 1;
          return acc;
        }, {});
        setGraficoData(
          Object.entries(contagem)
            .map(([tipo, quantidade]) => ({ tipo, quantidade: quantidade as number }))
            .sort((a, b) => b.quantidade - a.quantidade)
        );
      } else {
        setRelatos([]);
        setGraficoData([]);
      }
    } catch (e) {
      console.error('Erro inesperado:', e);
    } finally {
      setLoading(false);
    }
  }

  const maxGrafico = graficoData.length > 0 ? Math.max(...graficoData.map(g => g.quantidade)) : 1;
  const ultimaSemana = relatos.filter(r => {
    const d = new Date(r.created_at);
    return (Date.now() - d.getTime()) < 7 * 24 * 60 * 60 * 1000;
  }).length;

  const MENU = [
    { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'historico', label: 'Auditoria Restrita', icon: FileSearch },
  ] as const;

  return (
    <div className="min-h-screen bg-[#070d14] text-white flex font-sans" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* ── OVERLAY MOBILE ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── SIDEBAR ── */}
      <aside className={`
        fixed md:static top-0 left-0 h-full z-40 w-64
        bg-[#0a1520] border-r border-[#1e2d3d] flex flex-col
        transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="p-6 border-b border-[#1e2d3d]">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-[#e11d48] animate-pulse" />
                <span className="text-[10px] font-mono tracking-[3px] text-[#e11d48] uppercase font-bold">Sistema Ativo</span>
              </div>
              <h2 className="text-lg font-black tracking-tight text-white leading-none">CRAM <span className="text-[#e11d48]">/</span> PM</h2>
              <p className="text-[10px] text-[#4a6580] font-mono mt-0.5">Painel Operacional Seguro</p>
            </div>
            <button className="md:hidden text-[#4a6580]" onClick={() => setSidebarOpen(false)}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          <p className="text-[9px] font-mono tracking-[3px] text-[#2a3d50] uppercase px-3 mb-3">Navegação</p>
          {MENU.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { setActiveTab(id); setSidebarOpen(false); }}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium
                transition-all duration-200 group
                ${activeTab === id
                  ? 'bg-[#e11d48] text-white shadow-lg shadow-[#e11d4830]'
                  : 'text-[#4a6580] hover:text-white hover:bg-[#1e2d3d]'
                }
              `}
            >
              <Icon size={15} />
              <span>{label}</span>
              {activeTab === id && <ChevronRight size={13} className="ml-auto" />}
            </button>
          ))}
        </nav>

        {/* Rodapé sidebar */}
        <div className="p-4 border-t border-[#1e2d3d] space-y-3">
          <div className="bg-[#0f1923] border border-[#1e2d3d] rounded-md p-3 flex items-start gap-2">
            <ShieldCheck size={13} className="text-[#06b6d4] mt-0.5 shrink-0" />
            <div>
              <p className="text-[10px] font-mono text-[#06b6d4] font-bold">Criptografia AES-256</p>
              <p className="text-[9px] text-[#2a3d50] font-mono mt-0.5">Dados protegidos em repouso e em trânsito.</p>
            </div>
          </div>
          <button
            onClick={() => window.location.href = '/'}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-[#e11d48] text-sm hover:bg-[#e11d4815] transition-colors"
          >
            <LogOut size={14} />
            <span>Sair do Sistema</span>
          </button>
        </div>
      </aside>

      {/* ── CONTEÚDO PRINCIPAL ── */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">

        {/* Topbar */}
        <header className="bg-[#0a1520] border-b border-[#1e2d3d] px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-[#4a6580] hover:text-white" onClick={() => setSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            <div>
              <h1 className="text-lg font-black text-white leading-none">
                {activeTab === 'dashboard' ? 'Visão Geral Operacional' : 'Auditoria de Dados Sensíveis'}
              </h1>
              <p className="text-[11px] text-[#4a6580] font-mono mt-0.5">
                Última atualização: {loadedAt.current}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 bg-[#06b6d415] border border-[#06b6d430] rounded-full px-3 py-1">
              <Lock size={10} className="text-[#06b6d4]" />
              <span className="text-[10px] font-mono font-bold text-[#06b6d4] tracking-wide">CONEXÃO SEGURA</span>
            </div>
          </div>
        </header>

        {/* Body scrollável */}
        <div className="flex-1 overflow-y-auto p-6">

          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <div className="w-10 h-10 border-2 border-[#e11d48] border-t-transparent rounded-full animate-spin" />
              <p className="text-[#4a6580] font-mono text-sm tracking-widest animate-pulse">
                DESCRIPTOGRAFANDO DADOS...
              </p>
            </div>
          ) : (
            <>
              {/* ── ABA DASHBOARD ── */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6 animate-fadein">

                  {/* STAT CARDS */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard icon={Users} label="Total de Casos" value={relatos.length} sub="registros no sistema" accent="#e11d48" delay="0ms" />
                    <StatCard icon={TrendingUp} label="Última Semana" value={ultimaSemana} sub="novos registros" accent="#f59e0b" delay="80ms" />
                    <StatCard icon={AlertTriangle} label="Tipos de Violência" value={graficoData.length} sub="categorias distintas" accent="#8b5cf6" delay="160ms" />
                    <StatCard icon={Calendar} label="Mais Recente" value={relatos[0]?.data_formatada ?? '—'} sub="último registro" accent="#06b6d4" delay="240ms" />
                  </div>

                  {/* GRÁFICO DE BARRAS */}
                  <div className="bg-[#0a1520] border border-[#1e2d3d] rounded-lg p-6">
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <p className="text-[10px] font-mono tracking-[3px] text-[#4a6580] uppercase mb-1">Estatísticas Reais</p>
                        <h3 className="text-base font-black text-white">Distribuição por Tipo de Violência</h3>
                      </div>
                      <span className="text-[10px] font-mono text-[#4a6580] bg-[#0f1923] border border-[#1e2d3d] px-2 py-1 rounded">
                        {relatos.length} casos totais
                      </span>
                    </div>

                    {graficoData.length > 0 ? (
                      <div className="flex items-end h-52 gap-3 mb-6 overflow-x-auto pb-2">
                        {graficoData.map((item, i) => {
                          const pct = Math.max((item.quantidade / maxGrafico) * 100, 6);
                          const cor = COR_BARRA[i % COR_BARRA.length];
                          const isHov = hoveredBar === i;
                          return (
                            <div
                              key={item.tipo}
                              className="flex-1 min-w-[72px] flex flex-col items-center gap-2 cursor-pointer"
                              onMouseEnter={() => setHoveredBar(i)}
                              onMouseLeave={() => setHoveredBar(null)}
                            >
                              <span className="text-xs font-mono font-black" style={{ color: cor }}>{item.quantidade}</span>
                              <div className="w-full relative" style={{ height: '160px' }}>
                                <div
                                  className="absolute bottom-0 w-full rounded-t-md transition-all duration-300"
                                  style={{
                                    height: `${pct}%`,
                                    background: isHov
                                      ? cor
                                      : `linear-gradient(to top, ${cor}cc, ${cor}66)`,
                                    boxShadow: isHov ? `0 0 16px ${cor}66` : 'none',
                                  }}
                                />
                              </div>
                              <span className="text-[10px] font-mono text-[#4a6580] text-center leading-tight truncate w-full px-1" title={item.tipo}>
                                {item.tipo}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="h-40 flex items-center justify-center border border-dashed border-[#1e2d3d] rounded-md">
                        <p className="text-[#2a3d50] font-mono text-sm">Dados insuficientes para o gráfico.</p>
                      </div>
                    )}
                  </div>

                  {/* TABELA RECENTE */}
                  <div className="bg-[#0a1520] border border-[#1e2d3d] rounded-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-[#1e2d3d] flex items-center justify-between">
                      <h3 className="text-sm font-black text-white">Relatos Recentes</h3>
                      <span className="text-[10px] font-mono text-[#4a6580]">Exibindo {Math.min(10, relatos.length)} de {relatos.length}</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-[#1e2d3d]">
                            {['Data', 'Vítima', 'Cidade', 'CEP', 'Tipo de Violência'].map(h => (
                              <th key={h} className="px-5 py-3 text-left text-[9px] font-mono font-bold tracking-[2px] uppercase text-[#2a3d50]">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {relatos.length > 0 ? relatos.slice(0, 10).map((r, i) => (
                            <tr
                              key={r.id}
                              className="border-b border-[#1e2d3d] hover:bg-[#0f1923] transition-colors group"
                              style={{ animationDelay: `${i * 40}ms` }}
                            >
                              <td className="px-5 py-3 font-mono text-[12px] text-[#4a6580]">{r.data_formatada}</td>
                              <td className="px-5 py-3 font-medium text-white text-[13px]">{r.nome_completo}</td>
                              <td className="px-5 py-3 text-[#4a6580] text-[12px] flex items-center gap-1.5">
                                <MapPin size={11} className="text-[#2a3d50]" />{r.cidade}
                              </td>
                              <td className="px-5 py-3 font-mono text-[12px] text-[#06b6d4]">{r.cep_limpo}</td>
                              <td className="px-5 py-3"><TipoBadge tipo={r.tipo_ocorrencia} /></td>
                            </tr>
                          )) : (
                            <tr>
                              <td colSpan={5} className="px-5 py-12 text-center text-[#2a3d50] font-mono text-sm">
                                Nenhum registro encontrado no banco de dados.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ── ABA AUDITORIA ── */}
              {activeTab === 'historico' && (
                <div className="space-y-4 animate-fadein">
                  <div className="flex items-center gap-3 bg-[#e11d4815] border border-[#e11d4840] rounded-lg px-4 py-3">
                    <AlertTriangle size={15} className="text-[#e11d48] shrink-0" />
                    <p className="text-[12px] text-[#e11d48] font-mono font-medium">
                      ÁREA RESTRITA — Dados pessoais descriptografados. Acesso auditado e registrado.
                    </p>
                  </div>

                  {relatos.length === 0 ? (
                    <div className="bg-[#0a1520] border border-[#1e2d3d] rounded-lg p-12 text-center">
                      <p className="text-[#2a3d50] font-mono text-sm">Nenhum registro para auditar.</p>
                    </div>
                  ) : (
                    relatos.map((r, i) => (
                      <div
                        key={r.id}
                        className="bg-[#0a1520] border border-[#1e2d3d] rounded-lg overflow-hidden hover:border-[#e11d4840] transition-colors"
                        style={{ animationDelay: `${i * 30}ms` }}
                      >
                        {/* Cabeçalho do card colapsável */}
                        <button
                          className="w-full flex items-center justify-between px-5 py-4 text-left group"
                          onClick={() => setAuditExpanded(auditExpanded === r.id ? null : r.id)}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-full bg-[#e11d4815] border border-[#e11d4840] flex items-center justify-center shrink-0">
                              <span className="text-[11px] font-mono font-black text-[#e11d48]">{String(i + 1).padStart(2, '0')}</span>
                            </div>
                            <div>
                              <p className="text-sm font-bold text-white">{r.nome_completo}</p>
                              <p className="text-[11px] font-mono text-[#4a6580]">{r.data_formatada} · {r.cidade}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <TipoBadge tipo={r.tipo_ocorrencia} />
                            <ChevronRight
                              size={15}
                              className={`text-[#2a3d50] transition-transform duration-200 ${auditExpanded === r.id ? 'rotate-90' : ''}`}
                            />
                          </div>
                        </button>

                        {/* Conteúdo expandido */}
                        {auditExpanded === r.id && (
                          <div className="border-t border-[#1e2d3d] px-5 py-4 space-y-4">
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                              {[
                                { label: 'E-mail', value: r.email_limpo, mono: true },
                                { label: 'Celular', value: r.celular_limpo, mono: true },
                                { label: 'CEP Original', value: r.cep_limpo, mono: true },
                                { label: 'Data Registrada', value: r.data_formatada, mono: true },
                                { label: 'Tipo', value: r.tipo_ocorrencia, mono: false },
                              ].map(({ label, value, mono }) => (
                                <div key={label} className="bg-[#0f1923] border border-[#1e2d3d] rounded-md p-3">
                                  <p className="text-[9px] font-mono font-bold tracking-[2px] uppercase text-[#2a3d50] mb-1">{label}</p>
                                  <p className={`text-[12px] text-[#06b6d4] break-all ${mono ? 'font-mono' : 'font-medium'}`}>{value || '—'}</p>
                                </div>
                              ))}
                            </div>

                            {r.local_limpo && (
                              <div className="bg-[#0f1923] border border-[#1e2d3d] rounded-md p-3 flex items-start gap-2">
                                <MapPin size={13} className="text-[#f59e0b] mt-0.5 shrink-0" />
                                <div>
                                  <p className="text-[9px] font-mono font-bold tracking-[2px] uppercase text-[#2a3d50] mb-0.5">Localização GPS (descriptografada)</p>
                                  <p className="text-[12px] font-mono text-[#f59e0b]">{r.local_limpo}</p>
                                </div>
                              </div>
                            )}

                            <div className="bg-[#0f1923] border border-[#e11d4830] rounded-md p-4">
                              <p className="text-[9px] font-mono font-bold tracking-[2px] uppercase text-[#e11d48] mb-2">Relato do Ocorrido</p>
                              <p className="text-[13px] text-[#a0b4c8] leading-relaxed">
                                {r.relato_limpo || 'Vítima optou por não detalhar o ocorrido.'}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <style>{`
        @keyframes fadein {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fadein { animation: fadein 0.35s ease both; }

        .stat-card {
          animation: fadein 0.4s ease both;
        }
      `}</style>
    </div>
  );
}