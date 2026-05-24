'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabaseClient';
import { descriptografarDado } from '@/services/crypto';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [relatos, setRelatos] = useState<any[]>([]);
  const [graficoData, setGraficoData] = useState<{tipo: string, quantidade: number}[]>([]);
  const [loading, setLoading] = useState(true);
  
  const CHAVE = "CHAVE_SECRETA_DO_CRAM";

  useEffect(() => {
    carregarDadosBase();
  }, []);

  async function carregarDadosBase() {
    setLoading(true);
    try {
      // CORREÇÃO 1: Ordenando pela coluna correta do banco (created_at)
      const { data: denuncias, error } = await supabase
        .from('denuncias')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Erro ao buscar no Supabase:", error);
        return;
      }

      if (denuncias && denuncias.length > 0) {
        const relatosDescriptografados = await Promise.all(denuncias.map(async (d) => ({
          ...d,
          // CORREÇÃO 2: Puxando a data do created_at para formatar
          data_formatada: d.created_at ? new Date(d.created_at).toLocaleDateString('pt-BR') : 'Data não registrada',
          relato_limpo: await descriptografarDado(d.relato_criptografado, CHAVE),
          email_limpo: await descriptografarDado(d.email_criptografado, CHAVE),
          celular_limpo: await descriptografarDado(d.celular_criptografado, CHAVE),
          local_limpo: await descriptografarDado(d.localizacao_real_criptografada, CHAVE),
          cep_limpo: await descriptografarDado(d.cep_criptografado, CHAVE) // Descriptografa o CEP
        })));
        
        setRelatos(relatosDescriptografados);

        // Calcula dados para o gráfico real
        const contagem = relatosDescriptografados.reduce((acc: any, curr) => {
          acc[curr.tipo_ocorrencia] = (acc[curr.tipo_ocorrencia] || 0) + 1;
          return acc;
        }, {});
        
        const dadosGrafico = Object.keys(contagem).map(key => ({
          tipo: key, quantidade: contagem[key]
        })).sort((a, b) => b.quantidade - a.quantidade);

        setGraficoData(dadosGrafico);
      } else {
        // Se não houver denúncias, zera os estados
        setRelatos([]);
        setGraficoData([]);
      }
    } catch (e) {
      console.error("Erro inesperado ao processar dados:", e);
    } finally {
      setLoading(false);
    }
  }

  // Define a altura máxima do gráfico
  const maxGrafico = graficoData.length > 0 ? Math.max(...graficoData.map(g => g.quantidade)) : 1;

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar Interativa */}
      <aside className="w-64 bg-[#1e293b] text-white p-6 hidden md:block">
        <h2 className="text-xl font-bold mb-8 text-blue-400">Painel CRAM / PM</h2>
        <nav className="space-y-4 text-sm font-medium">
          <button onClick={() => setActiveTab('dashboard')} className={`block p-2 w-full text-left rounded ${activeTab === 'dashboard' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}>Dashboard Geral</button>
          <button onClick={() => setActiveTab('historico')} className={`block p-2 w-full text-left rounded ${activeTab === 'historico' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}>Auditoria Completa</button>
          <button onClick={() => window.location.href = '/'} className="block p-2 w-full text-left text-red-400 hover:bg-gray-700 rounded mt-10">Sair do Sistema</button>
        </nav>
      </aside>

      {/* Conteúdo Principal */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            {activeTab === 'dashboard' ? 'Visão Geral Operacional' : 'Auditoria de Dados Sensíveis'}
          </h1>
          <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full border border-green-200">
            Conexão Criptografada Ativa
          </span>
        </div>

        {loading ? (
          <div className="text-center text-gray-500 mt-20">Descriptografando dados do servidor...</div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <>
                {/* Gráfico Real Gerado do Banco */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
                  <h3 className="text-lg font-bold text-gray-700 mb-2">Estatísticas Reais</h3>
                  <p className="text-sm text-gray-500 mb-6">Total de <strong>{relatos.length}</strong> casos registrados no sistema.</p>
                  
                  {graficoData.length > 0 ? (
                    <div className="flex items-end h-48 gap-4 mb-2 overflow-x-auto pb-4">
                      {graficoData.map((item, index) => {
                        const alturaReal = Math.max((item.quantidade / maxGrafico) * 100, 10);
                        const cores = ['bg-blue-600', 'bg-purple-600', 'bg-yellow-500', 'bg-red-500'];
                        const cor = cores[index % cores.length];

                        return (
                          <div key={item.tipo} className="flex-1 min-w-[80px] rounded-t relative group cursor-pointer transition hover:opacity-80" style={{ height: `${alturaReal}%` }}>
                            <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold text-gray-700">{item.quantidade}</span>
                            <div className={`w-full ${cor} h-full rounded-t opacity-80`}></div>
                            <div className="absolute -bottom-6 w-full text-center text-xs font-semibold text-gray-500 truncate" title={item.tipo}>{item.tipo}</div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">Nenhum dado suficiente para gerar o gráfico.</p>
                  )}
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-700 mb-4">Relatos Recentes</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                      <thead className="bg-gray-50 text-gray-500 uppercase">
                        <tr>
                          <th className="px-4 py-3">Data de Envio</th>
                          <th className="px-4 py-3">Vítima</th>
                          <th className="px-4 py-3">Cidade</th>
                          <th className="px-4 py-3">CEP (Descriptografado)</th>
                          <th className="px-4 py-3">Violência</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {relatos.length > 0 ? (
                          relatos.slice(0, 10).map((r) => (
                            <tr key={r.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 font-medium">{r.data_formatada}</td>
                              <td className="px-4 py-3">{r.nome_completo}</td>
                              <td className="px-4 py-3">{r.cidade}</td>
                              <td className="px-4 py-3 font-mono text-blue-600">{r.cep_limpo}</td>
                              <td className="px-4 py-3">{r.tipo_ocorrencia}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-gray-400">Nenhum relato encontrado no banco de dados.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* TELA DE AUDITORIA COM DADOS DESCRIPTOGRAFADOS */}
            {activeTab === 'historico' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-red-700 mb-4">Informações Descriptografadas (Restrito)</h3>
                
                {relatos.length === 0 ? (
                  <p className="text-gray-500">Nenhum registro para auditar.</p>
                ) : (
                  <div className="space-y-6">
                    {relatos.map((r) => (
                      <div key={r.id} className="p-4 border border-red-100 bg-red-50 rounded-lg shadow-sm">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm mb-4">
                          <div><span className="block text-gray-500 text-xs">Vítima</span><strong>{r.nome_completo}</strong></div>
                          <div><span className="block text-gray-500 text-xs">Celular</span><strong>{r.celular_limpo}</strong></div>
                          <div><span className="block text-gray-500 text-xs">Email</span><strong>{r.email_limpo}</strong></div>
                          <div><span className="block text-gray-500 text-xs">CEP Original</span><strong>{r.cep_limpo}</strong></div>
                          <div><span className="block text-gray-500 text-xs">Data Registrada</span><strong>{r.data_formatada}</strong></div>
                        </div>
                        <div className="mb-4">
                          <span className="block text-gray-500 text-xs">Localização do Aparelho (GPS)</span>
                          <strong className="text-blue-700">{r.local_limpo}</strong>
                        </div>
                        <div>
                          <span className="block text-gray-500 text-xs mb-1">Relato do Ocorrido ({r.tipo_ocorrencia})</span>
                          <p className="text-gray-800 bg-white p-3 border border-red-200 rounded">{r.relato_limpo || "Vítima optou por não detalhar o ocorrido."}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}