# Instruções para Integração do Blog no Domínio

## Para o Desenvolvedor/Hosteador

O blog da Benesse Gestão Esportiva está hospedado no **GitHub Pages** e precisa ser apontado via DNS para funcionar no subdomínio `blog.benessegestaoesportiva.com.br`.

---

## 1. Configuração de DNS (Registro.br ou onde o domínio está hospedado)

Adicione um registro **CNAME** apontando para o GitHub Pages:

```
Tipo:  CNAME
Nome:  blog
Valor: drptze-teste.github.io
```

**Tempo de propagação:** 5 a 48 horas (geralmente 30 minutos)

### Alternativa (se CNAME não funcionar):
Se o painel só permitir registros A, use os 4 IPs do GitHub Pages:

```
Tipo:  A
Nome:  blog
IPs:   185.199.108.153
       185.199.109.153
       185.199.110.153
       185.199.111.153
```

---

## 2. Após Configurar o DNS

Quando o DNS estiver propagado, o blog estará acessível em:
- **`https://blog.benessegestaoesportiva.com.br`** ✅
- **`https://blog.benessegestaoesportiva.com.br/blog/`** (listagem de posts)

---

## 3. Links para Integrar no Site Principal

### Landing Page do Blog
```html
<a href="https://blog.benessegestaoesportiva.com.br/">Ir para o Blog →</a>
```

### Botão na Navbar
```html
<nav>
  <a href="/">Home</a>
  <a href="https://blog.benessegestaoesportiva.com.br/">Blog</a>
  <a href="/sobre">Sobre</a>
</nav>
```

### Card/Destaque no Site
```html
<section>
  <h2>Fique por dentro</h2>
  <p>Leia artigos sobre eventos corporativos, NR-1, bem-estar e qualidade de vida.</p>
  <a href="https://blog.benessegestaoesportiva.com.br/" class="btn">Ver Blog →</a>
</section>
```

---

## 4. Características do Blog

✅ **Totalmente automático:**
- Novo post é gerado **toda segunda-feira às 8h** (Brasília)
- Gemini gera conteúdo sobre tendências do Google Trends
- Post é commitado e publicado automaticamente

✅ **Personalizado:**
- Logo e cores da Benesse
- Primeiro post pronto: "NR-1 e Saúde Mental no Trabalho"
- Layout profissional e responsivo

✅ **Integrado:**
- Cada post tem CTA (Call-to-Action) linkando para o site principal
- Links internos para manter visitantes no site da empresa
- Links do Instagram e site oficial em cada artigo

---

## 5. Contato para Suporte

Repositório GitHub: https://github.com/drptze-teste/bnsblog

Se tiver dúvidas sobre a integração, contacte a Benesse Gestão Esportiva.

---

**Data de criação:** 09/06/2026  
**Versão:** 1.0
