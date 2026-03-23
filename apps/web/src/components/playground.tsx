"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  AIInferenceResponsePayload,
  MultiPipelineResult,
  PipelineResult,
  ReasoningTrace,
} from "@dynaui/core";
import { runMultiPipeline, runPipeline } from "@dynaui/core";
import { DynaPlanRenderer } from "@dynaui/react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  Input,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@dynaui/ui";
import {
  ArrowRight,
  Braces,
  Check,
  ChevronDown,
  Download,
  LayoutDashboard,
  Link2,
  Loader2,
  Plus,
  RotateCcw,
  Shield,
  Sparkles,
  Trash2,
  Wand2,
  X,
} from "lucide-react";

const LS_SOURCES = "dynaui.playground.sources";
const LS_JSON = "dynaui.playground.json";

interface ApiSource {
  id: string;
  label: string;
  url: string;
  headers: string;
  data: unknown | null;
  error: string | null;
  loading: boolean;
}

let nextId = 1;
function makeId(): string {
  return `src_${Date.now()}_${nextId++}`;
}

function createEmptySource(): ApiSource {
  return {
    id: makeId(),
    label: "",
    url: "",
    headers: '{\n  "Accept": "application/json"\n}',
    data: null,
    error: null,
    loading: false,
  };
}

export function Playground() {
  const [tab, setTab] = useState<"url" | "json">("url");
  const [sources, setSources] = useState<ApiSource[]>(() => [createEmptySource()]);
  const [jsonText, setJsonText] = useState('{\n  "hello": "world"\n}');
  const [jsonData, setJsonData] = useState<unknown>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<AIInferenceResponsePayload | null>(null);
  const [trace, setTrace] = useState<ReasoningTrace | Record<string, ReasoningTrace> | null>(null);
  const [expandedHeaders, setExpandedHeaders] = useState<Set<string>>(new Set());
  const didRestore = useRef(false);

  useEffect(() => {
    if (didRestore.current) return;
    didRestore.current = true;
    try {
      const raw = localStorage.getItem(LS_SOURCES);
      if (raw) {
        const parsed = JSON.parse(raw) as Array<{ label: string; url: string; headers: string }>;
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSources(
            parsed.map((s) => ({
              id: makeId(),
              label: s.label ?? "",
              url: s.url ?? "",
              headers: s.headers ?? '{\n  "Accept": "application/json"\n}',
              data: null,
              error: null,
              loading: false,
            })),
          );
        }
      }
      const j = localStorage.getItem(LS_JSON);
      if (j) setJsonText(j);
    } catch {
      /* ignore */
    }
  }, []);

  const persist = useCallback(() => {
    try {
      localStorage.setItem(
        LS_SOURCES,
        JSON.stringify(sources.map((s) => ({ label: s.label, url: s.url, headers: s.headers }))),
      );
      localStorage.setItem(LS_JSON, jsonText);
    } catch {
      /* ignore */
    }
  }, [sources, jsonText]);

  const updateSource = useCallback((id: string, patch: Partial<ApiSource>) => {
    setSources((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }, []);

  const addSource = useCallback(() => {
    setSources((prev) => [...prev, createEmptySource()]);
  }, []);

  const removeSource = useCallback((id: string) => {
    setSources((prev) => {
      const next = prev.filter((s) => s.id !== id);
      return next.length === 0 ? [createEmptySource()] : next;
    });
  }, []);

  const toggleHeaders = useCallback((id: string) => {
    setExpandedHeaders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const fetchSource = useCallback(
    async (sourceId: string) => {
      const source = sources.find((s) => s.id === sourceId);
      if (!source) return;

      setGlobalError(null);
      setAiResponse(null);
      updateSource(sourceId, { loading: true, error: null });
      persist();

      try {
        let headers: Record<string, string> = {};
        try {
          headers = JSON.parse(source.headers) as Record<string, string>;
        } catch {
          throw new Error("Headers must be valid JSON.");
        }
        const res = await fetch("/api/proxy-fetch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: source.url, headers }),
        });
        const body = (await res.json()) as { ok?: boolean; data?: unknown; error?: string };
        if (!res.ok || !body.ok) {
          throw new Error(body.error ?? `Request failed (${res.status})`);
        }
        updateSource(sourceId, { data: body.data, loading: false, error: null });
      } catch (e) {
        updateSource(sourceId, {
          data: null,
          loading: false,
          error: e instanceof Error ? e.message : "Failed to load",
        });
      }
    },
    [sources, updateSource, persist],
  );

  const fetchAll = useCallback(async () => {
    setGlobalError(null);
    setAiResponse(null);
    persist();
    const fetchable = sources.filter((s) => s.url.trim());
    await Promise.allSettled(fetchable.map((s) => fetchSource(s.id)));
  }, [sources, fetchSource, persist]);

  const loadFromJson = () => {
    setGlobalError(null);
    setAiResponse(null);
    persist();
    try {
      const parsed = JSON.parse(jsonText) as unknown;
      setJsonData(parsed);
    } catch {
      setGlobalError("Invalid JSON. Check brackets and quotes.");
      setJsonData(null);
    }
  };

  const sourcesWithData = useMemo(
    () => sources.filter((s) => s.data !== null),
    [sources],
  );

  const multiPipeline: MultiPipelineResult | null = useMemo(() => {
    if (tab !== "url" || sourcesWithData.length === 0) return null;
    return runMultiPipeline(
      sourcesWithData.map((s) => ({
        id: s.id,
        label: s.label || new URL(s.url).hostname,
        data: s.data,
      })),
      { alwaysIncludeAIPayload: true },
    );
  }, [tab, sourcesWithData]);

  const jsonPipeline: PipelineResult | null = useMemo(() => {
    if (tab !== "json" || jsonData === null) return null;
    return runPipeline(jsonData, {
      aiResponse: aiResponse ?? undefined,
      alwaysIncludeAIPayload: true,
    });
  }, [tab, jsonData, aiResponse]);

  const activePlan = tab === "url" ? multiPipeline?.plan : jsonPipeline?.plan;
  const activeDataSources = tab === "url" ? multiPipeline?.dataSources : undefined;
  const activeData = tab === "json" ? jsonData : null;
  const activeNeedsAI =
    tab === "url" ? (multiPipeline?.needsAI ?? false) : (jsonPipeline?.needsAI ?? false);

  const firstPerSource =
    tab === "url" && multiPipeline?.perSource
      ? Object.values(multiPipeline.perSource)[0]
      : null;
  const activeAiPayload =
    tab === "json" ? jsonPipeline?.aiPayload : firstPerSource?.aiPayload;

  useEffect(() => {
    if (tab === "url" && multiPipeline?.traces) {
      setTrace(multiPipeline.traces);
    } else if (tab === "json" && jsonPipeline?.trace) {
      setTrace(jsonPipeline.trace);
    }
  }, [tab, multiPipeline, jsonPipeline]);

  const enhanceWithAI = async () => {
    if (!activeAiPayload) return;
    setAiLoading(true);
    setGlobalError(null);
    try {
      const res = await fetch("/api/infer-layout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(activeAiPayload),
      });
      const body = (await res.json()) as AIInferenceResponsePayload & { error?: string };
      if (!res.ok) {
        throw new Error(body.error ?? "Inference failed");
      }
      if (!body.rankedComponents?.length) {
        throw new Error("No components returned");
      }
      setAiResponse(body);
    } catch (e) {
      setGlobalError(e instanceof Error ? e.message : "AI failed");
    } finally {
      setAiLoading(false);
    }
  };

  const exportBundle = () => {
    if (!activePlan) return;
    const blob = new Blob(
      [
        JSON.stringify(
          {
            version: 1,
            exportedAt: new Date().toISOString(),
            source:
              tab === "url"
                ? { sources: sources.map((s) => ({ label: s.label, url: s.url })) }
                : { jsonSample: true },
            dataSources: activeDataSources ?? (jsonData ? { single: jsonData } : {}),
            plan: activePlan,
            traces: tab === "url" ? multiPipeline?.traces : jsonPipeline?.trace,
            aiResponse,
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "dynaui-export.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const hasPreview = activePlan != null;
  const anyLoading = sources.some((s) => s.loading);

  return (
    <div className="min-h-dvh flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2.5">
            <div
              className="flex size-8 items-center justify-center rounded-lg bg-foreground text-sm font-bold text-background"
              aria-hidden
            >
              D
            </div>
            <span className="font-display text-base font-semibold tracking-tight">DynaUI</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
              <Shield className="size-3.5" aria-hidden />
              Schema-only AI
            </span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        <div className="mx-auto max-w-[1440px] px-4 py-6 md:px-6 md:py-8">
          <div className="mb-8 text-center">
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              JSON to UI, instantly
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Paste JSON or fetch APIs — get tables, charts, and dashboards automatically.
            </p>
          </div>

          {/* Workspace */}
          <div className="mx-auto grid gap-6 lg:grid-cols-12 lg:gap-8 lg:items-start">
            {/* Left: input panel */}
            <div className="lg:col-span-4 xl:col-span-4">
              <Card className="overflow-hidden border-border/80 shadow-sm">
                <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
                  <div className="border-b border-border/60 bg-muted/30 px-1 pt-1">
                    <TabsList className="grid h-10 w-full grid-cols-2 gap-1 bg-transparent p-0">
                      <TabsTrigger
                        value="url"
                        className="gap-1.5 text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm"
                      >
                        <Link2 className="size-3.5" aria-hidden />
                        API URLs
                      </TabsTrigger>
                      <TabsTrigger
                        value="json"
                        className="gap-1.5 text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm"
                      >
                        <Braces className="size-3.5" aria-hidden />
                        Paste JSON
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="url" className="m-0 p-0">
                    <div className="divide-y divide-border/40">
                      {sources.map((source, idx) => (
                        <SourceRow
                          key={source.id}
                          source={source}
                          index={idx}
                          total={sources.length}
                          headersExpanded={expandedHeaders.has(source.id)}
                          onToggleHeaders={() => toggleHeaders(source.id)}
                          onUpdate={(patch) => updateSource(source.id, patch)}
                          onFetch={() => fetchSource(source.id)}
                          onRemove={() => removeSource(source.id)}
                        />
                      ))}
                    </div>
                    <CardContent className="space-y-2 p-3 pt-2">
                      <button
                        type="button"
                        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border/60 py-2 text-xs text-muted-foreground transition-colors hover:border-border hover:text-foreground"
                        onClick={addSource}
                      >
                        <Plus className="size-3" aria-hidden />
                        Add API source
                      </button>
                      <Button
                        type="button"
                        className="h-9 w-full"
                        onClick={fetchAll}
                        disabled={anyLoading || sources.every((s) => !s.url.trim())}
                      >
                        {anyLoading ? (
                          <Loader2 className="size-3.5 animate-spin" aria-hidden />
                        ) : (
                          <ArrowRight className="size-3.5" aria-hidden />
                        )}
                        Fetch {sources.length > 1 ? "All" : ""}
                      </Button>
                    </CardContent>
                  </TabsContent>

                  <TabsContent value="json" className="m-0 p-0">
                    <CardContent className="space-y-3 p-4">
                      <textarea
                        id="raw-json"
                        className="w-full resize-y rounded-lg border border-border bg-muted/30 p-2.5 font-mono text-xs leading-relaxed text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        rows={10}
                        value={jsonText}
                        onChange={(e) => setJsonText(e.target.value)}
                        spellCheck={false}
                        aria-label="JSON payload"
                      />
                      <Button type="button" className="h-9 w-full" onClick={loadFromJson}>
                        <LayoutDashboard className="size-3.5" aria-hidden />
                        Generate
                      </Button>
                    </CardContent>
                  </TabsContent>
                </Tabs>
              </Card>
            </div>

            {/* Right: preview */}
            <div className="lg:col-span-8 xl:col-span-8 space-y-4">
              {globalError && (
                <div
                  className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
                  role="alert"
                >
                  {globalError}
                </div>
              )}

              <div
                className={`min-h-[480px] rounded-xl border transition-colors ${
                  hasPreview
                    ? "border-border bg-card p-4 md:p-6 shadow-sm"
                    : "border-dashed border-border/60 bg-muted/5"
                }`}
              >
                {!hasPreview ? (
                  <div className="flex h-full min-h-[480px] flex-col items-center justify-center text-center px-6">
                    <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-muted/60">
                      <LayoutDashboard className="size-6 text-muted-foreground/60" aria-hidden />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Your dashboard will appear here
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground/60">
                      Load data from the panel on the left to get started
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Toolbar */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="font-mono text-[11px] font-normal">
                        {activePlan?.componentId}
                      </Badge>
                      {tab === "url" && sourcesWithData.length > 1 && (
                        <Badge variant="outline" className="text-[11px] font-normal">
                          {sourcesWithData.length} sources
                        </Badge>
                      )}

                      <div className="flex-1" />

                      {activeNeedsAI && !aiResponse && (
                        <span className="flex items-center gap-1.5 text-xs text-chart-2">
                          <Wand2 className="size-3" aria-hidden />
                          AI recommended
                        </span>
                      )}

                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={enhanceWithAI}
                        disabled={aiLoading || !!aiResponse || !activeAiPayload}
                      >
                        {aiLoading ? (
                          <Loader2 className="size-3 animate-spin" aria-hidden />
                        ) : (
                          <Sparkles className="size-3" aria-hidden />
                        )}
                        {aiResponse ? "Refined" : "Refine with AI"}
                      </Button>

                      {aiResponse && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => setAiResponse(null)}
                        >
                          <RotateCcw className="size-3" aria-hidden />
                          Undo
                        </Button>
                      )}

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={exportBundle}
                      >
                        <Download className="size-3" aria-hidden />
                        Export
                      </Button>
                    </div>

                    {/* Rendered dashboard */}
                    <div className="min-w-0">
                      <DynaPlanRenderer
                        data={activeData}
                        plan={activePlan!}
                        dataSources={activeDataSources}
                      />
                    </div>

                    {/* Trace (collapsed) */}
                    {trace && (
                      <details className="group">
                        <summary className="flex cursor-pointer list-none items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                          <ChevronDown className="size-3 transition-transform group-open:rotate-180" />
                          Reasoning trace
                        </summary>
                        <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-muted/30 p-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
                          {JSON.stringify(trace, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-4 text-center text-xs text-muted-foreground/60">
        DynaUI
      </footer>
    </div>
  );
}

function SourceRow({
  source,
  index,
  total,
  headersExpanded,
  onToggleHeaders,
  onUpdate,
  onFetch,
  onRemove,
}: {
  source: ApiSource;
  index: number;
  total: number;
  headersExpanded: boolean;
  onToggleHeaders: () => void;
  onUpdate: (patch: Partial<ApiSource>) => void;
  onFetch: () => void;
  onRemove: () => void;
}) {
  const hasData = source.data !== null;
  return (
    <div className="space-y-2 p-3">
      <div className="flex items-center gap-2">
        <span className="flex size-5 shrink-0 items-center justify-center rounded bg-muted text-[10px] font-medium text-muted-foreground">
          {index + 1}
        </span>
        <Input
          placeholder="Label (optional)"
          value={source.label}
          onChange={(e) => onUpdate({ label: e.target.value })}
          className="h-8 flex-1 text-xs"
        />
        {hasData && (
          <Check className="size-3.5 shrink-0 text-emerald-500" aria-label="Data loaded" />
        )}
        {source.error && (
          <X className="size-3.5 shrink-0 text-destructive" aria-label="Error" />
        )}
        {total > 1 && (
          <button
            type="button"
            className="shrink-0 rounded p-1 text-muted-foreground/60 transition-colors hover:bg-muted hover:text-destructive"
            onClick={onRemove}
            aria-label="Remove source"
          >
            <Trash2 className="size-3.5" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Input
          placeholder="https://api.example.com/data"
          value={source.url}
          onChange={(e) => onUpdate({ url: e.target.value })}
          className="h-8 flex-1 font-mono text-xs"
          aria-label={`API URL #${index + 1}`}
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="h-8 shrink-0 px-2.5"
          onClick={onFetch}
          disabled={source.loading || !source.url.trim()}
          aria-label={`Fetch source #${index + 1}`}
        >
          {source.loading ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <ArrowRight className="size-3" />
          )}
        </Button>
      </div>

      <div>
        <button
          type="button"
          className="flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          onClick={onToggleHeaders}
        >
          <ChevronDown
            className={`size-2.5 transition-transform ${headersExpanded ? "rotate-0" : "-rotate-90"}`}
          />
          Headers
        </button>
        {headersExpanded && (
          <textarea
            className="mt-1.5 w-full resize-y rounded-lg border border-border bg-muted/30 p-2 font-mono text-[11px] leading-relaxed text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            rows={3}
            value={source.headers}
            onChange={(e) => onUpdate({ headers: e.target.value })}
            spellCheck={false}
          />
        )}
      </div>

      {source.error && (
        <p className="text-[11px] text-destructive">{source.error}</p>
      )}
    </div>
  );
}

export default Playground;
