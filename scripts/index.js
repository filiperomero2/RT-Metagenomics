/**
 * 
 * App working in both modes. 
 * Must:
 *  - test rt mode at a more accurate rate;
 *  - Develop demux engine integrating guppy;
 *  - Advance frontend development.
 * 
 */



// Load helper module
const helpers = require('./helpers.js');

// Read command line args
const argv = require("yargs/yargs")(process.argv.slice(2))
.option("mode", {
    alias: "m",
    describe: "Analysis mode: either postrun or realtime"
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


// The follow function validate parameters and prepare
// the environment with the paths provided. 
const validateParameters = (parameters) =>{

    if(parameters.mode === "postrun" || parameters.mode === "pr"){
        console.log('Application launched in post run mode.');
    }else if(parameters.mode === "realtime" || parameters.mode === "rt"){
        console.log('Application launched in real time mode.');
    }else{
        console.log(`Unknown analysis mode: ${parameters.mode}.
        Use --mode realtime or --mode postrun.`);
        process.exit();
    }

    if (fs.existsSync(parameters.library)) {
        console.log(`Libraries directory -> ${parameters.library}`);
    }else{
        console.log(`Specified path for library directory does not exist -> ${parameters.library}`);
        process.exit();
    }

    if (fs.existsSync(parameters.output)) {
        console.log(`Libraries directory already exists -> ${parameters.output}.
        Please indicate other to avoid overwriting previous analysis`);
        process.exit();
    }else{
        console.log(`Output library directory created -> ${parameters.output}`);
        // Load paths into parameters object
        parameters.temp = `${parameters.output}/temp/`;
        parameters.results = `${parameters.output}/results/`;
        parameters.interface = `${parameters.output}/interface/`;
        // Create output directories
        helpers.createDir(parameters.output);
        helpers.createDir(parameters.temp);
        helpers.createDir(parameters.results);
        // copy all assets
        const temp = process.argv[1].split('/');
        temp.pop();
        const assetsPath = temp.join('/') + "/interface/"
        helpers.copyAllFiles(assetsPath,parameters.interface)
    }

    if (fs.existsSync(parameters.kraken)) {
        console.log(`kraken2-db directory -> ${parameters.kraken}`)
    }else{
        console.log(`Specified path for kraken2-db directory does not exist -> ${parameters.kraken}`)
        process.exit()
    }

    if (fs.existsSync(parameters.krona)) {
        console.log(`krona-db directory -> ${parameters.krona}`)
    }else{
        console.log(`Specified path for krona-db directory does not exist -> ${parameters.krona}`)
        process.exit()
    }

    if(typeof(parameters.threads)=== "undefined"){
        parameters.threads = 1;
        console.log(`Number of processing threads has not being set, using only ${parameters.threads}`)
    }else{
        console.log(`Number of processing threads has been set -> ${parameters.threads}`)
    }

}



// Process the inputs provided on the command line.
// Returns the parameter objective with all important paths.
const processInput = () =>{ 
    const parameters = {
        "mode": argv.mode,
        "library": argv.input,
        "output": argv.output,
        "kraken": argv.kraken2Database,
        "krona": argv.kronaDatabase,
        "threads": process.threads,
        "generation": 0
    }
    validateParameters(parameters);
    return parameters;
}

const executeAnalysis = (parameters) =>{
    helpers.iterateOverSamplesAndPerformAnalysis(parameters);
}

// Call functions to do the job
const parameters = processInput();
executeAnalysis(parameters);

