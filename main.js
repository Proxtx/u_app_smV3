import { clients, refreshClients } from "../../private/clients.js";

export class App {
  client;
  customFunctions = [];

  constructor(config) {
    this.config = config;
    this.findClient();
  }

  async updateDefinitions() {
    if (!this.client) await this.findClient();
    if (!this.client) return;

    for (let functionName in this.definitions.methods)
      delete this[functionName];
    this.definitions.methods = {};

    try {
      let result = await this.client.request("http", "request", [
        "POST",
        this.config.url,
        JSON.stringify({
          arguments: [this.config.pwd],
          export: "serviceStatus",
          module: "public/service.js",
        }),
        "application/json",
      ]);

      if (!result.result.success) return;

      let services = JSON.parse(result.result.response).data;

      for (let service of services) {
        let methodName = `${service.active ? "stop" : "start"}${
          service.service
        }`;
        this.definitions.methods[methodName] = {
          arguments: [],
          name:
            service.service +
            " is " +
            (service.active ? "active" : "not active") +
            ". Change active status?",
        };

        this[methodName] = async () => {
          await this.client.request("http", "request", [
            "POST",
            this.config.url,
            JSON.stringify({
              arguments: [this.config.pwd, service.service],
              export: "changeServiceStatus",
              module: "public/service.js",
            }),
            "application/json",
          ]);
        };
      }
    } catch {
      console.log("SM Failed");
    }
  }

  async findClient() {
    await refreshClients();
    if (clients[this.config.client]) this.client = clients[this.config.client];
  }
}
