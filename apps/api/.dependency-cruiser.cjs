// Architecture rules (ADR 0018). Dependencies point toward the domain;
// modules talk to each other only through their index.ts.
module.exports = {
  forbidden: [
    {
      name: "domain-is-pure",
      severity: "error",
      from: { path: "^src/(modules/[^/]+|shared)/domain/" },
      to: { pathNot: ["^src/(modules/[^/]+/domain|shared/kernel)/", "node_modules/neverthrow"] },
    },
    {
      name: "kernel-is-pure",
      severity: "error",
      from: { path: "^src/shared/kernel/" },
      to: { pathNot: ["^src/shared/kernel/", "node_modules/neverthrow"] },
    },
    {
      name: "application-depends-on-domain-only",
      severity: "error",
      from: { path: "^src/modules/([^/]+)/application/" },
      to: { path: ["/infrastructure/", "/interface/", "^src/app\\.ts$", "^src/main\\.ts$"] },
    },
    {
      name: "interface-skips-infrastructure",
      severity: "error",
      from: { path: "^src/modules/[^/]+/interface/" },
      to: { path: "/infrastructure/" },
    },
    {
      name: "modules-use-public-api",
      comment: "Import other modules only through their index.ts",
      severity: "error",
      from: { path: "^src/modules/([^/]+)/" },
      to: { path: "^src/modules/([^/]+)/", pathNot: ["^src/modules/$1/", "^src/modules/[^/]+/index\\.ts$"] },
    },
    {
      name: "shared-ignores-modules",
      severity: "error",
      from: { path: "^src/shared/" },
      to: { path: "^src/modules/" },
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
