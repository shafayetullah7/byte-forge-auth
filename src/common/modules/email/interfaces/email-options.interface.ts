export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: {
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }[];
}
