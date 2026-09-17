"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { ActionState } from "@/actions/auth";

/**
 * Same return shape as `useActionState`, but the side effects that follow a
 * successful submit (toast + e.g. closing a dialog) run from the event
 * handler that triggers the action, not from a `useEffect` watching the
 * result — calling `setState` from inside an effect just to react to your
 * own action's result causes an avoidable extra render and trips the
 * `react-hooks/set-state-in-effect` lint rule. Used by every admin
 * create/edit dialog.
 */
export function useFormDialogAction(
  action: (state: ActionState, formData: FormData) => Promise<ActionState>,
  options: { successMessage: string; onSuccess?: (result: ActionState) => void },
) {
  const [state, setState] = useState<ActionState>({});
  const [isPending, startTransition] = useTransition();

  function formAction(formData: FormData) {
    startTransition(async () => {
      const result = await action(state, formData);
      setState(result);
      if (result.success) {
        toast.success(options.successMessage);
        options.onSuccess?.(result);
      } else if (result.error) {
        toast.error(result.error);
      }
    });
  }

  return [state, formAction, isPending] as const;
}
