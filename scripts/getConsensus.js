const fs = require('fs');
const {createDir,execShellCommand} = require('./helpers.js');
const calculateAssemblyStats = require('./calculateAssemblyStats.js');

// Read command line args
const argv = require("yargs/yargs")(process.argv.slice(2))
.option("input", {
  alias: "i",
  describe: "Absolute path for input fastq file"
})
.option("output", {
    alias: "o",
    describe: "Absolute path for output directory"
})
.option("sample-name", {
    alias: "s",
    describe: "Sample name"
})
.option("reference", {
  alias: "r",
  describe: "Absolute path for reference genome in fasta format"
})
.option("medaka-model", {
    alias: "m",
    describe: "medaka model (default: r941_min_fast_g303). If unsure, check medaka docs."
})
.option("minimum-depth", {
    alias: "d",
    describe: "Minimum threshold used to mask low coverage genome sites (default: 100)"
})
.option("threads", {
    alias: "t",
    describe: "Number of threads (Optional, default = 1)"
})
.demandOption(["input","output","sample-name","reference"], "Please specify all required arguments.")
.help().argv;

// Initial args processing
const processInput = () => { 
    const parameters = {
        "inputFile": argv.input,
        "output": argv.output,
        "sampleName": argv['sample-name'],
        "referenceSequence": argv.reference,
        "medakaModel": argv['medaka-model'],
        "minimumDepth": argv['minimum-depth'],
        "threads": argv.threads
    }
    validateParameters(parameters);
    return parameters;
}

const validateParameters = parameters =>{

    if (fs.existsSync(parameters.inputFile)) {
        console.log(`Input fastq file was found -> ${parameters.inputFile}`);
    }else{
        console.log(`File does not exist -> ${parameters.inputFile}`);
        process.exit();
    }

    if (fs.existsSync(parameters.output)) {
        console.log(`Output directory already exists -> ${parameters.output}.\nPlease indicate other to avoid overwriting previous analysis`);
        process.exit();
    }else{
        createDir(parameters.output);
    }

    if(typeof(parameters.sampleName)=== "undefined"){
        console.log(`Sample name not provided, using 'sample' as prefix to all output files.`);
        parameters.sampleName = parameters.output + '/sample';
    }else{
        console.log(`Sample name identified -> ${parameters.sampleName}`)
        parameters.sampleName = parameters.output + '/' + parameters.sampleName;
    }

    if (fs.existsSync(parameters.referenceSequence)) {
        console.log(`Reference sequence was found -> ${parameters.referenceSequence}`);
    }else{
        console.log(`Reference file does not exist -> ${parameters.referenceSequence}`);
        process.exit();
    }

    if(typeof(parameters.medakaModel)=== "undefined"){
        parameters.medakaModel = 'r941_min_fast_g303';
        console.log(`Medaka model not provided, using the default -> ${parameters.medakaModel}`)
    }else{
        // Do a better validation here
        console.log(`Medaka model specified -> ${parameters.medakaModel}`)
    }

    if(typeof(parameters.minimumDepth)=== "undefined"){
        parameters.minimumDepth = 20;
        console.log(`Number of processing threads has not being set, using only ${parameters.minimumDepth}`)
    }else{
        console.log(`Number of processing threads has been set -> ${parameters.minimumDepth}`)
    }

    if(typeof(parameters.threads)=== "undefined"){
        parameters.threads = 1;
        console.log(`Number of processing threads has not being set, using only ${parameters.threads}\n\n`)
    }else{
        console.log(`Number of processing threads has been set -> ${parameters.threads}\n\n`)
    }
}

// The main functions begin here //
const launchAnalysis = parameters =>{
    minimapCall = `minimap2 -a -x map-ont -t ${parameters.threads} ${parameters.referenceSequence} ${parameters.inputFile} | samtools view -bS -F 4 - | samtools sort -o ${parameters.sampleName}.sorted.bam -`;
    console.log('## Mapping ##');
    console.log(minimapCall);
    execShellCommand(minimapCall)
        .then(resolve=>{
            console.log(resolve);
            console.log(`Mapping executed...\n\n`)
            index(parameters)
        })
}

const index = parameters =>{
    samtoolsIndexCall = `samtools index ${parameters.sampleName}.sorted.bam`;
    console.log('## Indexing ##');
    console.log(samtoolsIndexCall);
    execShellCommand(samtoolsIndexCall)
        .then(resolve=>{
            console.log(resolve);
            console.log(`Indexing executed...\n\n`)
            medakaConsensus(parameters);
        })
}

const medakaConsensus = parameters =>{
    medakaConsensusCall = `medaka consensus --model ${parameters.medakaModel} --threads 1 ${parameters.sampleName}.sorted.bam ${parameters.sampleName}.hdf`;
    console.log('## Consensus ##');
    console.log(medakaConsensusCall);
    execShellCommand(medakaConsensusCall)
        .then(resolve=>{
            console.log(resolve);
            console.log(`medaka consensus executed...\n\n`)
            callVariants(parameters);
        })
}

const callVariants = parameters =>{
    console.log('## Variant calling ##');
    medakaVariantCall = `medaka variant ${parameters.referenceSequence} ${parameters.sampleName}.hdf ${parameters.sampleName}.vcf`;
    console.log(medakaVariantCall);
    execShellCommand(medakaVariantCall)
        .then(resolve=>{
            console.log(resolve);
            console.log(`variant calling executed...\n\n`)
            annotate(parameters);
        })
}


const annotate = parameters =>{
    medakaAnnotateCall = `medaka tools annotate  ${parameters.sampleName}.vcf ${parameters.referenceSequence} ${parameters.sampleName}.sorted.bam ${parameters.sampleName}.medaka-annotated.vcf`;
    console.log('## Annotation ##');
    console.log(medakaAnnotateCall);
    execShellCommand(medakaAnnotateCall)
        .then(resolve=>{
            console.log(resolve);
            console.log(`medaka annotate executed...\n\n`)
            formatVCF(parameters);
        })
}


const formatVCF = parameters =>{
    formatVCFCall = `bgzip -f ${parameters.sampleName}.vcf`;
    console.log('## Format VCF ##');
    console.log(formatVCFCall);
    execShellCommand(formatVCFCall)
        .then(resolve=>{
            console.log(resolve);
            console.log(`VCF formated...\n\n`)
            indexVCF(parameters);
        })
}

const indexVCF = parameters =>{
    indexVCFCall = `tabix -p vcf ${parameters.sampleName}.vcf.gz`;
    console.log('## Index VCF ##');
    console.log(indexVCFCall);
    execShellCommand(indexVCFCall)
        .then(resolve=>{
            console.log(resolve);
            console.log(`VCF indexed...\n\n`);
            callBCFtools(parameters);
        })
}

const callBCFtools = parameters =>{
    bcftoolsCall = `bcftools consensus -f ${parameters.referenceSequence} ${parameters.sampleName}.vcf.gz  -o ${parameters.sampleName}.preconsensus.fasta`
    console.log('## Preconsensus generation ##');
    console.log(bcftoolsCall);
    execShellCommand(bcftoolsCall)
        .then(resolve=>{
            console.log(resolve);
            console.log(`Preconsensus generated...\n\n`);
            callBEDtools(parameters);
        })
}

const callBEDtools = parameters =>{
    bedtoolsCall = `bedtools genomecov -bga -ibam  ${parameters.sampleName}.sorted.bam > ${parameters.sampleName}.table_cov.txt`;
    console.log('## Depth table creation ##');
    console.log(bedtoolsCall);
    execShellCommand(bedtoolsCall)
        .then(resolve=>{
            console.log(resolve);
            console.log(`Depth table created...\n\n`);
            callBEDtools2(parameters);
        })
}

const callBEDtools2 = parameters =>{
    bedtoolsCall2 = `bedtools genomecov -d -ibam  ${parameters.sampleName}.sorted.bam > ${parameters.sampleName}.table_cov.sitewise.txt`;
    console.log('## Sitewise depth table creation ##');
    console.log(bedtoolsCall2);
    execShellCommand(bedtoolsCall2)
        .then(resolve=>{
            console.log(resolve);
            console.log(`Sitewise depth table created...\n\n`);
            filterDepthTable(parameters);
        })
}


const filterDepthTable = parameters =>{
    filterCall = `awk  '$4 < '${parameters.minimumDepth}'' ${parameters.sampleName}.table_cov.txt > ${parameters.sampleName}.table_cov.filtered-${parameters.minimumDepth}x.txt`;
    console.log('## Depth table filtering ##');
    console.log(filterCall);
    execShellCommand(filterCall)
        .then(resolve=>{
            console.log(resolve);
            console.log(`Depth table filtered...\n\n`);
            maskConsensus(parameters);
        })
}

const maskConsensus = parameters =>{
    maskCall = `bedtools maskfasta -fi  ${parameters.sampleName}.preconsensus.fasta -fo ${parameters.sampleName}.consensus.fa -bed ${parameters.sampleName}.table_cov.filtered-${parameters.minimumDepth}x.txt`;
    console.log('## Consensus masking ##');
    console.log(maskCall);
    execShellCommand(maskCall)
        .then(resolve=>{
            console.log(resolve);
            console.log(`Consensus sequence was properly masked.\n\n`);
            calculateAssemblyStats(parameters);
        })
}



// Call important functions.
const parameters = processInput();
launchAnalysis(parameters);
