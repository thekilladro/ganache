import { normalize } from "./helpers";
import { Definitions } from "@ganache/options";
import { openSync, PathLike } from "fs";
import { Logger, createLogger } from "@ganache/utils";

export type LoggingConfig = {
  options: {
    /**
     * An object, like `console`, that implements a `log` function.
     *
     * Defaults to `console` (logs to stdout).
     *
     * @example
     * ```typescript
     * {
     * 	log: (message: any) => {
     * 		// handle `message`
     * 	}
     * }
     * ```
     */
    readonly logger: {
      type: Logger;
      hasDefault: true;
    };

    /**
     * If you set this option, Ganache will write logs to a file located at the
     * specified path. You can provide a path, or numerical file descriptor.
     */
    readonly file: {
      type: number | PathLike;
    };
  };
};

export const LoggingOptions: Definitions<LoggingConfig> = {
  file: {
    // always normalizes to a file descriptor
    // todo: it would be nice if the accessor for file was a number type
    normalize: (raw: number | PathLike): number => {
      let descriptor: number;
      if (typeof raw === "number") {
        descriptor = raw as number;
      } else {
        try {
          descriptor = openSync(raw as PathLike, "a");
        } catch (err) {
          throw new Error(
            `Failed to open log file ${raw}. Please check if the file path is valid and if the process has write permissions to the directory.`
          );
        }
      }
      return descriptor;
    },

    cliDescription:
      "If set, Ganache will write logs to a file located at the specified path.",
    cliType: "string"
  },
  logger: {
    normalize: raw =>
      createLogger({
        ...raw,
        baseLog: (message: any, ...params: any[]) => raw.log(message, params)
      }),
    cliDescription:
      "An object, like `console`, that implements a `log` function.",
    disableInCLI: true,
    default: config => console
  }
};
