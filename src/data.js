// Default payment categories and items
export const DEFAULT_PAYMENTS = [
  {
    id: "monthly",
    title: "Mensais",
    dateMode: "days",
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
    id: "card",
    title: "Cartão",
    dateMode: "none",
    items: [],
  },
  {
    id: "savings",
    title: "Reservas",
    dateMode: "none",
    items: [],
  },
  {
    id: "yearly",
    title: "Anuais",
    dateMode: "months",
    items: [
      { id: "seguro", label: "Seguro" },
      { id: "licenciamento", label: "Licenciamento e IPVA" },
    ],
  },
];
