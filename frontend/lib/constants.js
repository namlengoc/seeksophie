export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8800';

export const POLL_INTERVAL_MS = 3000;

export const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp'];

export const TERMINAL_STATUSES = ['draft', 'failed', 'rejected', 'published', 'under_review'];

export const PROCESSING_STATUSES = ['pending', 'processing'];

export const MOCK_ACCOUNTS = [
  { email: 'admin@seeksophie.com', role: 'admin' },
  { email: 'editor@seeksophie.com', role: 'editor' },
  { email: 'author@seeksophie.com', role: 'author' },
];
