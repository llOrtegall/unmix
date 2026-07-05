// Architecture rules (ADR 0017, 0018): dependencies point toward the domain.
module.exports = {
  forbidden: [
    {
      name: "domain-is-pure",
      severity: "error",
      from: { path: "^src/domain/" },
      to: { pathNot: ["^src/domain/", "node_modules/neverthrow"] },
    },
    {
      name: "application-depends-on-domain-only",
      severity: "error",
      from: { path: "^src/application/" },
      to: { pathNot: ["^src/(application|domain)/", "node_modules/neverthrow"] },
    },
    {
      name: "presentation-skips-infrastructure",
      comment: "UI gets adapters through ServicesProvider, never by import",
      severity: "error",
      from: { path: "^src/presentation/" },
      to: { path: ["^src/infrastructure/", "^src/container\\.ts$"] },
    },
    {
      name: "infrastructure-ignores-presentation",
      severity: "error",
      from: { path: "^src/infrastructure/" },
      to: { path: "^src/presentation/" },
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
