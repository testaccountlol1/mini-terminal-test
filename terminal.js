import fs from "fs";
import readline from "readline";
import path from "path";
import { spawn } from "child_process";

console.log("press ctrl + c to exit");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const manuals = {
    cd: "cd <dir>",
    ls: "ls",
    cat: "cat <file> | cat >> <file> | cat > <file>",
    echo: "echo <text>",
    clear: "clear",
    touch: "touch <file>",
    mkdir: "mkdir <dir>",
    rm: "rm <name>",
    python: "python | python <file>",
    python3: "python3 <file>",
    node: "node | node <file>",
    add: "add commandName code | add > commandName code",
    man: "man <command>",
    gitinit: "gitinit",
    gitadd: "gitadd",
    gitcommit: "gitcommit <message>",
    gitpush: "gitpush"
};

const commands = {

    cd(args) {
        if (!args[0]) return;
        try {
            process.chdir(path.resolve(process.cwd(), args[0]));
        } catch {
            console.log("Directory not found");
        }
    },

    ls() {
        try {
            fs.readdirSync(process.cwd()).forEach(f => console.log(f));
        } catch {
            console.log("Error reading directory");
        }
    },

    cat(args) {

        if (!args[0]) {
            console.log("cat requires arguments");
            return;
        }

        if (args[0] === ">>") {

            if (!args[1]) return;

            return new Promise(resolve => {
                rl.question("Enter text: ", text => {
                    try {
                        fs.appendFileSync(path.join(process.cwd(), args[1]), text + "\n");
                    } catch {}

                    resolve();
                });
            });
        }

        if (args[0] === ">") {

            if (!args[1]) return;

            return new Promise(resolve => {
                rl.question("Enter text: ", text => {
                    try {
                        fs.writeFileSync(path.join(process.cwd(), args[1]), text + "\n");
                    } catch {}

                    resolve();
                });
            });
        }

        try {
            console.log(
                fs.readFileSync(path.join(process.cwd(), args[0]), "utf8")
            );
        } catch {
            console.log("File not found");
        }
    },

    python(args) {

        return new Promise(resolve => {
            const py = spawn("python", args.length ? args : [], {
                stdio: "inherit"
            });

            py.on("close", resolve);
        });

    },

    python3(args) {

        if (!args.length) {
            console.log("python3 requires file argument");
            return;
        }

        return new Promise(resolve => {
            const py = spawn("python3", args, {
                stdio: "inherit"
            });

            py.on("close", resolve);
        });
    },

    node(args) {

        return new Promise(resolve => {
            const nd = spawn("node", args.length ? args : [], {
                stdio: "inherit"
            });

            nd.on("close", resolve);
        });

    },

    add(args) {

        if (!args.length) {
            console.log("Usage: add [> optional] name code");
            return;
        }

        let overwrite = false;
        let index = 0;

        if (args[0] === ">") {
            overwrite = true;
            index = 1;
        }

        const name = args[index];
        const code = args.slice(index + 1).join(" ");

        if (!name || !code) {
            console.log("Invalid syntax");
            return;
        }

        if (!overwrite && commands[name]) {
            console.log("Command exists");
            return;
        }

        try {
            const fn = new Function("args", code);

            commands[name] = async function(cmdArgs) {
                return fn(cmdArgs);
            };

            console.log(`Command ${name} added`);
        } catch {
            console.log("Command creation failed");
        }
    },

    man(args) {

        if (!args[0]) {
            console.log("Specify command");
            return;
        }

        if (manuals[args[0]]) {
            console.log("\n" + manuals[args[0]] + "\n");
        } else {
            console.log("No manual entry");
        }
    },

    gitinit() {
        return new Promise(resolve => {
            spawn("git", ["init"], { stdio: "inherit" }).on("close", resolve);
        });
    },

    gitadd() {
        return new Promise(resolve => {
            spawn("git", ["add", "."], { stdio: "inherit" }).on("close", resolve);
        });
    },

    gitcommit(args) {
        const msg = args.length ? args.join(" ") : "update";

        return new Promise(resolve => {
            spawn("git", ["commit", "-m", msg], { stdio: "inherit" }).on("close", resolve);
        });
    },

    gitpush() {
        return new Promise(resolve => {
            spawn("git", ["push"], { stdio: "inherit" }).on("close", resolve);
        });
    }

};

async function handleCommand(input) {

    const parts = input.trim().split(" ");
    const cmd = parts[0];
    const args = parts.slice(1);

    if (commands[cmd]) {
        const result = commands[cmd](args);
        if (result instanceof Promise) {
            await result;
        }
    } else if (cmd) {
        console.log("Unknown command");
    }

    prompt();
}

function prompt() {
    rl.question(`${process.cwd()} $ `, handleCommand);
}

prompt();