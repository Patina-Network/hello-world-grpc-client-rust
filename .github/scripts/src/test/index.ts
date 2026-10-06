import { SonarScannerClient } from "@tahminator/pipeline";
import { $ } from "bun";

import { exclusions } from "../../../../exclusions";

async function main() {
  const { sonarToken } = parseCiEnv(process.env);

  const sonarClient = new SonarScannerClient({
    auth: {
      token: sonarToken,
    },
    scan: {
      additionalArgs: {
        "rust.lcov.reportPaths": "./lcov.info",
        "coverage.exclusions": `${exclusions}`,
      },
      organization: "patina-network",
      sourceCodeDir: "src/",
      projectKey: "Patina-Network_hello-world-grpc-client-rust",
    },
    run: {
      runTestsCmd: $`cargo clippy --locked --all-targets --message-format=json > clippy-report.json && cargo tarpaulin --locked --out lcov`,
    },
  });

  await sonarClient.runTests();
  await sonarClient.uploadTestCoverage();
}

function parseCiEnv(ciEnv: Record<string, string | undefined>) {
  const sonarToken = (() => {
    const v = ciEnv["SONAR_TOKEN"];
    if (!v) {
      throw new Error("Missing SONAR_TOKEN from .env.ci");
    }
    return v;
  })();

  return { sonarToken };
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
