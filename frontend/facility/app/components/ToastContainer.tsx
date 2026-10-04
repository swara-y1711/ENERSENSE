'use client';

import React from 'react';

export interface ToastMessage {
  id: string;
  msg: string;
  type?: 'info' | 'success' | 'alert';
}

interface ToastProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

export default function ToastContainer({ toasts }: ToastProps) {
  return (
    <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-center gap-2 px-3.5 py-2.5 rounded-xl shadow-xl text-xs font-medium bg-on-surface text-surface transition-all duration-300 border border-outline/20 animate-fade-in"
        >
          <span className="material-symbols-outlined text-[16px] text-primary shrink-0">
            {toast.type === 'success' ? 'check_circle' : 'info'}
          </span>
          <span className="leading-tight">{toast.msg}</span>
        </div>
      ))}
    </div>
  );
}
