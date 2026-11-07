# 🎞️ REBOBINAR

> **Um arcade de plataforma e pós-produção cinematográfica.** O jogador não está apenas controlando um personagem: está operando uma fita de película de 35mm em alta velocidade dentro de uma sala de projeção que insiste em dar errado.

[![Deploy to GitHub Pages](https://github.com/leonardoconstantino/REBOBINAR/actions/workflows/deploy.yml/badge.svg)](https://github.com/leonardoconstantino/REBOBINAR/actions/workflows/deploy.yml)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)](https://vite.dev/)
[![React 19](https://img.shields.io/badge/React%2019-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=flat&logo=vitest&logoColor=white)](https://vitest.dev/)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)

---

### 🎮 [JOGAR AGORA EM PRODUÇÃO](https://leonardoconstantino.github.io/REBOBINAR/)
> Acesse a versão estável rodando diretamente no GitHub Pages: **https://leonardoconstantino.github.io/REBOBINAR/**

---

![REBOBINAR Hero](./assets/hero.png)

---

## 📽️ Sobre o Jogo

Em **REBOBINAR**, você assume o controle da montagem em uma corrida de precisão contra o tempo e a física. Inspirado na estética analógica do cinema clássico (filmes preto e branco, sépia, fita magnética e Technicolor), o jogo traduz o ato de montar e cortar cenas em mecânicas centrais de plataforma.

### 🌟 Principais Recursos

- **Mecânica de Rebobinar (Trail Replay):**
  - Armazene um rastro temporal de até 5 segundos.
  - Ao ativar o botão de Rebobinar, o tempo corre para trás instantaneamente até o ponto de início do clipe, permitindo refazer saltos difíceis e desviar de cortes fatais.
- **Retomada Temporal (Snapshot Rings):**
  - Fixe marcadores temporais na fita. Se for atingido por um obstáculo, você é reintegrado na tomada anterior sem perder a velocidade acumulada.
- **Pressão da Edição Final:**
  - Uma linha de corte vertical avança impiedosamente pelo rolo da projeção. Não seja engolido pela tesoura da moviola!
- **Marcas de Tomada & Claquetes:**
  - Colete claquetes de cena espalhadas pela trilha para desbloquear bitrates e rolos extras na Cinemateca.
- **3 Modos de Jogo:**
  - **História / Temporada:** Progrida por diferentes épocas do cinema (Mudo, Noir, Anos 80 e Digital).
  - **Avanço Rápido (Speedrun):** Racha de montagem com cronômetro em milissegundos e fantasmas de tomada.
  - **Sobrevivência do Rolo:** Percurso infinito gerado proceduralmente com velocidade crescente do projetor.
- **Áudio Sintetizado Web Audio API:**
  - Clique de perfuração de filme de 35mm, ruído de arrasto de fita, motor de projetor e bipes de claquete 100% sintetizados via código (sem dependência de arquivos externos pesados).
- **Interface e HUD Cinematográficos:**
  - Código de tempo SMPTE (`00:00:00:00`), contador de fotogramas (FPS), indicador de película e granulado analógico procedural.

---

## 🕹️ Guia de Controles

### Desktop (Teclado)
| Ação | Teclas |
| :--- | :--- |
| **Mover para a Esquerda** | <kbd>←</kbd> ou <kbd>A</kbd> |
| **Mover para a Direita** | <kbd>→</kbd> ou <kbd>D</kbd> |
| **Pular** | <kbd>Espaço</kbd> ou <kbd>W</kbd> ou <kbd>↑</kbd> |
| **Rebobinar Fita** | <kbd>R</kbd> ou <kbd>Shift</kbd> |
| **Marcar Retomada** | <kbd>E</kbd> ou <kbd>F</kbd> |
| **Pausa / Moviola** | <kbd>Esc</kbd> ou <kbd>P</kbd> |

### Mobile / Touchscreen
- **D-Pad Virtual Anatômico:** Lado esquerdo da tela com resposta tátil visual.
- **Botões de Ação Dinâmicos:**
  - Botão **PULO** (maior área de toque na base direita).
  - Botão **REBOBINAR** (símbolo `⏪` com anel indicador de recarga).
  - Botão **TOMADA** (marcação de frame instantâneo).
- O controle virtual ativa-se automaticamente em dispositivos com suporte a toque (`navigator.maxTouchPoints > 0`).

---

## 💻 Como Rodar Localmente

### Pré-requisitos
- [Node.js](https://nodejs.org/) (versão 20 ou superior recomendada)
- `npm` (versão 9 ou superior)

### Passo a Passo

1. **Clonar o repositório:**
   ```bash
   git clone https://github.com/leonardoconstantino/REBOBINAR.git
   cd REBOBINAR
   ```

2. **Instalar as dependências:**
   ```bash
   npm install
   ```

3. **Iniciar o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```
   Abra seu navegador em [http://localhost:3000](http://localhost:3000) (ou na porta indicada no terminal).

4. **Executar a suíte de testes unitários:**
   ```bash
   npm test
   ```

5. **Gerar a compilação de produção:**
   ```bash
   npm run build
   ```

---

## 🚀 Pipeline de Deploy Automático (GitHub Actions)

A aplicação conta com Continuous Deployment (CD) automatizado configurado em [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

### Como funciona:
1. Qualquer `push` realizado na branch `main` ou `master` dispara o workflow.
2. O ambiente GitHub Actions executa uma máquina virtual Ubuntu com Node.js 20.
3. As dependências são instaladas de forma reproduzível (`npm ci` ou `npm install`).
4. A build de produção é gerada com a variável de ambiente `GITHUB_ACTIONS: "true"`, garantindo que o Vite utilize o caminho base correto (`/REBOBINAR/`).
5. O artefato gerado na pasta `dist/` é publicado no GitHub Pages através das ações oficiais `actions/upload-pages-artifact@v3` e `actions/deploy-pages@v4`.

### Configuração Única Necessária no Repositório do GitHub:
Para habilitar o deploy automático pela primeira vez:
1. No seu repositório no GitHub, clique na aba **Settings**.
2. Na barra lateral esquerda, clique em **Pages** (dentro da seção *Code and automation*).
3. Em **Build and deployment > Source**, selecione a opção:
   👉 **GitHub Actions**
4. Pronto! O próximo push nas branches `main` ou `master` (ou um disparo manual via *Run workflow* na aba *Actions*) publicará o jogo automaticamente em [https://leonardoconstantino.github.io/REBOBINAR/](https://leonardoconstantino.github.io/REBOBINAR/).

---

## 📄 Licença

Distribuído sob a licença **Apache 2.0**. Consulte o arquivo [LICENSE](LICENSE) para obter mais informações.
