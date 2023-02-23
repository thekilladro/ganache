import assert from "assert";
import { createLogger, EthereumOptionsConfig, LogFunc } from "../src";
import sinon from "sinon";
import { promises } from "fs";
import { resolve } from "path";
const { readFile, unlink } = promises;

describe("EthereumOptionsConfig", () => {
  describe("logging", () => {
    // resolve absolute path of current working directory, which is clearly an
    // invalid file path (because it's a directory).
    const invalidFilePath = resolve("");

    describe("options", () => {
      let spy: any;
      beforeEach(() => {
        spy = sinon.spy(console, "log");
      });

      afterEach(() => {
        spy.restore();
      });

      it("logs via console.log by default", () => {
        const message = "message";
        const options = EthereumOptionsConfig.normalize({});
        options.logging.logger.log(message);
        assert.strictEqual(spy.withArgs(message).callCount, 1);
      });

      it("disables the logger when the quiet flag is used", () => {
        const message = "message";
        const options = EthereumOptionsConfig.normalize({
          logging: { quiet: true }
        });
        options.logging.logger.log(message);
        assert.strictEqual(spy.withArgs(message).callCount, 0);
      });

      it("fails if an invalid file path is provided", () => {
        const message = `Failed to write logs to ${invalidFilePath}. Please check if the file path is valid and if the process has write permissions to the directory.`;

        assert.throws(() => {
          EthereumOptionsConfig.normalize({
            logging: { file: invalidFilePath }
          });
        }, new Error(message));
      });
    });

    describe("createLogger()", () => {
      const getFilePath = (slug: string) => `./tests/test-${slug}.log`;
      const message = "test message";

      const sandbox = sinon.createSandbox();

      beforeEach(() => {
        sandbox.spy(console, "log");
      });

      afterEach(() => {
        sandbox.restore();
      });

      it("should create a console logger by default", () => {
        const { log } = createLogger({});
        const logMethod = console.log as any;

        log(message);

        assert.strictEqual(
          logMethod.callCount,
          1,
          "console.log() was called unexpected number of times."
        );

        const args = logMethod.getCall(0).args;

        assert.deepStrictEqual(
          args,
          [message],
          "Console.log called with unexpected arguments."
        );
      });

      it("should still log to console when a file is specified", async () => {
        const file = getFilePath("write-to-console");

        const { log, getWaitHandle } = createLogger({ file });
        assert(getWaitHandle);

        const logMethod = console.log as any;

        try {
          log(message);
          await getWaitHandle();
        } finally {
          await unlink(file);
        }

        assert.strictEqual(
          logMethod.callCount,
          1,
          "console.log() was called unexpected number of times."
        );

        const args = logMethod.getCall(0).args;

        assert.deepStrictEqual(
          args,
          [message],
          "Console.log called with unexpected arguments."
        );
      });

      it("should write to the file provided", async () => {
        const file = getFilePath("write-to-file-provided");
        const { log, getWaitHandle } = createLogger({ file });
        assert(getWaitHandle);

        let fileContents: string;
        try {
          log(`${message} 0`);
          log(`${message} 1`);
          log(`${message} 2`);
          await getWaitHandle();

          fileContents = await readFile(file, "utf8");
        } finally {
          await unlink(file);
        }

        const logLines = fileContents.split("\n");

        // 4, because there's a \n at the end of each line
        assert.strictEqual(logLines.length, 4);
        assert.strictEqual(logLines[3], "");

        logLines.slice(0, 3).forEach((logLine, lineNumber) => {
          const timestampPart = logLine.slice(0, 24);
          const messagePart = logLine.slice(25);
          const delimiter = logLine[24];

          assert(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(timestampPart),
            "Unexpected timestamp."
          );
          assert.strictEqual(delimiter, " ", "Unexpected delimiter.");
          assert.strictEqual(
            messagePart,
            `${message} ${lineNumber}`,
            "Unexpected message."
          );
        });
      });

      it("should timestamp each line on multi-line log messages", async () => {
        const file = getFilePath("timestamp-each-line");

        const { log, getWaitHandle } = createLogger({ file });
        assert(getWaitHandle);

        const expectedLines = ["multi", "line", "message"];

        let loggedLines: string[];
        try {
          log(expectedLines.join("\n"));
          await getWaitHandle();

          const fileContents = await readFile(file, "utf8");
          loggedLines = fileContents.split("\n");
        } finally {
          await unlink(file);
        }

        // length == 4, because there's a \n at the end (string.split() results
        // in an empty string)
        assert.strictEqual(loggedLines.length, 4);
        assert.strictEqual(loggedLines[3], "");

        loggedLines.slice(0, 3).forEach((logLine, lineNumber) => {
          const timestampPart = logLine.slice(0, 24);
          const messagePart = logLine.slice(25);
          const delimiter = logLine[24];

          assert(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(timestampPart),
            "Unexpected timestamp"
          );
          assert.strictEqual(delimiter, " ", "Unexpected delimiter");
          assert.strictEqual(messagePart, expectedLines[lineNumber]);
        });
      });

      it("should not throw if the underlying file does not exist", async () => {
        const file = getFilePath("underlying-file-does-not-exist");

        const { log, getWaitHandle } = createLogger({ file });
        assert(getWaitHandle);

        try {
          log(message);
          await getWaitHandle();
        } finally {
          await unlink(file);
        }
      });

      it("should reject waitHandle if the underlying file is inaccessible", async () => {
        const { log, getWaitHandle } = createLogger({
          file: invalidFilePath
        });

        assert(getWaitHandle);

        log(message);

        await assert.rejects(getWaitHandle());
      });
    });
  });
});
