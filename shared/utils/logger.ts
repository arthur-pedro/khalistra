export type StructuredLogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface StructuredLogEntry {
  action: string;
  matchId?: string;
  playerId?: string;
  level?: StructuredLogLevel;
  context?: Record<string, unknown>;
}

export interface EnrichedLogEntry extends StructuredLogEntry {
  timestamp: string;
}

const toIsoString = () => new Date().toISOString();

export const createLogEntry = (entry: StructuredLogEntry): EnrichedLogEntry => ({
  level: 'info',
  ...entry,
  timestamp: toIsoString(),
});

const defaultWriter = (payload: EnrichedLogEntry) => {
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  console.log(payload);
};

export const logStructuredEvent = (
  entry: StructuredLogEntry,
  writer: (payload: EnrichedLogEntry) => void = defaultWriter,
): EnrichedLogEntry => {
  const enriched = createLogEntry(entry);
  writer(enriched);
  return enriched;
};
