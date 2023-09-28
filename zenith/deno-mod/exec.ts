import { execute } from "./deps.ts";
import { hello } from "./queries.ts";
import { schema } from "./schema.ts";

const result = await execute({
  schema,
  document: hello,
  variableValues: {
    name: "Tsiry",
  },
  contextValue: {
    x: 1,
  },
});

console.log(result.data);

// console.log(schema.getQueryType()?.getFields().hello);
