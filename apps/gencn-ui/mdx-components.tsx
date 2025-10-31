import defaultMdxComponents from 'fumadocs-ui/mdx';
import * as FilesComponents from 'fumadocs-ui/components/files';
import * as TabsComponents from 'fumadocs-ui/components/tabs';
import type { MDXComponents } from 'mdx/types';
import { Accordion, Accordions } from 'fumadocs-ui/components/accordion';
import * as icons from 'lucide-react';
import { AnchorHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import { createRelativeLink } from 'fumadocs-ui/mdx';
import { source } from '@/lib/source';
import { isValidElement } from 'react';
import * as CodeBlockComponents from 'fumadocs-ui/components/codeblock';
import { CodeBlock, Pre } from 'fumadocs-ui/components/codeblock';
//import { CodeBlock } from '@/components/codeblock';
import * as Twoslash from 'fumadocs-twoslash/ui';
import { Callout } from 'fumadocs-ui/components/callout';
import * as StepsComponents from 'fumadocs-ui/components/steps';
import { Mermaid } from '@/lib/mermaid';

export function getMDXComponents(components?: MDXComponents,page?: any): MDXComponents {
  return {
    ...(icons as unknown as MDXComponents),
    ...defaultMdxComponents,
    ...TabsComponents,
    ...FilesComponents,
    ...CodeBlockComponents,
    ...StepsComponents,
    Callout,
    Accordion,
    Accordions,
    ...Twoslash,
    Mermaid,
    ...components,
  };
}

declare module 'mdx/types.js' {
  // Augment the MDX types to make it understand React.
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    type Element = React.JSX.Element;
    type ElementClass = React.JSX.ElementClass;
    type ElementType = React.JSX.ElementType;
    type IntrinsicElements = React.JSX.IntrinsicElements;
  }
}

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}