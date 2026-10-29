# Minha carteira (B3)

Dashboard de carteira que roda direto no navegador, sem servidor e sem Python.
Arquivos: `index.html` (estrutura), `style.css` (visual) e `app.js` (lógica).

## Abrir no VS Code
1. Coloque os 4 arquivos na mesma pasta e abra a pasta no VS Code (Arquivo > Abrir Pasta).
2. Instale a extensão **Live Server** (Ritwick Dey).
3. Clique com o botão direito em `index.html` > **Open with Live Server**.

Sem extensão: no terminal da pasta, rode `python -m http.server 5500` e abra http://localhost:5500.
Abrir `index.html` com duplo clique também funciona.

Importante: os dados ficam salvos no navegador, separados por endereço
(`localhost:5500`, `127.0.0.1:5500` e `file://` guardam dados diferentes).
Escolha uma forma de abrir e use sempre a mesma. Use **Exportar backup** de tempos em tempos.

## Importar da B3
1. Entre na Área do Investidor da B3 (investidor.b3.com.br) > Extratos.
2. Baixe o extrato de **Posição** (ações, FIIs, renda fixa, Tesouro Direto) em Excel.
3. Opcional, para o preço médio: baixe também o extrato de **Negociação**.
4. Arraste os arquivos para a área "Importar da B3". Aceita .xlsx e .csv, vários de uma vez.

Observações:
- O extrato de Posição não traz preço médio. Ativos novos entram com a cotação como preço médio até você importar a Negociação (calculada por custo médio, só dos períodos do arquivo) ou editar na tabela.
- O tipo é identificado pela aba do arquivo. ETFs, units e fundos podem cair no tipo errado: corrija no seletor de tipo da tabela.
- Os nomes de menus e colunas da B3 podem mudar. Se algum arquivo não for lido, me envie as colunas dele para ajustar.

## Leitura de .xlsx offline
O `.xlsx` usa a biblioteca SheetJS, carregada da internet. Para funcionar offline, baixe
`xlsx.full.min.js` (SheetJS 0.18.5) e salve em `vendor/xlsx.full.min.js`. Arquivos .csv não precisam dela.

## Limites
- Cotações não são atualizadas sozinhas: atualize na tabela ou importe um novo extrato.
- Proventos são digitados por você (ainda não há importação do extrato de Movimentação).
- As ideias de investimento vêm do Claude: a aba gera o pedido pronto para você colar no chat.
