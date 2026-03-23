import type { DataNode, SelectionRule } from "./types.js";
import { FieldType } from "./types.js";

function isArrayOfObjects(n: DataNode): boolean {
  return (
    n.inferredType === FieldType.ARRAY &&
    n.semanticHints.includes("array_of_objects")
  );
}

function isFlatObject(n: DataNode): boolean {
  return (
    n.inferredType === FieldType.OBJECT &&
    (n.children ?? []).length > 0 &&
    (n.children ?? []).every(
      (c) =>
        c.cardinality === "scalar" &&
        c.inferredType !== FieldType.OBJECT &&
        c.inferredType !== FieldType.ARRAY,
    )
  );
}

function isNumericList(n: DataNode): boolean {
  return (
    n.cardinality === "list" &&
    n.inferredType === FieldType.NUMBER &&
    n.semanticHints.includes("primitive_array")
  );
}

export const defaultRules: SelectionRule[] = [
  {
    id: "array-objects-table",
    priority: 5,
    condition: (s) => isArrayOfObjects(s),
    score: (s) => {
      const rows = s.metadata.observedCount ?? 0;
      return rows <= 500 ? 0.95 : 0.75;
    },
    componentId: "DataTable",
    configDefaults: { pageSize: 20 },
  },
  {
    id: "flat-object-kv",
    priority: 8,
    condition: (s) => isFlatObject(s),
    score: () => 0.9,
    componentId: "KeyValueList",
  },
  {
    id: "numeric-list-chart",
    priority: 7,
    condition: (s) => isNumericList(s),
    score: (s) => {
      const n = s.metadata.observedCount ?? 0;
      return n <= 24 ? 0.92 : 0.72;
    },
    componentId: "BarChart",
    configDefaults: { showLegend: false },
  },
  {
    id: "enum-tag-list",
    priority: 9,
    condition: (s) =>
      s.cardinality === "list" &&
      s.inferredType === FieldType.ENUM &&
      s.semanticHints.includes("primitive_array"),
    score: () => 0.88,
    componentId: "TagList",
  },
  {
    id: "string-primitive-list",
    priority: 12,
    condition: (s) =>
      s.cardinality === "list" &&
      s.inferredType === FieldType.STRING &&
      s.semanticHints.includes("primitive_array"),
    score: () => 0.82,
    componentId: "BulletList",
  },
  {
    id: "object-with-metrics",
    priority: 10,
    condition: (s) =>
      s.inferredType === FieldType.OBJECT &&
      (s.children ?? []).filter(
        (c) =>
          c.inferredType === FieldType.NUMBER ||
          c.inferredType === FieldType.CURRENCY,
      ).length >= 2,
    score: () => 0.9,
    componentId: "MetricGrid",
  },
  {
    id: "nested-object-tree",
    priority: 11,
    condition: (s) =>
      s.inferredType === FieldType.OBJECT &&
      (s.children ?? []).some(
        (c) =>
          c.inferredType === FieldType.OBJECT ||
          c.inferredType === FieldType.ARRAY,
      ) &&
      !isFlatObject(s),
    score: () => 0.86,
    componentId: "TreePanel",
  },
  {
    id: "object-default-card",
    priority: 30,
    condition: (s) => s.inferredType === FieldType.OBJECT,
    score: () => 0.7,
    componentId: "PropertyCard",
  },
  {
    id: "array-fallback-cards",
    priority: 40,
    condition: (s) => s.inferredType === FieldType.ARRAY,
    score: () => 0.55,
    componentId: "CardGrid",
  },
  {
    id: "scalar-json",
    priority: 50,
    condition: () => true,
    score: () => 0.2,
    componentId: "JsonFallback",
  },
];
