
const argv = require("yargs/yargs")(process.argv.slice(2))
.option("mode", {
    alias: "m",
    describe: "Analysis mode: either --postrun or --realtime"
  })
.option("input", {
  alias: "i",
  describe: "Absolute path for samples root directory"
})
.option("output", {
  alias: "o",
  describe: "Absolute path for output directory"
})
.option("kraken2-database", {
    alias: "kraken2-db",
    describe: "Absolute path for selected kraken2 database directory"
})
.option("krona-database", {
    alias: "krona-db",
    describe: "Absolute path for selected krona database directory"
})
.option("threads", {
    alias: "t",
    describe: "Number of threads (Optional, default = 1)"
})
.demandOption(["mode","input","output","kraken2-database","krona-db"], "Please specify all required arguments.")
.help().argv;

// write function to validate arguments and replace previous IO engine on index.js

console.log(argv.mode)