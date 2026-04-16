# Plano de Design do Aplicativo

## Visão do produto

O aplicativo **Logística Mobile** será desenhado para uso contínuo em **orientação retrato (9:16)**, com navegação simples, áreas de toque amplas e fluxos otimizados para operação com uma mão. A proposta visual seguirá uma interpretação prática do **Material Design 3** para Android, mas com refinamento de hierarquia, espaçamento, contraste e feedback tátil compatíveis com padrões modernos de aplicativos utilitários de alta qualidade. O foco principal é reduzir tempo por tarefa em contextos de rua e de armazém, permitindo registrar inventário, consultar entregas, escanear produtos e gerar relatórios com poucos toques.

A arquitetura de interface será baseada em **barra inferior com cinco áreas principais** e navegação complementar por telas de detalhe, folhas modais e ações rápidas. Em operações críticas, a interface privilegiará clareza operacional: status visíveis, contagens resumidas, filtros acessíveis, campos validados e confirmação explícita para ações destrutivas.

## Escolhas de cor

A identidade visual será sóbria, funcional e adequada a ambientes industriais, mantendo boa legibilidade em luz forte e em modo escuro.

| Elemento | Cor | Uso planejado |
|---|---|---|
| Cor primária | `#0F5D7A` | Botões principais, destaques, indicadores de ação |
| Cor secundária | `#1E88E5` | Links operacionais, estados ativos, chips selecionados |
| Sucesso | `#2E7D32` | Entregas concluídas, estoque positivo, confirmações |
| Alerta | `#F9A825` | Pendências, atenção operacional, avisos |
| Erro | `#C62828` | Falhas, campos inválidos, remoções |
| Fundo claro | `#F4F7FA` | Fundo principal em modo claro |
| Superfície clara | `#FFFFFF` | Cartões, listas, modais |
| Fundo escuro | `#0F1419` | Fundo principal em modo escuro |
| Superfície escura | `#182028` | Cartões e blocos em modo escuro |
| Texto principal | `#102027` / `#EAF2F7` | Legibilidade em claro/escuro |

## Lista de telas

### 1. Dashboard

A tela inicial exibirá cartões de resumo com **entregas do dia**, **produtos escaneados hoje**, **entregas pendentes**, **entregas concluídas** e **níveis de estoque**. Abaixo dos indicadores, haverá uma grade de ações rápidas com botões grandes para **Escanear Produto**, **Adicionar Entrega**, **Ver Inventário**, **Mapa de Entregas**, **Relatórios**, **Exportar Excel** e **Otimizar Rota**. Também haverá uma seção de atividade recente com os últimos movimentos de estoque e atualizações de entrega.

### 2. Inventário

Esta tela mostrará uma lista pesquisável de produtos com busca por código, nome e categoria. Cada item apresentará código, nome, categoria, quantidade atual e data da última atualização. O topo terá filtros rápidos por categoria e por nível de estoque. A tela também terá atalhos para **adicionar produto**, **registrar entrada**, **registrar saída** e **importar planilha**.

### 3. Cadastro e edição de produto

A tela de formulário permitirá cadastrar ou editar produto com os campos **código do produto**, **nome**, **categoria**, **quantidade** e **observações**. O formulário terá validação imediata, prevenção de duplicidade por código de barras e preenchimento automático quando o produto já existir. O layout será compacto, com teclado apropriado por campo e botão primário fixo na parte inferior.

### 4. Scanner de código de barras

A experiência de scanner será de tela cheia, priorizando velocidade. Haverá moldura central de leitura, indicação textual do status do scanner, feedback visual e vibração ao detectar um código. Após a leitura, o usuário verá um cartão inferior com reconhecimento automático do produto e as ações **Entrada no Estoque**, **Saída do Estoque** e **Vincular à Entrega**. Se o produto não existir, o cartão oferecerá **cadastro rápido**.

### 5. Entregas

A área de entregas terá uma lista segmentada por status: **Pendente**, **Em rota**, **Entregue** e **Cancelada**. Cada cartão mostrará cliente, endereço, horário, quantidade de itens e status. A parte superior terá busca por cliente e endereço. O usuário poderá criar nova entrega, abrir detalhes, alterar status e consultar histórico.

### 6. Cadastro e edição de entrega

O formulário de entrega incluirá **endereço**, **nome do cliente**, **telefone**, **observações** e **produtos atribuídos**. A seleção de produtos ocorrerá por lista filtrável ou por scanner. O fluxo precisa permitir salvar rapidamente mesmo offline, deixando alterações sincronizadas apenas com o banco local.

### 7. Detalhe da entrega

A tela de detalhe mostrará os dados do cliente, endereço, status atual, produtos vinculados, histórico operacional, horário estimado e prova de entrega quando disponível. Haverá botões para **iniciar rota**, **abrir no Google Maps**, **marcar como entregue**, **anexar foto** e **registrar localização**.

### 8. Mapa e rota

A tela de mapa exibirá a posição atual do motorista, marcadores de entrega e uma visualização da sequência otimizada. Na parte inferior, um painel resumirá próxima parada, distância estimada e tempo previsto. O mapa deve funcionar como apoio visual local; a navegação externa ocorrerá pelo botão de abertura no Google Maps.

### 9. Relatórios

A tela de relatórios consolidará métricas operacionais com cartões e gráficos de **entregas por dia** e **movimentação de inventário**. O usuário poderá alternar períodos diário e semanal. A interface também apresentará ações para **exportar XLSX**, **compartilhar arquivo** e **gerar backup**.

### 10. Importação de Excel

Uma tela ou folha modal guiará a seleção do arquivo, visualização prévia das colunas reconhecidas e resumo da importação. Serão destacados registros inválidos, duplicados e novos produtos antes da confirmação final.

### 11. Backup e restauração

Esta tela exibirá histórico de backups locais, data do último backup automático e ações para **criar backup manual** e **restaurar backup**. Restaurações deverão exigir confirmação clara para evitar perda de dados locais mais recentes.

### 12. Configurações operacionais

A tela reunirá preferências de tema, permissões, vibração do scanner, comportamento de backup automático e estado de GPS/câmera. Também informará quando algum recurso necessário estiver desativado no dispositivo.

## Conteúdo primário e funcionalidades por tela

| Tela | Conteúdo principal | Funcionalidades principais |
|---|---|---|
| Dashboard | KPIs, ações rápidas, atividade recente | Navegação central, leitura do status operacional |
| Inventário | Lista de produtos, filtros, busca | Adicionar, editar, excluir, entrada e saída |
| Produto | Formulário validado | Criar, atualizar, bloquear duplicidades |
| Scanner | Câmera, overlay, resultado | Ler código, reconhecer produto, registrar movimento |
| Entregas | Lista por status, busca | Criar, editar, mudar status, abrir detalhe |
| Entrega | Formulário e seleção de produtos | Registrar pedido e vínculo com itens |
| Detalhe da entrega | Dados do cliente, itens, histórico | Marcar entregue, abrir mapa, anexar prova |
| Mapa | Marcadores, ordem de paradas, resumo | Visualizar rota e abrir navegação externa |
| Relatórios | Cartões métricos, gráficos | Filtrar período, exportar, compartilhar |
| Importação | Prévia de planilha, validação | Importar produtos de Excel |
| Backup | Lista de backups, data da última cópia | Backup manual, restauração |
| Configurações | Tema, permissões, preferências | Ajustes operacionais e diagnóstico |

## Fluxos principais do usuário

### Fluxo 1: escanear produto e registrar entrada

O usuário abre o **Dashboard**, toca em **Escanear Produto**, aponta a câmera para o código, recebe leitura com vibração e visualiza o produto reconhecido. Em seguida, toca em **Entrada no Estoque**, ajusta quantidade se necessário, confirma e retorna ao painel com o contador diário atualizado.

### Fluxo 2: escanear produto desconhecido e cadastrar rapidamente

O usuário abre o scanner, lê um código não cadastrado, recebe a mensagem de produto não encontrado e acessa o **cadastro rápido**. Ele preenche nome, categoria e quantidade inicial, salva o produto e já conclui a operação como entrada de estoque.

### Fluxo 3: criar entrega e vincular produtos

O usuário entra em **Entregas**, toca em **Nova Entrega**, preenche cliente, telefone, endereço e observações, adiciona produtos por busca ou scanner, salva a entrega como **Pendente** e volta para a lista com o novo cartão exibido imediatamente.

### Fluxo 4: iniciar rota e concluir entrega com prova

O usuário abre o **Detalhe da Entrega**, toca em **Iniciar rota**, consulta o mapa interno e depois usa **Abrir no Google Maps**. Ao chegar ao destino, registra localização, captura foto como prova de entrega, marca como **Entregue** e o sistema grava status, horário e coordenadas localmente.

### Fluxo 5: exportar relatório diário

O usuário acessa **Relatórios**, seleciona o período diário, revisa os gráficos e toca em **Exportar XLSX**. O arquivo é gerado localmente, salvo no dispositivo e disponibilizado para compartilhamento.

### Fluxo 6: restaurar backup

O usuário vai até **Backup e restauração**, escolhe um arquivo de backup existente, revisa a confirmação de impacto, confirma a restauração e o sistema recarrega os dados locais após concluir a operação.

## Estrutura de navegação principal

A navegação principal usará cinco abas inferiores: **Painel**, **Inventário**, **Scanner**, **Entregas** e **Relatórios**. Telas de formulário, detalhe, mapa, backup, importação e configurações serão abertas por rotas empilhadas ou folhas modais, evitando sobrecarregar a barra inferior.

## Diretrizes de layout e interação

O layout adotará cartões altos com respiro visual, tipografia de fácil leitura e contraste forte para uso externo. Botões críticos terão altura mínima confortável e posicionamento previsível. Listas extensas usarão virtualização, filtros em chips horizontais e estados vazios informativos. A experiência de erro será sempre recuperável, com mensagens objetivas e orientação clara de correção.

Em modo escuro, o contraste será preservado sem pretos absolutos em toda a interface, evitando fadiga visual. Ícones e marcadores de status terão significado consistente entre módulos, reduzindo o esforço cognitivo do operador ao longo do dia.

## Resultado esperado da experiência

O aplicativo deve transmitir sensação de confiabilidade operacional, rapidez e clareza. O usuário precisa conseguir executar tarefas recorrentes — escanear, registrar estoque, criar entregas, consultar rota e exportar relatórios — com o mínimo de fricção, mesmo sem conexão com a internet.
