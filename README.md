# Blog Benesse Gestão Esportiva

**Status:** ✅ Pronto para produção

Blog automático da Benesse Gestão Esportiva — hospedado em GitHub Pages com Jekyll, posts gerados automaticamente via Gemini + Google Trends toda segunda-feira.

---

## 📋 Resumo Executivo

| Item | Status | Detalhes |
|------|--------|----------|
| **Repositório** | ✅ Criado | `drptze-teste/bnsblog` |
| **Hospedagem** | ✅ Ativa | GitHub Pages (drptze-teste.github.io/bnsblog) |
| **Domínio** | ⏳ Pendente | Aguardando DNS no Registro.br |
| **Design** | ✅ Finalizado | Paleta Benesse (azul #4A90B5, laranja #FF9500, verde #2ECC71) |
| **Logo** | ✅ Inserido | Topo e rodapé |
| **Primeiro Post** | ✅ Pronto | "NR-1 e Saúde Mental no Trabalho" |
| **Automação** | ✅ Configurada | Post semanal (segundas 8h Brasília) |

---

## 🎯 O Que Foi Feito

### ✅ Estrutura Jekyll Completa
```
blog/
├── _config.yml              (configuração Jekyll)
├── _layouts/
│   ├── default.html        (moldura geral)
│   └── post.html           (layout dos artigos)
├── _posts/                 (artigos)
│   └── 2026-06-09-nr1-bem-estar-corporativo.md
├── blog/
│   └── index.html          (listagem de posts)
├── admin/
│   └── index.html          (painel simplificado)
├── .github/
│   ├── workflows/
│   │   └── weekly-blog-post.yml
│   └── scripts/
│       ├── gerar-post.js   (gerador Gemini)
│       └── package.json
└── images/
    └── logo-benesse.png
```

### ✅ Design Personalizado
- **Paleta de cores:** Azul, laranja e verde da Benesse
- **Logo:** Exibido no topo (navbar) e rodapé
- **Responsivo:** Mobile-first, funciona em todos os tamanhos
- **Typography:** Fraunces (títulos) + Hanken Grotesk (corpo)

### ✅ Primeiro Post
- **Tema:** NR-1 e Saúde Mental no Trabalho
- **Estrutura:** Introdução + 4 seções temáticas + conclusão
- **CTAs:** Links para o site e Instagram da Benesse
- **Imagens:** 3 fotos de qualidade profissional (Unsplash)

### ✅ Automação Semanal
- **Trigger:** Toda segunda-feira às 8h (Brasília)
- **Processo:**
  1. Busca tendências no Google Trends Brasil
  2. Pede ao Gemini um post sobre gestão esportiva/bem-estar
  3. Insere fotos automaticamente
  4. Commita e publica no site
  5. Avisa no WhatsApp (opcional)
- **Secrets configurados:** `GEMINI_API_KEY` (pronto)

### ✅ Painel Administrativo Simples
- `/admin/` → link para criar posts direto no GitHub
- Modelo pré-preenchido com data e front matter
- Sem necessidade de login OAuth

---

## 🚀 URLs

| URL | Status | Observação |
|-----|--------|-----------|
| `https://drptze-teste.github.io/bnsblog/` | ✅ Online | GitHub Pages (temporário) |
| `https://blog.benessegestaoesportiva.com.br/` | ⏳ Pendente | Aguardando DNS CNAME |
| `https://drptze-teste.github.io/bnsblog/blog/` | ✅ Online | Listagem de posts |
| `https://drptze-teste.github.io/bnsblog/admin/` | ✅ Online | Painel de criação |

---

## 🔧 Configuração Necessária (DNS)

**Responsável:** Desenvolvedor do site / Hosteador

Adicionar 1 registro CNAME no Registro.br (ou onde o domínio está):

```
Nome:  blog
Tipo:  CNAME
Valor: drptze-teste.github.io
```

**Tempo:** 30 minutos a 48 horas para propagar

**Documento completo:** Ver `INSTRUCOES-INTEGRACAO.md`

---

## 📝 Posts Automáticos

### Próximo Post
- **Data:** Segunda-feira, 16/06/2026 às 8h Brasília
- **Tema:** Gerado automaticamente via Google Trends
- **Temas em rotação:**
  - NR-1 e saúde mental
  - Quick massagem corporativa
  - Eventos de bem-estar
  - Academia em condomínio
  - Gestão de spa
  - Recreação infantil
  - Ginástica laboral
  - E muitos outros...

### Controle Manual
Você pode rodar o workflow manualmente em qualquer hora:
1. GitHub → Actions → "Post Automático Semanal"
2. Clique em "Run workflow"
3. Post é gerado em segundos

---

## 📧 Secrets Configurados

| Secret | Status | Valor |
|--------|--------|-------|
| `GEMINI_API_KEY` | ✅ Configurado | Chave `AIza...` (gera posts) |
| `WHATSAPP_PHONE` | ⏳ Opcional | `5511947221012` |
| `CALLMEBOT_APIKEY` | ⏳ Opcional | Chave de API |

---

## 🎨 Conteúdo & SEO

### Estrutura de Posts
Cada post segue este padrão:
1. **Introdução** — Hook + estatística
2. **A Realidade** — Contexto + problema
3. **Por Que Funciona** — Solução + benefícios
4. **Na Prática** — Passo a passo
5. **Erros Comuns** — O que evitar
6. **Conclusão** — CTA para o site

### Links Internos
- **1ª menção da empresa** → site principal
- **Callout no meio do texto** → Instagram
- **Box final** → links de referência

### Imagens
- 3 fotos por post (capa + 2 inline)
- Galeria rotativa de 8 imagens
- URLs externas (Unsplash) — sem dependência de uploads

---

## ✅ Checklist de Entrega

- [x] Repositório criado no GitHub
- [x] GitHub Pages ativado e funcionando
- [x] Jekyll configurado corretamente
- [x] Logo inserido (topo e rodapé)
- [x] Paleta de cores atualizada
- [x] Primeiro post criado manualmente
- [x] Script de geração automática implementado
- [x] Workflow configurado (segundas 8h)
- [x] Admin panel funcional
- [x] URLs corretas (baseurl e url ajustados)
- [x] Secrets do Gemini configurados
- [x] Documentação de integração completa

---

## 📚 Documentação

| Arquivo | Propósito |
|---------|-----------|
| `README.md` | Este arquivo — visão geral do projeto |
| `INSTRUCOES-INTEGRACAO.md` | Guia para o desenvolvedor integrar no domínio |
| `_config.yml` | Configuração Jekyll |
| `.github/workflows/weekly-blog-post.yml` | Workflow do GitHub Actions |
| `.github/scripts/gerar-post.js` | Script Gemini que gera posts |

---

## 🔐 Segurança & Performance

- **HTTPS:** Ativado automaticamente (GitHub Pages)
- **Certificado SSL:** Será gerado quando o domínio customizado for configurado
- **Performance:** Jekyll gera HTML estático — carregamento rápido
- **Cache:** Imagens servidas via Unsplash (CDN global)
- **Backup:** Tudo versionado no GitHub

---

## 📞 Suporte & Manutenção

### Para Adicionar um Post Manual
1. Vá para `/admin/`
2. Clique em "Escrever novo post"
3. GitHub abre um editor — preencha e commite
4. Site atualiza em 1-2 minutos

### Para Rodar Automação Manualmente
1. GitHub → Aba "Actions"
2. "Post Automático Semanal" → "Run workflow"
3. Post sai em segundos

### Para Mudar o Tema dos Posts
Edite o arquivo `.github/scripts/gerar-post.js`:
- `temasFallback` = temas padrão
- `palavrasChave` = termos para Google Trends
- `galeria` = fotos dos posts

---

## 📊 Estatísticas Iniciais

- **Repositório:** drptze-teste/bnsblog
- **Commits:** 7 commits iniciais
- **Arquivos:** 14 arquivos (sem contabilizar .git)
- **Tamanho:** ~60KB (sem imagens externas)
- **Tempo de build:** <5 segundos (Jekyll)

---

## 🎬 Próximos Passos

1. **Configurar DNS** (desenvolvedor do site)
   - Adicionar CNAME `blog → drptze-teste.github.io`
   - Aguardar propagação

2. **Integrar no Site Principal**
   - Adicionar link no menu
   - Opcional: iframe ou card de destaque
   - Ver `INSTRUCOES-INTEGRACAO.md`

3. **Teste Completo**
   - Visitar `blog.benessegestaoesportiva.com.br`
   - Clicar nos posts
   - Verificar links internos
   - Testar responsividade mobile

4. **Monitorar Primeira Automação**
   - Segunda-feira 16/06 às 8h
   - Verificar se novo post foi criado
   - Confirmar notificação no WhatsApp (se ativado)

---

## 📄 Changelog

| Data | Versão | O Que Mudou |
|------|--------|-----------|
| 09/06/2026 | 1.0 | Lançamento inicial |
| 09/06/2026 | 1.1 | Ajustes de cores e logo |
| 09/06/2026 | 1.2 | Corrigir URL e baseurl |
| 09/06/2026 | 1.3 | Adicionar documentação |

---

## 📌 Informações Técnicas

- **Gerador:** Jekyll 4.3+
- **Ruby:** Via GitHub Pages (automático)
- **Node:** Para script de geração (GitHub Actions)
- **Servidor:** GitHub Pages
- **SSL:** Automático (GitHub)
- **CDN:** Imagens via Unsplash
- **IA:** Google Gemini 2.5 Flash

---

**Criado em:** 09/06/2026  
**Status:** ✅ Pronto para produção  
**Mantém por:** Benesse Gestão Esportiva

---

*Para dúvidas ou alterações, consulte o repositório: https://github.com/drptze-teste/bnsblog*
