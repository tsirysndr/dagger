import {
  queryType,
  stringArg,
  nonNull,
  makeSchema,
  dirname,
  join,
  resolve,
} from "./deps.ts";

import { hello } from "./main.ts";

const Query = queryType({
  definition(t) {
    t.string("hello", {
      args: {
        name: nonNull(stringArg()),
      },
      resolve: (_root, args, _ctx) => hello(args.name),
    });
  },
});

export const schema = makeSchema({
  types: [Query],
  outputs: {
    schema: resolve(join(dirname("."), "schema.graphql")),
    typegen: resolve(join(dirname("."), "gen", "nexus.ts")),
  },
});
