import { SecretsManagerClient, GetSecretValueCommand } from "https://deno.land/x/aws_sdk@v3.32.0-1/client-secrets-manager/mod.ts";

const client = new SecretsManagerClient({ region: "us-west-2" }); // or your region

export async function getSecretValue(secretId: string): Promise<any> {
  const command = new GetSecretValueCommand({ SecretId: secretId });
  const response = await client.send(command);
  
  if (response.SecretString) {
    return JSON.parse(response.SecretString);
  }
  throw new Error("Secret not found or malformed");
}