import { connect, Client } from "https://esm.sh/@dagger.io/dagger@0.8.8";

connect(async (client: Client) => {
  const context = client.host().directory(".");
  const ctr = client
    .container()
    .from("golang:1.21-alpine")
    .withMountedCache("/go/pkg/mod", client.cacheVolume("modgomodcache"))
    .withMountedCache(
      "/root/.cache/go-build",
      client.cacheVolume("modgobuildcache")
    )
    .withDirectory("/sdk", context, { exclude: ["runtime.tar"] })
    .withLabel("io.dagger.module.config", "/sdk/runtime");
  await ctr.publish("tsiry/dagger-sdk-deno");
});
