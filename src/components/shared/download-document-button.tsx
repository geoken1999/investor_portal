"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { getDocumentDownloadUrl } from "@/actions/documents";
import { Button } from "@/components/ui/button";

export function DownloadDocumentButton({ documentId }: { documentId: string }) {
  const [isPending, startTransition] = useTransition();
  const [clicked, setClicked] = useState(false);

  function handleClick() {
    setClicked(true);
    startTransition(async () => {
      const result = await getDocumentDownloadUrl(documentId);
      if (result.error || !result.url) {
        toast.error(result.error ?? "Failed to generate a download link");
        setClicked(false);
        return;
      }
      window.open(result.url, "_blank", "noopener,noreferrer");
      setClicked(false);
    });
  }

  return (
    <Button variant="outline" size="sm" onClick={handleClick} disabled={isPending}>
      <Download />
      {isPending && clicked ? "Preparing…" : "Download"}
    </Button>
  );
}
