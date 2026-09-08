import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NOTICE_BADGES, NOTICE_LABELS, noticeTime, useNotices } from './notices';
import type { NoticeWithId } from './notices';

// Site hareketleri: bayi başvurusu, sipariş, teklif. The list is fed by the
// listener in AdminLayout, so it updates live while the panel is open — the
// same events also go out by e-mail (worker/index.js).
export default function AdminNotifications() {
  const { notices, unread, markRead, markAllRead, removeNotice } = useNotices();
  const navigate = useNavigate();
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [busy, setBusy] = useState(false);

  const rows = onlyUnread ? notices.filter(n => !n.read) : notices;

  const open = async (notice: NoticeWithId) => {
    if (!notice.read) await markRead(notice.id).catch(() => {});
    if (notice.link) navigate(notice.link);
  };

  const allRead = async () => {
    setBusy(true);
    try {
      await markAllRead();
    } catch (err) {
      console.error(err);
      alert('Bildirimler işaretlenemedi.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <p className="admin-page-title">
          Bildirimler {unread > 0 && <span className="admin-badge admin-badge--danger">{unread} yeni</span>}
        </p>
        <div className="admin-actions">
          <button
            className={`admin-btn admin-btn-sm${onlyUnread ? ' admin-btn-primary' : ''}`}
            onClick={() => setOnlyUnread(v => !v)}
          >
            {onlyUnread ? 'Tümünü göster' : 'Sadece okunmamış'}
          </button>
          <button className="admin-btn admin-btn-sm" onClick={allRead} disabled={busy || unread === 0}>
            Tümünü okundu işaretle
          </button>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="admin-empty">
          {onlyUnread ? 'Okunmamış bildirim yok.' : 'Henüz bildirim yok. Yeni bir bayi başvurusu, sipariş veya teklif geldiğinde burada listelenir.'}
        </p>
      ) : (
        <ul className="admin-notice-list">
          {rows.map(n => (
            <li key={n.id} className={`admin-notice${n.read ? '' : ' admin-notice--unread'}`}>
              <div className="admin-notice-main" onClick={() => open(n)}>
                <div className="admin-notice-head">
                  <span className={`admin-badge ${NOTICE_BADGES[n.type] ?? ''}`}>
                    {NOTICE_LABELS[n.type] ?? n.type}
                  </span>
                  <span className="admin-notice-title">{n.title}</span>
                  <span className="admin-notice-time">{noticeTime(n.createdAt)}</span>
                </div>
                {n.body && <p className="admin-notice-body">{n.body}</p>}
              </div>
              <div className="admin-notice-actions">
                {!n.read && (
                  <button className="admin-btn admin-btn-sm" onClick={() => markRead(n.id)}>Okundu</button>
                )}
                <button
                  className="admin-btn admin-btn-sm admin-btn-danger"
                  onClick={() => { if (confirm('Bu bildirim silinsin mi?')) removeNotice(n.id); }}
                >
                  Sil
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
