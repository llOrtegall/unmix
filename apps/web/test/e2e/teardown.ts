import { TEST_DOMAIN, testUserCli } from "./fixtures.ts";

// Users cascade to their tracks; leftover files are swept by the API's hourly cleanup.
export default function teardown() {
  testUserCli("delete", TEST_DOMAIN);
}
