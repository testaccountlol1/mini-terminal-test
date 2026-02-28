import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import readline from "readline";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const commands = {

    help() {
        console.log(`
Available Commands:

calculator <+|-|*|/> <a> <b>
    Performs math operations.
    Supports nesting.

random <min> <max>
    Generates a random number between min and max.
    Supports nesting.

node
    Opens Node.js REPL.

node <file.js>
    Runs a JavaScript file.

clear
    Clears the console.

exit
    Exits the shell.

Examples:
    calculator + 5 3
    random 1 10
    random calculator * random 1 10 3 10
`);
    },

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

    node(args) {
        return new Promise(resolve => {

            // REPL mode
            if (!args.length) {
                const repl = spawn("node", [], { stdio: "inherit" });
                repl.on("close", resolve);
                return;
            }

            // File mode
            const file = path.join(process.cwd(), args[0]);

            if (!fs.existsSync(file)) {
                console.log("File does not exist.");
                resolve();
                return;
            }

            const run = spawn("node", [file], { stdio: "inherit" });
            run.on("close", resolve);
        });
    },

    clear() {
        console.clear();
    },

    exit() {
        console.log("Goodbye.");
        process.exit(0);
    }

};

// 🔥 Recursive evaluator for nesting
function evaluate(tokens) {
    for (let i = 0; i < tokens.length; i++) {

        if (commands[tokens[i]]) {

            const cmdName = tokens[i];

            if (cmdName === "node" || cmdName === "clear" || cmdName === "exit" || cmdName === "help")
                return tokens;

            let needed = 0;
            if (cmdName === "calculator") needed = 3;
            if (cmdName === "random") needed = 2;

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

    let tokens = input.trim().split(" ").filter(Boolean);

    if (!tokens.length) return prompt();

    if (!commands[tokens[0]]) {
        console.log("Unknown command.");
        return prompt();
    }

    // Node is async and shouldn't be nested
    if (tokens[0] === "node") {
        await commands.node(tokens.slice(1));
        return prompt();
    }

    tokens = evaluate(tokens);

    if (commands[tokens[0]]) {
        commands[tokens[0]](tokens.slice(1));
    }

    prompt();
}

function prompt() {
    rl.question("> ", handleInput);
}

console.log("Advanced JS Shell Started");
prompt();
