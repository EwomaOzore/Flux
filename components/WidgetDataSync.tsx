import * as FileSystem from "expo-file-system/legacy";
import { useEffect } from "react";
import { useShallow } from "zustand/shallow";

import { buildWidgetSnapshotPayload } from "@/src/lib/widgetSnapshot";
import { saveWidgetLastSyncAt } from "@/src/lib/widgetSyncMeta";
import { useBudgetStore } from "@/src/state/budgetStore";

const FILE_NAME = "flux-widget-snapshot.json";

/** Persists a small JSON snapshot for native widget extensions; safe to mount once at app root. */
export function WidgetDataSync() {
  const deps = useBudgetStore(
    useShallow((s) => ({
      incomeStreams: s.incomeStreams,
      billItems: s.billItems,
      lines: s.lines,
    })),
  );

  useEffect(() => {
    const dir = FileSystem.documentDirectory ?? FileSystem.cacheDirectory;
    if (!dir) return;
    const payload = buildWidgetSnapshotPayload(deps);
    const uri = `${dir}${FILE_NAME}`;
    void FileSystem.writeAsStringAsync(uri, JSON.stringify(payload, null, 0), {
      encoding: FileSystem.EncodingType.UTF8,
    })
      .then(() => saveWidgetLastSyncAt(payload.updatedAt))
      .catch(() => {});
  }, [deps]);

  return null;
}
