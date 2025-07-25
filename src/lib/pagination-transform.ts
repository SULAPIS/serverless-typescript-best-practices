export function encodeToken(key: Record<string, unknown>): string {
    const json = JSON.stringify(key);
    return Buffer.from(json).toString('base64');
}

export function decodeToken(token: string): Record<string, unknown> {
    const json = Buffer.from(token, 'base64').toString();
    return JSON.parse(json);
}