# RT-META: Real Time Metagenomic Analysis

## Status
Application still on the early stage of development. It works as an async app for characterizing metagenomes after sequencing run. 
To do:
    - Further develop async app;
    - Better develop frontend (maybe with React).

## Introduction
The development of Oxford Nanopore Technologies offers unprecedented opportunities for conducting fast identification of pathogens accross several epidemiological settings by metagenomic sequencing. As bases may be called at time of sequencing, it is theoretically possible to perform taxonomic assignment of sequencing reads in real time. Nevertheless, popular tools used for metagenomic analysis are not designed to take full advantage of this amazing feature. In this sense, we developed RT-META, a pipeline that performs metagenomic analysis in real time and display results in a interactive, usefull manner. 

RT-META is entirely written as a collection of Node scripts that processes data, organizing downstream analysis using standard metagenomic analysis tools. Briefily, the script iteratively scans the basecalled directory, and moves data to a safe temporary directory. Taxonomic assignment with kraken2 is then performed for each sample and results are continually stored. Krona is used to generate iteractive taxonomic profile plots. These visualizations are integrated in a single page, allowing extremely fast pathogen identification. 

## Installation
RT-Meta recquires a handful of dependencies which are conviniently available in conda repositories. To install the entire environment, simply download the rt-meta.yml file and execute:

    conda env create -f rt-meta.yml

To download the script and other necessary assets to execute the pipeline, execute:

    git clone https://github.com/filiperomero2/RT-Metagenomics

Always activate the conda environment before running the pipeline:

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
The pipeline is currently under development process. So far, it is executed as a single node script (index.js) that recquires few positional arguments, as:

    (1) Analysis mode: either --postrun or --realtime;
    (2) the absolute path for the root of libraries directory;
    (3) the absolute path for the output directory;
    (4) the absolute path for the kraken2 database directory;
    (5) the absolute path for the krona taxonomic database directory;
    (6) the number of processing threads (Optional)

Please notice that the --realtime mode is still unavailable. Users are encourage to always provide absolute paths.

### Examples

Basic usage:

    node index.js --postrun /home/Projects/RT-Metagenomics/data/ /home/Projects/RT-Metagenomics/output /home/kraken-db/minikraken2_v2_8GB_201904_UPDATE/ /home/krona-db/taxonomy/ 6

## Citation

A scientific publication fully describing this pipeline is being prepared. Meanwhile, feel free to cite it directly to this GitHub repo. You should also cite:

<a href="https://doi.org/10.1186/s13059-019-1891-0">kraken2</a> - Wood, D.E., Lu, J. & Langmead, B. Improved metagenomic analysis with Kraken 2. Genome Biol 20, 257 (2019). 

<a href="https://doi.org/10.1186/1471-2105-12-385">krona</a> - Ondov, B.D., Bergman, N.H. & Phillippy, A.M. Interactive metagenomic visualization in a Web browser. BMC Bioinformatics 12, 385 (2011). 