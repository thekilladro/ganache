import assert from "assert";
import { EthereumOptionsConfig } from "../src";
import sinon from "sinon";
import { resolve } from "path";
import { promises } from "fs";
const unlink = promises.unlink;
import { closeSync, openSync } from "fs";
import { URL } from "url";

describe("EthereumOptionsConfig", () => {
  describe("logging", () => {
    // resolve absolute path of current working directory, which is clearly an
    // invalid file path (because it's a directory).
    const invalidFilePath = resolve("");
    const validFilePath = resolve("./tests/test-file.log");

    describe("options", () => {
      let spy: any;
      beforeEach(() => {
        spy = sinon.spy(console, "log");
      });

      afterEach(() => {
        spy.restore();
      });

      describe("logger", () => {
        it("uses console.log by default", () => {
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

        it("calls the provided logger, even when quiet flag is used", () => {
          let callCount = 0;

          const options = EthereumOptionsConfig.normalize({
            logging: {
              quiet: true,
              logger: {
                log: (message: any, ...params: any[]) => callCount++
              }
            }
          });

          options.logging.logger.log("message");

          assert.strictEqual(callCount, 1);
        });
      });

      describe("file", () => {
        it("resolves a file path to descriptor", async () => {
          const options = EthereumOptionsConfig.normalize({
            logging: { file: validFilePath }
          });
          try {
            assert(typeof options.logging.file === "number");
            assert.doesNotThrow(() =>
              closeSync(options.logging.file as number)
            );
          } finally {
            await unlink(validFilePath);
          }
        });

        it("resolves a file path as Buffer to descriptor", async () => {
          const options = EthereumOptionsConfig.normalize({
            logging: { file: Buffer.from(validFilePath, "utf8") }
          });
          try {
            assert(typeof options.logging.file === "number");
            assert.doesNotThrow(() =>
              closeSync(options.logging.file as number)
            );
          } finally {
            await unlink(validFilePath);
          }
        });

        it("resolves a file URL as Buffer to descriptor", async () => {
          const options = EthereumOptionsConfig.normalize({
            logging: { file: new URL(`file://${validFilePath}`) }
          });
          try {
            assert(typeof options.logging.file === "number");
            assert.doesNotThrow(() =>
              closeSync(options.logging.file as number)
            );
          } finally {
            await unlink(validFilePath);
          }
        });

        it("uses an existing descriptor if passed in", async () => {
          const fd = openSync(validFilePath, "a");

          const options = EthereumOptionsConfig.normalize({
            logging: { file: fd }
          });

          try {
            assert.strictEqual(options.logging.file, fd);
            assert(typeof options.logging.file === "number");
            assert.doesNotThrow(() =>
              closeSync(options.logging.file as number)
            );
          } finally {
            await unlink(validFilePath);
          }
        });

        it("fails if an invalid file path is provided", () => {
          const message = `Failed to open log file ${invalidFilePath}. Please check if the file path is valid and if the process has write permissions to the directory.`;

          assert.throws(
            () => {
              EthereumOptionsConfig.normalize({
                logging: { file: invalidFilePath }
              });
            },
            { message }
          );
        });

        it("uses the provided logger when both `logger` and `file` are provided", async () => {
          const calls: any[] = [];
          const logger = {
            log: (message: any, ...params: any[]) => {
              calls.push([message, ...params]);
            }
          };
          const descriptor = openSync(validFilePath, "a");

          try {
            const options = EthereumOptionsConfig.normalize({
              logging: {
                logger,
                file: descriptor
              }
            });

            options.logging.logger.log("message", "param1", "param2");
            assert.deepStrictEqual(calls, [["message", ["param1", "param2"]]]);
          } finally {
            await unlink(validFilePath);
          }
        });
      });
    });
  });
});
