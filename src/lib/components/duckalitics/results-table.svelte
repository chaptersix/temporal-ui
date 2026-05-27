<script lang="ts">
  interface Props {
    columns: string[];
    rows: Record<string, unknown>[];
    rowCount: number;
    executionMs: number;
  }

  let { columns, rows, rowCount, executionMs }: Props = $props();
</script>

{#if columns.length > 0}
  <div class="flex flex-col gap-1">
    <div class="text-xs text-secondary">{rowCount} rows in {executionMs}ms</div>
    <div class="overflow-auto">
      <table class="w-full border-collapse text-sm">
        <thead>
          <tr class="border-b border-subtle">
            {#each columns as col}
              <th class="px-3 py-2 text-left font-medium">{col}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each rows as row, i (i)}
            <tr class="border-b border-subtle hover:bg-subtle">
              {#each columns as col}
                <td class="px-3 py-2 font-mono text-xs">{row[col] ?? ''}</td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
{/if}
