// Load helper module
const helpers = require('./helpers.js');

// Declare main function
const iterateOverSamplesAndPerformAnalysis = allSamples =>{
    // Create relevant directories for the project
    helpers.createDir('./temp/');
    helpers.createDir('./results/');

    //List all samples directories
    const allSamples = helpers.list('./data/');
    const numberOfSamples = allSamples.length;

    // Iterate over samples, set paths, list fastq files,
    // copy them to a safe directory and run analysis.
    allSamples.forEach(sample =>{
        console.log(sample)
        const partialPath = sample + '/';
        const source = './data/' + partialPath;
        const destination = './temp/' + partialPath;
        const allFiles = helpers.list(source);
        const processedFiles = helpers.copyAllFiles(source, destination, allFiles);
        helpers.concatenateFilesAndCallMetagenomicsApps(partialPath,destination,numberOfSamples);
    })
    
}

// Call function to do the job
iterateOverSamplesAndPerformAnalysis()


/**

Program version adapted for multiple samples with a minimal frontend interface.

Lots of stuff still hardcoded.

The next step is to convert it to a sync app.

It would be great to have some nanopore data for validations.

 */

