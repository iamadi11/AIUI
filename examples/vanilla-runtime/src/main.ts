import { DSL_VERSION, LAYOUT_VERSION } from "@aiui/dsl-schema";
import { render } from "@aiui/runtime-core";

const ROOT_ID = "10000000-0000-4000-8000-000000000001";

const doc = {
  version: DSL_VERSION,
  layoutVersion: LAYOUT_VERSION,
  root: {
    id: ROOT_ID,
    type: "Box",
    props: {},
  },
};

const el = document.getElementById("app");
if (!el) {
  throw new Error("Missing #app");
}

render({ container: el, config: doc });
