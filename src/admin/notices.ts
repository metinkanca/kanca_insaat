import { useOutletContext } from 'react-router-dom';
import type { Timestamp } from 'firebase/firestore';
import type { AdminNotification, NotificationType } from '../types/firestore';

export type NoticeWithId = AdminNotification & { id: string };

export interface NoticeContext {
  notices: NoticeWithId[];
  unread: number;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  removeNotice: (id: string) => Promise<void>;
}

// AdminLayout keeps the single Firestore listener and hands it down through
// the router outlet, so the badge in the sidebar and the Bildirimler page can
// never drift apart.
export const useNotices = () => useOutletContext<NoticeContext>();

export const NOTICE_LABELS: Record<NotificationType, string> = {
  dealer: 'Bayi Başvurusu',
  order: 'Sipariş',
  quote: 'Teklif',
};

export const NOTICE_BADGES: Record<NotificationType, string> = {
  dealer: 'admin-badge--warning',
  order: 'admin-badge--success',
  quote: 'admin-badge--danger',
};

/** "3 dk önce" / "2 saat önce" / "14.07.2026" */
export function noticeTime(createdAt: Timestamp | Date | null | undefined): string {
  const date = createdAt instanceof Date ? createdAt : createdAt?.toDate?.() ?? null;
  if (!date) return '—';
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return 'az önce';
  if (mins < 60) return `${mins} dk önce`;
  if (mins < 24 * 60) return `${Math.floor(mins / 60)} saat önce`;
  return date.toLocaleDateString('tr-TR');
}
