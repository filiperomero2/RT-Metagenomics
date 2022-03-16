// Load modules
const fs = require('fs');
const {exec} = require('child_process');
const createMinimalInterface = require('./createMinimalInterface')

// Declare array with all krona HTML files
const HTMLFiles = [];

// Sync function to create directories, erase them if existant
const createDir = (dirName) =>{
    try {
        if (fs.existsSync(dirName)) {
            fs.rmSync(dirName, { recursive: true, force: true });
        }
        fs.mkdirSync(dirName);
        console.log(`Directory ${dirName} is created.`);
    } catch (err) {
        console.log(err);
    }
}

// Sync function to list contents of a directory
const list = (dataDir) =>{
    try{
        const files = fs.readdirSync(dataDir);
        return files;
    }catch(err){
        console.log(err);
    }
}

// Sync function to copy file
const copyFile = (source, destination) => {
    try{
        fs.copyFileSync(source, destination);
        //console.log(`${source} was copied to ${destination}`);
    }catch(err){
        console.log(err);
    }   
}

// Sync function to create temp directory and copy fastq files.
// It returns a list of processed files, useful for sync app.
const copyAllFiles = (source, destination) =>{
    try{
        const allFiles = list(source);
        const processedFiles = [];
        createDir(destination);
        allFiles.forEach(file =>{
            const sourceFile = source + file;
            const destinationFile = destination + file;
            copyFile(sourceFile,destinationFile);
            processedFiles.push(file);
        });
        return processedFiles;
    }catch(err){
        console.log(err);
    }
}


// Declare main function
const iterateOverSamplesAndPerformAnalysis = async (parameters) =>{

    //List all samples directories
    const allSamples = list(parameters.library);
    parameters.numberOfSamples = allSamples.length;

    // Iterate over samples, set paths, list fastq files,
    // copy them to a safe directory and run analysis.
    for(let counter = 0; counter <= allSamples.length - 1; counter++){
        const partialPath = allSamples[counter] + '/';
        const source = parameters.library + partialPath;
        const destination = parameters.temp + partialPath;
        copyAllFiles(source, destination);
        await concatenateFilesAndCallMetagenomicsApps(partialPath,destination,parameters);
    }
    
}

// Async function that starts the analysis flow.
// First, it concatenates files and when the promise is fulfilled,
// it calls the function reponsible for taxonomic assignment with kraken2
const concatenateFilesAndCallMetagenomicsApps = async (partialPath,destination,parameters) => {
    const concatenatedFile = destination + 'cat.fastq';
    if(fs.existsSync(concatenatedFile)) {
        fs.rmSync(concatenatedFile, { recursive: true, force: true });
    }
    await execShellCommand(`cat ${destination}* > ${concatenatedFile}`)
        .then(async()=>{
            console.log(`Concatenated file (${concatenatedFile}) has been created.`);
            await performTaxonomicAssignment(partialPath,concatenatedFile,parameters);
        })
}

// Async function that sets paths, executes kraken 2 and launches
// the creation of the krona input file. 
const performTaxonomicAssignment = async (partialPath,concatenatedFile,parameters) =>{
    const kraken2DB = parameters.kraken;
    const numberOfThreads = parameters.numberOfSamples;
    const sampleResultsPath = `${parameters.results}${partialPath}`;
    if(!fs.existsSync(sampleResultsPath)) {
        createDir(sampleResultsPath);
    } 
    const kraken2ReportFile = `${sampleResultsPath}report.txt`
    const kraken2OutputFile = `${sampleResultsPath}results.kraken2.txt`
    const kraken2Call = `kraken2 --db ${kraken2DB} --threads ${numberOfThreads} --report ${kraken2ReportFile} --output ${kraken2OutputFile} ${concatenatedFile}`;
    await execShellCommand(kraken2Call)
        .then(async (resolve)=>{
            console.log(`Taxonomic assignment has been performed for ${concatenatedFile}`);
            console.log(resolve);
            await createKronaInputFile(kraken2OutputFile,parameters);
        })
}


// Async function that creates krona input files and calls the
// function that effectively creates the plots
const createKronaInputFile = async (kraken2OutputFile,parameters) =>{
    const kronaInputFile = `${kraken2OutputFile}.krona`
    const kronaInputFileInstructions = `cat ${kraken2OutputFile} | cut -f 2,3 > ${kronaInputFile}`
    await execShellCommand(kronaInputFileInstructions)
        .then(async()=>{
            console.log(`Krona input file created -> ${kronaInputFile}`);
            await createKronaPlot(kronaInputFile,parameters);
        })
}

// Create krona plots and, when all samples have been analyzed,
// it creates a single html page with all analysis results.
const createKronaPlot = async (kronaInputFile,parameters) =>{
    const kronaOutputFile = `${kronaInputFile}.html`;
    const kronaDB = parameters.krona
    kronaPlotInstructions = `ktImportTaxonomy ${kronaInputFile} -tax ${kronaDB}  -o ${kronaOutputFile}`;
    await execShellCommand(kronaPlotInstructions)
        .then(async()=>{
            console.log(`Krona plot was created -> ${kronaOutputFile}`);
            HTMLFiles.push(kronaOutputFile);
            if(HTMLFiles.length === parameters.numberOfSamples){
                await createMinimalInterface(HTMLFiles,parameters.interface);
                HTMLFiles.length = 0;
                if(parameters.mode === "--postrun" || parameters.mode === "--pr"){
                    console.log(`Analysis finished.`);
                    process.exit();
                }else if(parameters.mode === "--realtime" || parameters.mode === "--rt"){
                    console.log(`### Performing real time analysis -> Generation ${parameters.generation} ###`)
                    await iterateOverSamplesAndPerformAnalysis(parameters);
                }
                parameters.generation++;
            }
        })
}

// Super usefull function that returns promisses, 
// allowing the execution of shell commands in parallel
const execShellCommand = (cmd) =>{
    return new Promise((resolve,reject) =>{
        exec(cmd,(err,stdout,stderr)=>{
            if(err){
                console.log(err);
            }
            resolve(stdout? stdout : stderr);
        })
    })
}



// Export node modules
module.exports = {
    createDir,
    list,
    copyFile,
    copyAllFiles,
    iterateOverSamplesAndPerformAnalysis
}

