<script lang="ts">
  import Button from '$lib/holocene/button.svelte';
  import Icon from '$lib/holocene/icon/icon.svelte';
  import { translate } from '$lib/i18n/translate';
  import type { DuckaliticsDataset } from '$lib/utilities/duckalitics-store';
  import { deleteDataset } from '$lib/utilities/duckalitics-store';

  interface Props {
    datasets: DuckaliticsDataset[];
    onSelect: (dataset: DuckaliticsDataset) => void;
    onDelete: () => void;
    selected: string | null;
  }

  let { datasets, onSelect, onDelete, selected }: Props = $props();

  const FOLDERS = ['workflows', 'activities', 'schedules'] as const;

  let folderOpen = $state<Record<string, boolean>>({
    workflows: true,
    activities: true,
    schedules: true,
  });

  const grouped = $derived(
    Object.fromEntries(
      FOLDERS.map((f) => [f, datasets.filter((d) => d.type === f)]),
    ),
  );

  const handleDelete = (dataset: DuckaliticsDataset, e: MouseEvent) => {
    e.stopPropagation();
    deleteDataset(dataset.key);
    onDelete();
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };
</script>

<div class="flex flex-col gap-1 text-sm">
  {#if datasets.length === 0}
    <p class="text-xs text-secondary">{translate('duckalitics.no-datasets')}</p>
  {:else}
    {#each FOLDERS as folder}
      {#if grouped[folder].length > 0}
        <button
          class="flex items-center gap-1 font-medium hover:text-primary"
          onclick={() => (folderOpen[folder] = !folderOpen[folder])}
        >
          <Icon name={folderOpen[folder] ? 'chevron-down' : 'chevron-right'} />
          <Icon name="folders" />
          {folder}
        </button>
        {#if folderOpen[folder]}
          {#each grouped[folder] as dataset (dataset.key)}
            <div
              class="flex cursor-pointer items-center gap-1 rounded pl-6 hover:bg-subtle"
              class:bg-interactive-active={selected === dataset.key}
              onclick={() => onSelect(dataset)}
              role="button"
              tabindex="0"
              onkeydown={(e) => e.key === 'Enter' && onSelect(dataset)}
            >
              <Icon name="json" />
              <span class="flex-1 truncate text-xs"
                >{dataset.namespace}.jsonl</span
              >
              <span class="text-xs text-secondary"
                >{formatSize(dataset.sizeBytes)}</span
              >
              <Button
                size="xs"
                variant="ghost"
                on:click={(e) => handleDelete(dataset, e)}
                aria-label={translate('duckalitics.delete-dataset')}
              >
                <Icon name="trash" />
              </Button>
            </div>
          {/each}
        {/if}
      {/if}
    {/each}
  {/if}
</div>
