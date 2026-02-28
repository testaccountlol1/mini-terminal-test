import fs from "fs";
import path from "path";
import readline from "readline";
import { spawn } from "child_process";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const manuals = {
    help: "help - Show commands",
    ls: "ls - List directory files",
    cd: "cd <dir>",
    cat: "cat <file> | cat > <file> | cat >> <file>",
    touch: "touch <file>",
    mkdir: "mkdir <dir>",
    rm: "rm <name>",
    node: "node | node <file.js>",
    python: "python | python <file.py>",
    c: "c | c <file.c>",
    calculator: "calculator <+|-|*|/> <a> <b>",
    random: "random <min> <max>",
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
        } catch {}
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

                    const filePath =
                        path.join(process.cwd(), args[1]);

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
        } catch {}
    },

    mkdir(args) {
        if (!args[0]) return;

        try {
            fs.mkdirSync(path.join(process.cwd(), args[0]));
        } catch {}
    },

    rm(args) {
        if (!args[0]) return;

        try {
            fs.rmSync(path.join(process.cwd(), args[0]), {
                recursive: true,
                force: true
            });
        } catch {}
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

            spawn("node", [file], { stdio: "inherit" })
                .on("close", resolve);
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

    c(args) {

        return new Promise(resolve => {

            if (!args.length) {

                console.log("C Console");
                console.log(".run to compile");
                console.log(".exit to quit");

                let buffer = [];

                const promptC = () => {

                    rl.question("c> ", line => {

                        if (line === ".exit") {
                            resolve();
                            return;
                        }

                        if (line === ".run") {

                            const file =
                                path.join(process.cwd(),
                                    "temp_shell_c.c");

                            const code =
                                "#include <stdio.h>\nint main(){\n" +
                                buffer.join("\n") +
                                "\nreturn 0;}\n";

                            fs.writeFileSync(file, code);

                            const exe = file.replace(".c", "");

                            const compile =
                                spawn("gcc", [file, "-o", exe],
                                    { stdio: "inherit" });

                            compile.on("close", () => {

                                spawn(exe, [], {
                                    stdio: "inherit"
                                }).on("close", () => {
                                    buffer = [];
                                    promptC();
                                });

                            });

                            return;
                        }

                        buffer.push(line);
                        promptC();
                    });
                };

                promptC();
                return;
            }

            const file =
                path.join(process.cwd(), args[0]);

            if (!fs.existsSync(file)) {
                console.log("File not found");
                resolve();
                return;
            }

            const exe = file.replace(".c", "");

            spawn("gcc", [file, "-o", exe],
                { stdio: "inherit" })
                .on("close", () => {

                    spawn(exe, [], {
                        stdio: "inherit"
                    }).on("close", resolve);

                });
        });
    },

    calculator(args, silent = false) {

        if (args.length < 3) return null;

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
            Math.floor(Math.random() *
            (max - min + 1)) + min;

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
        return spawn("git", ["commit", "-m", msg],
            { stdio: "inherit" });
    },

    gitpush() {
        return spawn("git", ["push"], { stdio: "inherit" });
    },

    help() {
        Object.values(manuals).forEach(m =>
            console.log(m)
        );
    },

    clear() {
        console.clear();
    },

    exit() {
        process.exit(0);
    }
};

function evaluate(tokens) {

    for (let i = 0; i < tokens.length; i++) {

        if (commands[tokens[i]]) {

            const cmd = tokens[i];

            if (cmd === "node" || cmd === "python" || cmd === "c")
                return tokens;

            let needed = 0;

            if (cmd === "calculator") needed = 3;
            if (cmd === "random") needed = 2;

            const sub =
                tokens.slice(i + 1, i + 1 + needed);

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

    let tokens =
        input.trim().split(" ").filter(Boolean);

    if (!tokens.length) return prompt();

    if (!commands[tokens[0]]) {
        console.log("Unknown command");
        return prompt();
    }

    if (tokens[0] === "node" ||
        tokens[0] === "python" ||
        tokens[0] === "c") {

        await commands[tokens[0]](tokens.slice(1));
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
