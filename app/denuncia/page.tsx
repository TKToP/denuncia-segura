
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabaseClient';
import { criptografarRelato } from '@/services/crypto';

export default function ReportingForm() {
  const [loading, setLoading] = useState(false);
  const [tiposBanco, setTiposBanco] = useState<string[]>([]);
  const [tipo, setTipo] = useState('');
  const [relato, setRelato] = useState('');
  const CHAVE = "CHAVE_SECRETA_DO_CRAM";

  useEffect(() => {
    // Busca os tipos de violência reais do banco de dados
    async function carregarTipos() {
      const { data } = await supabase.from('tipos_violencia').select('nome');
      if (data && data.length > 0) {
        setTiposBanco(data.map(d => d.nome));
        setTipo(data[0].nome);
      }
    }
    carregarTipos();
  }, []);

  const acionarPanico = () => {
    sessionStorage.clear();
    localStorage.clear();
    window.location.replace('https://www.google.com');
  };

  const handleEnviar = async () => {
    setLoading(true);
    try {
      // 1. Resgata o Nome do login seguro E os dados da página principal de disfarce
      const nomeLogado = sessionStorage.getItem('user_nome') || "Anônimo";
      const dadosDisfarce = JSON.parse(sessionStorage.getItem('dadosDisfarce') || '{}');
      
      // 2. Tenta capturar a localização atual real (GPS)
      let localizacao = "Não permitida/Indisponível";
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        localizacao = `Lat: ${position.coords.latitude}, Lng: ${position.coords.longitude}`;
      } catch (err) {
        console.warn("Localização não obtida", err);
      }

      // 3. Criptografa todos os dados sensíveis (AGORA INCLUINDO O CEP)
      const relatoCifrado = await criptografarRelato(relato, CHAVE);
      const emailCifrado = await criptografarRelato(dadosDisfarce.email || "Sem email", CHAVE);
      const celularCifrado = await criptografarRelato(dadosDisfarce.celular || "Sem celular", CHAVE);
      const cepCifrado = await criptografarRelato(dadosDisfarce.cep || "00000-000", CHAVE);
      const localizacaoCifrada = await criptografarRelato(localizacao, CHAVE);

      // 4. Envia para o Supabase (CORRIGIDO O NOME DA COLUNA DO CEP)
      const { error } = await supabase.from('denuncias').insert([{ 
        tipo_ocorrencia: tipo, 
        relato_criptografado: relatoCifrado,
        nome_completo: nomeLogado, 
        email_criptografado: emailCifrado,
        celular_criptografado: celularCifrado,
        cep_criptografado: cepCifrado, // <-- AQUI ESTAVA O ERRO!
        cidade: dadosDisfarce.cidade || "Desconhecida",
        localizacao_real_criptografada: localizacaoCifrada,
        verificacao_humana: true
      }]);

      if (error) throw error;

      alert("Denúncia enviada com sucesso.");
      acionarPanico(); 
    } catch (err: any) {
      console.error("Detalhes do erro:", err);
      alert(`Erro: ${err.message || JSON.stringify(err)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-red-600">Relato Seguro</h1>
      
      {/* Indicador visual de qual usuário está logado */}
      <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded text-sm text-gray-600">
        Modo de Envio: <span className="font-bold text-gray-800">{typeof window !== 'undefined' ? (sessionStorage.getItem('user_nome') || 'Anônimo (Não rastreável)') : ''}</span>
      </div>
      
      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Tipo de Ocorrência</label>
          <select 
            className="w-full p-2 border rounded-md"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
          >
            {tiposBanco.length === 0 ? <option>Carregando...</option> : null}
            {tiposBanco.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Relato (Opcional)</label>
          <textarea 
            className="w-full p-2 border rounded-md h-32" 
            placeholder="Descreva o ocorrido..."
            value={relato}
            onChange={(e) => setRelato(e.target.value)}
          />
        </div>

        <button 
          type="button"
          disabled={loading}
          className="w-full bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 transition disabled:opacity-50"
          onClick={handleEnviar}
        >
          {loading ? 'Enviando e Criptografando...' : 'Enviar Denúncia Agora'}
        </button>
      </form>

      <button onClick={acionarPanico} className="mt-8 w-full border border-gray-300 py-2 rounded hover:bg-gray-100 text-gray-500 text-xs transition">
        SAÍDA RÁPIDA (Pânico)
      </button>
    </div>
  );
}

