"use client";

import * as React from "react";

export function StaffClearanceGate(): null {
  React.useEffect(() => {
    if (typeof window !== "undefined" && window.sessionStorage) {
      // 🔓 Clear out the layout bypass lock once inside the secure portal boundaries
      window.sessionStorage.removeItem("freshpoint_exit_clearance");
      console.log(
        "🔓 [FreshPoint Auth] Staff profile active. Workspace exit clearance tokens flushed.",
      );
    }
  }, []);

  return null;
}
