/**
 * This is a simple script to simulate a sequencing run.
 * It takes three positional arguments: (1) the path for the
 * directory containing template data, (2) the path where
 * data will be received and (3) the number of seconds at
 * which each fastq file would be generated.
 * 
 */

helpers = require('./helpers');

const source = process.argv[2];
const destination = process.argv[3] + "/";
const awaitingTime = process.argv[4];

const files = helpers.list(source);
let counter = 0;

helpers.createDir(destination);

const simulateSequencingRun = () =>{
    counter++;
    const sample = files[Math.floor(Math.random() * files.length)];
    const sourceFile = `${source}${sample}`;
    const destinationFile = `${destination}${counter}_${sample}`;
    helpers.copyFile(sourceFile,destinationFile);
    console.log(`${sample} -> ${counter}`)
    
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

executeLoop = async() =>{
    while(true){
        simulateSequencingRun(); 
        await sleep(awaitingTime*1000);
    }
}

executeLoop();
