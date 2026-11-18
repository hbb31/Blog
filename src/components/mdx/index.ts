import Callout from './Callout.astro';
import PullQuote from './PullQuote.astro';
import Figure from './Figure.astro';

/** Components passed to <Content components={...} /> for post and page bodies. */
export const mdxComponents = { Callout, PullQuote, img: Figure };
