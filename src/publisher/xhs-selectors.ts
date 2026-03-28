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
  // Login
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

  // Publish page tabs
  creatorTab: {
    primary: 'div.creator-tab',
    fallbacks: ['.publish-tab', '[role="tab"]'],
    description: 'Creator center publish tab',
  },

  // Image upload
  uploadInputFirst: {
    primary: '.upload-input',
    fallbacks: ['input[type="file"][accept*="image"]', '.upload-wrapper input'],
    description: 'First image upload input',
  },
  uploadInputSubsequent: {
    primary: 'input[type="file"]',
    fallbacks: ['.upload-input', '.add-image input'],
    description: 'Subsequent image upload input',
  },
  imagePreviewArea: {
    primary: '.img-preview-area .pr',
    fallbacks: ['.image-preview .item', '.upload-preview img'],
    description: 'Image preview thumbnail',
  },

  // Content input
  titleInput: {
    primary: 'div.d-input input',
    fallbacks: ['input[placeholder*="标题"]', '.title-container input', '.title-input input'],
    description: 'Note title input field',
  },
  bodyEditor: {
    primary: 'div.ql-editor',
    fallbacks: ['[role="textbox"]', '[contenteditable="true"]', '[data-placeholder*="正文"]'],
    description: 'Note body rich text editor',
  },

  // Visibility
  visibilityDropdown: {
    primary: 'div.permission-card-wrapper div.d-select-content',
    fallbacks: ['.permission-select', '.visibility-select .d-select-content'],
    description: 'Visibility dropdown trigger',
  },
  visibilityOptions: {
    primary: 'div.d-options-wrapper div.d-grid-item div.custom-option',
    fallbacks: ['.d-options-wrapper .option', '.permission-options .item'],
    description: 'Visibility dropdown option items',
  },

  // Publish button
  publishBtn: {
    primary: '.publish-page-publish-btn button.bg-red',
    fallbacks: ['button.publish-btn', '.publish-page-publish-btn button:not([disabled])'],
    description: 'Publish submit button',
  },

  // Popover overlay
  popover: {
    primary: 'div.d-popover',
    fallbacks: ['.popover-mask', '.modal-overlay'],
    description: 'Blocking popover overlay',
  },

  // Title length warning
  titleLengthWarning: {
    primary: 'div.title-container div.max_suffix',
    fallbacks: ['.title-limit-warning'],
    description: 'Title too long warning',
  },

  // Body length error
  bodyLengthError: {
    primary: 'div.edit-container div.length-error',
    fallbacks: ['.content-length-error'],
    description: 'Body content too long error',
  },
};

// Legacy flat selector map for backward compatibility
export const SEL = Object.fromEntries(
  Object.entries(SELECTORS).map(([key, def]) => [key, def.primary]),
) as Record<keyof typeof SELECTORS, string>;
