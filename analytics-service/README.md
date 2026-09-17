# SAEP - Serviço Analítico (FastAPI)

Este serviço é responsável por realizar consultas, cálculos estatísticos e fornecer indicadores para o Dashboard do SAEP.

## Inventário de Dados

### 1. Tabela/Modelo: `Acao`
- **id**: Identificador único da Ação (String)
- **og**: Objetivo Geral (String)
- **lae**: Linha de Ação Estratégica (String)
- **setor**: Setor responsável pela ação (String)
- **prazo**: Classificação do prazo - CURTO_PRAZO, MEDIO_PRAZO, LONGO_PRAZO (Enum)
- **responsavel**: Nome do responsável (String)
- **matrizes**: Relacionamento com a tabela de ligação AcoesMatriz

### 2. Tabela/Modelo: `Matriz`
- **id**: Identificador único da Matriz (String)
- **nome**: Nome da matriz (String)
- **percentual**: Progresso de execução de 0 a 100 (Int)
- **status**: Situação cadastral - RASCUNHO, ENVIADO, APROVADO, PENDENTE (Enum)
- **impacto**: Nível de impacto - BAIXO, MEDIO, ALTO (Enum)
- **dataCriacao**: Data de criação do registro (DateTime)
- **dataAvaliacao**: Data em que foi avaliada (DateTime)
- **acoes**: Relacionamento com a tabela de ligação AcoesMatriz

### 3. Tabela/Modelo: `AcoesMatriz`
- **id**: Identificador da ligação (String)
- **matrizId**: ID da Matriz (Chave estrangeira)
- **acaoId**: ID da Ação (Chave estrangeira)

### 4. Tabela/Modelo: `Usuario`
- **id**: Identificador único do usuário (String)
- **setor**: Setor do usuário (String)
- **role**: Perfil - USUARIO, COMITE, ADMIN_SETOR, ADMIN_GERAL (Enum)