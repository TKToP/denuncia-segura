'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Menu, X, ChevronRight, Clock, Eye, Share2, Bookmark } from 'lucide-react';
// IMPORTANTE: Importe o seu cliente do supabase aqui
import { supabase } from '@/services/supabaseClient';

const NOTICIAS = [
  {
    id: 1,
    categoria: 'POLÍTICA',
    titulo: 'Câmara aprova projeto que regulamenta uso de inteligência artificial no serviço público',
    subtitulo: 'Medida deve impactar mais de 600 mil servidores federais e entra em vigor no segundo semestre.',
    tempo: '2h atrás',
    views: '4.821',
    destaque: true,
    img: 'https://images.unsplash.com/photo-1555848962-6e79363ec58f?w=800&q=80',
  },
  {
    id: 2,
    categoria: 'ECONOMIA',
    titulo: 'Dólar recua e fecha abaixo de R$ 5,70 após dados positivos do mercado de trabalho',
    subtitulo: 'Geração de empregos em abril superou expectativas dos analistas.',
    tempo: '3h atrás',
    views: '3.102',
    destaque: false,
    img: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&q=80',
  },
  {
    id: 3,
    categoria: 'CIDADES',
    titulo: 'São Paulo lança programa de reforma de calçadas em 12 bairros da Zona Norte',
    subtitulo: 'Investimento de R$ 48 milhões será aplicado ao longo de 18 meses.',
    tempo: '5h atrás',
    views: '1.974',
    destaque: false,
    img: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&q=80',
  },
  {
    id: 4,
    categoria: 'SAÚDE',
    titulo: 'Ministério da Saúde amplia cobertura vacinal contra dengue para crianças de 6 a 10 anos',
    subtitulo: 'Imunizante estará disponível em todas as UBSs a partir de junho.',
    tempo: '6h atrás',
    views: '8.340',
    destaque: false,
    img: 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?w=600&q=80',
  },
  {
    id: 5,
    categoria: 'ESPORTES',
    titulo: 'Seleção brasileira anuncia convocação para a Copa América com 26 atletas',
    subtitulo: 'Treinador mantém base da equipe campeã do último torneio continental.',
    tempo: '7h atrás',
    views: '12.657',
    destaque: false,
    img: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&q=80',
  },
  {
    id: 6,
    categoria: 'TECNOLOGIA',
    titulo: 'Startup brasileira cria app que monitora qualidade do ar em tempo real nas cidades',
    subtitulo: 'Ferramenta já está disponível para Android e iOS gratuitamente.',
    tempo: '9h atrás',
    views: '2.215',
    destaque: false,
    img: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&q=80',
  },
];

const MAIS_LIDAS = [
  { pos: 1, titulo: 'Inflação cai pelo terceiro mês consecutivo e fecha abril em 3,8%', categoria: 'ECONOMIA' },
  { pos: 2, titulo: 'Governo anuncia reajuste de 9% no salário mínimo para 2027', categoria: 'POLÍTICA' },
  { pos: 3, titulo: 'Chuvas intensas deixam 14 municípios do RS em alerta máximo', categoria: 'BRASIL' },
  { pos: 4, titulo: 'STF forma maioria e decide manter marco temporal das terras indígenas', categoria: 'JUSTIÇA' },
  { pos: 5, titulo: 'Universidade pública brasileira é eleita a melhor da América Latina', categoria: 'EDUCAÇÃO' },
];

const CATEGORIAS = ['Início', 'Brasil', 'Política', 'Economia', 'Cidades', 'Saúde', 'Esportes', 'Tecnologia', 'Cultura', 'Mundo'];

export default function FakeNewsPage() {
  const router = useRouter();
  const [clickCount, setClickCount] = useState(0);
  const [showCadastro, setShowCadastro] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [formData, setFormData] = useState({ nome: '', email: '', celular: '', cep: '', cidade: '' });
  const [captchaOk, setCaptchaOk] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatedPin, setGeneratedPin] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, []);

  /*
   * DICA PARA VÍTIMAS (DISCRETA):
   * No rodapé, há um texto: "Clique 5× no logotipo para acessar o portal seguro."
   * Ele tem cor quase igual ao fundo (text-[#1a1a2e] sobre bg-[#12122a])
   * — praticamente invisível para quem não sabe, legível para quem procura.
   */
  const handleLogoClick = () => {
    const next = clickCount + 1;
    setClickCount(next);
    if (next >= 5) router.push('/auth-segura');
  };

  const buscarCEP = async (cep: string) => {
    const cepLimpo = cep.replace(/\D/g, '');
    setFormData(prev => ({ ...prev, cep }));
    if (cepLimpo.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
        const data = await res.json();
        if (!data.erro) setFormData(prev => ({ ...prev, cep, cidade: data.localidade }));
      } catch { /* silencioso */ }
    }
  };

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!captchaOk) { alert('Por favor, confirme que você não é um robô.'); return; }
    setLoading(true);
    try {
      const randomPin = Math.floor(1000 + Math.random() * 9000).toString();
      const { error } = await supabase
        .from('usuarios_seguros')
        .insert([{ nome_cadastro: formData.nome.trim(), pin_permanente: randomPin }]);
      if (error) {
        if (error.code === '23505') alert('Este nome já está cadastrado. Por favor, adicione um sobrenome.');
        else throw error;
        setLoading(false);
        return;
      }
      sessionStorage.setItem('dadosDisfarce', JSON.stringify(formData));
      setGeneratedPin(randomPin);
    } catch (err) {
      console.error(err);
      alert('Erro ao realizar a assinatura. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const noticiaDestaque = NOTICIAS[0];
  const noticiasSec = NOTICIAS.slice(1, 5);
  const noticiasRodape = NOTICIAS.slice(4);

  return (
    <main className="min-h-screen bg-[#f0ede8] font-serif">

      {/* ── BARRA SUPERIOR ── */}
      <div className="bg-[#1a1a2e] text-[#9a9ab0] text-[11px] py-1.5 px-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <span>
            São Paulo, sábado, 24 de maio de 2026
            {currentTime && <span className="ml-2 text-[#c8a951]">⬤ {currentTime} — AO VIVO</span>}
          </span>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline">Temperatura: 22°C ☁</span>
            <button
              onClick={() => { setShowCadastro(true); setGeneratedPin(null); }}
              className="text-white font-bold tracking-wide hover:text-[#c8a951] transition-colors"
            >
              ASSINE GRÁTIS
            </button>
            <span className="text-[#555570]">|</span>
            <button className="hover:text-white transition-colors">Entrar</button>
          </div>
        </div>
      </div>

      {/* ── HEADER PRINCIPAL ── */}
      <header className="bg-white border-b-2 border-[#1a1a2e] shadow-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <button className="sm:hidden text-[#1a1a2e]" onClick={() => setMenuOpen(!menuOpen)}>
            <Menu size={22} />
          </button>

          {/* LOGOTIPO — clicável 5x para acesso secreto */}
          <div className="flex flex-col items-center cursor-pointer select-none" onClick={handleLogoClick}>
            <span className="text-[28px] font-black tracking-[-1px] leading-none text-[#1a1a2e] font-sans uppercase">
              Portal<span className="text-[#c8a951]">Notícias</span>
            </span>
            <span className="text-[9px] tracking-[4px] text-[#888] uppercase font-sans font-normal">
              Informação que importa
            </span>
          </div>

          {/* BUSCA */}
          <div className="hidden sm:flex items-center border border-[#ccc] rounded-full overflow-hidden bg-[#f9f9f9]">
            <input
              className="px-4 py-1.5 text-sm text-[#333] outline-none bg-transparent w-56 placeholder:text-[#aaa]"
              placeholder="Buscar notícias..."
            />
            <button className="bg-[#1a1a2e] px-3 py-2 hover:bg-[#c8a951] transition-colors">
              <Search size={15} className="text-white" />
            </button>
          </div>
        </div>

        {/* MENU DE CATEGORIAS */}
        <nav className={`bg-[#1a1a2e] ${menuOpen ? 'block' : 'hidden sm:block'}`}>
          <div className="max-w-6xl mx-auto px-4">
            <ul className="flex flex-col sm:flex-row sm:items-center gap-0 sm:gap-0 text-[12px] font-bold font-sans tracking-wide">
              {CATEGORIAS.map((cat, i) => (
                <li key={i}>
                  <button className={`block px-4 py-2.5 w-full text-left sm:text-center transition-colors
                    ${i === 0 ? 'text-[#c8a951]' : 'text-[#ccc] hover:text-white hover:bg-[#ffffff10]'}`}>
                    {cat}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </header>

      {/* ── BREAKING NEWS TICKER ── */}
      <div className="bg-[#d62828] text-white overflow-hidden py-1.5">
        <div className="max-w-6xl mx-auto px-4 flex items-center gap-3">
          <span className="font-black text-[11px] font-sans bg-white text-[#d62828] px-2 py-0.5 rounded shrink-0">
            URGENTE
          </span>
          <div className="overflow-hidden whitespace-nowrap">
            <span className="inline-block animate-[ticker_20s_linear_infinite] text-[12px] font-sans">
              Governo federal anuncia pacote de R$ 12 bi para infraestrutura &nbsp;•&nbsp;
              Bolsa de Valores fecha em alta de 1,4% após dados de emprego &nbsp;•&nbsp;
              Chuvas devem retornar ao Sul do país a partir de terça-feira &nbsp;•&nbsp;
              Nova variante do vírus da gripe detectada em três estados do Sudeste &nbsp;•&nbsp;
              Copa do Mundo 2026: Brasil estreia contra a Colômbia em junho
            </span>
          </div>
        </div>
      </div>

      {/* ── CORPO PRINCIPAL ── */}
      <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">

        {/* COLUNA ESQUERDA */}
        <div>
          {/* NOTÍCIA DESTAQUE */}
          <article className="mb-8">
            <span className="inline-block bg-[#1a1a2e] text-[#c8a951] text-[10px] font-bold font-sans tracking-widest px-2 py-0.5 mb-2 uppercase">
              {noticiaDestaque.categoria}
            </span>
            <div className="relative overflow-hidden rounded-sm mb-3 group">
              <img
                src={noticiaDestaque.img}
                alt={noticiaDestaque.titulo}
                className="w-full h-[360px] object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </div>
            <h1 className="text-3xl font-black leading-tight text-[#1a1a2e] mb-2 hover:text-[#c8a951] cursor-pointer transition-colors">
              {noticiaDestaque.titulo}
            </h1>
            <p className="text-[15px] text-[#555] leading-relaxed mb-3">{noticiaDestaque.subtitulo}</p>
            <div className="flex items-center gap-4 text-[11px] text-[#999] font-sans">
              <span className="flex items-center gap-1"><Clock size={11} /> {noticiaDestaque.tempo}</span>
              <span className="flex items-center gap-1"><Eye size={11} /> {noticiaDestaque.views} leituras</span>
              <button className="flex items-center gap-1 hover:text-[#c8a951] transition-colors"><Share2 size={11} /> Compartilhar</button>
              <button className="flex items-center gap-1 hover:text-[#c8a951] transition-colors"><Bookmark size={11} /> Salvar</button>
            </div>
          </article>

          {/* DIVISOR */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-[#ddd]" />
            <span className="text-[10px] font-black font-sans tracking-widest text-[#aaa] uppercase">Últimas Notícias</span>
            <div className="flex-1 h-px bg-[#ddd]" />
          </div>

          {/* GRADE SECUNDÁRIA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
            {noticiasSec.map(n => (
              <article key={n.id} className="group cursor-pointer">
                <div className="overflow-hidden rounded-sm mb-2">
                  <img
                    src={n.img}
                    alt={n.titulo}
                    className="w-full h-44 object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <span className="text-[9px] font-black font-sans tracking-widest text-[#c8a951] uppercase">{n.categoria}</span>
                <h2 className="text-[15px] font-bold leading-snug text-[#1a1a2e] group-hover:text-[#c8a951] transition-colors mt-0.5 mb-1">
                  {n.titulo}
                </h2>
                <p className="text-[12px] text-[#777] leading-relaxed line-clamp-2">{n.subtitulo}</p>
                <div className="flex items-center gap-3 mt-1.5 text-[10px] text-[#bbb] font-sans">
                  <span className="flex items-center gap-1"><Clock size={10} />{n.tempo}</span>
                  <span className="flex items-center gap-1"><Eye size={10} />{n.views}</span>
                </div>
              </article>
            ))}
          </div>

          {/* BANNER PUBLICITÁRIO FALSO */}
          <div className="border border-dashed border-[#ccc] bg-[#fafafa] rounded-sm h-20 flex items-center justify-center mb-8">
            <span className="text-[11px] text-[#bbb] font-sans tracking-widest uppercase">Espaço Publicitário</span>
          </div>

          {/* MAIS NOTÍCIAS ABAIXO */}
          <div className="space-y-5">
            {noticiasRodape.map(n => (
              <article key={n.id} className="flex gap-4 group cursor-pointer border-b border-[#e8e4df] pb-5">
                <img src={n.img} alt={n.titulo} className="w-28 h-20 object-cover rounded-sm shrink-0 transition-opacity group-hover:opacity-80" />
                <div>
                  <span className="text-[9px] font-black font-sans tracking-widest text-[#c8a951] uppercase">{n.categoria}</span>
                  <h3 className="text-[14px] font-bold text-[#1a1a2e] group-hover:text-[#c8a951] transition-colors leading-snug mt-0.5">
                    {n.titulo}
                  </h3>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-[#bbb] font-sans">
                    <span className="flex items-center gap-1"><Clock size={10} />{n.tempo}</span>
                    <span className="flex items-center gap-1"><Eye size={10} />{n.views}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* ── COLUNA LATERAL ── */}
        <aside className="space-y-8">
          {/* MAIS LIDAS */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-5 bg-[#c8a951]" />
              <h3 className="text-[13px] font-black font-sans tracking-widest text-[#1a1a2e] uppercase">Mais Lidas</h3>
            </div>
            <ol className="space-y-3">
              {MAIS_LIDAS.map(n => (
                <li key={n.pos} className="flex gap-3 group cursor-pointer border-b border-[#e8e4df] pb-3">
                  <span className="text-3xl font-black text-[#e8e4df] font-sans leading-none shrink-0 w-7">{n.pos}</span>
                  <div>
                    <span className="text-[9px] font-black font-sans tracking-widest text-[#c8a951] uppercase">{n.categoria}</span>
                    <p className="text-[13px] font-bold text-[#1a1a2e] group-hover:text-[#c8a951] transition-colors leading-snug mt-0.5">
                      {n.titulo}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* ASSINE */}
          <div className="bg-[#1a1a2e] text-white p-5 rounded-sm">
            <p className="text-[10px] font-sans tracking-widest uppercase text-[#c8a951] mb-1">Exclusivo</p>
            <h4 className="text-lg font-black leading-tight mb-2">Acesse todo o conteúdo sem limites</h4>
            <p className="text-[12px] text-[#aaa] leading-relaxed mb-4">
              Assinantes têm acesso antecipado a reportagens especiais, podcasts e análises semanais.
            </p>
            <button
              onClick={() => { setShowCadastro(true); setGeneratedPin(null); }}
              className="w-full bg-[#c8a951] text-[#1a1a2e] text-[12px] font-black font-sans py-2.5 rounded-sm hover:bg-[#e0c06a] transition-colors tracking-wide uppercase"
            >
              Assinar Agora — Grátis
            </button>
          </div>

          {/* CLIMA */}
          <div className="bg-white border border-[#e8e4df] p-4 rounded-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-5 bg-[#1a1a2e]" />
              <h3 className="text-[13px] font-black font-sans tracking-widest text-[#1a1a2e] uppercase">Previsão do Tempo</h3>
            </div>
            <div className="text-center py-2">
              <p className="text-4xl font-black text-[#1a1a2e]">22°C</p>
              <p className="text-[12px] text-[#888] font-sans mt-1">São Paulo — Parcialmente nublado</p>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3 text-center text-[11px] font-sans text-[#555]">
              {[['Dom', '☁', '23°'], ['Seg', '🌧', '19°'], ['Ter', '☀️', '26°']].map(([d, e, t]) => (
                <div key={d} className="bg-[#f0ede8] p-1.5 rounded-sm">
                  <p className="font-bold">{d}</p><p>{e}</p><p className="font-black text-[#1a1a2e]">{t}</p>
                </div>
              ))}
            </div>
          </div>

          {/* BANNER FALSO LATERAL */}
          <div className="border border-dashed border-[#ccc] bg-[#fafafa] rounded-sm h-52 flex items-center justify-center">
            <span className="text-[11px] text-[#bbb] font-sans tracking-widest uppercase">Anúncio</span>
          </div>
        </aside>
      </div>

      {/* ── RODAPÉ ── */}
      <footer className="bg-[#12122a] text-[#7070a0] mt-8">
        <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 sm:grid-cols-3 gap-8 text-[12px] font-sans">
          <div>
            <p className="text-white font-black text-lg mb-2 font-serif">Portal<span className="text-[#c8a951]">Notícias</span></p>
            <p className="leading-relaxed">Cobrindo o Brasil com jornalismo independente desde 2010. Informação de qualidade para todos.</p>
          </div>
          <div>
            <p className="text-white font-bold uppercase tracking-widest text-[10px] mb-3">Seções</p>
            <ul className="space-y-1.5">
              {['Brasil', 'Política', 'Economia', 'Saúde', 'Esportes', 'Tecnologia'].map(c => (
                <li key={c}>
                  <button className="hover:text-[#c8a951] transition-colors flex items-center gap-1">
                    <ChevronRight size={10} /> {c}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-white font-bold uppercase tracking-widest text-[10px] mb-3">Contato</p>
            <ul className="space-y-1.5">
              <li>redacao@portalnoticiasbr.com.br</li>
              <li>(11) 3000-0000</li>
              <li>Rua das Notícias, 42 — SP</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#1e1e40] py-4 px-4">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2 text-[10px]">
            <p>© 2026 PortalNotícias. Todos os direitos reservados.</p>

            {/*
              ── DICA INVISÍVEL PARA VÍTIMAS ──
              Cor quase igual ao fundo (#1a1a2e sobre #12122a): imperceptível para
              abusadores que olham rapidamente, legível para quem sabe que deve procurar.
              Oriente a vítima verbalmente ou via mensagem segura sobre esse texto.
            */}
            <p className="text-[#1a1a2e] hover:text-[#333] transition-colors duration-300 cursor-default select-none">
              Clique 5× no logotipo para acessar o portal seguro.
            </p>

            <div className="flex gap-4">
              <button className="hover:text-[#c8a951] transition-colors">Termos de Uso</button>
              <button className="hover:text-[#c8a951] transition-colors">Privacidade</button>
            </div>
          </div>
        </div>
      </footer>

      {/* ── MODAL DE ASSINATURA ── */}
      {showCadastro && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white max-w-md w-full rounded-sm shadow-2xl relative overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-[#1a1a2e] via-[#c8a951] to-[#1a1a2e]" />
            <div className="p-6">
              <button onClick={() => setShowCadastro(false)} className="absolute top-5 right-5 text-[#aaa] hover:text-[#333] transition-colors">
                <X size={18} />
              </button>

              {!generatedPin ? (
                <>
                  <p className="text-[10px] font-black font-sans tracking-widest text-[#c8a951] uppercase mb-1">Acesso Exclusivo</p>
                  <h2 className="text-2xl font-black text-[#1a1a2e] mb-1">Assine o Portal</h2>
                  <p className="text-[12px] text-[#888] mb-5 leading-relaxed">
                    Receba as principais notícias da região diretamente no seu e-mail. Grátis, sem compromisso.
                  </p>

                  <form onSubmit={handleCadastro} className="space-y-3 text-[13px]">
                    <input
                      required type="text" placeholder="Nome Completo"
                      className="w-full px-3 py-2.5 border border-[#ddd] rounded-sm outline-none focus:border-[#1a1a2e] transition-colors placeholder:text-[#bbb]"
                      value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })}
                    />
                    <input
                      required type="email" placeholder="E-mail"
                      className="w-full px-3 py-2.5 border border-[#ddd] rounded-sm outline-none focus:border-[#1a1a2e] transition-colors placeholder:text-[#bbb]"
                      value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                    />
                    <input
                      required type="tel" placeholder="Celular"
                      className="w-full px-3 py-2.5 border border-[#ddd] rounded-sm outline-none focus:border-[#1a1a2e] transition-colors placeholder:text-[#bbb]"
                      value={formData.celular} onChange={e => setFormData({ ...formData, celular: e.target.value })}
                    />
                    <div className="flex gap-2">
                      <input
                        required type="text" placeholder="CEP"
                        className="w-1/3 px-3 py-2.5 border border-[#ddd] rounded-sm outline-none focus:border-[#1a1a2e] transition-colors placeholder:text-[#bbb]"
                        value={formData.cep} onChange={e => buscarCEP(e.target.value)}
                      />
                      <input
                        required type="text" placeholder="Cidade (automático)"
                        className="w-2/3 px-3 py-2.5 border border-[#ddd] rounded-sm bg-[#f9f9f9] text-[#888] placeholder:text-[#bbb]"
                        readOnly value={formData.cidade}
                      />
                    </div>

                    <label className="flex items-start gap-2 bg-[#f9f9f9] border border-[#ddd] rounded-sm px-3 py-2.5 cursor-pointer">
                      <input
                        type="checkbox" id="captcha" checked={captchaOk}
                        onChange={e => setCaptchaOk(e.target.checked)} className="mt-0.5 cursor-pointer"
                      />
                      <span className="text-[11px] text-[#666]">Confirmo que não sou um robô (Verificação de Segurança)</span>
                    </label>

                    <button
                      type="submit" disabled={loading}
                      className="w-full bg-[#1a1a2e] text-white py-3 rounded-sm font-black font-sans tracking-wide uppercase text-[12px] hover:bg-[#c8a951] hover:text-[#1a1a2e] transition-colors disabled:opacity-40"
                    >
                      {loading ? 'Processando...' : 'Confirmar Assinatura'}
                    </button>
                  </form>
                </>
              ) : (
                <div className="text-center py-4">
                  <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">✓</span>
                  </div>
                  <h3 className="font-black text-xl text-[#1a1a2e] mb-1">Assinatura Concluída!</h3>
                  <p className="text-[12px] text-[#888] mb-5 leading-relaxed">
                    Seu código de acesso exclusivo foi gerado. Guarde-o com segurança — ele será solicitado em nossos canais.
                  </p>
                  <p className="text-4xl font-mono font-black tracking-[12px] text-[#1a1a2e] bg-[#f0ede8] py-4 rounded-sm border border-[#e0dbd4] mb-5">
                    {generatedPin}
                  </p>
                  <button
                    onClick={() => setShowCadastro(false)}
                    className="bg-[#f0ede8] text-[#333] px-8 py-2.5 rounded-sm font-bold hover:bg-[#e0dbd4] transition-colors text-[13px]"
                  >
                    Fechar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Ticker CSS */}
      <style>{`
        @keyframes ticker {
          0%   { transform: translateX(100vw); }
          100% { transform: translateX(-100%); }
        }
        .animate-\\[ticker_20s_linear_infinite\\] {
          animation: ticker 20s linear infinite;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </main>
  );
}