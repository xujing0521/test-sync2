import { Component, signal } from "@angular/core";
import { invoke } from "@pc-nexus/bridge";
import { NxContent, NxHeader, NxLayout, NxText } from "@pc-nexus/angular";

@Component({
    selector: "app-root",
    templateUrl: "./app.html",
    imports: [NxLayout, NxHeader, NxContent, NxText],
})
export class App {
    protected readonly result = signal<string | null>(null);

    constructor() {
        this.runGreeting();
    }

    protected runGreeting() {
        invoke<string, string>("greeting", "Nexus")
            .then((res: string) => this.result.set(res))
            .catch((err: Error) => this.result.set(`Error: ${err}`));
    }
}
