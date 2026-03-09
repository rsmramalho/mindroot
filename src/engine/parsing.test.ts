// engine/parsing.test.ts — Parsing Engine v2 tests
import { describe, it, expect } from 'vitest';
import { parseInput } from './parsing';

describe('Parsing Engine v2', () => {
  // ─── Title cleaning ────────────────────────────
  it('extracts clean title removing all tokens', () => {
    const result = parseInput('Comprar leite #mod_family @hoje #prio_urgente');
    expect(result.title).toBe('Comprar leite');
  });

  // ─── Modules ───────────────────────────────────
  it('detects #mod_work', () => {
    const result = parseInput('Reunião com time #mod_work');
    expect(result.module).toBe('work');
  });

  it('detects #mod_family', () => {
    const result = parseInput('Buscar Bella na escola #mod_family');
    expect(result.module).toBe('family');
  });

  it('detects #mod_soul', () => {
    const result = parseInput('Meditação guiada #mod_soul');
    expect(result.module).toBe('soul');
  });

  // ─── Priority ──────────────────────────────────
  it('detects #prio_urgente', () => {
    const result = parseInput('Bug em produção #prio_urgente');
    expect(result.priority).toBe('urgente');
  });

  it('detects #prio_futuro', () => {
    const result = parseInput('Aprender Rust #prio_futuro');
    expect(result.priority).toBe('futuro');
  });

  // ─── Emotions ──────────────────────────────────
  it('detects emotion before #emo_ansioso', () => {
    const result = parseInput('Apresentação do projeto #emo_ansioso');
    expect(result.emotion_before).toBe('ansioso');
  });

  it('detects emotion after #emob_grato', () => {
    const result = parseInput('Terminei a meditação #emob_grato');
    expect(result.emotion_after).toBe('grato');
  });

  it('detects both emotions', () => {
    const result = parseInput('Terapia #emo_ansioso #emob_calmo');
    expect(result.emotion_before).toBe('ansioso');
    expect(result.emotion_after).toBe('calmo');
  });

  // ─── Chore ─────────────────────────────────────
  it('detects #chore and sets is_chore + needs_checkin', () => {
    const result = parseInput('Lavar louça #chore');
    expect(result.is_chore).toBe(true);
    expect(result.needs_checkin).toBe(true);
    expect(result.type).toBe('chore');
  });

  // ─── Needs check-in ───────────────────────────
  it('detects #needs_checkin', () => {
    const result = parseInput('Reunião difícil #needs_checkin');
    expect(result.needs_checkin).toBe(true);
  });

  // ─── Types ─────────────────────────────────────
  it('detects #type_habit', () => {
    const result = parseInput('Correr 5km #type_habit');
    expect(result.type).toBe('habit');
  });

  it('detects #type_project', () => {
    const result = parseInput('MindRoot MVP #type_project');
    expect(result.type).toBe('project');
  });

  it('detects #type_note', () => {
    const result = parseInput('Ideia para feature #type_note');
    expect(result.type).toBe('note');
  });

  // ─── Temporal ──────────────────────────────────
  it('detects @hoje', () => {
    const result = parseInput('Comprar pão @hoje');
    expect(result.due_date).toBeTruthy();
  });

  it('detects @amanha', () => {
    const result = parseInput('Dentista @amanha');
    expect(result.due_date).toBeTruthy();
  });

  it('detects @semana', () => {
    const result = parseInput('Review do código @semana');
    expect(result.due_date).toBeTruthy();
  });

  it('detects @ritual and sets ritual_period', () => {
    const result = parseInput('Meditação @ritual');
    expect(result.ritual_period).toBeTruthy();
  });

  it('detects time "as 14:30"', () => {
    const result = parseInput('Reunião as 14:30');
    expect(result.due_time).toBe('14:30');
  });

  it('detects time "às 9h"', () => {
    const result = parseInput('Standup às 9h');
    expect(result.due_time).toBe('09:00');
  });

  // ─── Combined ──────────────────────────────────
  it('parses complex input with multiple tokens', () => {
    const result = parseInput('Deploy MindRoot #mod_work #prio_urgente @hoje as 15:00 #emo_focado #needs_checkin');
    expect(result.title).toBe('Deploy MindRoot');
    expect(result.module).toBe('work');
    expect(result.priority).toBe('urgente');
    expect(result.due_date).toBeTruthy();
    expect(result.due_time).toBe('15:00');
    expect(result.emotion_before).toBe('focado');
    expect(result.needs_checkin).toBe(true);
  });

  // ─── Non-system tags ──────────────────────────
  it('collects non-system tags', () => {
    const result = parseInput('Estudar React #frontend #study');
    expect(result.tags).toContain('frontend');
    expect(result.tags).toContain('study');
  });

  // ─── Default type ─────────────────────────────
  it('defaults to task when no type token', () => {
    const result = parseInput('Algo simples');
    expect(result.type).toBe('task');
  });

  // ─── Context preserved ────────────────────────
  it('preserves original input as context', () => {
    const raw = 'Teste #mod_work @hoje';
    const result = parseInput(raw);
    expect(result.context).toBe(raw);
  });

  // ─── Energy cost ─────────────────────────────
  it('detects #energy_3', () => {
    const result = parseInput('Treino pesado #energy_3');
    expect(result.energy_cost).toBe(3);
  });

  it('detects #energy_5 as max', () => {
    const result = parseInput('Sprint final #energy_5 #mod_work');
    expect(result.energy_cost).toBe(5);
    expect(result.module).toBe('work');
  });

  it('detects #energy_1 as min', () => {
    const result = parseInput('Ler artigo #energy_1');
    expect(result.energy_cost).toBe(1);
  });

  it('returns null energy_cost when no token', () => {
    const result = parseInput('Algo simples');
    expect(result.energy_cost).toBeNull();
  });

  it('removes energy token from title', () => {
    const result = parseInput('Tarefa pesada #energy_4');
    expect(result.title).toBe('Tarefa pesada');
  });
});
