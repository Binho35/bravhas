import type {
  ObligationArea,
  ObligationPriority,
  ObligationStatus,
} from "../domain/entities/Obligation";

export interface StoredObligation {
  id: string;

  title: string;

  description?: string;

  area: ObligationArea;

  priority: ObligationPriority;

  status: ObligationStatus;

  responsibleId: string;

  responsibleName: string;

  dueDate: string;

  completedAt: string | null;

  notes: string | null;

  createdAt: string;

  updatedAt: string;
}

const STORAGE_KEY = "bravhas_obligations";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function getStoredObligations(): StoredObligation[] {
  if (!isBrowser()) {
    return [];
  }

  const storedValue =
    window.localStorage.getItem(STORAGE_KEY);

  if (!storedValue) {
    return [];
  }

  try {
    const parsed =
      JSON.parse(storedValue) as StoredObligation[];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed;
  } catch {
    return [];
  }
}

export function saveStoredObligations(
  obligations: StoredObligation[],
): void {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(obligations),
  );
}

export function addStoredObligation(
  obligation: StoredObligation,
): void {
  const obligations =
    getStoredObligations();

  saveStoredObligations([
    ...obligations,
    obligation,
  ]);
}

export function removeStoredObligation(
  obligationId: string,
): void {
  const obligations =
    getStoredObligations();

  const updated =
    obligations.filter(
      (item) =>
        item.id !== obligationId,
    );

  saveStoredObligations(updated);
}

export function clearStoredObligations(): void {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(
    STORAGE_KEY,
  );
}