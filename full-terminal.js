import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import readline from "readline";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const commands = {

    calculator(args, silent = false) {

        if (args.length < 3) {
            if (!silent) console.log("Usage: calculator <+|-|*|/> <a> <b>");
            return null;
        }

        const operator = args[0];
        const a = Number(args[1]);
        const b = Number(args[2]);

        if (isNaN(a) || isNaN(b)) {
            if (!silent) console.log("Numbers only.");
            return null;
        }

        let result;

        switch (operator) {
            case "+": result = a + b; break;
            case "-": result = a - b; break;
            case "*": result = a * b; break;
            case "/":
                if (b === 0) {
                    if (!silent) console.log("Cannot divide by zero.");
                    return null;
                }
                result = a / b;
                break;
            default:
                if (!silent) console.log("Invalid operator.");
                return null;
        }

        if (!silent) console.log(result);
        return result;
    },

    random(args, silent = false) {

        if (args.length < 2) {
            if (!silent) console.log("Usage: random <min> <max>");
            return null;
        }

        let min = Number(args[0]);
        let max = Number(args[1]);

        if (isNaN(min) || isNaN(max)) {
            if (!silent) console.log("Numbers only.");
            return null;
        }

        if (min > max) [min, max] = [max, min];

        const value = Math.floor(Math.random() * (max - min + 1)) + min;

        if (!silent) console.log(value);
        return value;
    },

    c(args) {

        return new Promise(resolve => {

            // MINI C CONSOLE MODE
            if (!args.length) {

                console.log("C mini console");
                console.log("Type C code.");
                console.log("Type .run to compile and execute.");
                console.log("Type .exit to quit.");

                let buffer = [];

                const cPrompt = () => {
                    rl.question("c> ", line => {

                        if (line === ".exit") {
                            resolve();
                            return;
                        }

                        if (line === ".run") {

                            const fileName = path.join(process.cwd(), "temp_shell_c.c");

                            const fullCode = `
#include <stdio.h>

int main() {
${buffer.join("\n")}
return 0;
}
`;

                            fs.writeFileSync(fileName, fullCode);

                            const outputExe = fileName.replace(".c", "");

                            const compile = spawn("gcc", [fileName, "-o", outputExe], {
                                stdio: "inherit"
                            });

                            compile.on("close", code => {

                                if (code !== 0) {
                                    buffer = [];
                                    cPrompt();
                                    return;
                                }

                                const run = spawn(outputExe, [], {
                                    stdio: "inherit"
                                });

                                run.on("close", () => {
                                    buffer = [];
                                    cPrompt();
                                });
                            });

                            return;
                        }

                        buffer.push(line);
                        cPrompt();
                    });
                };

                cPrompt();
                return;
            }

            // FILE COMPILE MODE
            const file = path.join(process.cwd(), args[0]);

            if (!fs.existsSync(file)) {
                console.log("File does not exist.");
                resolve();
                return;
            }

            const outputExe = file.replace(".c", "");

            const compile = spawn("gcc", [file, "-o", outputExe], {
                stdio: "inherit"
            });

            compile.on("close", code => {

                if (code !== 0) {
                    resolve();
                    return;
                }

                const run = spawn(outputExe, [], {
                    stdio: "inherit"
                });

                run.on("close", resolve);
            });
        });
    }

};

// 🔥 Recursive evaluator for nested commands
function evaluate(tokens) {

    for (let i = 0; i < tokens.length; i++) {

        if (commands[tokens[i]]) {

            const cmdName = tokens[i];

            let needed = 0;
            if (cmdName === "calculator") needed = 3;
            if (cmdName === "random") needed = 2;

            // c command not allowed in nesting
            if (cmdName === "c") return tokens;

            const subTokens = tokens.slice(i + 1, i + 1 + needed);

            const evaluatedArgs = evaluate(subTokens);

            const result = commands[cmdName](evaluatedArgs, true);

            if (result === null) return tokens;

            tokens.splice(i, needed + 1, String(result));

            return evaluate(tokens);
        }
    }

    return tokens;
}

async function handleInput(input) {

    let tokens = input.trim().split(" ").filter(t => t.length);

    if (!tokens.length) return prompt();

    // Handle c separately because it's async
    if (tokens[0] === "c") {
        await commands.c(tokens.slice(1));
        return prompt();
    }

    tokens = evaluate(tokens);

    if (commands[tokens[0]]) {
        commands[tokens[0]](tokens.slice(1));
    } else if (tokens.length === 1) {
        console.log(tokens[0]);
    } else {
        console.log("Unknown command.");
    }

    prompt();
}

function prompt() {
    rl.question("> ", handleInput);
}

console.log("Ultimate Custom Shell Started");
prompt();
