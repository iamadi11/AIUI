import {
  type Cardinality,
  type DataNode,
  type DataNodeMetadata,
  FieldType,
} from "./types.js";
import { stableId } from "./ingest.js";

const EMAIL_RE =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^https?:\/\//i;

function typeofJs(v: unknown): string {
  if (v === null) return "null";
  if (Array.isArray(v)) return "array";
  return typeof v;
}

function inferScalarType(
  key: string,
  value: unknown,
): { type: FieldType; hints: string[] } {
  const hints: string[] = [];
  const lk = key.toLowerCase();

  if (value === null || value === undefined) {
    return { type: FieldType.NULL, hints };
  }
  if (typeof value === "boolean") {
    return { type: FieldType.BOOLEAN, hints };
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    if (
      lk.includes("price") ||
      lk.includes("cost") ||
      lk.includes("amount") ||
      lk.includes("fee") ||
      lk.includes("salary")
    ) {
      hints.push("currency");
      return { type: FieldType.CURRENCY, hints };
    }
    if (
      lk.includes("rate") ||
      lk.includes("pct") ||
      lk.includes("percent") ||
      lk.includes("ratio")
    ) {
      hints.push("percentage");
      return { type: FieldType.PERCENTAGE, hints };
    }
    if (
      (value >= 0 && value <= 1) ||
      (value >= 0 && value <= 100 && lk.includes("progress"))
    ) {
      hints.push("percentage");
    }
    return { type: FieldType.NUMBER, hints };
  }
  if (typeof value === "string") {
    if (lk.includes("email") || EMAIL_RE.test(value)) {
      hints.push("email");
      return { type: FieldType.EMAIL, hints };
    }
    if (
      lk.includes("created") ||
      lk.includes("updated") ||
      lk.includes("date") ||
      lk.includes("time") ||
      lk.includes("timestamp")
    ) {
      const d = Date.parse(value);
      if (!Number.isNaN(d)) {
        hints.push("timestamp");
        return { type: FieldType.DATE, hints };
      }
    }
    const d = Date.parse(value);
    if (!Number.isNaN(d) && /\d{4}-\d{2}-\d{2}/.test(value)) {
      hints.push("timestamp");
      return { type: FieldType.DATE, hints };
    }
    if (
      lk.includes("url") ||
      lk.includes("href") ||
      lk.includes("link") ||
      lk.includes("src")
    ) {
      hints.push("url");
      return { type: FieldType.URL, hints };
    }
    if (URL_RE.test(value)) {
      hints.push("url");
      return { type: FieldType.URL, hints };
    }
    if (
      lk === "id" ||
      lk.endsWith("_id") ||
      lk === "uuid" ||
      lk === "key" ||
      lk === "code"
    ) {
      hints.push("identifier");
    }
    return { type: FieldType.STRING, hints };
  }
  return { type: FieldType.UNKNOWN, hints };
}

function cardinalityForArray(arr: unknown[]): Cardinality {
  return arr.length === 0 ? "list" : "list";
}

function collectEnumValues(sample: unknown[], max = 12): string[] | undefined {
  const set = new Set<string>();
  for (const item of sample.slice(0, 200)) {
    if (typeof item === "string") set.add(item);
    if (set.size > max) return undefined;
  }
  if (set.size <= 1 || set.size > max) return undefined;
  return [...set].sort();
}

export function analyzeValue(
  path: string[],
  key: string,
  value: unknown,
  sampleArray?: unknown[],
): DataNode {
  const t = typeofJs(value);
  const nullable = value === null || value === undefined;

  if (t === "null") {
    return {
      id: stableId(path),
      path,
      rawValue: value,
      inferredType: FieldType.NULL,
      semanticHints: [],
      cardinality: "scalar",
      metadata: { nullable: true },
    };
  }

  if (t === "array") {
    const arr = value as unknown[];
    const card = cardinalityForArray(arr);
    if (arr.length === 0) {
      return {
        id: stableId(path),
        path,
        rawValue: value,
        inferredType: FieldType.ARRAY,
        semanticHints: [],
        cardinality: card,
        children: [],
        metadata: { nullable: false, observedCount: 0 },
      };
    }
    const first = arr[0];
    const ft = typeofJs(first);
    if (ft === "object" && first !== null && !Array.isArray(first)) {
      const keys = Object.keys(first as object);
      const children = keys.map((k) =>
        analyzeValue(
          [...path, k],
          k,
          (first as Record<string, unknown>)[k],
          arr.map((row) =>
            row && typeof row === "object" && !Array.isArray(row)
              ? (row as Record<string, unknown>)[k]
              : undefined,
          ),
        ),
      );
      return {
        id: stableId(path),
        path,
        rawValue: value,
        inferredType: FieldType.ARRAY,
        semanticHints: ["array_of_objects"],
        cardinality: card,
        children,
        metadata: { nullable: false, observedCount: arr.length },
      };
    }
    const primitiveTypes = new Set(
      arr.slice(0, 50).map((x) => inferScalarType(key, x).type),
    );
    const homogenous = primitiveTypes.size <= 1;
    const inferred = inferScalarType(key, first);
    const enumVals =
      inferred.type === FieldType.STRING
        ? collectEnumValues(arr)
        : undefined;
    const meta: DataNodeMetadata = {
      nullable: arr.some((x) => x === null || x === undefined),
      observedCount: arr.length,
    };
    let type = inferred.type;
    if (enumVals && enumVals.length > 0) {
      type = FieldType.ENUM;
      meta.enumValues = enumVals;
    }
    return {
      id: stableId(path),
      path,
      rawValue: value,
      inferredType: type,
      semanticHints: homogenous
        ? [...inferred.hints, "primitive_array"]
        : [...inferred.hints, "mixed_array"],
      cardinality: card,
      metadata: meta,
    };
  }

  if (t === "object" && value !== null) {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj);
    const children = keys.map((k) =>
      analyzeValue([...path, k], k, obj[k], sampleArray),
    );
    const hasTs = children.some(
      (c) =>
        c.inferredType === FieldType.DATE ||
        c.semanticHints.includes("timestamp"),
    );
    const hints: string[] = ["object"];
    if (hasTs) hints.push("has_timestamp");
    return {
      id: stableId(path),
      path,
      rawValue: value,
      inferredType: FieldType.OBJECT,
      semanticHints: hints,
      cardinality: "map",
      children,
      metadata: { nullable },
    };
  }

  const scalar = inferScalarType(key, value);
  let type = scalar.type;
  if (
    type === FieldType.STRING &&
    sampleArray &&
    sampleArray.length > 0
  ) {
    const ev = collectEnumValues(
      sampleArray.filter((x) => typeof x === "string") as string[],
    );
    if (ev && ev.length > 0) {
      type = FieldType.ENUM;
      return {
        id: stableId(path),
        path,
        rawValue: value,
        inferredType: type,
        semanticHints: scalar.hints,
        cardinality: "scalar",
        metadata: { nullable, enumValues: ev },
      };
    }
  }
  return {
    id: stableId(path),
    path,
    rawValue: value,
    inferredType: type,
    semanticHints: scalar.hints,
    cardinality: "scalar",
    metadata: { nullable },
  };
}

export function buildDataTree(root: unknown): DataNode {
  const t = typeofJs(root);
  if (t === "array") {
    return analyzeValue([], "$root", root);
  }
  if (t === "object" && root !== null) {
    return analyzeValue([], "$root", root);
  }
  return analyzeValue([], "$root", root);
}
