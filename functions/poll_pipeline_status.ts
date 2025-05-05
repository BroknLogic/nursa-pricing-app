import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import { PipelineArray } from "../types/pipeline_type.ts";
// import { getSecretValue } from "../utils/awsSecrets.ts";

/**
 * Functions are reusable building blocks of automation that accept inputs,
 * perform calculations, and provide outputs. Functions can be used as steps in
 * a workflow or independently.
 * Learn more: https://api.slack.com/automation/functions/custom
 */
export const PollPipelineStatus = DefineFunction({
  callback_id: "poll_pipeline_status",
  title: "Poll Pricing Change",
  description: "Checks mage to see the status of running pipeline",
  source_file: "functions/poll_pipeline_status.ts", // The file with the exported function handler
  input_parameters: {
    properties: {
      user: {
        type: Schema.slack.types.user_id,
      },
      runDict: {
        type: PipelineArray,
      },
      channelId: {
        type: Schema.types.string,
      },
      messageTs: {
        type: Schema.types.string,
      },
    },
    required: [
      "user",
      "runDict",
      "channelId",
      "messageTs",
    ],
  },
});

/**
 * The default export for a custom function accepts a function definition
 * and a function handler that contains the custom logic for the function.
 */
export default SlackFunction(PollPipelineStatus,
  async ({ inputs, client, env }) => {
    /**
     * Gather the stored external authentication access token using the access
     * token id passed from the workflow's input. This token can be used to
     * authorize requests made to an external service on behalf of the user.
     */

    //const mageAPI = await getSecretValue("dataeng/prod/mage-api")

    const headers = {
      "x-api-key": env.MAGE_API_KEY,
      Cookie: `oauth_token=${env.MAGE_OAUTH_TOKEN}`,
    };

    const { user, runDict, channelId, messageTs } = inputs;
    const results = [];
    let status = "queued";

    for (const run of runDict) {
      const { facility, license, runID } = run;
      try {
        // Polling the pipeline status
        const statusResponse = await fetch(`https://cluster.mage.ai/mageai-24-data-engineering/api/pipeline_runs/${runID}`, {
          method: "GET",
          headers,
        });
      
        if (!statusResponse.ok) {
          throw new Error(`Status check failed with ${statusResponse.status}`);
        }

        const statusJson = await statusResponse.json();
        console.log("Extracted status:", statusJson.pipeline_run?.status);
        status = statusJson.pipeline_run?.status; // should be 'completed', 'failed', etc.
        results.push({ facility: facility, license: license, runID: runID, status: status });
      } catch (err) {
        console.error(`Error processing facility ${facility}/${license}: `, err);
        
        return {
          error:
            `An error was encountered during facilty ${facility}/${license}: ${err.message}`,
        };
      }
    }
    let facility = results[0].facility;
    status = results[0].status;
    let license = results[0].license;
    for (let i = 1; i < results.length; i++) {
      facility += `, ${results[i].facility}`;
      license += `, ${results[i].license}`;
      if (results[i].status != "completed") {
        status = results[i].status;
      }
    }
  
  
  if (status !== "completed") {
    await client.chat.update({
      channel: channelId,
      ts: messageTs,
      text: `Pricing adjustments for ${facility}: ${license} submitted by <@${user}> have failed. ❌`,
    });
  }
  else {
  await client.chat.update({
    channel: channelId,
    ts: messageTs,
    text: `Pricing adjustments for ${facility}: ${license} submitted by <@${user}> have ran successfully. ✅`,
    });
    
  }
  return {
    completed: true 
  };
  },
);
