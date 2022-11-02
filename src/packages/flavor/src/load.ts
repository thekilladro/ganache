import chalk from "chalk";
import { TruffleColors } from "@ganache/colors";
import { Flavor } from "./flavor";
import { hasOwn } from "@ganache/utils";

export function load<F extends Flavor>(flavor: F["flavor"]): F {
  // `@ganache/filecoin` used to be named just `filecoin`, we we need to
  // preserve this alias for backwards compatibility
  if (flavor === "filecoin") flavor = "@ganache/filecoin";
  try {
    // we use `eval` to prevent webpack from webpacking the `require` statement.
    return eval("require")(flavor).default as F;
  } catch (e: any) {
    if (
      hasOwn(e, "message") &&
      typeof e.message === "string" &&
      e.message.includes(`Cannot find module '${flavor}'`)
    ) {
      const NEED_HELP = "Need help? Reach out to the Truffle community at";
      const COMMUNITY_LINK = "https://trfl.io/support";

      // we print and exit rather than throw to prevent webpack output from being
      // spat out for the line number
      console.warn(
        chalk`\n\n{red.bold ERROR:} Could not find Ganache flavor "{bold ${flavor}}"; ` +
          `it probably\nneeds to be installed.\n` +
          ` ▸ if you're using Ganache as a library run: \n` +
          chalk`   {blue.bold $ npm install ${flavor}}\n` +
          ` ▸ if you're using Ganache as a CLI run: \n` +
          chalk`   {blue.bold $ npm install --global ${flavor}}\n\n` +
          chalk`{hex("${TruffleColors.porsche}").bold ${NEED_HELP}}\n` +
          chalk`{hex("${TruffleColors.turquoise}") ${COMMUNITY_LINK}}\n\n`
      );
      process.exit(1);
    } else {
      throw e;
    }
  }
}
