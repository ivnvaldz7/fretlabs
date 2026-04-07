import type { FretboardConfig } from '../modules/calculator/types';

const HASH_KEY = 'cfg';

type UrlPayloadV1 = {
  v: 1;
  config: FretboardConfig;
};

function base64UrlEncode(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  const b64 = btoa(bin);
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlDecodeToBytes(b64url: string): Uint8Array {
  const padded = b64url
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(b64url.length / 4) * 4, '=');
  const bin = atob(padded);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function encodeUtf8(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

function decodeUtf8(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

function readCfgFromHash(hash: string): string | null {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  if (!raw) return null;
  const params = new URLSearchParams(raw);
  return params.get(HASH_KEY);
}

function writeCfgToHash(cfg: string): string {
  const params = new URLSearchParams();
  params.set(HASH_KEY, cfg);
  return `#${params.toString()}`;
}

export function serializeConfigToHash(config: FretboardConfig): string {
  const payload: UrlPayloadV1 = { v: 1, config };
  const json = JSON.stringify(payload);
  const encoded = base64UrlEncode(encodeUtf8(json));
  return writeCfgToHash(encoded);
}

export function parseConfigFromHash(hash: string): unknown | null {
  const cfg = readCfgFromHash(hash);
  if (!cfg) return null;

  try {
    const json = decodeUtf8(base64UrlDecodeToBytes(cfg));
    return JSON.parse(json) as unknown;
  } catch {
    return null;
  }
}

export function isUrlPayloadV1(x: unknown): x is UrlPayloadV1 {
  if (!x || typeof x !== 'object') return false;
  const rec = x as Record<string, unknown>;
  return rec.v === 1 && typeof rec.config === 'object' && rec.config !== null;
}

