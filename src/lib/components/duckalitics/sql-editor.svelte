<script lang="ts">
  import { autocompletion, closeBrackets } from '@codemirror/autocomplete';
  import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
  import { PostgreSQL, sql } from '@codemirror/lang-sql';
  import { syntaxHighlighting } from '@codemirror/language';
  import { EditorState } from '@codemirror/state';
  import { EditorView, keymap, lineNumbers } from '@codemirror/view';
  import { onDestroy, onMount } from 'svelte';

  import { useDarkMode } from '$lib/utilities/dark-mode';
  import {
    getEditorThemeWithLineNumbers,
    highlightStyles,
  } from '$lib/vendor/codemirror/custom-extensions';

  interface Props {
    value: string;
    onRun: (sql: string) => void;
  }

  let { value = $bindable(''), onRun }: Props = $props();

  let container: HTMLDivElement;
  let view: EditorView;

  onMount(() => {
    view = new EditorView({
      state: EditorState.create({
        doc: value,
        extensions: [
          sql({ dialect: PostgreSQL }),
          history(),
          autocompletion(),
          closeBrackets(),
          lineNumbers(),
          getEditorThemeWithLineNumbers($useDarkMode, false),
          syntaxHighlighting(highlightStyles, { fallback: true }),
          keymap.of([
            ...defaultKeymap,
            ...historyKeymap,
            {
              key: 'Mod-Enter',
              run: () => {
                onRun(view.state.doc.toString());
                return true;
              },
            },
          ]),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              value = update.state.doc.toString();
            }
          }),
        ],
      }),
      parent: container,
    });
  });

  onDestroy(() => view?.destroy());
</script>

<div
  bind:this={container}
  class="min-h-[120px] overflow-hidden rounded border border-subtle font-mono text-sm"
></div>
