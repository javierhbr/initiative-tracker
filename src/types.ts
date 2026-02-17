
export enum InitiativeStatus {
  IDEA = 'Idea',
  IN_DISCOVERY = 'In discovery',
  IN_PROGRESS = 'In Progress',
  BLOCKED = 'Blocked',
  COMPLETED = 'Delivered'
}

// What the React list/board/sidebar components use
export interface Initiative {
  id: string;
  title: string;
  status: InitiativeStatus;
  type: string;
  targetDeadline: string;
  blockersCount: number;
  directory: string;
}

// Server response types
export interface ServerInitiative {
  id: string;
  name: string;
  status: string;
  type: string;
  deadline: string;
  blockers: number;
  directory: string;
}

export interface ServerInitiativeDetail {
  id: string;
  readme: string;
  notes: string;
  comms: string;
  links: string;
}

export interface ServerDirectory {
  name: string;
  path: string;
  default: boolean;
}

export interface SearchResult {
  initiative: string;
  file: string;
  matches: { line_num: number; text: string }[];
}

export interface AppConfig {
  server: { host: string; port: number };
  initiativeTypes: string[];
  directories: { name: string; path: string; default: boolean }[];
}

export type ViewMode = 'List' | 'Board';
export type TabName = 'readme' | 'notes' | 'comms' | 'links';

// Map server status strings to enum
export function mapStatus(status: string): InitiativeStatus {
  const statusMap: Record<string, InitiativeStatus> = {
    'Idea': InitiativeStatus.IDEA,
    'In discovery': InitiativeStatus.IN_DISCOVERY,
    'In Progress': InitiativeStatus.IN_PROGRESS,
    'Blocked': InitiativeStatus.BLOCKED,
    'Delivered': InitiativeStatus.COMPLETED,
  };
  return statusMap[status] || InitiativeStatus.IDEA;
}

// Convert server list item to React Initiative
export function toInitiative(si: ServerInitiative): Initiative {
  return {
    id: si.id,
    title: si.name,
    status: mapStatus(si.status),
    type: si.type,
    targetDeadline: si.deadline,
    blockersCount: si.blockers,
    directory: si.directory,
  };
}
