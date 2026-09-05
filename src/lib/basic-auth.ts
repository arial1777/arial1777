/**
 * 管理画面のベーシック認証。
 *
 * proxy.ts（/admin 以下の入口）と Server Action の両方から呼ぶ。Server Action は
 * 画面を通さず直接 POST できるので、入口で止めているからといって中の検証を
 * 省かない——というのが Next.js のドキュメントの言うところでもある。
 *
 * proxy は Edge ランタイムで動きうるので、node:crypto は使わず
 * Web 標準の API だけで組む。
 */

const REALM = "arial admin";

export const UNAUTHORIZED_HEADERS = {
  // charset を明示しないと、ブラウザによっては非ASCIIのパスワードが化ける
  "WWW-Authenticate": `Basic realm="${REALM}", charset="UTF-8"`,
} as const;

/** 認証情報が設定されているか。未設定なら管理画面は誰にも開かない */
export function adminCredentialsConfigured(): boolean {
  return Boolean(process.env.ADMIN_USER && process.env.ADMIN_PASSWORD);
}

/**
 * 長さの違いも含めて、比較にかかる時間を入力に依存させない。
 * 早期 return すると、1文字ずつ試して正解に近づけてしまう。
 */
function constantTimeEquals(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const left = encoder.encode(a);
  const right = encoder.encode(b);

  let diff = left.length ^ right.length;
  const length = Math.max(left.length, right.length);
  for (let i = 0; i < length; i += 1) {
    diff |= (left[i] ?? 0) ^ (right[i] ?? 0);
  }
  return diff === 0;
}

/** "Basic base64(user:password)" を user と password に戻す */
function decodeBasic(header: string): { user: string; password: string } | null {
  const [scheme, encoded] = header.split(" ");
  if (!scheme || scheme.toLowerCase() !== "basic" || !encoded) return null;

  let decoded: string;
  try {
    // atob はバイト列を latin1 の文字列で返すので、UTF-8 として読み直す。
    // これをしないと日本語や記号入りのパスワードが一致しない。
    const bytes = Uint8Array.from(atob(encoded.trim()), (c) => c.charCodeAt(0));
    decoded = new TextDecoder().decode(bytes);
  } catch {
    return null;
  }

  // パスワードに : が入っていてもよいので、最初の : だけで割る
  const separator = decoded.indexOf(":");
  if (separator < 0) return null;
  return { user: decoded.slice(0, separator), password: decoded.slice(separator + 1) };
}

export function isAuthorized(authorizationHeader: string | null | undefined): boolean {
  const expectedUser = process.env.ADMIN_USER;
  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedUser || !expectedPassword) return false;
  if (!authorizationHeader) return false;

  const credentials = decodeBasic(authorizationHeader);
  if (!credentials) return false;

  // どちらが違ったかを応答時間から読ませないよう、両方とも必ず比較する
  const userMatches = constantTimeEquals(credentials.user, expectedUser);
  const passwordMatches = constantTimeEquals(credentials.password, expectedPassword);
  return userMatches && passwordMatches;
}
