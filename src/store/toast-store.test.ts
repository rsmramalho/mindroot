// store/toast-store.test.ts — Toast store unit tests
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useToastStore, toast } from './toast-store';

describe('toast-store', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useToastStore.getState().clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should start with empty toasts', () => {
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it('should add a toast', () => {
    useToastStore.getState().add({ message: 'Hello' });
    expect(useToastStore.getState().toasts).toHaveLength(1);
    expect(useToastStore.getState().toasts[0].message).toBe('Hello');
  });

  it('should default to success type', () => {
    useToastStore.getState().add({ message: 'OK' });
    expect(useToastStore.getState().toasts[0].type).toBe('success');
  });

  it('should default to 3000ms duration', () => {
    useToastStore.getState().add({ message: 'OK' });
    expect(useToastStore.getState().toasts[0].duration).toBe(3000);
  });

  it('should auto-dismiss after duration', () => {
    useToastStore.getState().add({ message: 'Temp', duration: 1000 });
    expect(useToastStore.getState().toasts).toHaveLength(1);
    vi.advanceTimersByTime(1100);
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it('should not auto-dismiss with duration 0', () => {
    useToastStore.getState().add({ message: 'Sticky', duration: 0 });
    vi.advanceTimersByTime(10000);
    expect(useToastStore.getState().toasts).toHaveLength(1);
  });

  it('should dismiss by id', () => {
    const id = useToastStore.getState().add({ message: 'A' });
    useToastStore.getState().add({ message: 'B' });
    expect(useToastStore.getState().toasts).toHaveLength(2);
    useToastStore.getState().dismiss(id);
    expect(useToastStore.getState().toasts).toHaveLength(1);
    expect(useToastStore.getState().toasts[0].message).toBe('B');
  });

  it('should clear all toasts', () => {
    useToastStore.getState().add({ message: 'A', duration: 0 });
    useToastStore.getState().add({ message: 'B', duration: 0 });
    useToastStore.getState().add({ message: 'C', duration: 0 });
    expect(useToastStore.getState().toasts).toHaveLength(3);
    useToastStore.getState().clear();
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it('should enforce max 4 toasts', () => {
    for (let i = 0; i < 6; i++) {
      useToastStore.getState().add({ message: `Toast ${i}`, duration: 0 });
    }
    expect(useToastStore.getState().toasts).toHaveLength(4);
    // Should keep the most recent
    expect(useToastStore.getState().toasts[0].message).toBe('Toast 2');
    expect(useToastStore.getState().toasts[3].message).toBe('Toast 5');
  });

  it('should support undo action', () => {
    const undoFn = vi.fn();
    useToastStore.getState().add({
      message: 'Deleted',
      undoAction: undoFn,
      duration: 0,
    });
    const t = useToastStore.getState().toasts[0];
    expect(t.undoAction).toBeDefined();
    t.undoAction!();
    expect(undoFn).toHaveBeenCalledOnce();
  });

  it('should support custom undo label', () => {
    useToastStore.getState().add({
      message: 'Removed',
      undoAction: () => {},
      undoLabel: 'Restaurar',
      duration: 0,
    });
    expect(useToastStore.getState().toasts[0].undoLabel).toBe('Restaurar');
  });

  // Convenience helpers
  it('toast.success should add success toast', () => {
    toast.success('Done');
    expect(useToastStore.getState().toasts[0].type).toBe('success');
    expect(useToastStore.getState().toasts[0].message).toBe('Done');
  });

  it('toast.error should add error toast with 4s duration', () => {
    toast.error('Failed');
    expect(useToastStore.getState().toasts[0].type).toBe('error');
    expect(useToastStore.getState().toasts[0].duration).toBe(4000);
  });

  it('toast.info should add info toast', () => {
    toast.info('FYI');
    expect(useToastStore.getState().toasts[0].type).toBe('info');
  });

  it('should generate unique ids', () => {
    const id1 = useToastStore.getState().add({ message: 'A', duration: 0 });
    const id2 = useToastStore.getState().add({ message: 'B', duration: 0 });
    expect(id1).not.toBe(id2);
  });

  it('should include createdAt timestamp', () => {
    const now = Date.now();
    useToastStore.getState().add({ message: 'Time' });
    expect(useToastStore.getState().toasts[0].createdAt).toBeGreaterThanOrEqual(now);
  });
});
