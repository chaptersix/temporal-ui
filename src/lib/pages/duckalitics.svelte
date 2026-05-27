<script lang="ts">
  import type { AsyncDuckDB } from '@duckdb/duckdb-wasm';
  import { BROWSER } from 'esm-env';
  import { onMount } from 'svelte';

  import FileTree from '$lib/components/duckalitics/file-tree.svelte';
  import ResultsTable from '$lib/components/duckalitics/results-table.svelte';
  import SqlEditor from '$lib/components/duckalitics/sql-editor.svelte';
  import Button from '$lib/holocene/button.svelte';
  import { translate } from '$lib/i18n/translate';
  import type { DuckaliticsDataset } from '$lib/utilities/duckalitics-store';
  import {
    getDatasetContent,
    getIndex,
  } from '$lib/utilities/duckalitics-store';

  let datasets: DuckaliticsDataset[] = $state([]);
  let selected: string | null = $state(null);
  let initError: string | null = $state(null);
  let initializing = $state(true);
  let db: AsyncDuckDB | null = $state(null);

  let sqlValue = $state(
    `SELECT
  name,
  id,
  status,
  taskQueue,
  startTime,
  endTime,
  historySizeBytes,
  stateTransitionCount
FROM read_json_auto('/workflows/default.jsonl')
WHERE status = 'Running'
ORDER BY historySizeBytes DESC
LIMIT 100;`,
  );
  let running = $state(false);
  let queryError: string | null = $state(null);
  let resultColumns: string[] = $state([]);
  let resultRows: Record<string, unknown>[] = $state([]);
  let resultCount = $state(0);
  let executionMs = $state(0);

  const refreshDatasets = () => {
    datasets = getIndex();
  };

  onMount(() => {
    refreshDatasets();
  });

  onMount(async () => {
    if (!BROWSER) return;
    try {
      const { getJsDelivrBundles, selectBundle, AsyncDuckDB, ConsoleLogger } =
        await import('@duckdb/duckdb-wasm');

      const bundle = await selectBundle(getJsDelivrBundles());
      const workerUrl = URL.createObjectURL(
        new Blob([`importScripts("${bundle.mainWorker!}");`], {
          type: 'text/javascript',
        }),
      );
      const worker = new Worker(workerUrl);
      const logger = new ConsoleLogger();
      const instance = new AsyncDuckDB(logger, worker);
      await instance.instantiate(bundle.mainModule, bundle.pthreadWorker);

      for (const dataset of getIndex()) {
        const content = getDatasetContent(dataset.key);
        if (content) {
          await instance.registerFileText(
            `/${dataset.type}/${dataset.namespace}.jsonl`,
            content,
          );
        }
      }

      db = instance;
      initializing = false;
    } catch (e) {
      initError = (e as Error).message;
      initializing = false;
    }
  });

  const runQuery = async (query: string) => {
    if (!db) return;
    running = true;
    queryError = null;
    const start = Date.now();
    try {
      const conn = await db.connect();
      const result = await conn.query(query);
      await conn.close();

      const schema = result.schema.fields.map((f) => f.name);
      const rowData = result.toArray().map((row) => {
        const obj: Record<string, unknown> = {};
        for (const col of schema) {
          obj[col] = row[col];
        }
        return obj;
      });
      resultColumns = schema;
      resultRows = rowData;
      resultCount = rowData.length;
      executionMs = Date.now() - start;
    } catch (e) {
      queryError = (e as Error).message;
    } finally {
      running = false;
    }
  };
</script>

<div class="flex h-full overflow-hidden">
  <div class="w-64 shrink-0 overflow-y-auto border-r border-subtle p-4">
    <h2 class="mb-3 text-sm font-semibold">
      {translate('duckalitics.file-tree-title')}
    </h2>
    <FileTree
      {datasets}
      {selected}
      onSelect={(d) => (selected = d.key)}
      onDelete={refreshDatasets}
    />
  </div>

  <div class="flex flex-1 flex-col overflow-hidden">
    {#if initializing}
      <div
        class="flex h-full items-center justify-center text-sm text-secondary"
      >
        {translate('duckalitics.initializing')}
      </div>
    {:else if initError}
      <div class="p-4 text-sm text-danger">
        {translate('duckalitics.init-error')}: {initError}
      </div>
    {:else}
      <div class="flex flex-1 flex-col gap-4 overflow-hidden p-4">
        <div class="flex flex-col gap-2">
          <SqlEditor bind:value={sqlValue} onRun={runQuery} />
          <div class="flex items-center gap-2">
            <Button
              on:click={() => runQuery(sqlValue)}
              disabled={running}
              size="sm"
              leadingIcon="play"
            >
              {running
                ? translate('duckalitics.running')
                : translate('duckalitics.run')}
            </Button>
            <span class="text-xs text-secondary">Cmd+Enter to run</span>
          </div>
        </div>

        {#if queryError}
          <div
            class="rounded border border-danger p-3 font-mono text-sm text-danger"
          >
            {queryError}
          </div>
        {:else}
          <div class="flex-1 overflow-auto">
            <ResultsTable
              columns={resultColumns}
              rows={resultRows}
              rowCount={resultCount}
              {executionMs}
            />
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>
