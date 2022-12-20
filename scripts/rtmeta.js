// Load helper module
const fs = require('fs');
const {exec} = require('child_process');
const {createDir,copyAllFiles} = require('./helpers.js');
const performDemuxAndLaunchAnalysis = require('./rtmetaLib.js')


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
.option("remove-human-reads",{
    alias: "rhr",
    boolean: "rhr",
    describe: "Remove human reads from krona reports"
})
.option("remove-unknown-reads",{
    alias: "rur",
    boolean: "rur",
    describe: "Remove unknown reads from krona reports"
})
.option("nodemux",{
    alias: "nd",
    boolean: "nd",
    describe: "No demux option, assumes the whole sequencing runs characterizes a single sample."
})
.option("samplesheet",{
    alias: "s",
    describe: "Absolute path for samplesheet csv file (see docs)."
})
.option("guppy", {
    alias: "g",
    describe: "Absolute path for guppy_barcoder binary"
})
.option("barcode-kit", {
    alias: "b",
    describe: "Barcode kit used in the sequencing run."
})
.option("port", {
    alias: "p",
    describe: "Port for local server (Optional, default = 8001)"
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
        if(typeof(parameters.port)=== "undefined"){
            parameters.port = 8001;
            console.log(`Port for local server not specified, using the default ${parameters.port}`)
        }else{
            console.log(`Port for local server set -> ${parameters.port}`)
        }
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
        console.log(`Output directory already exists -> ${parameters.output}.
        Please indicate other to avoid overwriting previous analysis`);
        process.exit();
    }else{
        // Create output dir
        createDir(parameters.output);
        console.log(`Output library directory created -> ${parameters.output}`);
        // Load paths into parameters object
        parameters.temp = `${parameters.output}/temp/`;
        parameters.interface = `${parameters.output}/interface/`;
        parameters.results = `${parameters.output}/interface/results/`;
        // copy all assets
        const temp = process.argv[1].split('/');
        temp.pop();
        const assetsPath = temp.join('/') + "/interface/";
        copyAllFiles(assetsPath,parameters.interface);
        parameters.server = temp.join('/') + "/server.js";
        // Create output directories
        createDir(parameters.temp);
        createDir(parameters.results);
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


    if(parameters.readsToRemove.length > 0){
        console.log(`Removing reads with specified taxIDs...`);
        console.log(parameters.readsToRemove);
    }

    if(parameters.nodemux){
        console.log("No demux flag specified, ignoring --samplesheet, --guppy and --barcode arguments.");
        const samples = {
            names: ['Unique sample'],
            barcodes: ['NA'],
            numberOfSequences: []
        }
        parameters.samples = samples;
        return
    }

    if (fs.existsSync(parameters.samplesheet)) {
        console.log(`Samplesheet file found -> ${parameters.samplesheet}`);
        const samples = validateSampleSheet(parameters.samplesheet);
        parameters.samples = samples;
    }else{
        console.log(`Samplesheet file not found -> ${parameters.samplesheet}`);
        process.exit();
    }

    if (fs.existsSync(parameters.guppy)) {
        console.log(`guppy_barcoder identified -> ${parameters.guppy}`)
    }else{
        console.log(`guppy_barcoder not found -> ${parameters.guppy}`)
        process.exit()
    }

    if(parameters.barcode.startsWith("EXP-")){
        console.log(`Kit code matches pattern EXP -> ${parameters.barcode}`)
    }else if(parameters.barcode.startsWith("OND-")){
        console.log(`Kit code matches pattern OND -> ${parameters.barcode}`)
    }else if(parameters.barcode.startsWith("SQK-")){
        console.log(`Kit code matches pattern SQK -> ${parameters.barcode}`)
    }else if(parameters.barcode.startsWith("VSK-")){
        console.log(`Kit code matches pattern VSK -> ${parameters.barcode}`)
    }else{
        console.log("Kit code out of pattern. Please provide a kit consistent with the list provided in 'guppy_barcoder --print_kits'")
    }

}


const validateSampleSheet = (inputFile) =>{
    const samples = {
        names: [],
        barcodes: [],
        numberOfSequences: []
    }
        
    const text = fs.readFileSync(inputFile,'utf-8');
    text.split(/\r?\n/).forEach(line =>  {
        const values = line.split(',');
        const sampleName = values[0].replace(/\s+/g,'');
        const sampleBarcode = values[1].replace(/\s+/g,'');
        if(!sampleBarcode.startsWith("barcode")){
            console.log(`Inconsistent pattern in csv file, barcode name not formatted: ${sampleBarcode}`);
            console.log(`Please use barcode01,barcode02...`);
            process.exit();
        }
        if(samples.names.includes(sampleName)){
            console.log(`Inconsistent pattern in csv file, repeated name: ${sampleName}`);
            process.exit()
        }
        if(samples.barcodes.includes(sampleBarcode)){
            console.log(`Inconsistent pattern in csv file, repeated barcode: ${sampleName}`);
            process.exit()
        }

        samples.names.push(sampleName);
        samples.barcodes.push(sampleBarcode);

    });

    console.log('Samplesheet validated.')
    return samples
}


// Process the inputs provided on the command line.
// Returns the parameter objective with all important paths.
const processInput = () => { 
    const parameters = {
        "generation": 0,
        "threads": argv.threads,
        "mode": argv.mode,
        "library": argv.input,
        "output": argv.output,
        "kraken": argv.kraken2Database,
        "krona": argv.kronaDatabase,
        "samplesheet": argv.samplesheet,
        "guppy": argv.guppy,
        "barcode": argv.barcodeKit,
        "port": argv.port,
        "readsToRemove": []    
    }
    if(Object.keys(argv).includes("nd")){
        parameters.nodemux = true;
        parameters.numberOfSamples = 1;
    }
    if(Object.keys(argv).includes("rhr")){
        parameters.readsToRemove.push(9606);
    }
    if(Object.keys(argv).includes("rur")){
        parameters.readsToRemove.push(0);
    }
    validateParameters(parameters);
    return parameters;
}


const executeAnalysis = (parameters) =>{
    if(parameters.mode === 'realtime' || parameters.mode === 'rt'){
        const cmd = `node ${parameters.server} ${parameters.interface} ${parameters.port}`
        exec(cmd,(err,stdout,stderr)=>{
            if(err){
                console.log(err);
            }
        })
        console.log(`After the first complete iteration, results will be available at localhost:${parameters.port}`);
    }
    performDemuxAndLaunchAnalysis(parameters);
}


// Call functions to do the job
const parameters = processInput();
executeAnalysis(parameters);

