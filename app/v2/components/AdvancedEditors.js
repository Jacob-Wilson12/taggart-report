'use client';

import { useEffect, useState } from 'react';
import { colors, font } from '../lib/theme';
import { Icon } from './Icons';

/**
 * First-class editors for the complex field types that used to deep-link to
 * the legacy admin. Each editor owns an array/object value and calls onSave
 * on change (debounced upstream).
 */

/* ────── TopQueries ──────
 * Shape:  [{ query, position, impressions, clicks, ctr }, ...]
 * Source: Search Console → Top queries report
 */
export function TopQueriesEditor({ value = [], onSave }) {
  const [rows, setRows] = useState(() => sanitizeQueries(value));
  useEffect(() => setRows(sanitizeQueries(value)), [value]);

  const update = (next) => {
    setRows(next);
    onSave(next.filter((r) => r.query || r.impressions || r.clicks));
  };
  const addRow = () =>
    update([...rows, { query: '', position: '', impressions: '', clicks: '', ctr: '' }]);
  const removeRow = (i) => update(rows.filter((_, idx) => idx !== i));
  const setCell = (i, key, v) =>
    update(rows.map((r, idx) => (idx === i ? { ...r, [key]: v } : r)));

  return (
    <EditorFrame hint="Enter up to ~10 queries. Paste from Search Console → Performance.">
      <table style={tableStyle}>
        <thead>
          <tr>
            <Th>Query</Th>
            <Th align="right">Position</Th>
            <Th align="right">Impressions</Th>
            <Th align="right">Clicks</Th>
            <Th align="right">CTR (%)</Th>
            <Th />
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <Td>
                <CellInput value={r.query} onChange={(v) => setCell(i, 'query', v)} placeholder="query text" />
              </Td>
              <Td align="right">
                <CellInput type="number" step="0.1" value={r.position} onChange={(v) => setCell(i, 'position', v)} />
              </Td>
              <Td align="right">
                <CellInput type="number" value={r.impressions} onChange={(v) => setCell(i, 'impressions', v)} />
              </Td>
              <Td align="right">
                <CellInput type="number" value={r.clicks} onChange={(v) => setCell(i, 'clicks', v)} />
              </Td>
              <Td align="right">
                <CellInput type="number" step="0.01" value={r.ctr} onChange={(v) => setCell(i, 'ctr', v)} />
              </Td>
              <Td align="right">
                <RemoveBtn onClick={() => removeRow(i)} />
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
      <AddBtn onClick={addRow}>Add query</AddBtn>
    </EditorFrame>
  );
}

function sanitizeQueries(v) {
  if (!Array.isArray(v)) return [];
  return v.map((r) => ({
    query: r.query ?? r.text ?? '',
    position: r.position ?? '',
    impressions: r.impressions ?? '',
    clicks: r.clicks ?? '',
    ctr: r.ctr ?? '',
  }));
}

/* ────── TrackedKeywords ──────
 * Shape:  [{ keyword, target_position, current_position? }, ...]
 */
export function TrackedKeywordsEditor({ value = [], onSave }) {
  const [rows, setRows] = useState(() => sanitizeKeywords(value));
  useEffect(() => setRows(sanitizeKeywords(value)), [value]);

  const update = (next) => {
    setRows(next);
    onSave(next.filter((r) => r.keyword));
  };
  const addRow = () => update([...rows, { keyword: '', target_position: '', current_position: '' }]);
  const removeRow = (i) => update(rows.filter((_, idx) => idx !== i));
  const setCell = (i, key, v) =>
    update(rows.map((r, idx) => (idx === i ? { ...r, [key]: v } : r)));

  return (
    <EditorFrame hint="Keywords you want to track rank for over time.">
      <table style={tableStyle}>
        <thead>
          <tr>
            <Th>Keyword</Th>
            <Th align="right">Target Position</Th>
            <Th align="right">Current Position</Th>
            <Th />
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <Td>
                <CellInput value={r.keyword} onChange={(v) => setCell(i, 'keyword', v)} placeholder="e.g. ford f-150 burley" />
              </Td>
              <Td align="right">
                <CellInput type="number" step="1" value={r.target_position} onChange={(v) => setCell(i, 'target_position', v)} />
              </Td>
              <Td align="right">
                <CellInput type="number" step="0.1" value={r.current_position} onChange={(v) => setCell(i, 'current_position', v)} />
              </Td>
              <Td align="right">
                <RemoveBtn onClick={() => removeRow(i)} />
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
      <AddBtn onClick={addRow}>Add keyword</AddBtn>
    </EditorFrame>
  );
}

function sanitizeKeywords(v) {
  if (!Array.isArray(v)) return [];
  return v.map((r) => ({
    keyword: r.keyword ?? r.text ?? '',
    target_position: r.target_position ?? r.target ?? '',
    current_position: r.current_position ?? r.current ?? '',
  }));
}

/* ────── PageLinks ──────
 * Shape:  [{ url, label }, ...]
 */
export function PageLinksEditor({ value = [], onSave }) {
  const [rows, setRows] = useState(() => sanitizeLinks(value));
  useEffect(() => setRows(sanitizeLinks(value)), [value]);

  const update = (next) => {
    setRows(next);
    onSave(next.filter((r) => r.url));
  };
  const addRow = () => update([...rows, { url: '', label: '' }]);
  const removeRow = (i) => update(rows.filter((_, idx) => idx !== i));
  const setCell = (i, key, v) =>
    update(rows.map((r, idx) => (idx === i ? { ...r, [key]: v } : r)));

  return (
    <EditorFrame hint="Link out to assets, SOPs, dashboards, or published work.">
      {rows.length === 0 && (
        <div style={{ fontSize: 12, color: colors.textDim, padding: 10 }}>
          No links yet.
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rows.map((r, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8 }}>
            <CellInput value={r.label} onChange={(v) => setCell(i, 'label', v)} placeholder="Label" />
            <CellInput value={r.url} onChange={(v) => setCell(i, 'url', v)} placeholder="https://..." />
            <RemoveBtn onClick={() => removeRow(i)} />
          </div>
        ))}
      </div>
      <AddBtn onClick={addRow}>Add link</AddBtn>
    </EditorFrame>
  );
}

function sanitizeLinks(v) {
  if (!Array.isArray(v)) return [];
  return v.map((r) => ({ url: r.url ?? r.href ?? '', label: r.label ?? r.text ?? '' }));
}

/* ────── Duration ──────
 * Stored as integer seconds; UI is H:MM:SS.
 */
export function DurationEditor({ value, onSave }) {
  const seconds = typeof value === 'number' ? value : parseDuration(value);
  const [text, setText] = useState(formatDuration(seconds));
  useEffect(() => setText(formatDuration(seconds)), [seconds]);

  const commit = (raw) => {
    const parsed = parseDuration(raw);
    if (parsed === null) {
      // Invalid — leave input, don't save
      return;
    }
    onSave(parsed);
  };

  return (
    <input
      type="text"
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => commit(text)}
      placeholder="H:MM:SS or 2:25 or 145s"
      style={{
        padding: '8px 10px',
        borderRadius: 6,
        border: `1px solid ${colors.border}`,
        fontSize: 13,
        fontFamily: 'inherit',
        background: 'white',
        color: colors.text,
        fontVariantNumeric: 'tabular-nums',
        width: '100%',
      }}
    />
  );
}

function parseDuration(raw) {
  if (raw == null || raw === '') return null;
  if (typeof raw === 'number') return Math.round(raw);
  const s = String(raw).trim();
  // bare seconds like "145s"
  const secOnly = s.match(/^(\d+)\s*s?$/i);
  if (secOnly) return parseInt(secOnly[1], 10);
  // mm:ss or hh:mm:ss
  const parts = s.split(':').map((x) => parseInt(x, 10));
  if (parts.some((p) => Number.isNaN(p))) return null;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return null;
}

function formatDuration(seconds) {
  if (seconds == null) return '';
  const s = Number(seconds);
  if (!Number.isFinite(s) || s < 0) return '';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

/* ────── Shared editor chrome ────── */
function EditorFrame({ hint, children }) {
  return (
    <div
      style={{
        background: 'white',
        border: `1px solid ${colors.border}`,
        borderRadius: 6,
        padding: 10,
        fontFamily: font.sans,
      }}
    >
      {hint && (
        <div style={{ fontSize: 11, color: colors.textMuted, marginBottom: 6 }}>
          {hint}
        </div>
      )}
      {children}
    </div>
  );
}

function Th({ children, align = 'left' }) {
  return (
    <th
      style={{
        textAlign: align,
        padding: '6px 8px',
        fontSize: 10,
        fontWeight: 700,
        color: colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        borderBottom: `1px solid ${colors.border}`,
      }}
    >
      {children}
    </th>
  );
}

function Td({ children, align = 'left' }) {
  return (
    <td style={{ padding: '4px 6px', textAlign: align, verticalAlign: 'middle' }}>
      {children}
    </td>
  );
}

function CellInput({ value, onChange, type = 'text', step, placeholder }) {
  return (
    <input
      type={type}
      step={step}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        padding: '5px 8px',
        borderRadius: 4,
        border: `1px solid ${colors.border}`,
        fontSize: 12,
        fontFamily: 'inherit',
        background: 'white',
        color: colors.text,
        fontVariantNumeric: 'tabular-nums',
        width: '100%',
      }}
    />
  );
}

function AddBtn({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        marginTop: 8,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '5px 10px',
        borderRadius: 5,
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer',
        border: `1px solid ${colors.border}`,
        background: colors.brandTint,
        color: colors.brandDark,
        fontFamily: 'inherit',
      }}
    >
      + {children}
    </button>
  );
}

function RemoveBtn({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="Remove row"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 24,
        height: 24,
        borderRadius: 4,
        cursor: 'pointer',
        border: `1px solid ${colors.border}`,
        background: 'white',
        color: colors.textMuted,
        fontFamily: 'inherit',
      }}
    >
      <Icon name="circleBan" size={11} />
    </button>
  );
}

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 12,
};
