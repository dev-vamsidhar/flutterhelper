#! /usr/bin/env node
import yargs from "yargs";
import chalk from "chalk";
import { spawn } from "child_process";
import dotenv from "dotenv";
dotenv.config();

import fs from "fs";

import AWS from "aws-sdk";

const framework = process.argv[2];
const fileName = process.argv[3];

const log = console.log;

const handleApkUpload = async (fileName) => {
  AWS.config.update({
    accessKeyId: process.env.ACCESS_KEY,
    secretAccessKey: process.env.SCRECT_KEY,
    region: process.env.REGION,
  });
  const s3 = new AWS.S3();
  s3.upload(
    {
      Bucket: "vamsidhar-build",
      Key: fileName,
      ACL: "public-read",
      Body: fs.createReadStream(
        "./build/app/outputs/apk/release/app-release.apk"
      ),
    },
    function (err, data) {
      if (err) {
        console.log(err);
      }
      console.log(data.Location);
    }
  );
};

if (framework === "flutter") {
  log(chalk.blue("Building flutter app..."));

  const flutterProcess = spawn("flutter", ["build", "apk"]);

  flutterProcess.stdout.on("data", (data) => {
    console.log(`${data}`);
  });

  flutterProcess.stderr.on("data", (data) => {
    console.log(`stderr: ${data}`);
  });

  flutterProcess.on("error", (error) => {
    console.log(`error: ${error.message}`);
  });

  flutterProcess.on("close", (code) => {
    handleApkUpload(fileName);
    console.log(`child process exited with code ${code}`);
  });
} else {
  log(chalk.red("Framework not supported"));
  await handleApkUpload("index.js");
}

//Helper documentation
const argv = yargs(process.argv.slice(2))
  .usage("Usage: build appname\n Currently supported apps: flutter")
  .option("hosting", {
    alias: "h",
    describe: "Hosting platform",
  }).argv;

if (argv.help) {
  yargs.showHelp();
  process.exit();
}
