// Default payment categories and items
export const DEFAULT_PAYMENTS = [
  {
    id: "monthly",
    title: "Pagar contas mensais",
    cycle: "monthly",
    items: [
      { id: "comgas", label: "Comgas" },
      { id: "cpfl", label: "CPFL" },
      { id: "condominio", label: "Condomínio" },
      { id: "aluguel", label: "Aluguel" },
      { id: "vivo", label: "Vivo" },
      { id: "unimed", label: "Unimed" },
      { id: "cartao_global", label: "Fatura Cartão Global" },
      { id: "cartao_credito", label: "Fatura Cartão de Crédito" },
      { id: "impostos_empresa", label: "Impostos Empresa" },
    ],
  },
  {
    id: "yearly",
    title: "Pagar contas anuais",
    cycle: "yearly",
    items: [
      { id: "seguro", label: "Seguro" },
      { id: "licenciamento", label: "Licenciamento e IPVA" },
    ],
  },
];
