"use client";

import type { ComponentPlan } from "@dynaui/core";
import { getAtPath } from "./data-path";
import { BarChartWidget } from "./widgets/bar-chart";
import { BulletListWidget } from "./widgets/bullet-list";
import { CardGridWidget } from "./widgets/card-grid";
import { DataTableWidget } from "./widgets/data-table";
import { JsonFallbackWidget } from "./widgets/json-fallback";
import { KeyValueListWidget } from "./widgets/key-value-list";
import { LineChartWidget } from "./widgets/line-chart";
import { MetricGridWidget } from "./widgets/metric-grid";
import { PropertyCardWidget } from "./widgets/property-card";
import { TagListWidget } from "./widgets/tag-list";
import { TreePanelWidget } from "./widgets/tree-panel";

function DashboardShellView({
  data,
  plan,
  dataSources,
}: {
  data: unknown;
  plan: ComponentPlan;
  dataSources?: Record<string, unknown>;
}) {
  const children = plan.children ?? [];
  return (
    <div className="space-y-5">
      {plan.props?.title ? (
        <h2 className="text-base font-semibold tracking-tight">
          {String(plan.props.title)}
        </h2>
      ) : null}
      <div className="grid gap-5 lg:grid-cols-2">
        {children.map((child, i) => (
          <div key={child.sourceId ?? i} className={isFullWidthWidget(child.componentId) ? "lg:col-span-2" : ""}>
            <DynaPlanRenderer data={data} plan={child} dataSources={dataSources} />
          </div>
        ))}
      </div>
    </div>
  );
}

function isFullWidthWidget(id: string): boolean {
  return id === "DataTable" || id === "LineChart" || id === "BarChart";
}

export function DynaPlanRenderer({
  data,
  plan,
  dataSources,
}: {
  data: unknown;
  plan: ComponentPlan;
  dataSources?: Record<string, unknown>;
}) {
  const resolvedData =
    plan.sourceId && dataSources?.[plan.sourceId] !== undefined
      ? dataSources[plan.sourceId]
      : data;
  const scoped = getAtPath(resolvedData, plan.dataPath ?? []) ?? resolvedData;
  const title = plan.props?.title as string | undefined;
  const pageSize = (plan.props?.pageSize as number | undefined) ?? 20;

  switch (plan.componentId) {
    case "DashboardShell":
      return <DashboardShellView data={resolvedData} plan={plan} dataSources={dataSources} />;
    case "DataTable":
      return (
        <DataTableWidget
          data={scoped}
          title={title}
          pageSize={pageSize}
        />
      );
    case "KeyValueList":
      return <KeyValueListWidget data={scoped} title={title} />;
    case "BarChart":
      return <BarChartWidget data={scoped} title={title} />;
    case "LineChart":
      return <LineChartWidget data={scoped} title={title} />;
    case "TagList":
      return <TagListWidget data={scoped} title={title} />;
    case "BulletList":
      return <BulletListWidget data={scoped} title={title} />;
    case "MetricGrid":
      return <MetricGridWidget data={scoped} title={title} />;
    case "TreePanel":
      return <TreePanelWidget data={scoped} title={title} />;
    case "PropertyCard":
      return <PropertyCardWidget data={scoped} title={title} />;
    case "CardGrid":
      return <CardGridWidget data={scoped} title={title} />;
    case "JsonFallback":
    default:
      return <JsonFallbackWidget data={scoped} title={title} />;
  }
}
