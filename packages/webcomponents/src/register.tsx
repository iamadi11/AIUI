import r2wc from "@r2wc/react-to-web-component";
import { useMemo } from "react";
import { runPipeline } from "@dynaui/core";
import { DynaPlanRenderer } from "@dynaui/react";
import "./wc.css";

function DynauiMount({ payload }: { payload: string }) {
  const result = useMemo(() => {
    try {
      const data = JSON.parse(payload || "null") as unknown;
      const { plan } = runPipeline(data);
      return { ok: true as const, data, plan };
    } catch {
      return { ok: false as const };
    }
  }, [payload]);

  if (!result.ok) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        Invalid <code>payload</code> JSON on <code>dynaui-dashboard</code>.
      </div>
    );
  }

  return <DynaPlanRenderer data={result.data} plan={result.plan} />;
}

const DynauiDashboard = r2wc(DynauiMount, {
  props: {
    payload: "string",
  },
});

if (typeof window !== "undefined" && !customElements.get("dynaui-dashboard")) {
  customElements.define("dynaui-dashboard", DynauiDashboard);
}

export { DynauiDashboard };
