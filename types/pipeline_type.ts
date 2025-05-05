// types/pipeline_run.ts
import { DefineType, Schema } from "deno-slack-sdk/mod.ts";

export const PipelineType = DefineType({
  name: "Pipeline",
  type: Schema.types.object,
  properties: {
    facility: {
      type: Schema.types.string,
    },
    license: {
      type: Schema.types.string,
    },
    runID: {
      type: Schema.types.string,
    },
    status: {
      type: Schema.types.string,
    },
  },
  required: ["facility", "license", "runID"],
});

// Define the array with the items as the custom type
export const PipelineArray = DefineType({
  name: "PipelineArray",
  type: Schema.types.array,
  items: {
    type: PipelineType
  },
})

/**
 * Corresponding TS typing for use elsewhere
 */
export type PipelineType = {
  facility: string;
  license: string;
  runID: string;
  status?: string;
};