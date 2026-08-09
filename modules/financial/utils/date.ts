export function formatDate(
  value: string,
): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    },
  ).format(date);
}

export function formatDateInput(
  value: string,
): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date
    .toISOString()
    .slice(0, 10);
}

export function isOverdue(
  dueDate: string,
): boolean {
  const due = new Date(
    dueDate,
  ).getTime();

  if (Number.isNaN(due)) {
    return false;
  }

  return due < Date.now();
}

export function todayISO(): string {
  return new Date().toISOString();
}