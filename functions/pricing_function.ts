import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import { PipelineArray } from "../types/pipeline_type.ts";

/**
 * Functions are reusable building blocks of automation that accept inputs,
 * perform calculations, and provide outputs. Functions can be used as steps in
 * a workflow or independently.
 * Learn more: https://api.slack.com/automation/functions/custom
 */
export const PricingFunction = DefineFunction({
  callback_id: "pricing_function",
  title: "Calls Pricing Change",
  description: "Sends a pricing change to Postgres via Mage",
  source_file: "functions/pricing_function.ts", // The file with the exported function handler
  input_parameters: {
    properties: {
      userId: {
        type: Schema.slack.types.user_id,
      },
      facilityId: {
        type: Schema.types.string,
      },
      licenseType: {
        type: Schema.types.array,
        items: {
          type: Schema.types.string,
        },
        description: "Type of license to submit pricing change",
      },
      marginPercentage: {
        type: Schema.types.number,
        description: "Margin Percentage for the license",
      },
      weekDayDay: {
        type: Schema.types.number,
        description: "Weekday Day Price",
      },
      weekDayNight: {
        type: Schema.types.number,
        description: "Weekday Night Price",
      },
      weekEndDay: {
        type: Schema.types.number,
        description: "Weekend Day Price",
      },
      weekEndNight: {
        type: Schema.types.number,
        description: "Weekend Night Price",
      },
      channelId: {
        type: Schema.types.string,
      },
      messageTs: {
        type: Schema.types.string,
      },
    },
    required: [
      "userId",
      "facilityId",
      "licenseType",
      "marginPercentage",
      "weekDayDay",
      "weekDayNight",
      "weekEndDay",
      "weekEndNight",
      "channelId",
      "messageTs",
    ],
  },
  output_parameters: {
    properties: {
      runDict: {
        type: PipelineArray,
      },
    },
    required: [
      "runDict",
    ],
  },
});

/**
 * The default export for a custom function accepts a function definition
 * and a function handler that contains the custom logic for the function.
 */
export default SlackFunction(
  PricingFunction,
  async ({ inputs, client, env }) => {
    /**
     * Gather the stored external authentication access token using the access
     * token id passed from the workflow's input. This token can be used to
     * authorize requests made to an external service on behalf of the user.
     */

    const headers = {
      "x-api-key": env.MAGE_API_KEY,
      Cookie: `oauth_token=${env.MAGE_OAUTH_TOKEN}`,
    };
    const { userId, facilityId, licenseType, marginPercentage, weekDayDay, weekDayNight, weekEndDay, weekEndNight, channelId, messageTs } = inputs;

    //pull email from userID
    const userInfo = await client.users.info({ user: userId });

    if (!userInfo.ok || !userInfo.user || !userInfo.user.profile?.email) {
      return { error: "Could not retrieve email for the workflow starter." };
    }

    const email = userInfo.user.profile.email;

    // single_license_pricing_adjustment endpoint
    let url = 'https://cluster.mage.ai/mageai-24-data-engineering/api/pipeline_schedules/438/pipeline_runs/0b624eb9f5794e3fa347ad92c215c517';

    const facilities = facilityId.split(",").map(facility => facility.trim());
    const results = [];

    for (let facility of facilities) {
      facility = facility.padStart(6, "0");
      for (let license of licenseType) {
        try {
          const body = JSON.stringify({
            "pipeline_run": {
              "variables" : {
                "email": "kevin.enrile@nursa.com",//TODO: Change back
                "facility_id": facility, 
                "license": license,
                "margin_percentage": marginPercentage,
                "prod": true,
                "weekday_day_rate": weekDayDay,
                "weekday_night_rate": weekDayNight,
                "weekend_day_rate": weekEndDay,
                "weekend_night_rate": weekEndNight,
                "message_ts": messageTs,
                "channel_id": channelId
              },
              "error_on_failure": true
            }
          });
    
          const response = await fetch(url, {
            method: "POST",
            headers,
            body,
          });
          
          if (!response.ok) {
            throw new Error(`${response.status}: ${response.statusText}`);
          }
          
          const result = await response.json();
          let runID = result.pipeline_run?.id;
          
          if (!runID) {
            throw new Error("No pipeline run UUID returned.");
          }
          
          results.push({ facility: facility, license: license, runID: runID });
        } catch (err) {
          console.error(`Error processing facility ${facility}/${license}: `, err);
          return {
            error:
              `An error was encountered during facilty ${facility}/${license}: ${err.message}`,
          };
        }
      }
    }
    return {
      completed: true,
      outputs: { 
        message: "Pricing change submitted successfully",
        runDict: results
       } };
  },
);
