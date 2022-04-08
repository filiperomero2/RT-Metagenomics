const {execShellCommand} = require('./helpers.js');
const fs = require('fs');


const calculateAssemblyStats = async parameters =>{
    stats = {
        "statsReportFile": parameters.sampleName + '.stats.txt'
    };
    console.log('## Stats report ##');
    // Get number of reads
    let call = `grep -cE "^\\+$" ${parameters.inputFile}`;
    await execShellCommand(call)
        .then(resolve=>{
            //console.log(resolve);
            stats.numberOfReads = Number.parseInt(resolve,10);
            console.log(`Absolute number of analyzed reads -> ${stats.numberOfReads}`)
        })
    
    // Get average sequencing depth
    call = `cat  ${parameters.sampleName}.table_cov.txt | awk '{sum+=$3; print sum}' | tail -n 1`;
    await execShellCommand(call)
        .then(resolve=>{
            //console.log(resolve);
            stats.sum = Number.parseInt(resolve,10);
        })
    call = `grep -v '>' ${parameters.referenceSequence} | sed ':a;N;$!ba;s/\\n//g' | wc -c`;
    await execShellCommand(call)
        .then(resolve=>{
            //console.log(resolve);
            stats.referenceLength = Number.parseInt(resolve,10);
        })
    stats.averageDepth = stats.sum/stats.referenceLength;
    console.log(`Average sequencing depth -> ${stats.averageDepth}`)
    
    // Get depth 10x,100x,1000x
    call = `awk  '$3 > 10' ${parameters.sampleName}.table_cov.txt | wc -l`
    await execShellCommand(call)
        .then(resolve=>{
            //console.log(resolve);
            stats.sitesOver10x = Number.parseInt(resolve,10)/stats.referenceLength;
            console.log(`Proportion of sites sequenced at least 10x -> ${stats.sitesOver10x}`)
        })
    call = `awk  '$3 > 100' ${parameters.sampleName}.table_cov.txt | wc -l`
    await execShellCommand(call)
        .then(resolve=>{
            //console.log(resolve);
            stats.sitesOver100x = Number.parseInt(resolve,10)/stats.referenceLength;
            console.log(`Proportion of sites sequenced at least 100x -> ${stats.sitesOver100x}`)
        })
    call = `awk  '$3 > 1000' ${parameters.sampleName}.table_cov.txt | wc -l`
    await execShellCommand(call)
        .then(resolve=>{
            //console.log(resolve);
            stats.sitesOver1000x = Number.parseInt(resolve,10)/stats.referenceLength;
            console.log(`Proportion of sites sequenced at least 1000x -> ${stats.sitesOver1000x}`)
        })
    
    // Get depth at selected threshold
    call = `awk  '$3 > ${parameters.minimumDepth}' ${parameters.sampleName}.table_cov.txt | wc -l`
    await execShellCommand(call)
        .then(resolve=>{
            //console.log(resolve);
            stats.sitesOverMinimumDepth = Number.parseInt(resolve,10)/stats.referenceLength;
            console.log(`Proportion of sites sequenced at least ${parameters.minimumDepth}x (threshold specified) -> ${stats.sitesOverMinimumDepth}`)
        })

    // Write sequencing stats to text file
    const content = `#reads,average_depth,cov10x,cov100x,cov1000x,cov${parameters.minimumDepth}x_specified\n${stats.numberOfReads},${stats.averageDepth},${stats.sitesOver10x},${stats.sitesOver100x},${stats.sitesOver1000x},${stats.sitesOverMinimumDepth}`
    fs.writeFileSync(stats.statsReportFile, content);

    // Plot sequencing depth
    const temp = process.argv[1].split('/');
    temp.pop();
    rscriptPath = temp.join('/') + '/plot_sequencing_depth.R';
    call = `Rscript ${rscriptPath} ${parameters.sampleName} ${parameters.minimumDepth}`;
    await execShellCommand(call)
        .then(resolve=>{
            //console.log(resolve);
            console.log('Sequencing depth plot created\n\n\nFinished.');
        })
}


module.exports = calculateAssemblyStats;