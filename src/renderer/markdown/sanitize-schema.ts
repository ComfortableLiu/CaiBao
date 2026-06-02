import { defaultSchema } from 'rehype-sanitize';

/** KaTeX 输出的 MathML 标签（保留 HTML 回退时也可省略，但一并放行） */
const MATHML_TAG_NAMES = [
  'math',
  'semantics',
  'mrow',
  'mi',
  'mo',
  'mn',
  'msup',
  'msub',
  'mfrac',
  'mtext',
  'annotation',
  'menclose',
  'mstyle',
  'mspace',
  'mpadded',
  'mphantom',
  'mfenced',
  'mtable',
  'mtr',
  'mtd',
  'mlabeledtr',
  'maligngroup',
  'malignmark',
  'munder',
  'mover',
  'munderover',
  'msqrt',
  'mroot',
] as const;

const katexClass = /^katex(-|$)/;

/** 允许 highlight.js、KaTeX 注入的 class / 属性，与 rehype-sanitize 配合使用 */
export const markdownSanitizeSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), ...MATHML_TAG_NAMES],
  attributes: {
    ...defaultSchema.attributes,
    code: [
      ...(defaultSchema.attributes?.code ?? []),
      ['className', /^language-./, 'hljs', 'language-math', 'math-inline', 'math-display'],
    ],
    pre: [...(defaultSchema.attributes?.pre ?? []), ['className', 'hljs', 'math-display']],
    div: [...(defaultSchema.attributes?.div ?? []), ['className', katexClass]],
    span: [
      ...(defaultSchema.attributes?.span ?? []),
      ['className', /^hljs-|^katex/],
      ['style'],
      ['ariaHidden'],
    ],
    math: [...(defaultSchema.attributes?.math ?? []), 'xmlns', 'display'],
    semantics: [...(defaultSchema.attributes?.semantics ?? []), 'ariaHidden'],
    annotation: [...(defaultSchema.attributes?.annotation ?? []), 'encoding'],
    mrow: [...(defaultSchema.attributes?.mrow ?? [])],
    mi: [...(defaultSchema.attributes?.mi ?? []), 'mathvariant'],
    mo: [...(defaultSchema.attributes?.mo ?? []), 'stretchy', 'fence', 'separator'],
    mn: [...(defaultSchema.attributes?.mn ?? [])],
  },
};
