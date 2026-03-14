import fs from "fs";
import path from "path";
import readline from "readline";
import { spawn } from "child_process";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const manuals = {
    help: "help",
    ls: "ls",
    cd: "cd <dir>",
    cat: "cat <file> | cat > <file> | cat >> <file>",
    touch: "touch <file>",
    mkdir: "mkdir <dir>",
    rm: "rm <file>",
    node: "node | node <file>",
    python: "python | python <file>",
    clear: "clear",
    exit: "exit"
};

const commands = {

    ls() {
        fs.readdirSync(process.cwd()).forEach(f => console.log(f));
    },

    cd(args) {
        if (!args[0]) return;
        process.chdir(path.resolve(process.cwd(), args[0]));
    },

    cat(args) {

        if (!args[0]) return;

        if (args[0] === ">" || args[0] === ">>") {

            if (!args[1]) return;

            return new Promise(resolve => {

                rl.question("Enter text: ", text => {

                    const filePath =
                        path.join(process.cwd(), args[1]);

                    if (args[0] === ">")
                        fs.writeFileSync(filePath, text + "\n");
                    else
                        fs.appendFileSync(filePath, text + "\n");

                    resolve();
                });
            });
        }

        try {
            console.log(
                fs.readFileSync(
                    path.join(process.cwd(), args[0]),
                    "utf8"
                )
            );
        } catch {
            console.log("File not found");
        }
    },

    touch(args) {
        if (!args[0]) return;
        fs.writeFileSync(path.join(process.cwd(), args[0]), "");
    },

    mkdir(args) {
        if (!args[0]) return;
        fs.mkdirSync(path.join(process.cwd(), args[0]));
    },

    rm(args) {

        if (!args[0]) {
            console.log("rm <file>");
            return;
        }

        const target = path.join(process.cwd(), args[0]);

        if (!fs.existsSync(target)) {
            console.log("File not found");
            return;
        }

        fs.rmSync(target, { recursive: true, force: true });
        console.log("Deleted");
    },

    node(args) {

        return new Promise(resolve => {

            if (!args.length) {
                spawn("node", [], { stdio: "inherit" })
                    .on("close", resolve);
                return;
            }

            const file =
                path.join(process.cwd(), args[0]);

            if (!fs.existsSync(file)) {
                console.log("File not found");
                resolve();
                return;
            }

            spawn("node", [file], {
                stdio: "inherit",
                env: process.env,
                shell: true
            }).on("close", resolve);
        });
    },

    python(args) {

        return new Promise(resolve => {

            if (!args.length) {
                spawn("python", [], {
                    stdio: "inherit"
                }).on("close", resolve);
                return;
            }

            const file =
                path.join(process.cwd(), args[0]);

            if (!fs.existsSync(file)) {
                console.log("File not found");
                resolve();
                return;
            }

            spawn("python", [file], {
                stdio: "inherit"
            }).on("close", resolve);
        });
    },

    clear() {
        console.clear();
    },

    exit() {
        process.exit(0);
    },

    help() {
        Object.values(manuals).forEach(v => console.log(v));
    }
};

function evaluate(tokens) {

    let changed = true;

    while (changed) {

        changed = false;

        for (let i = 0; i < tokens.length; i++) {

            const cmd = tokens[i];

            if (!commands[cmd]) continue;
            if (typeof commands[cmd] !== "function") continue;

            if (["node", "python", "c"].includes(cmd))
                return tokens;

            let needed = 0;

            if (cmd === "calculator") needed = 3;
            if (cmd === "random") needed = 2;

            const args = tokens.slice(i + 1, i + 1 + needed);

            const result = commands[cmd](args, true);

            if (result !== null && result !== undefined) {

                tokens.splice(i, needed + 1, String(result));

                changed = true;

                break;
            }
        }
    }

    return tokens;
}

async function handleInput(input) {

    let tokens =
        input.trim().split(" ").filter(Boolean);

    if (!tokens.length) return prompt();

    if (!commands[tokens[0]] ||
        typeof commands[tokens[0]] !== "function") {

        console.log("Unknown command");
        return prompt();
    }

    if (["node", "python", "c"].includes(tokens[0])) {
        await commands[tokens[0]](tokens.slice(1));
        return prompt();
    }

    tokens = evaluate(tokens);

    await commands[tokens[0]](tokens.slice(1));

    prompt();
}

function prompt() {
    rl.question("> ", handleInput);
}

console.log("Shell Runtime Started");
prompt();
