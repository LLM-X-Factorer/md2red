export const XHS_URLS = {
  explore: 'https://www.xiaohongshu.com/explore',
  publish: 'https://creator.xiaohongshu.com/publish/publish?source=official',
} as const;

export const SEL = {
  // Login
  loginQrCode: '.login-container .qrcode-img',
  loginSuccess: '.main-container .user .link-wrapper .channel',

  // Publish page tabs
  creatorTab: 'div.creator-tab',
  tabTextImage: '上传图文',
  tabTextVideo: '上传视频',

  // Image upload
  uploadInputFirst: '.upload-input',
  uploadInputSubsequent: 'input[type="file"]',
  imagePreviewArea: '.img-preview-area .pr',

  // Content input
  titleInput: 'div.d-input input',
  bodyEditor: 'div.ql-editor',
  bodyEditorAlt: '[data-placeholder="输入正文描述"]',

  // Visibility
  visibilityDropdown: 'div.permission-card-wrapper div.d-select-content',
  visibilityOptions: 'div.d-options-wrapper div.d-grid-item div.custom-option',

  // Publish button
  publishBtn: '.publish-page-publish-btn button.bg-red',

  // Popover overlay (may block clicks)
  popover: 'div.d-popover',

  // Title length warning
  titleLengthWarning: 'div.title-container div.max_suffix',

  // Body length error
  bodyLengthError: 'div.edit-container div.length-error',
} as const;
