// Architecture rules (ADR 0018, 0028, 0032). Dependencies point toward the domain; hooks, components
// and pages reach modules through their factory instance and their domain objects.
module.exports = {
  forbidden: [
    {
      name: "domain-is-pure",
      comment: "Domain code imports only domain code: no packages",
      severity: "error",
      from: { path: "^src/modules/[^/]+/domain/" },
      to: { pathNot: "^src/modules/[^/]+/domain/" },
    },
    {
      name: "application-depends-on-domain-only",
      comment: "Use cases import their own application folder and domain code; only factory.ts wires infrastructure",
      severity: "error",
      from: { path: "^src/modules/([^/]+)/application/", pathNot: "/factory\\.ts$" },
      to: { pathNot: ["^src/modules/$1/application/", "^src/modules/[^/]+/domain/"] },
    },
    {
      name: "modules-ignore-entrypoints",
      severity: "error",
      from: { path: "^src/modules/" },
      to: { path: ["^src/(hooks|components|pages|i18n|lib)/", "^src/(App|main)\\.tsx$"] },
    },
    {
      name: "entrypoints-skip-infrastructure",
      comment: "Hooks, components and pages call the module factory, never a repository",
      severity: "error",
      from: { path: ["^src/(hooks|components|pages|i18n)/", "^src/(App|main)\\.tsx$"] },
      to: { path: "^src/modules/[^/]+/infrastructure/" },
    },
    {
      name: "modules-use-public-api",
      comment: "Reach another module only through its domain or its factory",
      severity: "error",
      from: { path: "^src/modules/([^/]+)/", pathNot: "^src/modules/[^/]+/test/" },
      to: {
        path: "^src/modules/([^/]+)/",
        pathNot: ["^src/modules/$1/", "^src/modules/shared/", "^src/modules/[^/]+/domain/", "^src/modules/[^/]+/application/factory\\.ts$"],
      },
    },
    {
      name: "production-ignores-tests",
      comment: "Tests may reuse another module's Mothers, but production code never imports test code",
      severity: "error",
      from: { pathNot: ["/test/", "\\.test\\.tsx?$"] },
      to: { path: ["/test/", "\\.test\\.tsx?$"] },
    },
    { name: "no-circular", severity: "error", from: {}, to: { circular: true } },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    // TypeScript 7 has no compiler API yet; swc parses the sources instead.
    parser: "swc",
    tsPreCompilationDeps: true,
    tsConfig: { fileName: "tsconfig.json" },
    enhancedResolveOptions: { extensions: [".ts", ".tsx", ".js"] },
  },
};
