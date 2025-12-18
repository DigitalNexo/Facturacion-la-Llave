'use client';

/**
 * HOOK: useConfirm
 * Hook para usar el modal de confirmación fácilmente
 */

import React, { useState } from 'react';
import ConfirmModalComponent from '@/components/ConfirmModal';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export function useConfirm() {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({
    title: '',
    message: '',
  });
  const [resolver, setResolver] = useState<{
    resolve: (value: boolean) => void;
  } | null>(null);

  const confirm = (opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts);
    setIsOpen(true);

    return new Promise((resolve) => {
      setResolver({ resolve });
    });
  };

  const handleConfirm = () => {
    resolver?.resolve(true);
    setIsOpen(false);
    setResolver(null);
  };

  const handleCancel = () => {
    resolver?.resolve(false);
    setIsOpen(false);
    setResolver(null);
  };

  const ConfirmModal = () => {
    return React.createElement(ConfirmModalComponent, {
      isOpen,
      onClose: handleCancel,
      onConfirm: handleConfirm,
      title: options.title,
      message: options.message,
      confirmText: options.confirmText,
      cancelText: options.cancelText,
      type: options.type,
    });
  };

  return {
    confirm,
    ConfirmModal,
    isOpen,
    options,
    handleConfirm,
    handleCancel,
  };
}
