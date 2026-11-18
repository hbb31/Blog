/**
 * Removes the <p> wrapper around paragraphs that contain only an image, so the
 * MDX `img` component can render a <figure> (with <figcaption>) as valid HTML.
 * @returns {(tree: any) => void}
 */
export function rehypeUnwrapImages() {
  return (tree) => visit(tree);
}

/** @param {any} node */
function visit(node) {
  if (!node.children) return;
  node.children = node.children.map((child) => {
    if (child.type === 'element' && child.tagName === 'p') {
      const meaningful = child.children.filter((/** @type {any} */ c) => !(c.type === 'text' && c.value.trim() === ''));
      if (meaningful.length === 1 && isImage(meaningful[0])) return meaningful[0];
    }
    visit(child);
    return child;
  });
}

/** @param {any} node */
function isImage(node) {
  return (
    (node.type === 'element' && node.tagName === 'img') ||
    (node.type === 'mdxJsxFlowElement' && node.name === 'img') ||
    (node.type === 'mdxJsxTextElement' && node.name === 'img')
  );
}
