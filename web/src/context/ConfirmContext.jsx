import { useCallback, useMemo, useRef, useState } from 'react';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { Button } from '@/components/ui/button';
import { ConfirmContext } from './confirm-context.js';

export function ConfirmProvider({ children }) {
  const [state, setState] = useState({
    open: false,
    title: '',
    description: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
  });
  const resolverRef = useRef(null);

  const confirm = useCallback((title, options = {}) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setState({
        open: true,
        title,
        description: options.description || '',
        confirmText: options.confirmText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',
      });
    });
  }, []);

  const close = useCallback(() => {
    setState((prev) => ({ ...prev, open: false }));
    resolverRef.current = null;
  }, []);

  const handleConfirm = useCallback(() => {
    resolverRef.current?.(true);
    close();
  }, [close]);

  const handleCancel = useCallback(() => {
    resolverRef.current?.(false);
    close();
  }, [close]);

  const handleOpenChange = useCallback(
    (open) => {
      if (!open && state.open) {
        resolverRef.current?.(false);
        close();
      }
    },
    [state.open, close]
  );

  const value = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <AlertDialog.Root open={state.open} onOpenChange={handleOpenChange}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          <AlertDialog.Content className="fixed left-1/2 top-1/2 w-[95vw] max-w-md -translate-x-1/2 -translate-y-1/2 space-y-4 rounded-xl border bg-card p-6 shadow-xl focus:outline-none">
            <AlertDialog.Title className="text-lg font-semibold text-foreground">
              {state.title}
            </AlertDialog.Title>
            {state.description && (
              <AlertDialog.Description className="text-sm text-muted-foreground">
                {state.description}
              </AlertDialog.Description>
            )}
            <div className="flex justify-end gap-2">
              <AlertDialog.Cancel asChild>
                <Button variant="outline" onClick={handleCancel}>
                  {state.cancelText}
                </Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <Button onClick={handleConfirm}>{state.confirmText}</Button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </ConfirmContext.Provider>
  );
}

export default ConfirmProvider;
