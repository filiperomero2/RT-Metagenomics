helpers = require('./helpers');

const source = './test_data/';
const destination = './data/sample2/';
const files = helpers.listFiles(source);
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
        await sleep(1000);
    }
}

executeLoop();
