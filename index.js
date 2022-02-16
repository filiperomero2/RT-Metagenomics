const helpers = require('./helpers.js');

// Create relevant directories for the project
helpers.createDir('./temp/');
helpers.createDir('./results/');

// In here list directories
const allSamples = helpers.list('./data/');

const iterateOverSamplesAndPerformAnalysis = (allSamples) =>{
    allSamples.forEach(sample =>{
        const partialPath = sample + '/';
        const source = './data/' + partialPath;
        const destination = './temp/' + partialPath;
        const allFiles = helpers.list(source);
        const processedFiles = helpers.copyAllFiles(source, destination, allFiles);
        helpers.concatenateFilesAndCallMetagenomicsApps(partialPath,destination);
    })
}

iterateOverSamplesAndPerformAnalysis(allSamples);


/**
Program version adapted for multiple samples.
The next step is to convert it to a sync app.
It would be great to have some nanopore data for validations.
Lots of stuff still hardcoded.
No front end development whatsoever.

 */

