const INDEX_KEY = 'duckalitics:index';

export type DatasetType = 'workflows' | 'activities' | 'schedules';

export type DuckaliticsDataset = {
  key: string;
  type: DatasetType;
  namespace: string;
  label: string;
  savedAt: string;
  sizeBytes: number;
};

export function getIndex(): DuckaliticsDataset[] {
  try {
    return JSON.parse(localStorage.getItem(INDEX_KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function saveDataset(
  type: DatasetType,
  namespace: string,
  jsonlContent: string,
): void {
  const key = `duckalitics:${type}:${namespace}:${new Date().toISOString()}`;
  const entry: DuckaliticsDataset = {
    key,
    type,
    namespace,
    label: `${type}/${namespace}.jsonl`,
    savedAt: new Date().toISOString(),
    sizeBytes: new TextEncoder().encode(jsonlContent).length,
  };
  localStorage.setItem(key, jsonlContent);
  const index = getIndex();
  index.push(entry);
  localStorage.setItem(INDEX_KEY, JSON.stringify(index));
}

export function getDatasetContent(key: string): string | null {
  return localStorage.getItem(key);
}

export function deleteDataset(key: string): void {
  localStorage.removeItem(key);
  const index = getIndex().filter((d) => d.key !== key);
  localStorage.setItem(INDEX_KEY, JSON.stringify(index));
}
