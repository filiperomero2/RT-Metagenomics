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

const listFiles = (dataDir) =>{
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

const copyAllFiles = (allFiles) =>{
    try{
        const processedFiles = [];
        console.log("I'm copying all files to ./temp/")
        allFiles.forEach(file =>{
            const source = `./data/${file}`;
            const destination = `./temp/${file}`;
            copyFile(source,destination);
            processedFiles.push(file);
            return processedFiles;
        })
    }catch(err){
        console.log(err);
    }
}

const concatenateFilesAndCallMetagenomicsApps = tempDir => {
    const concatenatedFile = tempDir + 'cat.fastq';
    if(fs.existsSync(concatenatedFile)) {
        fs.rmSync(concatenatedFile, { recursive: true, force: true });
    }
    execShellCommand(`cat ${tempDir}* > ${concatenatedFile}`)
        .then(()=>{
            console.log(`Concatenated file (${concatenatedFile}) has been created.`);
            performTaxonomicAssignment(concatenatedFile);
        })
}


const performTaxonomicAssignment = (concatenatedFile) =>{
    const kraken2DB = '/home/filipe/kraken-db/minikraken2_v2_8GB_201904_UPDATE/';
    const numberOfThreads = '4';
    const kraken2ReportFile = './results/report.txt';
    const kraken2OutputFile = './results/results.kraken2.txt'
    const kraken2Call = `kraken2 --db ${kraken2DB} --threads ${numberOfThreads} --report ${kraken2ReportFile} --output ${kraken2OutputFile} ${concatenatedFile}`;
    execShellCommand(kraken2Call)
        .then((resolve)=>{
            console.log(resolve);
            console.log('Taxonomic assignment has been performed');
            createKronaInputFile(kraken2OutputFile);
        })
}

const createKronaInputFile = kraken2OutputFile =>{
    const kronaInputFile = `${kraken2OutputFile}.krona`
    const kronaInputFileInstructions = `cat ${kraken2OutputFile} | cut -f 2,3 > ${kronaInputFile}`
    execShellCommand(kronaInputFileInstructions)
        .then(()=>{
            console.log(`Krona input file created -> ${kronaInputFile}`);
            createKronaPlot(kronaInputFile);
        })
}

const createKronaPlot = (kronaInputFile) =>{
    const kronaOutputFile = `${kronaInputFile}.html`;
    const kronaDB = '/home/filipe/krona-db/taxonomy';
    kronaPlotInstructions = `ktImportTaxonomy ${kronaInputFile} -tax ${kronaDB}  -o ${kronaOutputFile}`;
    execShellCommand(kronaPlotInstructions)
        .then(()=>{
            console.log(`Krona plot was created -> ${kronaOutputFile}`)
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
    listFiles,
    copyFile,
    copyAllFiles,
    concatenateFilesAndCallMetagenomicsApps
}

/**

*/