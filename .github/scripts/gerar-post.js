const googleTrends = require('google-trends-api');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
const https = require('https');

// ── Datas e semana ─────────────────────────────────────────────────────────
const hoje = new Date();
const inicioAno = new Date(hoje.getFullYear(), 0, 1);
const semana = Math.ceil(
  ((hoje - inicioAno) / 86400000 + inicioAno.getDay() + 1) / 7
);
const ano = hoje.getFullYear();
const pad = (n) => String(n).padStart(2, '0');
const dataHoje = `${ano}-${pad(hoje.getMonth() + 1)}-${pad(hoje.getDate())}`;

// ── Temas rotativos de fallback ─────────────────────────────────────────────
const temasFallback = [
  'NR-1 e saúde mental no trabalho: o que sua empresa precisa fazer em 2026',
  'Quick massagem corporativa: como reduzir o estresse da equipe em 15 minutos',
  'Eventos de bem-estar para empresas: como organizar e o que esperar',
  'Academia de condomínio: como a gestão profissional valoriza o empreendimento',
  'Ginástica laboral na prática: exercícios simples que previnem dores e lesões no trabalho',
  'Recreação infantil em condomínios: segurança, estrutura e gestão',
  'Gestão de spa corporativo: diferencial que retém talentos',
  'Palestras de qualidade de vida: como escolher os temas certos para sua empresa',
  'Ergonomia e produtividade: o impacto do bem-estar físico nos resultados',
  'Como a Benesse cuida da gestão de funcionários de academias e spas',
  'Eventos de team building com foco em saúde: tendência nas empresas em 2026',
  'Programa de bem-estar corporativo: passo a passo para implementar na sua empresa',
  'Massagem corporativa: como o quick massage alivia tensão e melhora o foco da equipe',
  'Atividades socioesportivas na empresa: integração, clima organizacional e bem-estar',
  'Exercício físico e prevenção do burnout: como o movimento protege a saúde da equipe',
  'Gincanas e atividades esportivas corporativas: engajamento e espírito de equipe',
];
const temaFallback = temasFallback[semana % temasFallback.length];

// ── Estilos de título (rotação semanal p/ fugir do padrão "N passos/dicas") ──
const estilosTitulo = [
  'uma PERGUNTA que o gestor realmente se faz (ex.: "Programa de bem-estar dá retorno ou é só custo?")',
  'uma afirmação CONTRAINTUITIVA que quebra um senso comum de gestão ou RH',
  'um CUSTO ou problema concreto da empresa (ex.: "O afastamento por dor nas costas que ninguém mede")',
  'um DADO ou achado de pesquisa como gancho',
  'uma CENA reconhecível do ambiente de trabalho',
  'a QUEBRA DE UM MITO comum sobre bem-estar corporativo, ginástica laboral ou gestão de equipe',
];
const estiloTitulo = estilosTitulo[semana % estilosTitulo.length];

// ── Anti-repetição: não repetir o assunto dos últimos posts ──────────────────
const STOP_WORDS = new Set([
  'a','o','e','de','do','da','dos','das','em','no','na','nos','nas',
  'por','para','com','como','que','se','um','uma','ao','aos','sua','seu',
  'sao','ou','vs','mas','nem','ja','nao','mais','menos','muito','bem','mal',
  'isso','esta','este','qual','quem','quando','onde','porque','pois','tudo',
  'todo','toda','depois','antes','ainda','mesmo','entre','sobre','aqui','agora',
]);

// Palavras comuns ao domínio (aparecem em quase todo título) — não indicam tema
const PALAVRAS_COMUNS = new Set([
  'benesse','gestao','esportiva','empresa','empresas','corporativo','corporativa',
  'equipe','equipes','trabalho','precisa','fazer','passos','estrategias',
]);

// Quebra texto em palavras significativas; preserva "NR-1" como token "nr1"
function tokeniza(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\bnr[\s-]?1\b/g, ' nr1 ')        // mantém o tema NR-1 como 1 token
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(p => p.length > 2 && !STOP_WORDS.has(p));
}

function palavrasSignificativas(texto) {
  return new Set(tokeniza(texto).filter(p => !PALAVRAS_COMUNS.has(p)));
}

// Classifica o assunto macro de um tema/título (regra de "não repetir o tema")
function assuntoDe(texto) {
  const t = texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const regras = [
    ['nr1',          /\bnr[\s-]?1?\b|psicossoci|saude mental|conformidade/],
    ['burnout',      /burnout|esgotamento|exausta/],
    ['massagem',     /massagem/],
    ['ginastica',    /ginastica/],
    ['socioesportiv',/socioesportiv|gincana|atividade.{0,4}esportiv/],
    ['exercicio',    /exercicio|atividade fisic/],
    ['spa',          /\bspa\b/],
    ['academia',     /academia|condominio/],
    ['recreacao',    /recreacao|infantil/],
    ['ergonomia',    /ergonomia|postura/],
    ['evento',       /evento|team building/],
    ['palestra',     /palestra/],
    ['bemestar',     /bem-estar|qualidade de vida/],
  ];
  for (const [nome, re] of regras) if (re.test(t)) return nome;
  return null; // assunto genérico
}

// Lê os títulos dos últimos N posts publicados (mais recentes primeiro)
function lerPostsRecentes(n = 3) {
  try {
    const dir = path.join(process.cwd(), '_posts');
    return fs.readdirSync(dir)
      .filter(f => f.endsWith('.md'))
      .sort().reverse().slice(0, n)
      .map(f => {
        const txt = fs.readFileSync(path.join(dir, f), 'utf8');
        const m = txt.match(/^title:\s*(.+)$/im);
        return (m ? m[1].trim() : f).replace(/^["']|["']$/g, '');
      });
  } catch (e) {
    console.log(`Não foi possível ler posts recentes: ${e.message}`);
    return [];
  }
}

// Um candidato repete se: (1) mesmo assunto macro de um post recente, OU
// (2) compartilha 2+ palavras-chave (ou metade) do título com algum recente
function ehRepetitivo(candidato, recentes) {
  const aCand = assuntoDe(candidato);
  if (aCand && recentes.map(assuntoDe).includes(aCand)) return true;
  const cand = palavrasSignificativas(candidato);
  if (cand.size === 0) return false;
  for (const titulo of recentes) {
    const post = palavrasSignificativas(titulo);
    let comuns = 0;
    for (const p of cand) if (post.has(p)) comuns++;
    if (comuns >= 2 || comuns / cand.size >= 0.5) return true;
  }
  return false;
}

// ── Galeria de fotos (Unsplash) com TAG de assunto — a capa casa com o tema ──
const QFOTO = 'w=1600&q=80&auto=format&fit=crop';
const galeria = [
  { tag: 'evento',    url: `https://images.unsplash.com/photo-1552664730-d307ca884978?${QFOTO}`, alt: 'Equipe corporativa em evento de bem-estar' },
  { tag: 'ginastica', url: `https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?${QFOTO}`, alt: 'Atividade física em ambiente empresarial' },
  { tag: 'bemestar',  url: `https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?${QFOTO}`, alt: 'Momento de relaxamento e qualidade de vida' },
  { tag: 'palestra',  url: `https://images.unsplash.com/photo-1521737711867-e3b97375f902?${QFOTO}`, alt: 'Reunião de equipe em empresa moderna' },
  { tag: 'nr1',       url: `https://images.unsplash.com/photo-1506126613408-eca07ce68773?${QFOTO}`, alt: 'Equilíbrio e saúde mental no trabalho' },
  { tag: 'academia',  url: `https://images.unsplash.com/photo-1540497077202-7c8a3999166f?${QFOTO}`, alt: 'Espaço de atividade física em condomínio' },
  { tag: 'spa',       url: `https://images.unsplash.com/photo-1558618666-fcd25c85cd64?${QFOTO}`, alt: 'Spa e relaxamento profissional' },
  { tag: 'ergonomia', url: `https://images.unsplash.com/photo-1600880292203-757bb62b4baf?${QFOTO}`, alt: 'Ambiente de trabalho saudável e produtivo' },
];
// Assuntos sem foto própria usam uma foto próxima
const ALIAS_FOTO = { massagem: 'spa', burnout: 'bemestar', exercicio: 'ginastica', socioesportiv: 'evento', recreacao: 'evento' };

// ── Palavras-chave para Google Trends ──────────────────────────────────────
const palavrasChave = [
  'bem-estar corporativo',
  'qualidade de vida empresa',
  'ginástica laboral',
  'massagem corporativa',
  'burnout',
  'exercício físico no trabalho',
  'academia condomínio',
  'eventos corporativos',
];

async function buscarTendencias() {
  const tendencias = [];
  for (const palavra of palavrasChave) {
    try {
      const resultado = await googleTrends.relatedQueries({
        keyword: palavra,
        geo: 'BR',
        hl: 'pt-BR',
      });
      const dados = JSON.parse(resultado);
      const rising = dados?.default?.rankedList?.[0]?.rankedKeyword;
      if (rising && rising.length > 0) {
        rising.slice(0, 2).forEach(({ query, value }) => {
          tendencias.push({ query, value: value || 0, origem: palavra });
        });
      }
    } catch (e) {
      console.log(`Trends indisponível para "${palavra}": ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 800));
  }
  return tendencias;
}

// ── PubMed (NCBI E-utilities, API pública) — embasa o post em pesquisa real ──
const EUTILS = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
// Busca biomédica (em inglês) a partir do tema corporativo/ocupacional
function queryPubMed(tema) {
  const t = tema.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (/\bnr[\s-]?1?\b|psicossoci|saude mental|conformidade/.test(t)) return 'workplace mental health psychosocial intervention';
  if (/burnout|esgotamento|exausta/.test(t)) return 'burnout workers intervention prevention';
  if (/massagem/.test(t)) return 'workplace massage stress employees';
  if (/ginastica|laboral/.test(t)) return 'workplace exercise musculoskeletal pain workers';
  if (/ergonomia|postura/.test(t)) return 'office ergonomics musculoskeletal workers';
  if (/socioesportiv|gincana|team building/.test(t)) return 'team building physical activity workplace';
  if (/exercicio|atividade fisic/.test(t)) return 'physical activity workplace employee health';
  if (/\bspa\b|relax/.test(t)) return 'workplace wellness program stress';
  if (/academia|condominio/.test(t)) return 'physical activity sedentary adults';
  if (/recreacao|infantil/.test(t)) return 'physical activity children wellbeing';
  if (/palestra|evento/.test(t)) return 'health promotion workplace program';
  if (/bem-estar|qualidade de vida|produtividade/.test(t)) return 'workplace wellbeing physical activity productivity';
  return 'workplace health physical activity employees';
}

function httpsGet(url, json) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'benesse-blog/1.0' } }, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try { resolve(json ? JSON.parse(data) : data); }
        catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function buscarEstudoPubMed(tema) {
  try {
    const termo = queryPubMed(tema);
    const q = encodeURIComponent(termo);
    const es = await httpsGet(`${EUTILS}/esearch.fcgi?db=pubmed&term=${q}&retmax=3&retmode=json&sort=relevance&datetype=pdat&reldate=4000&tool=benesse-blog`, true);
    const ids = es?.esearchresult?.idlist || [];
    if (!ids.length) return null;
    await new Promise((r) => setTimeout(r, 400));
    const sum = await httpsGet(`${EUTILS}/esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=json&tool=benesse-blog`, true);
    const pmid = ids[0];
    const rec = sum?.result?.[pmid];
    if (!rec) return null;
    const doiObj = (rec.articleids || []).find((a) => a.idtype === 'doi');
    await new Promise((r) => setTimeout(r, 400));
    let abstract = '';
    try {
      const txt = await httpsGet(`${EUTILS}/efetch.fcgi?db=pubmed&id=${pmid}&rettype=abstract&retmode=text&tool=benesse-blog`, false);
      abstract = txt.replace(/\s+/g, ' ').trim().slice(0, 1400);
    } catch (e) { /* abstract é opcional */ }
    return {
      pmid,
      titulo: (rec.title || '').replace(/\.$/, ''),
      journal: rec.fulljournalname || rec.source || 'PubMed',
      ano: (rec.pubdate || '').slice(0, 4),
      doi: doiObj ? doiObj.value : '',
      abstract,
    };
  } catch (e) {
    console.log(`PubMed indisponível: ${e.message}`);
    return null;
  }
}

async function main() {
  // ── Tendências ─────────────────────────────────────────────────────────────
  let contextoTrends = '';
  let trendQueries = [];

  try {
    console.log('Buscando tendências no Google Trends Brasil...');
    const tendencias = await buscarTendencias();

    if (tendencias.length > 0) {
      tendencias.sort((a, b) => b.value - a.value);
      const top5 = tendencias.slice(0, 5);
      trendQueries = top5.map(t => t.query);
      contextoTrends = `\n\nTendências atuais no Google Brasil (use como inspiração):\n` +
        top5.map((t, i) => `${i + 1}. "${t.query}" (relacionado a: ${t.origem})`).join('\n');
      console.log('Top tendências:');
      top5.forEach(t => console.log(`  - ${t.query} (valor: ${t.value})`));
    } else {
      console.log('Sem tendências — usando tema rotativo.');
    }
  } catch (e) {
    console.log(`Erro trends: ${e.message}. Usando tema rotativo.`);
  }

  // ── Escolher tema evitando repetir o assunto dos últimos posts ───────────────
  const recentes = lerPostsRecentes(3);
  console.log(`Posts recentes: ${recentes.join(' | ') || '(nenhum)'}`);

  // Candidatos em ordem de preferência: tendências primeiro, depois fallback rotativo
  const candidatos = [...trendQueries];
  for (let i = 0; i < temasFallback.length; i++) {
    candidatos.push(temasFallback[(semana + i) % temasFallback.length]);
  }

  let temaDestaque = candidatos.find(c => !ehRepetitivo(c, recentes));
  if (!temaDestaque) {
    temaDestaque = candidatos[0] || temaFallback;
    console.log('Todos os candidatos repetem posts recentes — usando o primeiro mesmo assim.');
  }

  console.log(`\nSemana: ${semana} | Assunto recente: ${recentes.map(assuntoDe).join(',') || '—'}`);
  console.log(`Tema escolhido: ${temaDestaque} (assunto: ${assuntoDe(temaDestaque) || 'genérico'})`);

  // ── Fotos: a CAPA casa com o assunto do post; inlines variados ───────────────
  const assuntoFoto = assuntoDe(temaDestaque);
  const alvoFoto = ALIAS_FOTO[assuntoFoto] || assuntoFoto;
  const combinam = galeria.filter((g) => g.tag === alvoFoto);
  const capa = combinam.length ? combinam[semana % combinam.length] : galeria[semana % galeria.length];
  const resto = galeria.filter((g) => g.url !== capa.url);
  const inline1 = resto[semana % resto.length];
  const inline2 = resto[(semana + 3) % resto.length];
  console.log(`Fotos: capa(${capa.tag}) + ${inline1.tag} + ${inline2.tag}`);

  // ── Embasar o post numa pesquisa real (PubMed / NCBI) ────────────────────────
  const estudo = await buscarEstudoPubMed(temaDestaque);
  let contextoEstudo = '';
  if (estudo) {
    console.log(`Estudo PubMed: ${estudo.titulo} | ${estudo.journal} ${estudo.ano} | DOI ${estudo.doi || '(sem)'}`);
    contextoEstudo = `\n\nACHADO DE PESQUISA (use como gancho de credibilidade — explique em linguagem simples, sem jargão, e NÃO invente números; use só o que estiver abaixo):\nEstudo: "${estudo.titulo}" (${estudo.journal}, ${estudo.ano}).\nResumo: ${estudo.abstract || '(sem resumo disponível — use o título como referência geral)'}\n`;
  } else {
    console.log('Sem estudo PubMed — gerando post sem âncora de pesquisa.');
  }

  // ── Gemini ──────────────────────────────────────────────────────────────────
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: 'Você é o editor de conteúdo do Blog da Benesse Gestão Esportiva, empresa especializada em eventos corporativos de bem-estar, quick massagem, palestras sobre qualidade de vida, NR-1, gestão de spa e gestão de academias de condomínio. A Benesse também atua com recreação infantil e é a contratante oficial dos funcionários que gerencia. Escreva sempre em português brasileiro, com tom profissional mas acessível, como se estivesse explicando para um gestor de RH ou síndico de condomínio. Siga exatamente o formato pedido pelo usuário.',
  });

  const recentesTxt = recentes.length ? recentes.map(t => `- ${t}`).join('\n') : '- (nenhuma)';

  const userPrompt = `Gere um post de blog para a semana ${semana} do ano ${ano}.

Escreva ESPECIFICAMENTE e SOMENTE sobre este tema: **${temaDestaque}**

⚠️ REGRA OBRIGATÓRIA DE NÃO-REPETIÇÃO: é PROIBIDO escrever sobre NR-1, saúde mental no trabalho, riscos psicossociais, conformidade ou produtividade — A MENOS que o tema acima seja exatamente sobre isso. As últimas matérias já cobriram esse assunto à exaustão. Se o tema acima for curto/genérico, desenvolva-o dentro de OUTRO serviço da Benesse (eventos corporativos, quick massagem, gestão de spa, academia de condomínio, ginástica laboral, recreação infantil) — nunca volte para NR-1.

Matérias recentes já publicadas (NÃO repita o assunto delas):
${recentesTxt}

${contextoEstudo}
Responda EXATAMENTE neste formato, sem nada antes nem depois:

TITULO: <título ORIGINAL que usa ESTE estilo nesta semana: ${estiloTitulo}>
RESUMO: Uma frase que desperta curiosidade e resume o benefício principal (sem aspas)
CORPO:
[Abertura de 2-4 linhas que fisga o leitor. Se houver um achado de pesquisa acima, ABRA com esse dado — explicado de forma simples e conectado à realidade de empresas, condomínios ou RH. Senão, abra com uma cena do dia a dia corporativo ou uma pergunta que o gestor reconheça.]

[Desenvolva em 4 a 6 seções com SUBTÍTULOS ORIGINAIS e específicos deste tema (use ##). Cada subtítulo deve dizer algo concreto do assunto — JAMAIS use rótulos genéricos e repetidos como "A Realidade", "Por Que Funciona", "Na Prática", "Erros Comuns", "Conclusão". Varie a construção: uma seção pode trazer o problema com números, outra o porquê, outra o que fazer na prática, outra o erro mais comum. Use listas (- / ✅ / ❌) só quando ajudarem de verdade, nunca como fôrma.]

[Feche com um parágrafo que amarra o benefício + convite caloroso e sem pressão para conhecer a Benesse Gestão Esportiva e solicitar uma proposta ou conversa.]

REGRAS DO TÍTULO (críticas):
- PROIBIDO o formato listicle como fórmula: nada de "N passos", "N dicas", "N técnicas", "N estratégias", "N benefícios", "N segredos", "N maneiras", "N formas", "N erros", "N motivos".
- Use número no título SOMENTE se ele for a própria notícia e vier de um dado real.
- Máx. ~12 palavras, específico, original. Nunca genérico nem igual aos títulos recentes.

Links obrigatórios — insira naturalmente no texto em pelo menos 3 pontos diferentes:
- Site: [Benesse Gestão Esportiva](https://www.benessegestaoesportiva.com.br) — ao mencionar a empresa pela primeira vez e na conclusão
- Instagram: [@benessegestaoesportiva](https://instagram.com/benessegestaoesportiva) — em 1 dica ou callout no meio do texto
- Exemplo de callout: > 💡 Acompanhe dicas de bem-estar corporativo no nosso Instagram: [@benessegestaoesportiva](https://instagram.com/benessegestaoesportiva)

Regras obrigatórias:
- Não use front matter YAML
- Não escreva "hashtags" nem "tags"
- Não inclua imagens (serão inseridas depois)
- Não invente dados nem estatísticas — se citar um número de pesquisa, use SOMENTE o do estudo acima
- NUNCA copie termos de busca do Google Trends ao pé da letra — use-os só como inspiração, escrevendo em português natural
- Use Markdown: ## para títulos, **negrito**, *itálico*, listas com - ou números
- Tom: editorial e profissional, mas acessível — como um bom artigo para gestores de RH, síndicos e diretores, não um manual de "passos"
- Sempre chame a empresa de "Benesse Gestão Esportiva" (nunca abreviar para "BNS" no texto do artigo)`;

  async function gerarComRetry(tentativa = 1) {
    try {
      console.log(`\nChamando Gemini... (tentativa ${tentativa})`);
      const result = await model.generateContent(userPrompt);
      return result.response.text();
    } catch (err) {
      const isQuota = err.message && err.message.includes('quota');
      const isRate  = err.message && (err.message.includes('429') || err.message.includes('RESOURCE_EXHAUSTED'));
      if ((isQuota || isRate) && tentativa < 4) {
        const espera = tentativa * 30000;
        console.log(`Limite de quota. Aguardando ${espera/1000}s...`);
        await new Promise(r => setTimeout(r, espera));
        return gerarComRetry(tentativa + 1);
      }
      throw err;
    }
  }

  const bruto = await gerarComRetry();

  // ── Montar post final ───────────────────────────────────────────────────────
  const limpaAspas = (s) => s.replace(/^["']|["']$/g, '').replace(/"/g, '').trim();

  const mTitulo = bruto.match(/TITULO:\s*(.+)/i);
  const mResumo = bruto.match(/RESUMO:\s*(.+)/i);
  const mCorpo  = bruto.match(/CORPO:\s*([\s\S]*)$/i);

  const titulo = mTitulo ? limpaAspas(mTitulo[1]) : temaDestaque;
  const resumo = mResumo ? limpaAspas(mResumo[1]) : `Novidades sobre ${temaDestaque} da Benesse Gestão Esportiva.`;

  let corpo = mCorpo ? mCorpo[1] : bruto;
  corpo = corpo
    .replace(/^---[\s\S]*?---/, '')
    .replace(/^\s*TITULO:.*$/gim, '')
    .replace(/^\s*RESUMO:.*$/gim, '')
    .replace(/^\s*CORPO:\s*$/gim, '')
    .replace(/^\s*hashtags?:.*$/gim, '')
    .trim();

  // Inserir fotos
  corpo = corpo.replace(/\n#{2,3} /, `\n\n![${inline1.alt}](${inline1.url})\n\n## `);
  // 2ª foto antes do ÚLTIMO subtítulo (estrutura agora é livre, sem "Conclusão" fixo)
  const headings2 = [...corpo.matchAll(/\n#{2,3} /g)];
  if (headings2.length >= 3) {
    const pos = headings2[headings2.length - 1].index;
    corpo = corpo.slice(0, pos) + `\n\n![${inline2.alt}](${inline2.url})` + corpo.slice(pos);
  }

  // Callout SEO interno no 2º subtítulo
  let nTitulos = 0;
  corpo = corpo.replace(/\n#{2,3} /g, (m) => {
    nTitulos++;
    if (nTitulos === 2) {
      return `\n\n> 💡 **Quer implementar isso na sua empresa?** Conheça os serviços da [Benesse Gestão Esportiva](https://www.benessegestaoesportiva.com.br) e solicite uma proposta.\n${m}`;
    }
    return m;
  });

  // Fonte científica (quando houver estudo do PubMed) — credibilidade + citação
  if (estudo) {
    const link = estudo.doi
      ? `[${estudo.titulo}](https://doi.org/${estudo.doi})`
      : `[${estudo.titulo}](https://pubmed.ncbi.nlm.nih.gov/${estudo.pmid}/)`;
    corpo += `\n\n---\n\n*Fonte científica: ${link}. ${estudo.journal}, ${estudo.ano}. Via PubMed.*\n`;
  }

  const frontMatter = [
    '---',
    'layout: post',
    `title: "${titulo}"`,
    `date: ${dataHoje} ${pad(hoje.getUTCHours())}:${pad(hoje.getUTCMinutes())}:${pad(hoje.getUTCSeconds())} +0000`,
    `excerpt: "${resumo}"`,
    'author: "Equipe Benesse Gestão Esportiva"',
    `cover: "${capa.url}"`,
    '---',
    '',
  ].join('\n');

  const conteudo = `${frontMatter}\n${corpo}\n`;

  const nomeArquivo = `_posts/${dataHoje}-post-semana-${String(semana).padStart(2, '0')}.md`;
  fs.writeFileSync(path.join(process.cwd(), nomeArquivo), conteudo, 'utf8');

  console.log(`\nPost salvo: ${nomeArquivo}`);
  console.log('--- Prévia ---');
  console.log(conteudo.substring(0, 400));

  const temaSanitizado = temaDestaque
    .replace(/[^\w\sáéíóúãõâêîôûàèìòùçÁÉÍÓÚÃÕÂÊÎÔÛÀÈÌÒÙÇ-]/g, '')
    .trim()
    .substring(0, 60);

  const slug = `post-semana-${String(semana).padStart(2, '0')}`;
  const postUrl = `https://blog.benessegestaoesportiva.com.br/blog/${ano}/${pad(hoje.getMonth() + 1)}/${pad(hoje.getDate())}/${slug}/`;

  const envFile = process.env.GITHUB_ENV;
  if (envFile) {
    fs.appendFileSync(envFile, `NOME_ARQUIVO=${nomeArquivo}\n`);
    fs.appendFileSync(envFile, `SEMANA=${semana}\n`);
    fs.appendFileSync(envFile, `TEMA=${temaSanitizado}\n`);
    fs.appendFileSync(envFile, `TITULO=${titulo}\n`);
    fs.appendFileSync(envFile, `POST_URL=${postUrl}\n`);
  }
}

main().catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
