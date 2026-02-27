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
    clear: "clear - Clear terminal screen",
    cd: "cd <dir> - Change current working directory",
    ls: "ls - List files in current directory",
    cat: "cat <file>\ncat >> <file> - Append text\ncat > <file> - Overwrite file content",
    echo: "echo <text> - Print text to terminal",
    touch: "touch <file> - Create empty file",
    mkdir: "mkdir <dir> - Create directory",
    rm: "rm <name> - Delete file or directory recursively",
    python: "python - Open Python REPL or run python file",
    python3: "python3 <file> - Run python3 script file",
    node: "node - Open Node.js REPL or run JavaScript file",
    add: "add [> optional] <name> <code> - Create dynamic command",
    calculator: "calculator <operator> <num1> <num2>\nSupported operators: + - * /",
    man: "man <command> - Show manual page",
    gitinit: "gitinit - Initialize git repository",
    gitadd: "gitadd - Stage all files",
    gitcommit: "gitcommit <message> - Create git commit",
    gitpush: "gitpush - Push commits to remote repository"
};

const commands = {

    clear() {
        console.log("\n".repeat(20));
    },

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
                        fs.appendFileSync(
                            path.join(process.cwd(), args[1]),
                            text + "\n"
                        );
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
                        fs.writeFileSync(
                            path.join(process.cwd(), args[1]),
                            text + "\n"
                        );
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

    echo(args) {
        if (!args.length) {
            console.log("i cant echo nothning");
            return;
        }
        console.log(args);
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

    calculator(args) {

        if (args.length < 3) {
            console.log("Usage: calculator <operator> <num1> <num2>");
            return;
        }

        const op = args[0];
        const a = Number(args[1]);
        const b = Number(args[2]);

        if (isNaN(a) || isNaN(b)) {
            console.log("Invalid numbers");
            return;
        }

        let result;

        switch (op) {
            case "+":
                result = a + b;
                break;
            case "-":
                result = a - b;
                break;
            case "*":
                result = a * b;
                break;
            case "/":
                if (b === 0) {
                    console.log("Division by zero");
                    return;
                }
                result = a / b;
                break;
            default:
                console.log("Unknown operator");
                return;
        }

        console.log(result);
    },

    gitinit() {
        return new Promise(resolve => {
            spawn("git", ["init"], { stdio: "inherit" })
                .on("close", resolve);
        });
    },

    gitadd() {
        return new Promise(resolve => {
            spawn("git", ["add", "."], { stdio: "inherit" })
                .on("close", resolve);
        });
    },

    gitcommit(args) {

        const msg = args.length ? args.join(" ") : "update";

        return new Promise(resolve => {
            spawn("git", ["commit", "-m", msg], { stdio: "inherit" })
                .on("close", resolve);
        });
    },

    gitpush() {
        return new Promise(resolve => {
            spawn("git", ["push"], { stdio: "inherit" })
                .on("close", resolve);
        });
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
