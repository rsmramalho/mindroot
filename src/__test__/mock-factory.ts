// __test__/mock-factory.ts — Shared mock factory for tests
import type { AtomItem } from '@/types/item';
import type { ParsedInput } from '@/types/engine';
import { format, subDays, addDays } from 'date-fns';

let _id = 0;
const uid = () => `item-${++_id}`;

export function resetIds() {
  _id = 0;
}

export function mockItem(overrides: Partial<AtomItem> = {}): AtomItem {
  return {
    id: uid(),
    user_id: 'user-1',
    title: 'Test item',
    type: 'task',
    module: null,
    priority: null,
    tags: [],
    parent_id: null,
    completed: false,
    completed_at: null,
    archived: false,
    due_date: null,
    due_time: null,
    recurrence: null,
    ritual_period: null,
    emotion_before: null,
    emotion_after: null,
    needs_checkin: false,
    is_chore: false,
    energy_cost: null,
    description: null,
    context: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

export function mockParsedInput(overrides: Partial<ParsedInput> = {}): ParsedInput {
  return {
    title: 'Test input',
    type: 'task',
    module: null,
    priority: null,
    emotion_before: null,
    emotion_after: null,
    needs_checkin: false,
    is_chore: false,
    energy_cost: null,
    due_date: null,
    due_time: null,
    ritual_period: null,
    tags: [],
    tokens: [],
    context: 'test input',
    ...overrides,
  };
}

// Date helpers
export const today = () => format(new Date(), 'yyyy-MM-dd');
export const yesterday = () => format(subDays(new Date(), 1), 'yyyy-MM-dd');
export const twoDaysAgo = () => format(subDays(new Date(), 2), 'yyyy-MM-dd');
export const tomorrow = () => format(addDays(new Date(), 1), 'yyyy-MM-dd');
export const nextWeek = () => format(addDays(new Date(), 7), 'yyyy-MM-dd');
