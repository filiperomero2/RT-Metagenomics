# RT-META: Real Time Metagenomic Analysis

## Introduction
The development of Oxford Nanopore Technologies offers unprecedented opportunities for conducting fast identification of pathogens accross several epidemiological settings by metagenomic sequencing. As bases may be called at time of sequencing, it is possible to perform taxonomic assignment of sequencing reads in real time. Nevertheless, popular tools used for metagenomic analysis are not designed to take full advantage of this amazing feature. In this sense, we developed RT-META, a pipeline that performs metagenomic analysis in real time and display results in a interactive, useful manner. 

RT-META is entirely written as a collection of Node scripts that processes data, organizing downstream analysis using standard metagenomic analysis tools. Briefly, the script iteratively scans the basecalled directory, performing demultiplexation of sequencing reads. Taxonomic assignment with kraken2 is then performed for each sample and Krona is used to generate iteractive taxonomic profile plots. These visualizations are integrated in a single page, allowing extremely fast pathogen identification. 

## Installation
RT-Meta recquires a handful of dependencies which are conveniently available in conda repositories. To install the entire environment, simply download the rt-meta:

    git clone https://github.com/filiperomero2/RT-Metagenomics
    
To create the conda environment with all dependencies:

    cd RT-Metagenomics    
    conda env create -f rt-meta.yml -y
    conda activate rt-meta
    npm i
    conda deactivate

Always activate the conda environment before running the pipeline or working on configs:

    conda activate rt-meta

## Database configuration

As RT-META uses kraken2 to perform taxonomic assignments and krona to create interactive visualizations, it is necessary to download and configure their respective databases. Users are encouraged to install DBs in different directories under /home/. To install minikraken2 database, execute:

    mkdir ~/kraken-db; cd ~/kraken-db
    wget ftp://ftp.ccb.jhu.edu/pub/data/kraken2_dbs/old/minikraken2_v2_8GB_201904.tgz
    tar -xzvf minikraken2_v2_8GB_201904.tgz
    cd

Notice that one might also want to build custom database. To do that, please refer to the official <a href="https://github.com/DerrickWood/kraken2/wiki/Manual">kraken2 docs</a>. Beaware of the memory demands associated with these databases. 

In regards of krona, a standard outdated DB is installed in the conda environment directory. To make updates easier, we encourage its exclusion, followed by the creation of a symbolically linked DB elsewhere. To do so, execute:

    rm -rf /home/host_name/miniconda3/envs/RT-Metagenomics/opt/krona/taxonomy
    mkdir -p ~/krona/taxonomy
    ln -s ~/krona/taxonomy /home/host_name/miniconda3/envs/RT-Metagenomics/opt/krona/taxonomy
    ktUpdateTaxonomy.sh ~/krona/taxonomy

## Usage
The pipeline is currently under development process. It is executed as a single node script (index.js) that requires few arguments, as:

    --mode: either postrun or realtime;
    --input: the absolute path for the root of libraries directory;
    --output: the absolute path for the output directory;
    --kraken2-database: the absolute path for the kraken2 database directory;
    --krona-database: the absolute path for the krona taxonomic database directory;
    --nodemux: if declared no sample demultiplexing will be performed (boolean);
    --guppy: the absolute path for guppy binaries;
    --barcode-kit: barcode kit used to prepare libraries. Consult guppy_barcoder docs. 
    --threads: the number of processing threads (Optional);
    --help: display help message;
    --version: display software version.

Users are encouraged to always provide absolute paths. The directory in --input is usually the ´fastq_pass/´ created by basecallers.


### Examples

Basic usage after sequencing run:

     node scripts/index.js --mode postrun --input /mnt/c/Users/filip/OneDrive/Desktop/RT-Metagenomics/test_data/ --output /mnt/c/Users/filip/OneDrive/Desktop/RT-Metagenomics/output/ --kraken2-db ~/kraken-db/minikraken2_v2_8GB_201904_UPDATE/ --krona-db ~/krona/taxonomy/ --guppy ~/ont-guppy-cpu/bin/ --barcode-kit "EXP-NBD104 EXP-NBD114" --threads 8 

Basic usage for real time analysis:

     node scripts/index.js --mode realtime --input /mnt/c/Users/filip/OneDrive/Desktop/RT-Metagenomics/test_data/ --output /mnt/c/Users/filip/OneDrive/Desktop/RT-Metagenomics/output/ --kraken2-db ~/kraken-db/minikraken2_v2_8GB_201904_UPDATE/ --krona-db ~/krona/taxonomy/ --guppy ~/ont-guppy-cpu/bin/ --barcode-kit "EXP-NBD104 EXP-NBD114" --threads 8

If no multiplexing scheme was used, use the --nodemux flag (--guppy and --barcode-kit arguments are not required):

    node scripts/index.js --mode postrun --input /mnt/c/Users/filip/OneDrive/Desktop/RT-Metagenomics/test_data/ --output /mnt/c/Users/filip/OneDrive/Desktop/RT-Metagenomics/output/ --kraken2-db ~/kraken-db/minikraken2_v2_8GB_201904_UPDATE/ --krona-db ~/krona/taxonomy/ --threads 8 --nodemux

## Citation

A scientific publication fully describing this pipeline is being prepared. Meanwhile, feel free to cite it directly to this GitHub repo. You should also cite:

<a href="https://doi.org/10.1186/s13059-019-1891-0">kraken2</a> - Wood, D.E., Lu, J. & Langmead, B. Improved metagenomic analysis with Kraken 2. Genome Biol 20, 257 (2019). 

<a href="https://doi.org/10.1186/1471-2105-12-385">krona</a> - Ondov, B.D., Bergman, N.H. & Phillippy, A.M. Interactive metagenomic visualization in a Web browser. BMC Bioinformatics 12, 385 (2011). 