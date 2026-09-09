export function normalizeCpf(value: string): string {
  return value.replace(/\D/g, "");
}

function calculateDigit(base: string, firstWeight: number): number {
  const sum = base.split("").reduce((total, digit, index) => total + Number(digit) * (firstWeight - index), 0);
  const remainder = (sum * 10) % 11;
  return remainder === 10 ? 0 : remainder;
}

export function isValidCpf(value: string): boolean {
  const cpf = normalizeCpf(value);
  if (!/^\d{11}$/.test(cpf)) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  const first = calculateDigit(cpf.slice(0, 9), 10);
  if (first !== Number(cpf[9])) return false;
  const second = calculateDigit(cpf.slice(0, 10), 11);
  return second === Number(cpf[10]);
}

export function requireValidCpf(value: string): string {
  const cpf = normalizeCpf(value);
  if (!isValidCpf(cpf)) throw new Error("CPF inválido.");
  return cpf;
}

export function formatCpf(cpf: string): string {
  const normalized = normalizeCpf(cpf);
  if (normalized.length !== 11) return normalized;
  return `${normalized.slice(0, 3)}.${normalized.slice(3, 6)}.${normalized.slice(6, 9)}-${normalized.slice(9)}`;
}

export function cpfDuplicateCandidates(value: string): string[] {
  const canonical = requireValidCpf(value);
  return [canonical, formatCpf(canonical)];
}
