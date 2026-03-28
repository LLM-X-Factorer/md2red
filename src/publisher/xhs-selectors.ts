export const XHS_URLS = {
  explore: 'https://www.xiaohongshu.com/explore',
  publish: 'https://creator.xiaohongshu.com/publish/publish?source=official',
} as const;

export interface SelectorDef {
  primary: string;
  fallbacks: string[];
  description: string;
}

export const SELECTORS: Record<string, SelectorDef> = {
  // Login (on explore page)
  loginQrCode: {
    primary: '.login-container .qrcode-img',
    fallbacks: ['.qrcode-img', 'img[src*="qrcode"]'],
    description: 'Login QR code image',
  },
  loginSuccess: {
    primary: '.main-container .user .link-wrapper .channel',
    fallbacks: ['.sidebar .user-info', '.user .channel'],
    description: 'Logged-in user indicator',
  },

  // Tab (text-based matching needed, not CSS selector alone)
  creatorTab: {
    primary: 'span.title',
    fallbacks: ['div.creator-tab', '[role="tab"]'],
    description: 'Creator center tab items (match by text)',
  },

  // Image upload
  uploadInputFirst: {
    primary: '.upload-input',
    fallbacks: ['input[type="file"][accept*="image"]', 'input[type="file"]'],
    description: 'Image upload file input (hidden, use locator)',
  },
  uploadInputSubsequent: {
    primary: 'input[type="file"]',
    fallbacks: ['.upload-input'],
    description: 'Subsequent image upload input',
  },
  imagePreviewItem: {
    primary: '.img-item',
    fallbacks: ['.image-item', '.upload-preview img', '.cover-image'],
    description: 'Uploaded image preview item',
  },

  // Content input
  titleInput: {
    primary: 'input.d-text[placeholder*="标题"]',
    fallbacks: ['input[placeholder*="标题"]', 'input.d-text[type="text"]'],
    description: 'Note title input field',
  },
  bodyEditor: {
    primary: 'div.tiptap.ProseMirror[role="textbox"]',
    fallbacks: ['[role="textbox"][contenteditable="true"]', 'div.ProseMirror', 'div.ql-editor'],
    description: 'Note body rich text editor (TipTap/ProseMirror)',
  },

  // Visibility
  visibilityDropdown: {
    primary: '.permission-card-select .d-select-content',
    fallbacks: ['.permission-card-wrapper .d-select-content', 'div.permission-card-wrapper div.d-select-content'],
    description: 'Visibility dropdown trigger',
  },
  visibilityOptions: {
    primary: '.d-options-wrapper .d-grid-item .custom-option',
    fallbacks: ['.d-options-wrapper .custom-option', '.d-options .d-grid-item'],
    description: 'Visibility dropdown option items',
  },

  // Publish button (match by text "发布")
  publishBtn: {
    primary: 'button.d-button:has-text("发布")',
    fallbacks: ['.publish-page-publish-btn button', 'button.bg-red'],
    description: 'Publish submit button',
  },

  // Topic/tag button
  topicBtn: {
    primary: 'button.topic-btn',
    fallbacks: ['button:has-text("话题")'],
    description: 'Topic/hashtag button in editor toolbar',
  },

  // Popover overlay
  popover: {
    primary: 'div.d-popover',
    fallbacks: ['.popover-mask', '.modal-overlay'],
    description: 'Blocking popover overlay',
  },
};

// Legacy flat selector map
export const SEL = Object.fromEntries(
  Object.entries(SELECTORS).map(([key, def]) => [key, def.primary]),
) as Record<keyof typeof SELECTORS, string>;
