// deno-lint-ignore-file no-explicit-any
import { Client, TypeDef, TypeDefKind } from "../client.ts";
import { connect } from "../connect.ts";
import { execute } from "../../deps.ts";
import { getArgsType, getReturnType } from "./lib.ts";

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

const typeMap: Record<string, TypeDefKind> = {
  String: TypeDefKind.Stringkind,
  Int: TypeDefKind.Integerkind,
  Boolean: TypeDefKind.Booleankind,
  Void: TypeDefKind.Voidkind,
};

export function main() {
  connect(async (client: Client) => {
    const fnCall = client.currentFunctionCall();
    let mod = client.currentModule();

    const name = await fnCall.name();
    let returnValue;

    if (name === "") {
      const moduleName = await mod.name();
      let objDef = client.typeDef().withObject(moduleName);

      for (const key of resolvers) {
        objDef = register(client, key, objDef);
      }

      mod = mod.withObject(objDef);
      const id = await mod.id();
      returnValue = `"${id}"`;
    } else {
      const args = await fnCall.inputArgs();
      console.log("function call name => ", name);

      const argsType = getArgsType(schema, name);
      const variableValues: Record<string, any> = {};
      for (const arg of args) {
        const argName = await arg.name();
        const argValue = await arg.value();
        console.log("args => ", argName, argValue, typeof argValue);

        variableValues[argName] = parseArg(
          argValue,
          argsType.find((a) => a.name === argName)?.type || "String"
        );
      }

      const result = await execute({
        schema,
        document: queries[name],
        variableValues,
      });

      console.log("=> result", result);

      returnValue = `"${result.data?.[name]}"`;
    }

    await fnCall.returnValue(returnValue as any);
  });
}

function parseArg(value: any, type: string) {
  switch (type) {
    case "String":
      return value.replace(/"/g, "");
    case "Int":
      return parseInt(value);
    case "Boolean":
      return /^\s*(true|1|on)\s*$/i.test(value);
    default:
      return value;
  }
}

function register(client: Client, functionName: any, objDef: TypeDef) {
  const returnType = getReturnType(schema, functionName);
  const argsType = getArgsType(schema, functionName);

  let fn = client.newFunction(
    functionName,
    client.typeDef().withKind(typeMap[returnType])
  );

  for (const arg of argsType) {
    fn = fn.withArg(arg.name, client.typeDef().withKind(typeMap[arg.type]));
  }

  return objDef.withFunction(fn);
}

// Learn more at https://deno.land/manual/examples/module_metadata#concepts
if (import.meta.main) {
  main();
}
