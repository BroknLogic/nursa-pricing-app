import { Trigger } from "deno-slack-sdk/types.ts";
import { TriggerContextData, TriggerTypes } from "deno-slack-api/mod.ts";
import { PricingWorkflow } from "../workflows/pricing_workflow.ts";

/**
 * Triggers determine when workflows are executed. A trigger file describes a
 * scenario in which a workflow should be run, such as a user clicking a link.
 * Learn more: https://api.slack.com/automation/triggers/link
 */
const trigger: Trigger<typeof PricingWorkflow.definition> = {
  type: TriggerTypes.Shortcut,
  name: "Send pricing changes",
  description: "Sends pricing changes to the app.",
  workflow: `#/workflows/${PricingWorkflow.definition.callback_id}`,
  inputs: {
    interactivity: {
      value: TriggerContextData.Shortcut.interactivity,
    },
    user: {
      value: TriggerContextData.Shortcut.user_id,
    },
  },
};

export default trigger;