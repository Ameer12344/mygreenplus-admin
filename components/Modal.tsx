'use client';

import { ReactNode } from 'react';
import { X } from 'lucide-react';

export default function Modal({
  trigger,
  title,
  children,
  open,
  onClose,
}: {
  trigger: ReactNode;
  title: string;
  children: ReactNode;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <>
      {trigger}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40"
          onClick={onClose}
        >
          <div
            className="bg-white rounded-xl shadow-lg w-full max-w-md max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
              <h2 className="font-semibold text-lg">{title}</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-700 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">{children}</div>
          </div>
        </div>
      )}
    </>
  );
}
