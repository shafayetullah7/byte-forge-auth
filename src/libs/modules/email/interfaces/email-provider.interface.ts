export interface IEmailProvider {
  sendEmail(options: {
    to: string;
    subject: string;
    text?: string;
    html?: string;
  }): Promise<void>;
}

export interface EmailConfig {
  provider: 'gmail' | 'smtp' | 'sendgrid' | 'console';
  host?: string;
  port?: number;
  secure?: boolean;
  user?: string;
  password?: string;
  fromName?: string;
  fromEmail?: string;
}
