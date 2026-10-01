/* ═══════════════════════════════════════════════════════════════
   SPEAK EASY — Document Types
   ═══════════════════════════════════════════════════════════════ */

export type SupportedFileType = 'pdf' | 'ppt' | 'pptx' | 'doc' | 'docx' | 'txt';

export const SUPPORTED_MIME_TYPES: Record<string, SupportedFileType> = {
  'application/pdf': 'pdf',
  'application/vnd.ms-powerpoint': 'ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'text/plain': 'txt',
};

export const SUPPORTED_EXTENSIONS: string[] = ['.pdf', '.ppt', '.pptx', '.doc', '.docx', '.txt'];
export const MAX_FILE_SIZE = 20 * 1024 * 1024;

export type DocumentUploadStatus =
  | 'idle' | 'validating' | 'uploading' | 'extracting' | 'processing' | 'ready' | 'error';

export type DocumentError =
  | 'unsupported-type' | 'too-large' | 'corrupted' | 'empty'
  | 'password-protected' | 'image-only' | 'extraction-failed' | 'unknown';

export interface DocumentValidation {
  valid: boolean;
  error?: DocumentError;
  message?: string;
}

export interface ExtractedDocument {
  fileName: string;
  fileType: SupportedFileType;
  fileSize: number;
  content: string;
  pageCount?: number;
  slideCount?: number;
  wordCount: number;
  summary?: string;
  sections?: DocumentSection[];
  extractedAt: number;
}

export interface DocumentSection {
  title?: string;
  content: string;
  pageNumber?: number;
  slideNumber?: number;
}
