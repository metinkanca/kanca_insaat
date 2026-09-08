import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import type { NotificationType } from './types/firestore';

export interface AdminNotice {
  type: NotificationType;
  /** One line — also the e-mail subject. */
  title: string;
  /** Detail lines, separated by \n. */
  body: string;
  /** Admin panel path to open, e.g. '/admin/orders'. */
  link?: string;
  /** Id of the document the notice is about. */
  refId?: string;
}

// Absolute URL of the Cloudflare Worker endpoint (see worker/index.js). It has
// to be absolute because the same build is also served from Firebase Hosting,
// where /api/notify does not exist. Unset = no e-mail, panel bildirimi only.
const ENDPOINT = import.meta.env.VITE_NOTIFY_ENDPOINT as string | undefined;

/**
 * Tells the admin something happened on the site: writes a notifications/{id}
 * doc that the panel's "Bildirimler" page reads, and pings the Worker that
 * sends the e-mail.
 *
 * Both legs are best effort and deliberately never throw — a bayi must not see
 * their order fail because a notification could not be delivered. Call sites
 * fire this without awaiting it.
 */
export async function notifyAdmin(notice: AdminNotice): Promise<void> {
  await Promise.allSettled([writeNotice(notice), sendMail(notice)]);
}

async function writeNotice(notice: AdminNotice) {
  try {
    await addDoc(collection(db, 'notifications'), {
      type: notice.type,
      title: notice.title.slice(0, 120),
      body: notice.body.slice(0, 2000),
      link: notice.link ?? '',
      refId: notice.refId ?? '',
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.error('Bildirim kaydedilemedi:', err);
  }
}

async function sendMail(notice: AdminNotice) {
  if (!ENDPOINT) return;
  try {
    await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: notice.type,
        title: notice.title,
        body: notice.body,
        link: notice.link ?? '',
      }),
      // Checkout navigates away the moment this is fired; keepalive lets the
      // request finish anyway.
      keepalive: true,
    });
  } catch (err) {
    console.error('Bildirim e-postası gönderilemedi:', err);
  }
}

/** `1.234,50 ₺` — same formatting the panel and the cart use. */
export const noticeMoney = (n: number) =>
  `${n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`;
