const fs = require('fs');
const {exec} = require('child_process');

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
            const sourceFile = source + "/" + file;
            const destinationFile = destination + file;
            copyFile(sourceFile,destinationFile);
            processedFiles.push(file);
        });
        return processedFiles;
    }catch(err){
        console.log(err);
    }
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
    execShellCommand
}
