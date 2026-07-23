// Architecture rules (ADR 0018, 0028, 0030). Dependencies point toward the domain; modules reach
// each other only through their domain or their application factory.
module.exports = {
  forbidden: [
    {
      name: "domain-is-pure",
      comment: "Domain code imports only domain code: no packages and no node: modules",
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
      to: { path: ["^src/(routes|middlewares|consumers|jobs)/", "^src/(app|server|config)\\.ts$"] },
    },
    {
      name: "entrypoints-skip-infrastructure",
      comment: "Entrypoints reach modules through their factory; only server.ts builds infrastructure",
      severity: "error",
      from: { path: ["^src/(routes|middlewares|consumers|jobs)/", "^src/app\\.ts$"] },
      to: { path: "^src/modules/[^/]+/infrastructure/" },
    },
    {
      name: "modules-use-public-api",
      comment: "Reach another module only through its domain or its factory; identity/index.ts exposes the users table for foreign keys",
      severity: "error",
      from: { path: "^src/modules/([^/]+)/", pathNot: "^src/modules/[^/]+/test/" },
      to: {
        path: "^src/modules/([^/]+)/",
        pathNot: [
          "^src/modules/$1/",
          "^src/modules/shared/",
          "^src/modules/[^/]+/domain/",
          "^src/modules/[^/]+/application/factory\\.ts$",
          "^src/modules/identity/index\\.ts$",
        ],
      },
    },
    {
      name: "production-ignores-tests",
      comment: "Tests may reuse another module's Mothers, but production code never imports test code",
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
