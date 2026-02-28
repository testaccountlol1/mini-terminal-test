import fs from "fs";
import path from "path";
import readline from "readline";
import { spawn } from "child_process";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const manuals = {

    help: "help - Show command list",

    ls: "ls - List files",

    cd: "cd <dir> - Change directory",

    cat: "cat <file>\ncat > <file>\ncat >> <file>",

    touch: "touch <file> - Create file",

    mkdir: "mkdir <dir> - Create directory",

    rm: "rm <name> - Delete file/folder",

    node: "node - Open REPL\nnode <file.js> - Run JS file",

    c: "c <file.c> - Compile C program\nc - Open mini C console",

    calculator: "calculator <+|-|*|/> <a> <b>",

    random: "random <min> <max>",

    add: "add [>] name code - Create dynamic command",

    gitinit: "gitinit",

    gitadd: "gitadd",

    gitcommit: "gitcommit <message>",

    gitpush: "gitpush",

    clear: "clear",

    exit: "exit"
};

const commands = {

    ls() {
        try {
            fs.readdirSync(process.cwd()).forEach(f => console.log(f));
        } catch {
            console.log("Error listing directory");
        }
    },

    cd(args) {
        if (!args[0]) return;

        try {
            process.chdir(path.resolve(process.cwd(), args[0]));
        } catch {
            console.log("Directory not found");
        }
    },

    cat(args) {

        if (!args[0]) return;

        if (args[0] === ">" || args[0] === ">>") {

            if (!args[1]) return;

            return new Promise(resolve => {

                rl.question("Enter text: ", text => {

                    const filePath = path.join(process.cwd(), args[1]);

                    try {

                        if (args[0] === ">")
                            fs.writeFileSync(filePath, text + "\n");

                        else
                            fs.appendFileSync(filePath, text + "\n");

                    } catch {}

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

        try {
            fs.writeFileSync(path.join(process.cwd(), args[0]), "");
            console.log("File created");
        } catch {
            console.log("Creation failed");
        }
    },

    mkdir(args) {
        if (!args[0]) return;

        try {
            fs.mkdirSync(path.join(process.cwd(), args[0]));
            console.log("Directory created");
        } catch {
            console.log("Creation failed");
        }
    },

    rm(args) {
        if (!args[0]) return;

        try {
            fs.rmSync(path.join(process.cwd(), args[0]), {
                recursive: true,
                force: true
            });

            console.log("Deleted");
        } catch {
            console.log("Deletion failed");
        }
    },

    node(args) {

        return new Promise(resolve => {

            if (!args.length) {
                spawn("node", [], { stdio: "inherit" })
                    .on("close", resolve);
                return;
            }

            const file = path.join(process.cwd(), args[0]);

            if (!fs.existsSync(file)) {
                console.log("File not found");
                resolve();
                return;
            }

            spawn("node", [file], { stdio: "inherit" })
                .on("close", resolve);
        });
    },

    calculator(args, silent = false) {

        if (args.length < 3) {
            if (!silent)
                console.log("calculator <+|-|*|/> a b");

            return null;
        }

        const op = args[0];
        const a = Number(args[1]);
        const b = Number(args[2]);

        if (isNaN(a) || isNaN(b)) return null;

        let result;

        switch (op) {
            case "+": result = a + b; break;
            case "-": result = a - b; break;
            case "*": result = a * b; break;
            case "/":
                if (b === 0) return null;
                result = a / b;
                break;
            default:
                return null;
        }

        if (!silent) console.log(result);
        return result;
    },

    random(args, silent = false) {

        if (args.length < 2) return null;

        let min = Number(args[0]);
        let max = Number(args[1]);

        if (isNaN(min) || isNaN(max)) return null;

        if (min > max) [min, max] = [max, min];

        const value =
            Math.floor(Math.random() * (max - min + 1)) + min;

        if (!silent) console.log(value);

        return value;
    },

    gitinit() {
        return spawn("git", ["init"], { stdio: "inherit" });
    },

    gitadd() {
        return spawn("git", ["add", "."], { stdio: "inherit" });
    },

    gitcommit(args) {
        const msg = args.join(" ") || "update";

        return spawn("git", ["commit", "-m", msg], {
            stdio: "inherit"
        });
    },

    gitpush() {
        return spawn("git", ["push"], { stdio: "inherit" });
    },

    help() {
        Object.keys(manuals).forEach(k =>
            console.log(manuals[k])
        );
    },

    clear() {
        console.clear();
    },

    exit() {
        process.exit(0);
    }
};

// Recursive parser
function evaluate(tokens) {

    for (let i = 0; i < tokens.length; i++) {

        if (commands[tokens[i]]) {

            const cmd = tokens[i];

            if (cmd === "node") return tokens;

            let needed = 0;

            if (cmd === "calculator") needed = 3;
            if (cmd === "random") needed = 2;

            const sub = tokens.slice(i + 1, i + 1 + needed);

            const result =
                commands[cmd](evaluate(sub), true);

            if (result === null) return tokens;

            tokens.splice(i, needed + 1, String(result));

            return evaluate(tokens);
        }
    }

    return tokens;
}

async function handleInput(input) {

    let tokens = input.trim().split(" ").filter(Boolean);

    if (!tokens.length) return prompt();

    if (!commands[tokens[0]]) {
        console.log("Unknown command");
        return prompt();
    }

    if (tokens[0] === "node") {
        await commands.node(tokens.slice(1));
        return prompt();
    }

    tokens = evaluate(tokens);

    commands[tokens[0]](tokens.slice(1));

    prompt();
}

function prompt() {
    rl.question("> ", handleInput);
}

console.log("Ultimate Master Shell Started");
prompt();
