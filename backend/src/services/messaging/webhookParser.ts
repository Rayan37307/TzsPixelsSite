export interface IgDmEvent {
  senderId: string;
  text: string;
  mid?: string;
}

export function parseInstagramDms(body: any): IgDmEvent[] {
  const igId = process.env.IG_BUSINESS_ACCOUNT_ID || '';
  const dms: IgDmEvent[] = [];

  for (const entry of body.entry || []) {
    for (const messaging of entry.messaging || []) {
      const senderId = messaging.sender?.id;
      const text = messaging.message?.text;
      const isEcho = messaging.message?.is_echo === true;
      if (senderId && text && !isEcho && senderId !== igId) {
        dms.push({ senderId, text, mid: messaging.message?.mid });
      }
    }
  }

  return dms;
}
