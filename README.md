# 📋 Sistema de Avaliação de Atendimento — PGM

Sistema web para avaliação de atendimento da **Procuradoria Geral do Município de Fortaleza (PGM)**, desenvolvido com HTML, CSS e JavaScript puro, sem dependências externas.

---

## 🖥️ Funcionalidades

### 👤 Perfil Avaliador
- Formulário de avaliação com validação de nome completo
- Seleção do atendente que realizou o atendimento
- Avaliação por nota: Ótimo, Bom, Médio ou Ruim
- Campo de comentário opcional (até 300 caracteres)
- Confirmação visual após envio da avaliação

### 🛠️ Perfil Programador (acesso restrito por senha)
- Dashboard com totais de avaliações por categoria
- Gráfico de volume de avaliações por atendente
- Gráfico de distribuição geral das notas
- Detalhamento individual por atendente com média de desempenho
- Exportação dos dados em **CSV** (compatível com Excel e Power BI)
- Exportação dos dados em **JSON**

---

## 📊 Análise Mensal no Power BI

O CSV exportado contém as colunas **Mês** e **Ano** separadas, facilitando a criação de filtros e comparativos mensais no Power BI.

**Fluxo recomendado:**
1. No final de cada mês, exporte o CSV pelo painel do Programador
2. Salve com o nome do mês, ex: `avaliacoes_maio_2026.csv`
3. No Power BI, use o conector **Pasta** apontando para o diretório com todos os arquivos
4. O Power BI combina os arquivos automaticamente para análise comparativa

---

## 🗂️ Estrutura do Projeto

```
avaliacao-atendimento-pgm/
│
├── index.html           # Tela inicial — seleção de perfil
├── avaliador.html       # Tela do avaliador
├── programador.html     # Painel do programador (dashboard + exportação)
├── app.js               # Lógica completa da aplicação
├── style.css            # Estilos globais
└── logo-prefeitura-PGM.svg  # Logo da Prefeitura de Fortaleza
```

---

## 🚀 Como usar

Por ser um projeto frontend puro, não requer instalação de dependências.

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/avaliacao-atendimento-pgm.git
```

2. Abra a pasta no VSCode e inicie com o **Live Server**

3. Acesse `index.html` no navegador

---

## 🔐 Segurança

O acesso ao painel do Programador é protegido por senha. A senha **não é armazenada em texto puro** no código — é utilizado o algoritmo **SHA-256** para armazenar apenas o hash, garantindo que a senha real não fique exposta no repositório.

---

## 💾 Armazenamento de Dados

Os dados das avaliações são armazenados no **localStorage** do navegador. Para limpar os dados de teste, execute no console do navegador:

```javascript
localStorage.removeItem('avaliacoes')
```

---

## 🛠️ Tecnologias utilizadas

- HTML5
- CSS3
- JavaScript (ES6+)
- Web Crypto API (SHA-256 para hash de senha)
- LocalStorage API

---

## 👥 Autores

- **Jéssica Sandre**
- **Francisco Eduardo**

---

## 🏛️ Instituição

**Procuradoria Geral do Município de Fortaleza — PGM**  
Prefeitura de Fortaleza — Ceará, Brasil