# Bioquímica Clínica — site de estudo

Site estático (HTML + CSS + JS puro, sem build). Resumo das Aulas 6, 8 e 9, 78 questões comentadas e modo simulado.

## Arquivos

- `index.html` — página
- `style.css` — visual (tema claro/escuro)
- `app.js` — navegação, questões, simulado e progresso
- `data.js` — conteúdo: resumos e questões (edite aqui para corrigir ou adicionar questões)
- `vercel.json` — configuração do Vercel

## Subir no Vercel

**Opção 1: pelo site, sem instalar nada**
1. Crie um repositório no GitHub e envie esta pasta inteira.
2. Em vercel.com → Add New → Project → importe o repositório.
3. Framework Preset: **Other**. Não precisa de build command nem output directory.
4. Clique em Deploy e mande o link para o seu amigo.

**Opção 2: pela linha de comando**
```bash
npm i -g vercel
cd estudo-bioquimica
vercel        # primeira vez: responde às perguntas (aceite os padrões)
vercel --prod # publica no link definitivo
```

## Observações

- O progresso (respostas e acertos) fica salvo no navegador de cada pessoa. Você e seu amigo têm progresso separado.
- Para testar localmente: `npx serve .` ou `python3 -m http.server` dentro da pasta, e abra http://localhost:8000 (ou a porta que aparecer).
- Adicionar questão: copie um item de `questoes` em `data.js`, troque o `id` (ex.: `a6q26`) e preencha `enunciado`, `opcoes`, `correta` e `explicacao`.
