// deno-lint-ignore-file no-explicit-any
import { Client, TypeDefKind } from "../client.ts";
import { connect } from "../connect.ts";
import { execute } from "../../deps.ts";

const module = await import(Deno.args[0]);

if (!module) {
  throw new Error("Module not found");
}

const { schema, queries } = module;

if (!schema) {
  throw new Error("Schema not found");
}

if (!queries) {
  throw new Error("Queries not found");
}

const resolvers = Object.keys(module).filter(
  (key) => key !== "default" && key !== "schema" && key !== "queries"
);

export function main() {
  connect(async (client: Client) => {
    const fnCall = client.currentFunctionCall();
    let mod = client.currentModule();

    const name = await fnCall.name();
    let returnValue;

    if (name === "") {
      const moduleName = await mod.name();
      const typeDef = client.typeDef().withObject(moduleName);

      for (const resolver of resolvers) {
        const fn = client
          .newFunction(
            resolver,
            client.typeDef().withKind(TypeDefKind.Stringkind)
          )
          .withArg("name", client.typeDef().withKind(TypeDefKind.Stringkind));
        mod = mod.withObject(typeDef.withFunction(fn));
      }

      const id = await mod.id();
      returnValue = `"${id}"`;
    } else {
      const args = await fnCall.inputArgs();
      console.log("function call name => ", name);

      const params = [];
      for (const arg of args) {
        const argName = await arg.name();
        const argValue = await arg.value();
        console.log("args => ", argName, argValue);
        params.push(argValue.replace(/"/g, ""));
      }

      const result = await execute({
        schema,
        document: queries[name],
        variableValues: {
          name: params[0],
        },
      });

      returnValue = `"${result.data?.[name]}"`;
    }

    await fnCall.returnValue(returnValue as any);
  });
}

// Learn more at https://deno.land/manual/examples/module_metadata#concepts
if (import.meta.main) {
  main();
}
