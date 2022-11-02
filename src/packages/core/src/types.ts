import EthereumFlavor from "@ganache/ethereum";
import { Flavor, FlavorOptions, ServerConfig } from "@ganache/flavor";
import { ExternalConfig, InternalOptions } from "@ganache/options";

type NamespacedServerConfigOptions = {
  server: ServerConfig;
};

export type ProviderOptions<F extends Flavor> = FlavorOptions<F>;

export type ServerOptions<F extends Flavor = EthereumFlavor> = Partial<{
  [K in keyof NamespacedServerConfigOptions]: ExternalConfig<
    NamespacedServerConfigOptions[K]
  >;
}> &
  FlavorOptions<F>;

export type InternalServerOptions =
  InternalOptions<NamespacedServerConfigOptions>;
