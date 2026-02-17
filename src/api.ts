import type { ServerInitiative, ServerInitiativeDetail, ServerDirectory, SearchResult, AppConfig } from './types';

export async function fetchConfig(): Promise<AppConfig> {
  const res = await fetch('/api/config');
  if (!res.ok) throw new Error('Failed to fetch config');
  return res.json();
}

export async function updateConfig(config: AppConfig): Promise<{ success: boolean; message: string }> {
  const res = await fetch('/api/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to update config');
  }
  return res.json();
}

export async function fetchDirectories(): Promise<ServerDirectory[]> {
  const res = await fetch('/api/directories');
  if (!res.ok) throw new Error('Failed to fetch directories');
  return res.json();
}

export async function fetchInitiatives(directory?: string): Promise<ServerInitiative[]> {
  const params = directory ? `?directory=${encodeURIComponent(directory)}` : '';
  const res = await fetch(`/api/initiatives${params}`);
  if (!res.ok) throw new Error('Failed to fetch initiatives');
  return res.json();
}

export async function fetchInitiativeDetail(id: string, directory?: string): Promise<ServerInitiativeDetail> {
  const params = directory ? `?directory=${encodeURIComponent(directory)}` : '';
  const res = await fetch(`/api/initiatives/${encodeURIComponent(id)}${params}`);
  if (!res.ok) throw new Error(`Failed to fetch initiative ${id}`);
  return res.json();
}

export async function searchInitiatives(query: string, directory?: string): Promise<SearchResult[]> {
  const params = new URLSearchParams({ q: query });
  if (directory) params.set('directory', directory);
  const res = await fetch(`/api/search?${params}`);
  if (!res.ok) throw new Error('Search failed');
  return res.json();
}

export async function createInitiative(data: { id: string; name: string; type?: string; directory?: string }): Promise<{ success: boolean; id: string }> {
  const res = await fetch('/api/initiatives', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create initiative');
  }
  return res.json();
}

export async function addNote(id: string, note: string, directory?: string): Promise<{ success: boolean }> {
  const res = await fetch(`/api/initiatives/${encodeURIComponent(id)}/note`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ note, directory }),
  });
  if (!res.ok) throw new Error('Failed to add note');
  return res.json();
}

export async function addComm(
  id: string,
  data: { channel: string; link: string; context: string; directory?: string }
): Promise<{ success: boolean }> {
  const res = await fetch(`/api/initiatives/${encodeURIComponent(id)}/comm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to add communication');
  return res.json();
}

export async function updateFile(
  id: string,
  fileName: 'readme' | 'notes' | 'comms' | 'links',
  content: string,
  directory?: string
): Promise<{ success: boolean }> {
  const res = await fetch(
    `/api/initiatives/${encodeURIComponent(id)}/file/${fileName}?directory=${encodeURIComponent(directory || '')}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, directory }),
    }
  );
  if (!res.ok) throw new Error('Failed to update file');
  return res.json();
}
