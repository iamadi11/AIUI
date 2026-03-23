export enum FieldType {
  STRING = "STRING",
  NUMBER = "NUMBER",
  BOOLEAN = "BOOLEAN",
  DATE = "DATE",
  URL = "URL",
  EMAIL = "EMAIL",
  CURRENCY = "CURRENCY",
  PERCENTAGE = "PERCENTAGE",
  ENUM = "ENUM",
  OBJECT = "OBJECT",
  ARRAY = "ARRAY",
  NULL = "NULL",
  UNKNOWN = "UNKNOWN",
}

export type Cardinality = "scalar" | "list" | "map";

export interface DataNodeMetadata {
  nullable: boolean;
  observedCount?: number;
  valueRange?: [number, number];
  enumValues?: string[];
}

export interface DataNode {
  id: string;
  path: string[];
  rawValue: unknown;
  inferredType: FieldType;
  semanticHints: string[];
  cardinality: Cardinality;
  children?: DataNode[];
  metadata: DataNodeMetadata;
}

export interface ComponentCandidate {
  componentId: string;
  score: number;
  ruleId?: string;
  aiReasoning?: string;
  configDefaults?: Record<string, unknown>;
}

export interface SelectionRule {
  id: string;
  priority: number;
  condition: (schema: DataNode) => boolean;
  score: (schema: DataNode) => number;
  componentId: string;
  configDefaults?: Record<string, unknown>;
}

export type SelectionPath = "RULE" | "AI" | "CACHE" | "PINNED";

export interface ReasoningTrace {
  schemaSignature: string;
  analysisMs: number;
  selectionMs: number;
  totalMs: number;
  path: SelectionPath;
  candidates: Array<{
    componentId: string;
    score: number;
    ruleId?: string;
    aiReasoning?: string;
  }>;
  selected: string;
  configOverrides: string[];
  warnings: string[];
}

export interface InteractionSpec {
  trigger: "rowClick" | "cardClick" | "refresh";
  action: "expand" | "panel" | "none";
  path?: string[];
}

export interface ComponentPlan {
  componentId: string;
  props?: Record<string, unknown>;
  children?: ComponentPlan[];
  dataPath?: string[];
  interactions?: InteractionSpec[];
  /** References a key in the dataSources map for multi-API dashboards. */
  sourceId?: string;
}

export interface DynaUIConfig {
  preferredComponents?: Record<string, string>;
  excludeComponents?: string[];
  forceComponent?: string;
  density?: "compact" | "default" | "spacious";
  enableAI?: boolean;
  confidenceThreshold?: number;
  fields?: Record<string, Partial<DynaUIConfig>>;
}

export interface AIInferenceRequestPayload {
  schemaSignature: string;
  schemaTree: unknown;
  availableComponents: string[];
  ruleCandidates: ComponentCandidate[];
}

export interface AIInferenceResponsePayload {
  rankedComponents: Array<{
    componentId: string;
    score: number;
    reasoning?: string;
  }>;
  layoutHints?: {
    emphasizePaths?: string[][];
    columns?: string[][];
  };
}
