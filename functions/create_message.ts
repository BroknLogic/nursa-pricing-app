import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";

/**
 * Functions are reusable building blocks of automation that accept inputs,
 * perform calculations, and provide outputs. Functions can be used as steps in
 * a workflow or independently.
 * Learn more: https://api.slack.com/automation/functions/custom
 */
export const CreateMessage = DefineFunction({
  callback_id: "create_message",
  title: "Creates Pricing Message",
  description: "Formats a custom pricing message",
  source_file: "functions/create_message.ts", // The file with the exported function handler
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
    },
    required: [
      "userId",
      "facilityId",
      "licenseType"
    ],
  },
  output_parameters: {
    properties: {
      messageText: {
        type: Schema.types.string,
      },
    },
    required: [
      "messageText",
    ],
  },
});

/**
 * The default export for a custom function accepts a function definition
 * and a function handler that contains the custom logic for the function.
 */
export default SlackFunction(
  CreateMessage,
  async ({ inputs, client, env }) => {
    /**
     * Gather the stored external authentication access token using the access
     * token id passed from the workflow's input. This token can be used to
     * authorize requests made to an external service on behalf of the user.
     */

    const { userId, facilityId, licenseType } = inputs;
    console.log('start');
    //Splits arrays 
    const facilityIds = facilityId.split(',');

    console.log(facilityIds);
    console.log(licenseType);

    // Build every combination of facility_id and license_type
    const lines = facilityIds.flatMap(facilityId => 
      licenseType.map(licenseType => `${facilityId}: ${licenseType} is pending`)
    );
    console.log(lines);

    // Final message
    const messageText = `Pricing adjustments for submitted by <@${userId}>:\n` + lines.join('\n')

    console.log(messageText);

    return {
      completed: true,
      outputs: { 
        messageText: messageText
       } };
  },
);
