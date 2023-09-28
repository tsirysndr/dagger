// deno-lint-ignore-file no-explicit-any
import { Client } from "../client.ts";
import { connect } from "../connect.ts";
import * as defaultModule from "../../default_module.ts";

const module = (await import(Deno.args[0])) || defaultModule;

export function main() {
  connect(async (client: Client) => {
    console.log("module => ", module);
    const fnCall = client.currentFunctionCall();
    const mod = client.currentModule();
    const name = await fnCall.name();
    const args = await fnCall.inputArgs();
    console.log("function call name => ", name);
    console.log("function call args => ", args);

    for (const arg of args) {
      const argName = await arg.name();
      const argValue = await arg.value();
    }

    await fnCall.returnValue(
      '{"helloWorld": { "hello": "Hello tsiry" }}' as any
    );
  });
}

// Learn more at https://deno.land/manual/examples/module_metadata#concepts
if (import.meta.main) {
  main();
}
