const helpers = require('./helpers.js');

// Create relevant directories for the project
helpers.createDir('./temp/');
helpers.createDir('./results/');

// List directory with the original data
const allFiles = helpers.listFiles('./data/');

// Copy files to temporary directory
const processedFiles = helpers.copyAllFiles(allFiles);

// Concatenate files and run metagenomics apps
helpers.concatenateFilesAndCallMetagenomicsApps('./temp/')


/**
Create code that will conduct the analysis repetitively
- Put the program to sleep for a minute
- Execute analysis if new fastq files are detected
- Skips if there are none
Update minikraken2 db
 */

