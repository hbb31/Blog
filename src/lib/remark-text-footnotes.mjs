/**
 * Makes footnotes survive the Keystatic editor.
 *
 * Keystatic's rich-text editor doesn't know GFM footnotes, so when a post is
 * saved from the CMS, `[^1]` is written as `\[^1]` and would render as plain
 * text. This plugin turns literal `[^id]` text back into footnote references,
 * and paragraphs starting with `[^id]: ` into footnote definitions. Real GFM
 * footnotes written in a code editor keep working as before.
 *
 * In the CMS: type `[^1]` where the marker goes, and a paragraph
 * `[^1]: The note text.` at the end of the post.
 * @returns {(tree: any) => void}
 */
export function remarkTextFootnotes() {
  return (tree) => {
    convertDefinitions(tree);
    convertReferences(tree);
  };
}

const DEF = /^\[\^([\w-]+)\]:\s*/;
const REF = /\[\^([\w-]+)\]/g;

/** @param {any} parent */
function convertDefinitions(parent) {
  if (!parent.children) return;
  parent.children = parent.children.map((node) => {
    const first = node.type === 'paragraph' ? node.children?.[0] : undefined;
    const m = first?.type === 'text' ? DEF.exec(first.value) : null;
    if (m) {
      const rest = first.value.slice(m[0].length);
      const children = rest ? [{ ...first, value: rest }, ...node.children.slice(1)] : node.children.slice(1);
      return {
        type: 'footnoteDefinition',
        identifier: m[1].toLowerCase(),
        label: m[1],
        children: [{ type: 'paragraph', children }],
      };
    }
    convertDefinitions(node);
    return node;
  });
}

/** @param {any} parent */
function convertReferences(parent) {
  if (!parent.children || parent.type === 'code' || parent.type === 'inlineCode') return;
  parent.children = parent.children.flatMap((node) => {
    if (node.type !== 'text' || !REF.test(node.value)) {
      convertReferences(node);
      return [node];
    }
    REF.lastIndex = 0;
    const out = [];
    let last = 0;
    for (const m of node.value.matchAll(REF)) {
      if (m.index > last) out.push({ type: 'text', value: node.value.slice(last, m.index) });
      out.push({ type: 'footnoteReference', identifier: m[1].toLowerCase(), label: m[1] });
      last = m.index + m[0].length;
    }
    if (last < node.value.length) out.push({ type: 'text', value: node.value.slice(last) });
    return out;
  });
}
