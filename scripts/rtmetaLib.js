// Load modules
const fs = require('fs');
const {createDir,list,copyAllFiles,execShellCommand} = require('./helpers.js');
const createMinimalInterface = require('./createMinimalInterface.js')


// Declare array with all krona HTML files
const HTMLFiles = [];


const performDemuxAndLaunchAnalysis = async (parameters) => {
    if(parameters.nodemux){
        // copy files and call concatenateFilesAndCallMetagenomicsApps()
        const partialPath = "sample/"
        const uniqueSamplePath = parameters.temp + partialPath;
        copyAllFiles(parameters.library,uniqueSamplePath);
        concatenateFilesAndCallMetagenomicsApps(partialPath,uniqueSamplePath,parameters)
    }else{
        guppyBarcoderPath = parameters.guppy + '/guppy_barcoder';
        demuxCall = `${guppyBarcoderPath} --require_barcodes_both_ends -i ${parameters.library} -s ${parameters.temp} --barcode_kits "${parameters.barcode}"  -t ${parameters.threads} -r`;
        await execShellCommand(demuxCall)
            .then((resolve)=>{
                console.log(resolve);
                console.log('Demux finished.');
                iterateOverSamples(parameters);
            })
    }
    
}


// Declare main function
const iterateOverSamples = async (parameters) =>{

    //List all samples directories
    const allItems = list(parameters.temp);
    const allSamples = allItems.filter(item =>{
        //return item.startsWith("barcode");
        return parameters.samples.barcodes.includes(item);
    })

    parameters.numberOfSamples = allSamples.length;

    // Iterate over samples, set paths, list fastq files,
    // copy them to a safe directory and run analysis.
    for(let counter = 0; counter <= allSamples.length - 1; counter++){
        const partialPath = allSamples[counter] + '/';
        const destination = parameters.temp + partialPath;
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
    await execShellCommand(`cat ${destination}*fastq > ${concatenatedFile}`)
        .then(async()=>{
            console.log(`\n\n\nConcatenated file (${concatenatedFile}) has been created.`);
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
    const kraken2Call = `kraken2 --db ${kraken2DB} --threads ${numberOfThreads} --report-minimizer-data --minimum-hit-group 3 --report ${kraken2ReportFile} --output ${kraken2OutputFile} ${concatenatedFile}`;
    await execShellCommand(kraken2Call)
        .then(async (resolve)=>{
            console.log(`Taxonomic assignment has been performed for ${concatenatedFile}`);
            console.log(resolve);
            temp = resolve.split('\n')[1];
            parameters.samples.numberOfSequences.push(temp.split(' ')[0]);
            await createKronaInputFile(kraken2OutputFile,parameters);
        })
}


const removeReadsFromKronaInputFile = async (kronaInputFile,parameters) =>{
    const kronaInputFileEdited = kronaInputFile + `.edited`;
    let kronaInputFileEditionInstruction = '';
    if(parameters.readsToRemove.length === 1){
        kronaInputFileEditionInstruction = `grep -Pv "\\h${parameters.readsToRemove[0]}$" ${kronaInputFile} > ${kronaInputFileEdited}`;
    }else{
        kronaInputFileEditionInstruction = `grep -Pv "\\h${parameters.readsToRemove[0]}$|\\h${parameters.readsToRemove[1]}$" ${kronaInputFile} > ${kronaInputFileEdited}`;
    }
    await execShellCommand(kronaInputFileEditionInstruction)
        .then(async()=>{
            console.log(`Krona input file edited -> ${kronaInputFileEdited}`);
            await createKronaPlot(kronaInputFileEdited,parameters);
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
            if(parameters.readsToRemove.length > 0){
                await removeReadsFromKronaInputFile(kronaInputFile,parameters);
            }else{
                await createKronaPlot(kronaInputFile,parameters);
            }
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
                await createMinimalInterface(HTMLFiles,parameters);
                HTMLFiles.length = 0;
                parameters.samples.numberOfSequences.length = 0;
                if(parameters.mode === "postrun" || parameters.mode === "pr"){
                    console.log(`Analysis finished.`);
                    process.exit();
                }else if(parameters.mode === "realtime" || parameters.mode === "rt"){
                    console.log(`Results available at localhost:${parameters.port}`)
                    console.log(`### Performing real time analysis -> Generation ${parameters.generation} executed ###\n\n`);
                    parameters.generation++;
                    await performDemuxAndLaunchAnalysis(parameters);
                }
            }
        })
}


// Export node modules
module.exports = performDemuxAndLaunchAnalysis
