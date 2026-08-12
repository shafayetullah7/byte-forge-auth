export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function stripHtmlTags(value: string): string {
  return value.replace(/<[^>]+>/g, '');
}

export function nl2br(value: string): string {
  return value.replace(/\n/g, '<br/>');
}
