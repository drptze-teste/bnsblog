# bns-blog — Contexto do Projeto

> ⚠️ Projeto **bns-blog** (blog da Benesse Gestão Esportiva). NÃO confundir com os outros
> projetos da pasta `Downloads`. Confirmar a pasta/remote antes de qualquer git/deploy.

## O que é
Blog institucional da **Benesse Gestão Esportiva** — eventos corporativos, bem-estar, NR-1,
gestão de spa e academias. Posts publicados **automaticamente toda semana** por IA.

## Stack
- **Jekyll** (site estático) — `_config.yml`, `_layouts/`, `_posts/`, `Gemfile`
- Hospedagem: **GitHub Pages**
- CMS: **Decap CMS** em `admin/` (`admin/index.html`)
- Automação: **GitHub Actions** + Gemini + Google Trends

## Identidade (confirmar antes de agir)
- Pasta: `C:\Users\User\Downloads\bns-blog`
- Remote git: `https://github.com/drptze-teste/bnsblog` · branch `main`
- URL publicada: `https://drptze-teste.github.io/bnsblog` (baseurl `/bnsblog`)

## Deploy & automação
- **Deploy:** automático via GitHub Pages no push para `main`.
- **Post semanal automático:** `.github/workflows/weekly-blog-post.yml`
  - Roda **toda segunda-feira 18h UTC (15h Brasília)** (`cron: '0 18 * * 1'`)
  - Executa `.github/scripts/gerar-post.js` (Node 20): gera o post com **Gemini + Google Trends**,
    commita e dá push (o que dispara o rebuild do Pages).
  - Requer secret do GitHub com a chave da API Gemini.
- Para postar manualmente: criar `.md` em `_posts/` (formato `AAAA-MM-DD-titulo.md` com front matter) e push.

## Convenções / armadilhas
- **Decap CMS:** o `<script>` do Decap deve ficar no **fim do `<body>`**, nunca no `<head>` — senão a página `/admin` fica em branco.
- Posts ficam em `_posts/`; imagens em `images/`.
- É blog Jekyll, **não** React — sem `npm run build` de SPA aqui.
