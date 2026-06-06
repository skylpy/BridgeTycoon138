// 通用工具函数：金币格式化、时间格式化、数字兜底和颜色解析。
import { Color } from 'cc';

export function formatCoins(value: number): string {
  const safeValue = Math.max(0, Math.floor(safeNumber(value, 0)));
  if (safeValue < 1000) {
    return `${safeValue}`;
  }
  if (safeValue < 1000000) {
    return `${(safeValue / 1000).toFixed(2)}K`;
  }
  if (safeValue < 1000000000) {
    return `${(safeValue / 1000000).toFixed(2)}M`;
  }
  return `${(safeValue / 1000000000).toFixed(2)}B`;
}

export function formatTime(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(safeNumber(seconds, 0)));
  if (safeSeconds < 60) {
    return `${safeSeconds}秒`;
  }
  if (safeSeconds < 3600) {
    const minutes = Math.floor(safeSeconds / 60);
    const remainSeconds = safeSeconds % 60;
    return `${minutes}分${remainSeconds}秒`;
  }
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  return `${hours}小时${minutes}分`;
}

export function safeNumber(value: unknown, defaultValue: number): number {
  const numberValue = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  if (Number.isFinite(numberValue)) {
    return numberValue;
  }
  return defaultValue;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function parseColorHex(hex: string): Color {
  const normalized = hex.startsWith('#') ? hex.slice(1) : hex;
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return new Color(255, 255, 255, 255);
  }
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return new Color(r, g, b, 255);
}

