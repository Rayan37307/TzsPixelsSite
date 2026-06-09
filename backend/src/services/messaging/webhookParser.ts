export interface IgDmEvent {
  senderId: string;
  text: string;
  mid?: string;
  imageUrl?: string;
}

export function normalizeImageUrl(url: unknown): string | undefined {
  if (typeof url !== 'string') return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;
  return trimmed.replace(/&amp;/g, '&');
}

export function extractImageUrl(attachments: any[] | undefined): string | undefined {
  const attachment = attachments?.find((a: any) => a?.type === 'image');
  return normalizeImageUrl(attachment?.payload?.url);
}

export function parseInstagramDms(body: any): IgDmEvent[] {
  const igId = process.env.IG_BUSINESS_ACCOUNT_ID || '';
  const dms: IgDmEvent[] = [];

  for (const entry of body.entry || []) {
    for (const messaging of entry.messaging || []) {
      const senderId = messaging.sender?.id;
      const text = messaging.message?.text ?? '';
      const imageUrl = extractImageUrl(messaging.message?.attachments);
      const isEcho = messaging.message?.is_echo === true;
      if (senderId && (text || imageUrl) && !isEcho && senderId !== igId) {
        dms.push({ senderId, text, mid: messaging.message?.mid, imageUrl });
      }
    }
  }

  return dms;
}
