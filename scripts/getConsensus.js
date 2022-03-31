const {exec} = require('child_process');
const helpers = require('./helpers.js')

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
        "referenceSequence": argv.reference,
        "medakaModel": argv['medaka-model'],
        "minimumDepth": argv['minimum-depth'],
        "threads": argv.threads,
    }
    validateParameters(parameters);
    return parameters;
}

// args evaluation - organize helpers before further editing here
const validateParameters = parameters =>{

}

// Main async control function
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

// The main functions begin here //

// Prototyping, nothing to see here...
const launchAnalysis = parameters =>{
    minimapCall = `minimap2 -a -x map-ont -t ${parameters.threads} ${parameters.referenceSequence} ${parameters.inputFile} | samtools view -bS -F 4 - | samtools sort -o ${parameters.inputFile}.sorted.bam -`;
    console.log(minimapCall);
    execShellCommand(minimapCall)
        .then(resolve=>{
            console.log(resolve);
            console.log(`Mapping executed...\n\n`)
            index(parameters)
        })
}

const index = parameters =>{
    samtoolsIndexCall = `samtools index ${parameters.inputFile}.sorted.bam`;
    console.log(samtoolsIndexCall);
    execShellCommand(samtoolsIndexCall)
        .then(resolve=>{
            console.log(resolve);
            console.log(`Indexing executed...\n\n`)
            medakaConsensus(parameters);
        })
}

const medakaConsensus = parameters =>{
    medakaConsensusCall = `medaka consensus --model ${parameters.medakaModel} --threads 1 ${parameters.inputFile}.sorted.bam ${parameters.inputFile}.hdf`;
    console.log(medakaConsensusCall);
    execShellCommand(medakaConsensusCall)
        .then(resolve=>{
            console.log(resolve);
            console.log(`medaka consensus executed...\n\n`)
            callVariants(parameters);
        })
}

const callVariants = parameters =>{
    medakaVariantCall = `medaka variant ${parameters.referenceSequence} ${parameters.inputFile}.hdf ${parameters.inputFile}.vcf`;
    console.log(medakaVariantCall);
    execShellCommand(medakaVariantCall)
        .then(resolve=>{
            console.log(resolve);
            console.log(`variant calling executed...\n\n`)
            annotate(parameters);
        })
}


const annotate = parameters =>{
    medakaAnnotateCall = `medaka tools annotate  ${parameters.inputFile}.vcf ${parameters.referenceSequence} ${parameters.inputFile}.sorted.bam ${parameters.inputFile}.medaka-annotated.vcf`;
    console.log(medakaAnnotateCall);
    execShellCommand(medakaAnnotateCall)
        .then(resolve=>{
            console.log(resolve);
            console.log(`medaka annotate executed...\n\n`)
            formatVCF(parameters);
        })
}


formatVCF = parameters =>{
    formatVCFCall = `bgzip -f ${parameters.inputFile}.vcf`;
    console.log(formatVCFCall);
    execShellCommand(formatVCFCall)
        .then(resolve=>{
            console.log(resolve);
            console.log(`VCF formated...\n\n`)
            indexVCF(parameters);
        })
}

indexVCF = parameters =>{
    indexVCFCall = `tabix -p vcf ${parameters.inputFile}.vcf.gz`;
    console.log(indexVCFCall);
    execShellCommand(indexVCFCall)
        .then(resolve=>{
            console.log(resolve);
            console.log(`VCF indexed...\n\n`);
            callBCFtools(parameters);
        })
}

callBCFtools = parameters =>{
    bcftoolsCall = `bcftools consensus -f ${parameters.referenceSequence} ${parameters.inputFile}.vcf.gz  -o ${parameters.inputFile}.preconsensus.fasta`
    console.log(bcftoolsCall);
    execShellCommand(bcftoolsCall)
        .then(resolve=>{
            console.log(resolve);
            console.log(`VCF indexed...\n\n`);
            callBEDtools(parameters);
        })
}

callBEDtools = parameters =>{
    bedtoolsCall = `bedtools genomecov -bga -ibam  ${parameters.inputFile}.sorted.bam > ${parameters.inputFile}.table_cov.txt`;
    console.log(bedtoolsCall);
    execShellCommand(bedtoolsCall)
        .then(resolve=>{
            console.log(resolve);
            console.log(`Depth table created...\n\n`);
            filterDepthTable(parameters);
        })
}


filterDepthTable = parameters =>{
    filterCall = `awk  '$4 < '${parameters.minimumDepth}'' ${parameters.inputFile}.table_cov.txt > ${parameters.inputFile}.table_cov.filtered-${parameters.minimumDepth}x.txt`;
    console.log(filterCall);
    execShellCommand(filterCall)
        .then(resolve=>{
            console.log(resolve);
            console.log(`Depth table filtered...\n\n`);
            maskConsensus(parameters);
        })
}

maskConsensus = parameters =>{
    maskCall = `bedtools maskfasta -fi  ${parameters.inputFile}.preconsensus.fasta -fo ${parameters.inputFile}.consensus.fa -bed ${parameters.inputFile}.table_cov.filtered-${parameters.minimumDepth}x.txt`;
    console.log(maskCall);
    execShellCommand(maskCall)
        .then(resolve=>{
            console.log(resolve);
            console.log(`Consensus sequence was properly masked...\n\n`);
        })
}


// Call important functions.
const parameters = processInput();
launchAnalysis(parameters);



// add command line args engine and workflow
// Filter variants?