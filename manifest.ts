import { Manifest } from "deno-slack-sdk/mod.ts";
import { PricingWorkflow } from "./workflows/pricing_workflow.ts";

/**
 * The app manifest contains the app's configuration. This
 * file defines attributes like app name and description.
 * https://api.slack.com/automation/manifest
 */
export default Manifest({
  name: "pricing-app",
  description: "A blank template for building Slack apps with Deno",
  icon: "assets/pricing_app.png",
  workflows: [PricingWorkflow],
  outgoingDomains: ["cluster.mage.ai"],
  botScopes: ["commands", "chat:write", "chat:write.public", "channels:read", "channels:history", "users:read", "users:read.email",],
});
