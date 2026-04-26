# TODO — RT-Metagenomics

Itens pendentes da integração e operação do pipeline.

---

## Metagenomics / CLI

- [ ] Nova opção: `--deadon-index` com caminho para a base (documentar e expor no fluxo de metagenomics).

---

## Startup (`rt-meta`)

- [ ] Rodar o **setup** na inicialização, baixando bases quando ainda não existirem localmente.

---

## Compatibilização da nova branch

- [ ] **Diamond** deixa de ser a única opção de alinhamento; revisar se o default e a UI/API refletem isso corretamente.

---

## Formato de saída

O output parece ter mudado: há **três arquivos** distintos.

| Arquivo   | Notas                          |
| --------- | ------------------------------ |
| Normal    | Saída padrão                   |
| RPM       | Versão RPM                     |
| RPM bleed | **Novo guia** principal da app |

- [ ] Validar se a mudança afeta as **estatísticas** já disponibilizadas para o Hiago.
