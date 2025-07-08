/**
 * Whitelist configuration for Farcaster usernames.
 * Usernames are stored in lowercase to make comparison case-insensitive.
 */
export const WHITELISTED_USERNAMES = ['garrett', 'cush.eth'];

/**
 * Determine if a given username is included in the whitelist.
 */
export function isUserWhitelisted(username?: string | null): boolean {
  if (!username) return false;
  return WHITELISTED_USERNAMES.some(
    (name) => name.toLowerCase() === username.toLowerCase()
  );
}
