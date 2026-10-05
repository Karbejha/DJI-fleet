const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    let message = errorText;
    try {
      const parsed = JSON.parse(errorText);
      message = parsed.message || errorText;
    } catch (_) {}
    throw new Error(message || `API error: ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Flights
  getFlights: (params?: Record<string, string>) => {
    const qs = params ? new URLSearchParams(params).toString() : '';
    return fetchApi<any>(`/flights?${qs}`);
  },
  getFlight: (id: string) => fetchApi<any>(`/flights/${id}`),
  getFlightTrack: (id: string) => fetchApi<any>(`/flights/${id}/track`),
  getFlightTelemetry: (id: string, resolution = 'all') =>
    fetchApi<any>(`/flights/${id}/telemetry?resolution=${resolution}`),
  getFlightEvents: (id: string) => fetchApi<any>(`/flights/${id}/events`),
  deleteFlight: (id: string) => fetchApi<any>(`/flights/${id}`, { method: 'DELETE' }),

  // Fleet
  getDrones: () => fetchApi<any>('/fleet/drones'),
  getDrone: (id: string) => fetchApi<any>(`/fleet/drones/${id}`),
  getBatteries: () => fetchApi<any>('/fleet/batteries'),
  getBattery: (id: string) => fetchApi<any>(`/fleet/batteries/${id}`),
  getPilots: () => fetchApi<any>('/fleet/pilots'),
  getMissions: () => fetchApi<any>('/fleet/missions'),

  // Analytics
  getDashboard: () => fetchApi<any>('/analytics/dashboard'),

  // GIS
  getMapTracks: () => fetchApi<any>('/gis/map-tracks'),
  queryGis: (body: any) => fetchApi<any>('/gis/query', { method: 'POST', body: JSON.stringify(body) }),

  // Imports
  uploadFile: async (file: File, apiKey?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (apiKey) formData.append('apiKey', apiKey);

    const res = await fetch(`${API_BASE}/imports/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      throw new Error(`Upload failed: ${res.statusText}`);
    }
    return res.json();
  },
  getFileInspector: (id: string) => fetchApi<any>(`/files/${id}`),

  // Reports
  getFlightReport: (id: string) => fetchApi<any>(`/flights/${id}/report`),
};
