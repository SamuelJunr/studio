
// Tipos para os dados que serão armazenados

export interface StoredDataPoint {
  timestamp: string; // ISO string
  value: number;
  filterId: string;
}

export interface AppSession {
  id: string; // startTime ISO string, usado como ID
  startTime: string; // ISO string
  endTime: string | null; // ISO string
  durationMs: number | null;
}

export interface TestRun {
  id: string; // gerado com crypto.randomUUID()
  filterId: string;
  filterName: string;
  startTime: string; // ISO string
  endTime: string | null; // ISO string
  status: 'running' | 'completed' | 'stopped' | 'aborted'; // Adicionado 'aborted'
  loggedData: StoredDataPoint[];
  testDurationSeconds?: number; // Duração definida para o teste
  // initialRemainingSeconds?: number; // Removido, usar testDurationSeconds
}

// Tipo para dados ao vivo na UI, pode ser diferente de StoredDataPoint
export interface LiveDataPoint {
  timestamp: Date;
  value: number;
  filterId: string;
}
