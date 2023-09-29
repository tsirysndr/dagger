import {
  queryType,
  stringArg,
  intArg,
  nonNull,
  makeSchema,
  dirname,
  join,
  resolve,
} from "../deps.ts";

import { add, hello } from "./main.ts";

const Query = queryType({
  definition(t) {
    t.string("hello", {
      args: {
        name: nonNull(stringArg()),
      },
      resolve: (_root, args, _ctx) => hello(args.name),
    });
    t.int("add", {
      args: {
        a: nonNull(intArg()),
        b: nonNull(intArg()),
      },
      resolve: (_root, args, _ctx) => add(args.a, args.b),
    });
    t.boolean("isEven", {
      args: {
        num: nonNull(intArg()),
      },
      resolve: (_root, args, _ctx) => args.num % 2 === 0,
    });
  },
});

export const schema = makeSchema({
  types: [Query],
  outputs: {
    schema: resolve(join(dirname(".."), "schema.graphql")),
    typegen: resolve(join(dirname(".."), "gen", "nexus.ts")),
  },
});
