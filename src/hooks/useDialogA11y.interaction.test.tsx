/**
 * @vitest-environment jsdom
 *
 * Interaction coverage for `useDialogA11y` (T5a).
 *
 * Contract source: the WAI-ARIA Authoring Practices dialog (modal) pattern -- on open, focus moves
 * into the dialog; Tab/Shift+Tab are trapped inside it; Escape dismisses; on close, focus returns
 * to the element that invoked the dialog. These tests pin that contract, not an implementation
 * detail: each renders an OUTSIDE trigger button and focuses it before mounting the harness, so the
 * capture-and-restore path is exercised the way the single real consumer (OperationsModal, a plain
 * container of focusable buttons, no portal) uses it.
 *
 * Deliberately NOT covered:
 * - The no-focusables fallback (`container.focus()`): unreachable for the production consumer,
 *   which always renders a focusable close button, and it would require a `tabindex` the real
 *   container does not carry.
 * - Mid-container Tab traversal: the hook preventDefaults only at the edges and leaves interior
 *   movement to the browser, so that is browser behaviour rather than this hook's contract.
 *
 * Explicit 30 s timeouts throughout (T1/E29 lesson: survive full-suite contention from day one).
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { useRef, useState } from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useDialogA11y } from './useDialogA11y';

afterEach(cleanup);

const TIMEOUT_MS = 30000;

function DialogHarness({ onClose }: { onClose: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  useDialogA11y({ onClose, containerRef });
  return (
    <div ref={containerRef} role="dialog" aria-modal="true">
      <button>first</button>
      <button>middle</button>
      <button>last</button>
    </div>
  );
}

/** Trigger + conditionally mounted dialog: mirrors how a real consumer opens/closes the modal. */
function TriggerAndDialog({ onClose }: { onClose: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>trigger</button>
      {open && (
        <DialogHarness
          onClose={() => {
            onClose();
            setOpen(false);
          }}
        />
      )}
    </>
  );
}

/** Focus the outside trigger, then open the dialog through it (so the hook captures the trigger). */
async function openViaTrigger(user: ReturnType<typeof userEvent.setup>) {
  const trigger = screen.getByRole('button', { name: 'trigger' });
  await user.click(trigger);
  return trigger;
}

describe('useDialogA11y — WAI-ARIA dialog contract (jsdom)', () => {
  it(
    'mounting focuses the first focusable inside the container',
    async () => {
      const user = userEvent.setup();
      render(<TriggerAndDialog onClose={vi.fn()} />);
      await openViaTrigger(user);

      expect(document.activeElement).toBe(screen.getByRole('button', { name: 'first' }));
    },
    TIMEOUT_MS,
  );

  it(
    'Escape calls onClose exactly once',
    async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<TriggerAndDialog onClose={onClose} />);
      await openViaTrigger(user);

      await user.keyboard('{Escape}');

      expect(onClose).toHaveBeenCalledTimes(1);
    },
    TIMEOUT_MS,
  );

  it(
    'Tab on the last focusable wraps to the first',
    async () => {
      const user = userEvent.setup();
      render(<TriggerAndDialog onClose={vi.fn()} />);
      await openViaTrigger(user);

      screen.getByRole('button', { name: 'last' }).focus();
      await user.tab();

      expect(document.activeElement).toBe(screen.getByRole('button', { name: 'first' }));
    },
    TIMEOUT_MS,
  );

  it(
    'Shift+Tab on the first focusable wraps to the last',
    async () => {
      const user = userEvent.setup();
      render(<TriggerAndDialog onClose={vi.fn()} />);
      await openViaTrigger(user);

      screen.getByRole('button', { name: 'first' }).focus();
      await user.tab({ shift: true });

      expect(document.activeElement).toBe(screen.getByRole('button', { name: 'last' }));
    },
    TIMEOUT_MS,
  );

  it(
    'unmounting restores focus to the previously focused trigger',
    async () => {
      const user = userEvent.setup();
      render(<TriggerAndDialog onClose={vi.fn()} />);
      const trigger = await openViaTrigger(user);
      expect(document.activeElement).not.toBe(trigger);

      // Escape closes the dialog, unmounting it and running the hook's cleanup.
      await user.keyboard('{Escape}');

      expect(screen.queryByRole('dialog')).toBeNull();
      expect(document.activeElement).toBe(trigger);
    },
    TIMEOUT_MS,
  );
});
