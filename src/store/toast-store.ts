// store/toast-store.ts — Toast notification queue (Zustand)
// Supports auto-dismiss, stacking, and undo actions

import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number; // ms, 0 = manual dismiss
  undoAction?: () => void;
  undoLabel?: string;
  createdAt: number;
}

export interface ToastPayload {
  message: string;
  type?: ToastType;
  duration?: number;
  undoAction?: () => void;
  undoLabel?: string;
}

interface ToastState {
  toasts: Toast[];
  add: (payload: ToastPayload) => string;
  dismiss: (id: string) => void;
  clear: () => void;
}

let counter = 0;
const generateId = () => `toast-${++counter}-${Date.now()}`;

const MAX_TOASTS = 4;
const DEFAULT_DURATION = 3000;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  add: (payload) => {
    const id = generateId();
    const toast: Toast = {
      id,
      message: payload.message,
      type: payload.type ?? 'success',
      duration: payload.duration ?? DEFAULT_DURATION,
      undoAction: payload.undoAction,
      undoLabel: payload.undoLabel,
      createdAt: Date.now(),
    };

    set((state) => ({
      toasts: [...state.toasts, toast].slice(-MAX_TOASTS),
    }));

    // Auto-dismiss
    if (toast.duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, toast.duration);
    }

    return id;
  },

  dismiss: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  clear: () => set({ toasts: [] }),
}));

// Convenience helpers for external use
export const toast = {
  success: (message: string, opts?: Omit<ToastPayload, 'message' | 'type'>) =>
    useToastStore.getState().add({ message, type: 'success', ...opts }),
  error: (message: string, opts?: Omit<ToastPayload, 'message' | 'type'>) =>
    useToastStore.getState().add({ message, type: 'error', duration: 4000, ...opts }),
  info: (message: string, opts?: Omit<ToastPayload, 'message' | 'type'>) =>
    useToastStore.getState().add({ message, type: 'info', ...opts }),
};
