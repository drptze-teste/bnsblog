const googleTrends = require('google-trends-api');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

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
  'Ginástica laboral e NR-1: tudo que o RH precisa saber',
  'Recreação infantil em condomínios: segurança, estrutura e gestão',
  'Gestão de spa corporativo: diferencial que retém talentos',
  'Palestras de qualidade de vida: como escolher os temas certos para sua empresa',
  'Ergonomia e produtividade: o impacto do bem-estar físico nos resultados',
  'Como a Benesse cuida da gestão de funcionários de academias e spas',
  'Eventos de team building com foco em saúde: tendência nas empresas em 2026',
  'Programa de bem-estar corporativo: passo a passo para implementar na sua empresa',
];
const temaFallback = temasFallback[semana % temasFallback.length];

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
    ['nr1',       /\bnr[\s-]?1\b|riscos psicossociais|saude mental/],
    ['massagem',  /massagem/],
    ['spa',       /\bspa\b/],
    ['academia',  /academia|condominio/],
    ['ginastica', /ginastica laboral/],
    ['recreacao', /recreacao|infantil/],
    ['ergonomia', /ergonomia|postura/],
    ['evento',    /evento|team building/],
    ['palestra',  /palestra/],
    ['bemestar',  /bem-estar|qualidade de vida/],
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

// ── Galeria de fotos (Unsplash, livres) — corporativo / esporte / bem-estar ──
const galeria = [
  { url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&q=80', alt: 'Equipe corporativa em evento de bem-estar' },
  { url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&q=80', alt: 'Atividade física em ambiente empresarial' },
  { url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200&q=80', alt: 'Momento de relaxamento e qualidade de vida' },
  { url: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1200&q=80', alt: 'Reunião de equipe em empresa moderna' },
  { url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1200&q=80', alt: 'Meditação e equilíbrio no trabalho' },
  { url: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=1200&q=80', alt: 'Academia e espaço de bem-estar em condomínio' },
  { url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80', alt: 'Spa e relaxamento profissional' },
  { url: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1200&q=80', alt: 'Ambiente de trabalho saudável e produtivo' },
];
const n = galeria.length;
const capa    = galeria[semana % n];
const inline1 = galeria[(semana + 3) % n];
const inline2 = galeria[(semana + 6) % n];

// ── Palavras-chave para Google Trends ──────────────────────────────────────
const palavrasChave = [
  'NR-1',
  'saúde mental trabalho',
  'bem-estar corporativo',
  'qualidade de vida empresa',
  'ginástica laboral',
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

  // ── Gemini ──────────────────────────────────────────────────────────────────
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: 'Você é o editor de conteúdo do Blog da Benesse Gestão Esportiva, empresa especializada em eventos corporativos de bem-estar, quick massagem, palestras sobre qualidade de vida, NR-1, gestão de spa e gestão de academias de condomínio. A Benesse também atua com recreação infantil e é a contratante oficial dos funcionários que gerencia. Escreva sempre em português brasileiro, com tom profissional mas acessível, como se estivesse explicando para um gestor de RH ou síndico de condomínio. Siga exatamente o formato pedido pelo usuário.',
  });

  const userPrompt = `Gere um post de blog para a semana ${semana} do ano ${ano}.

O tema principal vem das buscas mais quentes do Google Brasil: **${temaDestaque}**
Tema rotativo de apoio: ${temaFallback}
${contextoTrends}

Responda EXATAMENTE neste formato, sem nada antes nem depois:

TITULO: Título chamativo e direto com número ou promessa concreta (sem aspas)
RESUMO: Uma frase que desperta curiosidade e resume o benefício principal (sem aspas)
CORPO:
[introdução de 2-3 linhas conectando o tema à realidade de empresas, condomínios ou gestores de RH — use dado ou estatística se possível]

---

## A Realidade: [subtítulo sobre o problema ou contexto]
[2-3 parágrafos com números, fatos ou situações do dia a dia corporativo que o leitor reconhece]

## Por Que Funciona: [subtítulo sobre a solução]
[2-3 parágrafos explicando como a solução resolve — pode usar listas com ✅ ou ❌]

## Na Prática: [subtítulo com dicas ou passo a passo]
[2-3 parágrafos com orientações concretas e aplicáveis — use numeração ou lista]

## Erros Comuns
[3-4 erros que empresas ou condomínios cometem, no formato: ❌ **Erro X** — explicação breve + como fazer certo]

## Conclusão
[Parágrafo final resumindo o benefício + convite caloroso e sem pressão para conhecer a Benesse Gestão Esportiva e solicitar uma proposta ou conversa]

Links obrigatórios — insira naturalmente no texto em pelo menos 3 pontos diferentes:
- Site: [Benesse Gestão Esportiva](https://www.benessegestaoesportiva.com.br) — use ao mencionar a empresa pela primeira vez e na conclusão
- Instagram: [@benessegestaoesportiva](https://instagram.com/benessegestaoesportiva) — use em 1 dica ou callout no meio do texto
- Exemplo de callout: > 💡 Acompanhe dicas de bem-estar corporativo no nosso Instagram: [@benessegestaoesportiva](https://instagram.com/benessegestaoesportiva)

Regras obrigatórias:
- Não use front matter YAML
- Não escreva "hashtags" nem "tags"
- Não inclua imagens (serão inseridas depois)
- Use Markdown: ## para títulos, **negrito**, *itálico*, listas com - ou números
- Tom: profissional mas acessível, voltado para gestores de RH, síndicos e diretores de empresa
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
  if (/\n#{2,3}\s*Conclus/i.test(corpo)) {
    corpo = corpo.replace(/\n#{2,3}\s*Conclus[^\n]*/i, (m) =>
      `\n\n![${inline2.alt}](${inline2.url})${m}`);
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

  const frontMatter = [
    '---',
    'layout: post',
    `title: "${titulo}"`,
    `date: ${dataHoje} 10:00:00 -0300`,
    `excerpt: "${resumo}"`,
    'author: "Equipe Benesse"',
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
