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
- URL publicada: **https://blog.benessegestaoesportiva.com.br** (domínio próprio via `CNAME`; `baseurl` **vazio**)
  - O github.io (`drptze-teste.github.io/bnsblog`) faz **301** para o domínio próprio.

## Deploy & automação
- **Deploy:** automático via GitHub Pages no push para `main`.
- **Post semanal automático:** `.github/workflows/weekly-blog-post.yml`
  - Roda **toda segunda-feira 18h UTC (15h Brasília)** (`cron: '0 18 * * 1'`)
  - Executa `.github/scripts/gerar-post.js` (Node 20): gera o post com **Gemini + Google Trends**,
    commita e dá push (o que dispara o rebuild do Pages).
  - Requer secret do GitHub com a chave da API Gemini.
  - **Anti-repetição (regra de tema):** o script lê os títulos dos 3 últimos posts e classifica o
    **assunto macro** de cada um (nr1, massagem, spa, academia, evento, etc.). Monta uma lista de
    candidatos (tendências do Trends primeiro, depois os 12 temas-fallback rotativos) e escolhe o
    **1º candidato cujo assunto não repita** os posts recentes. Resolve o caso das 3 matérias NR-1
    seguidas: candidatos NR-1 do Trends são descartados e cai num tema diferente (ex.: Eventos/Spa).
    - **Lição (26/06):** o Trends devolveu **"nr"** (sem o "1") e passou como genérico → Gemini voltou pro NR-1.
      `assuntoDe` agora pega `nr` solto / `psicossoci` / `saúde mental` / `conformidade`. O prompt trava no tema e proíbe NR-1.
    - **Lição (26/06):** a data do front matter era **fixa "10:00"** → ficava antes da ativação do Make e o post do mesmo
      dia era ignorado. Agora a `date:` usa o **horário real (UTC)** da geração.
    - **Temas no pool:** NR-1, quick massagem, ginástica laboral, eventos/team building, academia, spa, recreação,
      ergonomia, palestras, **atividades socioesportivas**, **exercício e burnout**, bem-estar.
- Para postar manualmente: criar `.md` em `_posts/` (formato `AAAA-MM-DD-titulo.md` com front matter) e push.

## Auto-post no LinkedIn (Make.com)
- **Feed RSS** (`jekyll-feed` → `/feed.xml`) alimenta um cenário no **Make.com** (conta login Google `drptze@gmail.com`).
- Cenário **"Blog Benesse → LinkedIn (perfil + página)"**: RSS → "Create a User Text Post" (perfil **profzeluizceo**)
  → "Create a Company Text Post" (página **Benesse Gestão Esportiva**). Agenda **Daily 20:00 (Brasília)**.
- A cada matéria nova, o Make publica automaticamente no perfil e na página. Detalhes em `../BLOGS-BENESSE.md`.

## Analytics
- **Contador de acessos:** GoatCounter (script no fim do `<body>` de `_layouts/default.html`).
  - Privacidade: sem cookies, sem IP armazenado, sem aviso LGPD.
  - Painel: **https://bnsblog.goatcounter.com** (requer conta gratuita com o código **`bnsblog`**).
  - **Badge total** "👁️ X visitas no site" no rodapé de todas as páginas (`.site-views` em `default.html`).
  - **Contador por matéria:** `post.html` consome `https://bnsblog.goatcounter.com/counter/<path>.json` e mostra 👁️ ao lado da data. Requer a opção **"Allow adding visitor counts on your website"** habilitada em GoatCounter → Settings.

## Convenções / armadilhas
- **`baseurl` deve ficar VAZIO** enquanto o site estiver no domínio próprio servido na raiz. Se voltar a `/bnsblog`, o logo e os links dos posts quebram (404). _(Bug já resolvido em 26/06/2026: baseurl estava `/bnsblog`, logo e matérias davam 404 no domínio próprio.)_
- **Não apagar o `CNAME`** — é o que mantém `blog.benessegestaoesportiva.com.br` apontando para o Pages. O bot da automação dá push em `main`; o CNAME precisa continuar versionado.
- **Decap CMS:** o `<script>` do Decap deve ficar no **fim do `<body>`**, nunca no `<head>` — senão a página `/admin` fica em branco.
- Posts ficam em `_posts/`; imagens em `images/`.
- É blog Jekyll, **não** React — sem `npm run build` de SPA aqui.
