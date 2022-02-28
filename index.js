/**

Program version adapted for multiple samples with a minimal frontend interface.
It works with simple command line arguments and doesn't work with hardcoded paths.
The next step is to write better docs and generate the sync app version.


 */


// Load helper module
const helpers = require('./helpers.js');


// The follow function validate parameters and prepare
// the environment with the paths provided. 
const validateParameters = (parameters) =>{

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


// Print help message in required cases
const printHelpMessage = () =>{
    console.log('This is RT-Meta - a simple app for fast metagenomic analysis');
    console.log(`The script takes six positional arguments, being: 
    (1) Analysis mode: either --postrun or --realtime;
    (2) the root of library directory;
    (3) the output directory path;
    (4) the path for the kraken-db;
    (5) the path for the krona-db;
    (6) the number of processing threads (Optional)`);
    console.log(`If unsure about the meaning of these parameters, visit https://github.com/filiperomero2/RT-Metagenomics`);
    console.log('Example usage: node index.js --postrun /mnt/c/Users/filip/OneDrive/Desktop/dev/RT-Metagenomics/data/  /home/fmoreira/kraken-db/minikraken2_v2_8GB_201904_UPDATE /home/fmoreira/krona/taxonomy 4')
}

// Process the inputs provided on the command line.
// Returns the parameter objective with all important paths.
const processInput = () =>{
    if(process.argv.includes('-help') || process.argv.includes('-h') || process.argv.includes('--help')){
        printHelpMessage();
        process.exit();
    }else{
        const parameters = {
            "mode": process.argv[2],
            "library": process.argv[3],
            "output": process.argv[4],
            "kraken": process.argv[5],
            "krona": process.argv[6],
            "threads": process.argv[7]
        }
        validateParameters(parameters);
        //console.log(parameters)
        return parameters;
    }
}

// Declare main function
const iterateOverSamplesAndPerformAnalysis = (parameters) =>{

    //List all samples directories
    const allSamples = helpers.list(parameters.library);
    parameters.numberOfSamples = allSamples.length;

    // Iterate over samples, set paths, list fastq files,
    // copy them to a safe directory and run analysis.
    allSamples.forEach(sample =>{
        const partialPath = sample + '/';
        const source = parameters.library + partialPath;
        const destination = parameters.temp + partialPath;
        helpers.copyAllFiles(source, destination);
        helpers.concatenateFilesAndCallMetagenomicsApps(partialPath,destination,parameters);
    })

}

// Call function to do the job
const parameters = processInput();
if(parameters.mode === "--postrun" || parameters.mode === "--pr"){
    iterateOverSamplesAndPerformAnalysis(parameters);
}else if(parameters.mode === "--realtime" || parameters.mode === "--rt"){
    console.log('Do other stuff.')
}else{
    console.log(`Unknown analysis mode: ${parameters.mode}.
    Use --realtime or --postrun.`)
}


// Create function to do it in real time here.
// Add mode option to indicate if analysis is realtime or postrun
