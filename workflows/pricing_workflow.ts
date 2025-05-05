import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { CreateMessage } from "../functions/create_message.ts";
import { PricingFunction } from "../functions/pricing_function.ts";
import { PollPipelineStatus } from "../functions/poll_pipeline_status.ts";

const PricingWorkflow = DefineWorkflow({
  callback_id: "pricing_workflow",
  title: "Input Pricing Paramters",
  input_parameters: {
    properties: {
      interactivity: {
        type: Schema.slack.types.interactivity,
      },
      user: {
        type: Schema.slack.types.user_id,
      },
    },
    required: ["interactivity", "user"],
  },
});

const pricing = PricingWorkflow.addStep(
  Schema.slack.functions.OpenForm,
  {
    title: "Submit Pricing Change",
    interactivity: PricingWorkflow.inputs.interactivity,
    submit_label: "Submit",
    description: "Make sure all fields are filled out before submitting a price change.",
    fields: {
      elements: [{
        name: "facility_id",
        title: "Facility Id",
        description: "Use the full facility ID in the database, might be best to look up in app.",
        type: Schema.types.string,
      }, {
        name: "license_type",
        title: "License",
        type: Schema.types.array,
        items: {
          type: Schema.types.string,
          enum: ["CNA", "LPN", "RN", "CG", "CMA", "CRMA", "GNA", "MA-C", "PN", "QMAP", "RT"], // get all licenses 
        },
        //default: ["CNA"],
      }, {
        name: "margin_percentage",
        title: "License Margin Percentage",
        type: Schema.types.number,
      }, {
        name: "weekday_day",
        title: "Weekday Day Price",
        type: Schema.types.number,
      }, {
        name: "weekday_night",
        title: "Weekday Night Price",
        type: Schema.types.number,
      }, {
        name: "weekend_day",
        title: "Weekend Day Price",
        type: Schema.types.number,
      }, {
        name: "weekend_night",
        title: "Weekend Night Price",
        type: Schema.types.number,
      }],
      required: ["facility_id", "license_type", "margin_percentage", "weekday_day", "weekday_night", "weekend_day", "weekend_night"],
    },
  },
);

const createMessageStep = PricingWorkflow.addStep(CreateMessage, {
  userId: PricingWorkflow.inputs.user,
  facilityId: pricing.outputs.fields.facility_id,
  licenseType: pricing.outputs.fields.license_type,
});

const messageStep = PricingWorkflow.addStep(Schema.slack.functions.SendMessage, {
  channel_id: 'C071W2PH09W',
  message: createMessageStep.outputs.messageText,
});

const pricingChange = PricingWorkflow.addStep(PricingFunction, {
  userId: PricingWorkflow.inputs.user, 
  facilityId: pricing.outputs.fields.facility_id,
  licenseType: pricing.outputs.fields.license_type,
  marginPercentage: pricing.outputs.fields.margin_percentage,
  weekDayDay: pricing.outputs.fields.weekday_day,
  weekDayNight: pricing.outputs.fields.weekday_night,
  weekEndDay: pricing.outputs.fields.weekend_day,
  weekEndNight: pricing.outputs.fields.weekend_night,
  channelId: messageStep.outputs.message_context.channel_id,
  messageTs: messageStep.outputs.message_context.message_ts,
});

const delayStep = PricingWorkflow.addStep(
  Schema.slack.functions.Delay,
  {
    minutes_to_delay: 2,
  },
);

const pricingChangeStatus = PricingWorkflow.addStep(PollPipelineStatus, {
  user: PricingWorkflow.inputs.user,
  runDict: pricingChange.outputs.runDict,
  channelId: messageStep.outputs.message_context.channel_id,
  messageTs: messageStep.outputs.message_context.message_ts,
});

export { PricingWorkflow };