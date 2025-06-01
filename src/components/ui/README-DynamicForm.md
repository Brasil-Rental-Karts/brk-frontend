# DynamicForm Component

O `DynamicForm` é um componente React reutilizável que permite criar formulários complexos a partir de uma configuração JSON. Ele suporta validação com Zod, campos condicionais, máscaras de input e diferentes tipos de campos.

## Características

- ✅ Validação automática com Zod baseada na configuração
- ✅ Campos condicionais (mostrar/ocultar baseado em outros campos)
- ✅ Suporte a máscaras (CPF, CNPJ, telefone, CEP, etc.)
- ✅ Diferentes tipos de campos (input, textarea, select, checkbox, inputMask)
- ✅ Contadores de caracteres automáticos
- ✅ Seções organizadas em cards
- ✅ Callback para mudanças de valores
- ✅ Integração com react-hook-form

## Tipos de Campos Suportados

### Input
```typescript
{
  id: "name",
  name: "Nome",
  type: "input",
  mandatory: true,
  max_char: 100,
  placeholder: "Digite seu nome"
}
```

### Textarea
```typescript
{
  id: "description",
  name: "Descrição",
  type: "textarea",
  mandatory: false,
  max_char: 500,
  placeholder: "Digite uma descrição"
}
```

### Select
```typescript
{
  id: "state",
  name: "Estado",
  type: "select",
  mandatory: true,
  options: [
    { value: "SP", description: "São Paulo" },
    { value: "RJ", description: "Rio de Janeiro" }
  ]
}
```

### Checkbox
```typescript
{
  id: "agree",
  name: "Aceito os termos",
  type: "checkbox",
  mandatory: false
}
```

### Input com Máscara
```typescript
{
  id: "phone",
  name: "Telefone",
  type: "inputMask",
  mask: "phone",
  mandatory: true,
  placeholder: "(99) 9999-9999"
}
```

Máscaras disponíveis: `phone`, `cpf`, `cnpj`, `cep`, `date`, `currency`

## Campos Condicionais

Você pode mostrar/ocultar campos baseado no valor de outros campos:

```typescript
{
  id: "responsibleName",
  name: "Nome do responsável",
  type: "input",
  mandatory: true,
  conditionalField: {
    dependsOn: "isResponsible",
    showWhen: false // Mostra quando isResponsible for false
  }
}
```

## Exemplo de Uso

```typescript
import { DynamicForm, FormSectionConfig } from "@/components/ui/dynamic-form";

const formConfig: FormSectionConfig[] = [
  {
    section: "Informações Pessoais",
    detail: "Dados básicos do usuário",
    fields: [
      {
        id: "name",
        name: "Nome completo",
        type: "input",
        mandatory: true,
        max_char: 100,
        placeholder: "Digite seu nome"
      },
      {
        id: "email",
        name: "E-mail",
        type: "input",
        mandatory: true,
        placeholder: "seu@email.com"
      },
      {
        id: "phone",
        name: "Telefone",
        type: "inputMask",
        mask: "phone",
        mandatory: true,
        placeholder: "(99) 9999-9999"
      }
    ]
  },
  {
    section: "Endereço",
    detail: "Informações de localização",
    fields: [
      {
        id: "cep",
        name: "CEP",
        type: "inputMask",
        mask: "cep",
        mandatory: true,
        placeholder: "00000-000"
      },
      {
        id: "state",
        name: "Estado",
        type: "select",
        mandatory: true,
        options: [
          { value: "SP", description: "São Paulo" },
          { value: "RJ", description: "Rio de Janeiro" }
        ]
      }
    ]
  }
];

function MyForm() {
  const handleSubmit = (data: any) => {
    console.log("Form data:", data);
  };

  const handleChange = (data: any) => {
    console.log("Form changed:", data);
    // Aqui você pode reagir a mudanças, como carregar cidades quando o estado muda
  };

  return (
    <DynamicForm
      config={formConfig}
      onSubmit={handleSubmit}
      onChange={handleChange}
      submitLabel="Salvar"
      cancelLabel="Cancelar"
      formId="my-form"
    />
  );
}
```

## Props

| Prop | Tipo | Obrigatório | Descrição |
|------|------|-------------|-----------|
| `config` | `FormSectionConfig[]` | ✅ | Configuração das seções e campos do formulário |
| `onSubmit` | `(data: any) => void` | ✅ | Callback chamado quando o formulário é submetido |
| `onCancel` | `() => void` | ❌ | Callback chamado quando o botão cancelar é clicado |
| `onChange` | `(data: any) => void` | ❌ | Callback chamado sempre que um campo muda |
| `submitLabel` | `string` | ❌ | Texto do botão de submit (padrão: "Salvar") |
| `cancelLabel` | `string` | ❌ | Texto do botão de cancelar (padrão: "Cancelar") |
| `showButtons` | `boolean` | ❌ | Se deve mostrar os botões (padrão: true) |
| `initialValues` | `Record<string, any>` | ❌ | Valores iniciais dos campos |
| `className` | `string` | ❌ | Classes CSS adicionais |
| `formId` | `string` | ❌ | ID do formulário para conectar com botões externos |

## Validação

A validação é gerada automaticamente baseada na configuração:

- Campos `mandatory: true` são obrigatórios
- Campos com `max_char` têm validação de tamanho máximo
- Selects validam se o valor está nas opções disponíveis
- Máscaras validam o formato automaticamente

## Integração com Botões Externos

Você pode usar botões fora do formulário usando o `formId`:

```typescript
<form id="my-form">
  <DynamicForm
    config={config}
    onSubmit={handleSubmit}
    showButtons={false}
    formId="my-form"
  />
</form>

<button type="submit" form="my-form">
  Salvar Formulário
</button>
```

## Exemplo Completo: Página de Criação de Campeonato

Veja o arquivo `src/pages/CreateChampionship.tsx` para um exemplo completo de como usar o DynamicForm em uma página real, incluindo:

- Carregamento dinâmico de cidades baseado no estado selecionado
- Campos condicionais
- Integração com header personalizado
- Máscaras de input
- Validação completa 