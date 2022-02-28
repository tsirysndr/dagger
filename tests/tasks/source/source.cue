package main

import (
	"dagger.io/dagger"
)

dagger.#Plan & {
	actions: {
		image: dagger.#Pull & {
			source: "alpine:3.15.0@sha256:e7d88de73db3d3fd9b2d63aa7f447a10fd0220b7cbf39803c803f2af9ba256b3"
		}

		source: dagger.#Source & {
			path: "."
		}

		exec: dagger.#Exec & {
			input: image.output
			mounts: code: {
				dest:     "/src"
				contents: source.output
			}
			args: ["/src/test.sh"]
		}

		verifyHello: dagger.#ReadFile & {
			input: source.output
			path:  "/world.txt"
		} & {
			// assert result
			contents: "world\n"
		}

		verifyWorld: dagger.#ReadFile & {
			input: exec.output
			path:  "/test.txt"
		} & {
			// assert result
			contents: "hello world"
		}
	}
}