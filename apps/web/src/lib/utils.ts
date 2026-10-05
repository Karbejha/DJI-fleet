import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "0s";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

export function formatDistance(meters: number): string {
  if (!meters || isNaN(meters)) return "0 m";
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  }
  return `${meters.toFixed(0)} m`;
}

export function formatSpeed(mps: number): string {
  if (!mps || isNaN(mps)) return "0.0 m/s";
  return `${mps.toFixed(1)} m/s`;
}

export function formatAltitude(meters: number): string {
  if (!meters || isNaN(meters)) return "0 m";
  return `${meters.toFixed(1)} m`;
}
