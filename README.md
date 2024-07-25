# RT-MetA: Real Time Metagenomic Analysis

## Introduction
The development of Oxford Nanopore Technologies offers unprecedented opportunities for conducting fast identification of pathogens accross several epidemiological settings by metagenomic sequencing. As bases may be called at time of sequencing, it is possible to perform taxonomic assignment of sequencing reads in real time. Nevertheless, popular tools used for metagenomic analysis are not designed to take full advantage of this amazing feature. In this sense, we developed RT-MetA, a pipeline that performs metagenomic analysis in real time and display results in a interactive manner. 

RT-MetA is entirely written as a collection of Node scripts that processes data, organizing downstream analysis using standard metagenomic analysis tools. Briefly, the script iteratively scans the basecalled directory, performing demultiplexation of sequencing reads. Taxonomic assignment with kraken2 is then performed for each sample and Krona is used to generate iteractive taxonomic profile plots. These visualizations are integrated in a single page, allowing extremely fast pathogen identification. 

### Warning
This app is a prototype still under development. 

## Installation
RT-MetA recquires a handful of dependencies which are conveniently available in conda repositories. To install the entire environment, simply download the repository:

    git clone https://github.com/filiperomero2/RT-Metagenomics
    
The following lines create the conda environment with all dependencies:

    cd RT-Metagenomics    
    conda env create -f rt-meta.yml
    conda activate rt-meta
    npm i
    conda deactivate

Always activate the conda environment before running the pipeline or working on configs:

    conda activate rt-meta

This pipeline has been developed and validated using the following dependencies versions:

* kraken2 v2.1.2
* krona v2.8.1
* guppy v6.0.6+8a98bbc

## Database configuration

As RT-MetA uses kraken2 to perform taxonomic assignments and krona to create interactive visualizations, it is necessary to download and configure their respective databases. Users are encouraged to install these databases in different directories. 

Kraken2 databases are available <a href="https://benlangmead.github.io/aws-indexes/k2">here</a>. For instance, to install the viral database one can execute:

    mkdir ~/kraken-db;
    cd ~/kraken-db
    wget https://genome-idx.s3.amazonaws.com/kraken/k2_viral_20221209.tar.gz
    tar -xzvf k2_viral_20221209.tar.gz
    cd

Notice that one might also want to build custom database. To do that, please refer to the official <a href="https://github.com/DerrickWood/kraken2/wiki/Manual">kraken2 docs</a>. Beaware of the memory demands associated with databases. 

In regards of krona, a standard outdated DB is installed in the conda environment directory. To make updates easier, we encourage its exclusion, followed by the creation of a symbolically linked DB elsewhere. To do so, execute:

    rm -rf /home/host_name/miniconda3/envs/RT-Metagenomics/opt/krona/taxonomy
    mkdir -p ~/krona/taxonomy
    ln -s ~/krona/taxonomy /home/host_name/miniconda3/envs/RT-Metagenomics/opt/krona/taxonomy
    ktUpdateTaxonomy.sh ~/krona/taxonomy

## Usage
The pipeline is currently under development process. It is executed as a single node script (rtmeta.js) that requires some arguments, as:

    --mode: either postrun or realtime;
    --input: the absolute path for the fastq_pass/ directory;
    --output: the absolute path for the output directory;
    --kraken2-database: the absolute path for the kraken2 database directory;
    --krona-database: the absolute path for the krona taxonomic database directory;
    --demux: demultiplexing options: true, false or pre;
    --remove-human-reads: exclude human reads from krona plots (boolean);
    --remove-unknown-reads: exclude unknown reads from krona plots (boolean);
    --samplesheet: the absolute path for a csv file with sample names and barcode numbers;
    --guppy: the absolute path for guppy_barcoder binary;
    --barcode-kit: barcode kit used to prepare libraries (example: "EXP-NBD104");
    --threads: the number of processing threads (Optional, default 1);
    --port: port for the local server used in realtime mode (default: 8001);

Users are encouraged to always provide absolute paths. The directory in --input is usually the ´fastq_pass/´ created by guppy_basecaller.


### Examples

Basic usage after sequencing run:

     node ~/RT-Metagenomics/scripts/rtmeta.js --mode postrun --input ~/RT-Metagenomics/test_data/ --output ~/rt-meta_test_output/ --kraken2-db ~/kraken-db/viral/ --krona-db ~/krona/taxonomy/ --samplesheet ~/RT-Metagenomics/scripts/test.csv  --guppy ~/ont-guppy-cpu/bin/guppy_barcoder --barcode-kit "EXP-NBD104 EXP-NBD114" --threads 8 --demux true

Basic usage for real time analysis:

     node ~/RT-Metagenomics/scripts/rtmeta.js --mode realtime --input ~/RT-Metagenomics/test_data/ --output ~/rt-meta_test_output/ --kraken2-db ~/kraken-db/viral/ --krona-db ~/krona/taxonomy/ --samplesheet ~/RT-Metagenomics/scripts/test.csv  --guppy ~/ont-guppy-cpu/bin/guppy_barcoder --barcode-kit "EXP-NBD104 EXP-NBD114" --threads 8 --port 9004 --demux true

If no multiplexing scheme was used, use the '--demux false'  (--guppy,--samplesheet and --barcode-kit arguments are not required):

    node ~/RT-Metagenomics/scripts/rtmeta.js --mode postrun --input ~/RT-Metagenomics/test_data/ --output ~/rt-meta_test_output/ --kraken2-db ~/kraken-db/viral/ --krona-db ~/krona/taxonomy/ --threads 8 --demux false
    

If you want the krona plots to include only microorganism reads:

    node ~/RT-Metagenomics/scripts/rtmeta.js --mode realtime --input ~/RT-Metagenomics/test_data/ --output ~/rt-meta_test_output/ --kraken2-db ~/kraken-db/viral/ --krona-db ~/krona/taxonomy/ --samplesheet ~/RT-Metagenomics/scripts/test.csv  --guppy ~/ont-guppy-cpu/bin/guppy_barcoder --barcode-kit "EXP-NBD104 EXP-NBD114" --threads 8 --port 9004 --demux true --remove-human-reads --remove-unknown-reads
 

## Consensus engine

RT-MetA also includes a script for consensus sequence inference. The dependencies of this module are included in a separate conda environment. To install them, use the following line within the repository: 
   
    conda env create -f rt-meta-consensus.yml

Briefly, this the pipeline uses minimap2 to map all reads against a reference genome sequence (in fasta format). Afterwards, the medaka pipeline is used to perform variant calling, and bcftools and bedtools are used to generate a consensus sequence. The code also generates a table with sequencing statistics (number of reads, average depth, and coverage at 10,100 and 1000x depth) and a genome coverage plot. 

To run this reference assembly pipeline, arguments are required:
 
    --input: absolute path for sample fastq file;
    --output: absolute path for output directory;
    --sample-name: sample name string, used as prefix in output files;
    --reference: absolute path for reference fasta file;
    --medaka-model: model file for medaka pipeline (default: r941_min_fast_g303). If unsure, check medaka docs.
    --minimum-depth: minimum sequencing depth threshold used to mask consensus sequences (default: 20)
    --threads: number of processing threads;
    
### Example usage:

    node ~/RT-Metagenomics/scripts/getConsensus.js --input ~/sequencing_run_1/BC01/BC01.fastq --output ~/sequencing_run_1_BC01_consensus/ --sample-name BC01 --reference ~/reference_genomes/target.fasta --minimum-depth 50 --threads 4


## Citation

A scientific publication fully describing this pipeline is being prepared. Meanwhile, feel free to cite it directly to this GitHub repo. You should also appropriatelly cite the dependencies used, for example:

<a href="https://doi.org/10.1186/s13059-019-1891-0">kraken2</a> - Wood, D.E., Lu, J. & Langmead, B. Improved metagenomic analysis with Kraken 2. Genome Biol 20, 257 (2019). 

<a href="https://doi.org/10.1186/1471-2105-12-385">krona</a> - Ondov, B.D., Bergman, N.H. & Phillippy, A.M. Interactive metagenomic visualization in a Web browser. BMC Bioinformatics 12, 385 (2011). 
