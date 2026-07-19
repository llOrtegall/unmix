// Architecture rules (ADR 0018, 0028). Dependencies point toward the domain; modules reach
// each other only through their domain or their application factory.
module.exports = {
  forbidden: [
    {
      name: "domain-is-pure",
      severity: "error",
      from: { path: "^src/modules/[^/]+/domain/" },
      to: { pathNot: "^src/modules/[^/]+/domain/", dependencyTypesNot: ["core"] },
    },
    {
      name: "application-depends-on-domain-only",
      comment: "Only the module factory wires infrastructure",
      severity: "error",
      from: { path: "^src/modules/([^/]+)/application/", pathNot: "/factory\\.ts$" },
      to: { path: ["/infrastructure/", "^src/(app|main|config)\\.ts$"] },
    },
    {
      name: "modules-ignore-entrypoints",
      severity: "error",
      from: { path: "^src/modules/" },
      to: { path: "^src/(routes|middlewares|consumers|jobs)/" },
    },
    {
      name: "entrypoints-skip-infrastructure",
      comment: "Entrypoints reach modules through their factory",
      severity: "error",
      from: { path: "^src/(routes|middlewares|consumers|jobs)/" },
      to: { path: "^src/modules/[^/]+/infrastructure/" },
    },
    {
      name: "modules-use-public-api",
      comment: "Reach another module only through its domain, its factory or its index.ts; tests may reuse its Mothers",
      severity: "error",
      from: { path: "^src/modules/([^/]+)/", pathNot: "^src/modules/[^/]+/test/" },
      to: {
        path: "^src/modules/([^/]+)/",
        pathNot: [
          "^src/modules/$1/",
          "^src/modules/shared/",
          "^src/modules/[^/]+/domain/",
          "^src/modules/[^/]+/application/factory\\.ts$",
          "^src/modules/[^/]+/index\\.ts$",
        ],
      },
    },
    {
      name: "production-ignores-tests",
      severity: "error",
      from: { pathNot: ["/test/", "\\.test\\.ts$"] },
      to: { path: "^src/modules/[^/]+/test/" },
    },
    { name: "no-circular", severity: "error", from: {}, to: { circular: true } },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    // TypeScript 7 has no compiler API yet; swc parses the sources instead.
    parser: "swc",
    tsPreCompilationDeps: true,
    tsConfig: { fileName: "tsconfig.json" },
  },
};
