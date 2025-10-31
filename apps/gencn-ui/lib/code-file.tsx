'use server';

import { readFileSync } from 'fs';
import { join } from 'path';
import { codeToHtml } from 'shiki';
import { CodeBlock, Pre } from 'fumadocs-ui/components/codeblock';

interface CodeFileProps {
  path: string;
  language?: string;
}

export async function CodeFile({ path, language }: CodeFileProps) {
  const fullPath = join(process.cwd(), path);
  const code = readFileSync(fullPath, 'utf-8');
  const lang = language || path.split('.').pop() || 'tsx';
  
  const highlightedCode = await codeToHtml(code, {
    lang,
    themes: {
      light: 'github-light',
      dark: 'github-dark',
    },
  });

  return (
    <CodeBlock lang={lang}>
      <Pre dangerouslySetInnerHTML={{ __html: highlightedCode }} className='not-prose dark:not-prose-invert'/>
    </CodeBlock>
  );
}

