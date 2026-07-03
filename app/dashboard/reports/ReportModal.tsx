'use client';

import { useState } from 'react';
import { MessageSquareWarning } from 'lucide-react';
import Modal from '@/components/Modal';
import StatusBadge from '@/components/StatusBadge';
import ReportResponseForm from './ReportResponseForm';

type Report = {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
  image_urls: string[] | null;
  app_users?: { name: string; phone: string } | null;
  rvm_machines?: { machine_code: string } | null;
};

export default function ReportModal({ r }: { r: Report }) {
  const [open, setOpen] = useState(false);
  const images = r.image_urls?.filter(Boolean) ?? [];

  return (
    <Modal
      title={r.title}
      open={open}
      onClose={() => setOpen(false)}
      trigger={
        <div
          onClick={() => setOpen(true)}
          className="bg-white rounded-xl2 shadow-card p-5 flex items-start gap-4 cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="w-9 h-9 rounded-lg bg-rose-50 flex items-center justify-center flex-shrink-0">
            <MessageSquareWarning className="w-4 h-4 text-rose-600" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <p className="text-ink font-medium leading-snug">{r.title}</p>
              <StatusBadge status={r.status} />
            </div>
            <p className="text-sage-400 text-sm mt-1 line-clamp-2">{r.description}</p>
            <div className="flex items-center gap-3 text-xs text-sage-400 mt-2">
              <span>{r.app_users?.name ?? 'Unknown user'}</span>
              <span>·</span>
              <span className="capitalize">{r.category?.replace('_', ' ')}</span>
              {r.rvm_machines?.machine_code && (
                <>
                  <span>·</span>
                  <span className="font-mono">{r.rvm_machines.machine_code}</span>
                </>
              )}
              <span>·</span>
              <span>{new Date(r.created_at).toISOString().slice(0, 10)}</span>
              {images.length > 0 && (
                <>
                  <span>·</span>
                  <span>{images.length} photo{images.length > 1 ? 's' : ''}</span>
                </>
              )}
            </div>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="text-sm text-ink bg-sage-50 rounded-lg p-3">
          <p className="text-xs text-sage-400 mb-1">
            Reported by {r.app_users?.name ?? 'Unknown'} {r.app_users?.phone ? `· ${r.app_users.phone}` : ''}
          </p>
          <p>{r.description || 'No description provided.'}</p>
        </div>

        {images.length > 0 && (
          <div>
            <p className="text-xs font-medium text-sage-400 mb-2">Attachments</p>
            <div className="grid grid-cols-3 gap-2">
              {images.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                  <img
                    src={url}
                    alt={`Attachment ${i + 1}`}
                    className="w-full h-24 object-cover rounded-lg border border-sage-100 hover:opacity-80 transition-opacity"
                  />
                </a>
              ))}
            </div>
          </div>
        )}

        <ReportResponseForm
          reportId={r.id}
          currentStatus={r.status}
          currentNotes={r.admin_notes ?? ''}
          onDone={() => setOpen(false)}
        />
      </div>
    </Modal>
  );
}
