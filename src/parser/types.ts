export interface ParsedDocument {
  frontmatter: Record<string, unknown>;
  title: string;
  coverText?: string;
  contentBlocks: ContentBlock[];
  images: ImageReference[];
  metadata: {
    wordCount: number;
    estimatedCards: number;
    hasCodeBlocks: boolean;
    sourceFile: string;
  };
}

export interface ContentBlock {
  id: string;
  type: 'heading-section' | 'code-block' | 'image-block' | 'mixed';
  heading?: string;
  textContent: string;
  markdownContent: string;
  codeSnippets?: CodeSnippet[];
  images?: ImageReference[];
  estimatedLength: 'short' | 'medium' | 'long';
}

export interface CodeSnippet {
  language: string;
  code: string;
  filename?: string;
}

export interface ImageReference {
  originalPath: string;
  localPath: string;
  alt: string;
  isLocal: boolean;
}
