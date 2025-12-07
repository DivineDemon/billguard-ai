import type { BillRecord } from "../types";

const STORAGE_KEY = "billguard_db_v1";

export const StorageService = {
  /**
   * Save a new bill to the database
   */
  saveBill: (bill: BillRecord): void => {
    try {
      const current = StorageService.getBills();
      const updated = [bill, ...current];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore storage errors
    }
  },

  /**
   * Retrieve all bills from the database
   */
  getBills: (): BillRecord[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  /**
   * Delete a specific bill
   */
  deleteBill: (id: string): void => {
    try {
      const current = StorageService.getBills();
      const updated = current.filter((b) => b.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore storage errors
    }
  },

  /**
   * Clear all data
   */
  clearDB: (): void => {
    localStorage.removeItem(STORAGE_KEY);
  },
};
