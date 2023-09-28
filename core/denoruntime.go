package core

import (
	"context"
	"fmt"
	"path/filepath"

	"github.com/dagger/dagger/engine/buildkit"
	specs "github.com/opencontainers/image-spec/specs-go/v1"
)

func (mod *Module) denoRuntime(ctx context.Context,
	bk *buildkit.Client,
	progSock string,
	sourceDir *Directory,
	sourceDirSubpath string) (*Container, error) {
	baseCtr, err := NewContainer("", mod.Pipeline, mod.Platform)
	if err != nil {
		return nil, fmt.Errorf("failed to create container: %w", err)
	}
	baseCtr, err = baseCtr.From(ctx, bk, "denoland/deno:alpine-1.37.0")
	if err != nil {
		return nil, fmt.Errorf("failed to create container from: %w", err)
	}

	buildEnvCtr, err := baseCtr.WithExec(ctx, bk, progSock, mod.Platform, ContainerExecOpts{
		Args: []string{"apk", "add", "git"},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to install system dependencies: %w", err)
	}
	buildEnvCtr, err = buildEnvCtr.WithMountedDirectory(ctx, bk, ModSourceDirPath, sourceDir, "", false)
	if err != nil {
		return nil, fmt.Errorf("failed to mount mod source directory: %w", err)
	}
	buildEnvCtr, err = buildEnvCtr.UpdateImageConfig(ctx, func(cfg specs.ImageConfig) specs.ImageConfig {
		cfg.WorkingDir = filepath.Join(ModSourceDirPath, sourceDirSubpath)
		cfg.Cmd = nil
		return cfg
	})
	if err != nil {
		return nil, fmt.Errorf("failed to update image config: %w", err)
	}
	buildEnvCtr, err = buildEnvCtr.WithMountedCache(ctx, bk, "/root/.cache/deno", NewCache("moddenocache"), nil, CacheSharingModeShared, "")
	if err != nil {
		return nil, fmt.Errorf("failed to mount deno cache: %w", err)
	}
	buildEnvCtr, err = buildEnvCtr.WithExec(ctx, bk, progSock, mod.Platform, ContainerExecOpts{
		Args: []string{
			"deno",
			"compile",
			"--output",
			runtimeExecutablePath,
			"-A",
			"-r",
			"https://raw.githubusercontent.com/tsirysndr/dagger/zenith-functions/sdk/deno/src/ext/cli.ts",
		},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to exec deno compile: %w", err)
	}

	finalEnvCtr, err := buildEnvCtr.UpdateImageConfig(ctx, func(cfg specs.ImageConfig) specs.ImageConfig {
		cfg.WorkingDir = ModSourceDirPath
		cfg.Cmd = []string{"main.ts"}
		cfg.Entrypoint = []string{runtimeExecutablePath}
		return cfg
	})
	if err != nil {
		return nil, fmt.Errorf("failed to update image config: %w", err)
	}

	return finalEnvCtr, nil
}
