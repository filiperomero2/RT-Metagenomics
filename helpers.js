const fs = require('fs');
const {exec} = require('child_process');

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

const list= (dataDir) =>{
    try{
        const files = fs.readdirSync(dataDir);
        return files;
    }catch(err){
        console.log(err);
    }
}

const copyFile = (source, destination) => {
    try{
        fs.copyFileSync(source, destination);
        //console.log(`${source} was copied to ${destination}`);
    }catch(err){
        console.log(err);
    }   
}

const copyAllFiles = (source, destination, allFiles) =>{
    try{
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

const concatenateFilesAndCallMetagenomicsApps = (partialPath,sampleDir) => {
    const concatenatedFile = sampleDir + 'cat.fastq';
    if(fs.existsSync(concatenatedFile)) {
        fs.rmSync(concatenatedFile, { recursive: true, force: true });
    }
    execShellCommand(`cat ${sampleDir}* > ${concatenatedFile}`)
        .then(()=>{
            console.log(`Concatenated file (${concatenatedFile}) has been created.`);
            performTaxonomicAssignment(partialPath,concatenatedFile);
        })
}


const performTaxonomicAssignment = (partialPath,concatenatedFile) =>{    
    const kraken2DB = '/home/filipe/kraken-db/minikraken2_v2_8GB_201904_UPDATE/';
    const numberOfThreads = '4';
    const sampleResultsPath = `./results/${partialPath}`;
    createDir(sampleResultsPath);
    const kraken2ReportFile = `${sampleResultsPath}report.txt`
    const kraken2OutputFile = `${sampleResultsPath}results.kraken2.txt`
    const kraken2Call = `kraken2 --db ${kraken2DB} --threads ${numberOfThreads} --report ${kraken2ReportFile} --output ${kraken2OutputFile} ${concatenatedFile}`;
    execShellCommand(kraken2Call)
        .then((resolve)=>{
            console.log('#################################################################');
            console.log(`Taxonomic assignment has been performed for ${concatenatedFile}`);
            console.log(resolve);
            createKronaInputFile(kraken2OutputFile);
        })
}

const createKronaInputFile = kraken2OutputFile =>{
    const kronaInputFile = `${kraken2OutputFile}.krona`
    const kronaInputFileInstructions = `cat ${kraken2OutputFile} | cut -f 2,3 > ${kronaInputFile}`
    execShellCommand(kronaInputFileInstructions)
        .then(()=>{
            console.log(`Krona input file created -> ${kronaInputFile}`);
            console.log('#################################################################');
            createKronaPlot(kronaInputFile);
        })
}

const createKronaPlot = (kronaInputFile) =>{
    const kronaOutputFile = `${kronaInputFile}.html`;
    const kronaDB = '/home/filipe/krona-db/taxonomy';
    kronaPlotInstructions = `ktImportTaxonomy ${kronaInputFile} -tax ${kronaDB}  -o ${kronaOutputFile}`;
    execShellCommand(kronaPlotInstructions)
        .then(()=>{
            console.log(`Krona plot was created -> ${kronaOutputFile}`);
        })
}


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


module.exports = {
    createDir,
    list,
    copyFile,
    copyAllFiles,
    concatenateFilesAndCallMetagenomicsApps
}

/**

*/