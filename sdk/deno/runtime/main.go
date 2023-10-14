package main

import (
	"path"
	"path/filepath"
)

type DenoSdk struct{}

const (
	ModSourceDirPath      = "/src"
	RuntimeExecutablePath = "/usr/local/bin/runtime"
)

type RuntimeOpts struct {
	SubPath  string   `doc:"Sub-path of the source directory that contains the module config."`
	Platform Platform `doc:"Platform to build for."`
}

func (m *DenoSdk) ModuleRuntime(modSource *Directory, opts RuntimeOpts) *Container {
	modSubPath := filepath.Join(ModSourceDirPath, opts.SubPath)
	return m.Base(opts.Platform).
		WithDirectory(ModSourceDirPath, modSource).
		WithWorkdir(modSubPath).
		WithExec([]string{"sh", "-c", "ls -lha"}).
		WithExec([]string{"codegen", "--module", ".", "--lang", "nodejs"}, ContainerWithExecOpts{
			ExperimentalPrivilegedNesting: true,
		}).
		WithExec([]string{
			"deno",
			"install",
			"--reload",
			"-A",
			"https://raw.githubusercontent.com/tsirysndr/dagger/zenith-functions/sdk/deno/src/ext/cli.ts",
			"-n",
			"runtime",
		}).
		WithWorkdir(ModSourceDirPath).
		WithDefaultArgs().
		WithEntrypoint([]string{RuntimeExecutablePath}).
		WithLabel("io.dagger.module.config", modSubPath)
}

func (m *DenoSdk) Codegen(modSource *Directory, opts RuntimeOpts) *GeneratedCode {
	base := m.Base(opts.Platform).
		WithMountedDirectory(ModSourceDirPath, modSource).
		WithWorkdir(path.Join(ModSourceDirPath, opts.SubPath))

	codegen := base.
		WithExec([]string{"codegen", "--module", ".", "--propagate-logs", "--lang", "nodejs"}, ContainerWithExecOpts{
			ExperimentalPrivilegedNesting: true,
		}).
		Directory(".")

	return dag.GeneratedCode().
		WithCode(base.Directory(".").Diff(codegen)).
		WithVCSIgnoredPaths([]string{
			"dagger.gen.go",
			"internal/querybuilder/",
			"querybuilder/", // for old repos
		})
}

func (m *DenoSdk) Base(platform Platform) *Container {
	return m.denoBase(platform).
		WithDirectory("/sdk", dag.Host().Directory(".")).
		WithExec([]string{"sh", "-c", "cp /sdk/codegen /usr/local/bin/codegen"})
}

func (m *DenoSdk) denoBase(platform Platform) *Container {
	opts := ContainerOpts{}
	if platform != "" {
		opts.Platform = platform
	}
	return dag.Container(opts).
		From("denoland/deno:alpine-1.37.0").
		WithExec([]string{"apk", "add", "--no-cache", "git"}).
		WithMountedCache("/deno-dir", dag.CacheVolume("moddenocache"))
}

func (m *DenoSdk) goBase(platform Platform) *Container {
	opts := ContainerOpts{}
	if platform != "" {
		opts.Platform = platform
	}
	return dag.Container(opts).
		From("golang:1.21-alpine").
		WithMountedCache("/go/pkg/mod", dag.CacheVolume("modgomodcache")).
		WithMountedCache("/root/.cache/go-build", dag.CacheVolume("modgobuildcache"))
}
