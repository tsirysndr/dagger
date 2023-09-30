import { client } from "./dagger.ts";

export async function hello(name: string) {
  const ctr = client
    .pipeline("test")
    .container()
    .from("alpine")
    .withExec(["apk", "add", "curl"])
    .withExec(["echo", "Hello from container"]);
  const result = await ctr.stdout();
  console.log(result);
  return `Hello ${name}`;
}

export function add(a: number, b: number) {
  return a + b;
}
