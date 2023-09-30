import { connect, Client } from "../deps.ts";

export const client = await new Promise<Client>((resolve) => {
  if (!Deno.env.has("DAGGER_SESSION_PORT")) {
    resolve(new Client());
    return;
  }
  // deno-lint-ignore require-await
  connect(async (client: Client) => {
    resolve(client);
  });
});
