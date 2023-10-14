import { client } from "./dagger.ts";

export async function hello(name: string) {
  const stdout = await client
    .container()
    .from("alpine")
    .withExec(["echo", "Hello from Dagger Module Deno!"])
    .stdout();

  console.log(stdout);

  return `Hello ${name}`;
}

export function add(a: number, b: number) {
  return a + b;
}
