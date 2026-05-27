import type { PaginatedRequest } from '$lib/holocene/table/paginated-table/api-paginated.svelte';
import type { DatasetType } from '$lib/utilities/duckalitics-store';
import { saveDataset } from '$lib/utilities/duckalitics-store';

const PAGE_SIZE = 1000;

export async function exportAllToJsonl<T>(
  fetchFn: PaginatedRequest<T>,
  type: DatasetType,
  namespace: string,
  onProgress?: (count: number) => void,
): Promise<void> {
  const lines: string[] = [];
  let token = '';

  do {
    const { items, nextPageToken } = await fetchFn(PAGE_SIZE, token);
    for (const item of items) {
      lines.push(JSON.stringify(item));
    }
    token = nextPageToken;
    onProgress?.(lines.length);
  } while (token !== '');

  saveDataset(type, namespace, lines.join('\n'));
}
