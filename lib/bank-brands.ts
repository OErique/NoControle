export interface BankBrand {
  name: string
  color: string
  gradient: string
  logo?: string
  textColor: string
}

const bankBrands: Record<string, BankBrand> = {
  nubank: {
    name: "Nubank",
    color: "#8B5CF6",
    gradient: "from-purple-600 to-purple-800",
    textColor: "white",
  },
  inter: {
    name: "Inter",
    color: "#FF7A00",
    gradient: "from-orange-500 to-orange-600",
    textColor: "white",
  },
  itau: {
    name: "Itaú",
    color: "#EC7000",
    gradient: "from-orange-500 to-orange-700",
    textColor: "white",
  },
  bradesco: {
    name: "Bradesco",
    color: "#CC092F",
    gradient: "from-red-600 to-red-800",
    textColor: "white",
  },
  santander: {
    name: "Santander",
    color: "#EC0000",
    gradient: "from-red-600 to-red-700",
    textColor: "white",
  },
  bb: {
    name: "Banco do Brasil",
    color: "#FFEF00",
    gradient: "from-yellow-400 to-blue-700",
    textColor: "black",
  },
  "banco do brasil": {
    name: "Banco do Brasil",
    color: "#FFEF00",
    gradient: "from-yellow-400 to-blue-700",
    textColor: "black",
  },
  caixa: {
    name: "Caixa",
    color: "#005CA9",
    gradient: "from-blue-600 to-blue-800",
    textColor: "white",
  },
  c6: {
    name: "C6 Bank",
    color: "#1A1A1A",
    gradient: "from-gray-900 to-black",
    textColor: "white",
  },
  "c6 bank": {
    name: "C6 Bank",
    color: "#1A1A1A",
    gradient: "from-gray-900 to-black",
    textColor: "white",
  },
  neon: {
    name: "Neon",
    color: "#00D4AA",
    gradient: "from-cyan-500 to-teal-600",
    textColor: "white",
  },
  picpay: {
    name: "PicPay",
    color: "#21C25E",
    gradient: "from-green-500 to-green-600",
    textColor: "white",
  },
  "mercado pago": {
    name: "Mercado Pago",
    color: "#009EE3",
    gradient: "from-blue-500 to-blue-600",
    textColor: "white",
  },
  mercadopago: {
    name: "Mercado Pago",
    color: "#009EE3",
    gradient: "from-blue-500 to-blue-600",
    textColor: "white",
  },
  xp: {
    name: "XP",
    color: "#1D1D1D",
    gradient: "from-gray-900 to-black",
    textColor: "white",
  },
  original: {
    name: "Banco Original",
    color: "#00A859",
    gradient: "from-green-600 to-green-700",
    textColor: "white",
  },
  next: {
    name: "Next",
    color: "#00FF87",
    gradient: "from-green-400 to-green-500",
    textColor: "black",
  },
  pan: {
    name: "Banco Pan",
    color: "#00ADEF",
    gradient: "from-blue-400 to-blue-600",
    textColor: "white",
  },
  safra: {
    name: "Safra",
    color: "#003366",
    gradient: "from-blue-900 to-blue-950",
    textColor: "white",
  },
  btg: {
    name: "BTG Pactual",
    color: "#001E50",
    gradient: "from-blue-900 to-blue-950",
    textColor: "white",
  },
  modal: {
    name: "Banco Modal",
    color: "#FF6600",
    gradient: "from-orange-500 to-orange-600",
    textColor: "white",
  },
  will: {
    name: "Will Bank",
    color: "#FFD700",
    gradient: "from-yellow-400 to-yellow-500",
    textColor: "black",
  },
  willbank: {
    name: "Will Bank",
    color: "#FFD700",
    gradient: "from-yellow-400 to-yellow-500",
    textColor: "black",
  },
  sicoob: {
    name: "Sicoob",
    color: "#003641",
    gradient: "from-teal-800 to-teal-900",
    textColor: "white",
  },
  sicredi: {
    name: "Sicredi",
    color: "#00A14B",
    gradient: "from-green-600 to-green-700",
    textColor: "white",
  },
  ame: {
    name: "Ame Digital",
    color: "#FF0066",
    gradient: "from-pink-600 to-pink-700",
    textColor: "white",
  },
  pagseguro: {
    name: "PagBank",
    color: "#FFC72C",
    gradient: "from-yellow-400 to-green-500",
    textColor: "black",
  },
  pagbank: {
    name: "PagBank",
    color: "#FFC72C",
    gradient: "from-yellow-400 to-green-500",
    textColor: "black",
  },
  stone: {
    name: "Stone",
    color: "#00A868",
    gradient: "from-green-600 to-green-700",
    textColor: "white",
  },
  ninetyNinePay: {
    name: "99Pay",
    color: "#FFCD00",
    gradient: "from-yellow-400 to-yellow-500",
    textColor: "black",
  },
  digio: {
    name: "Digio",
    color: "#003399",
    gradient: "from-blue-700 to-blue-800",
    textColor: "white",
  },
  sofisa: {
    name: "Sofisa Direto",
    color: "#FF6B00",
    gradient: "from-orange-500 to-orange-600",
    textColor: "white",
  },
  agibank: {
    name: "Agibank",
    color: "#6B21A8",
    gradient: "from-purple-700 to-purple-800",
    textColor: "white",
  },
  bmg: {
    name: "BMG",
    color: "#FF6600",
    gradient: "from-orange-500 to-orange-600",
    textColor: "white",
  },
}

const defaultBrand: BankBrand = {
  name: "Cartão",
  color: "#6B7280",
  gradient: "from-gray-600 to-gray-800",
  textColor: "white",
}

export function identifyBank(cardName: string): BankBrand {
  const normalized = cardName.toLowerCase().trim()

  // Check for exact match first
  if (bankBrands[normalized]) {
    return bankBrands[normalized]
  }

  // Check if card name contains any bank name
  for (const [key, brand] of Object.entries(bankBrands)) {
    if (normalized.includes(key)) {
      return brand
    }
  }

  return defaultBrand
}

export function getBankGradient(cardName: string): string {
  return identifyBank(cardName).gradient
}

export function getBankColor(cardName: string): string {
  return identifyBank(cardName).color
}
