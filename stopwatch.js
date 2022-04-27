#! /bin/env node
// const { exec } = require("child_process");
const { spawn } = require("child_process");

const serveScript = spawn("npm", ["run", "serve"]);

serveScript.stdout.on("data", (stream) => {
  console.log(`${stream}`);
});

const browser = spawn("xdg-open", ["http://localhost:8111"]);

serveScript.on("error", (error) => {
  console.log(error);
});

serveScript.on("exit", () => {
  browser.kill();
});
// const stopwatchServe = spawn("xdg-open", ['http://localhost:3000']);

// stopwatchServe.on('error', (err) => {
//   console.error(err)
//   stopwatchServe.kill()
// })
