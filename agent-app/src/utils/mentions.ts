// Mirrors app/services/messages/mention_service.rb's markup:
// (mention://user/<id>/<name>) and (mention://team/<id>/<name>), embedded
// directly in message content (private notes only).
const MENTION_PATTERN = /\(mention:\/\/(?:user|team)\/\d+\/([^)]+)\)/g;

export function formatMentionsForDisplay(content: string | null | undefined): string {
  if (!content) return '';
  return content.replace(MENTION_PATTERN, (_match, name) => `@${name}`);
}

export function buildUserMention(id: number, name: string): string {
  return `(mention://user/${id}/${name})`;
}
