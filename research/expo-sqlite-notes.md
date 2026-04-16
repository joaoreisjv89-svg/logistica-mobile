# Expo SQLite Notes

Fonte consultada: documentação oficial do Expo SQLite.

## Pontos principais

O pacote `expo-sqlite` fornece um banco SQLite persistido entre reinicializações do aplicativo. A API moderna é baseada em `openDatabaseAsync`, com operações como `execAsync`, `runAsync`, `getFirstAsync`, `getAllAsync`, `getEachAsync` e suporte a statements preparados com `prepareAsync` e `executeAsync`.

Para aplicações com escrita frequente e leitura local, a documentação recomenda o uso de `PRAGMA journal_mode = WAL;` durante a inicialização do banco. Consultas com entrada do usuário devem usar parâmetros nomeados ou posicionais em vez de interpolação direta.

Há suporte por plugin de configuração para opções nativas. Para este projeto, o ponto mais relevante é adicionar `expo-sqlite` como dependência e abrir o banco local de forma assíncrona, aplicando migrações na inicialização do app.

## Diretrizes de implementação para este projeto

| Tema | Decisão |
|---|---|
| Banco local | Usar `expo-sqlite` |
| Inicialização | Abrir banco com `openDatabaseAsync` |
| Migrações | Executar `CREATE TABLE IF NOT EXISTS` e índices no boot |
| Escritas | Usar `runAsync` ou statements preparados |
| Leituras | Usar `getFirstAsync` e `getAllAsync` |
| Integridade | Criar `UNIQUE` em código de produto e validações adicionais |
| Performance | Ativar `WAL` e índices para consultas frequentes |
