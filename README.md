# RT-META: Real Time Metagenomic Analysis

## Status
Application still on the early stage of development. It works as an async app for characterizing metagenomes after sequencing run. 
To do: 
    - fix hardcoded paths;
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

As RT-META uses kraken2 to perform taxonomic assignments and krona to create interactive visualizations, it is necessary to download and configure their respective databases. Users are encouraged to install DBs in different directories under /home/. To install kraken2 db, execute:

    mkdir ~/kraken-db; cd ~/kraken-db
    wget ftp://ftp.ccb.jhu.edu/pub/data/kraken2_dbs/old/minikraken2_v2_8GB_201904.tgz
    tar -xzvf minikraken2_v2_8GB_201904.tgz
    cd

In regards of krona, a standard outdated DB is installed in the conda environment directory. To make updates easier, we encourage its exclusion, followed by the creation of a symbolically linked DB elsewhere. To do so, execute:

    rm -rf /home/host_name/miniconda3/envs/RT-Metagenomics/opt/krona/taxonomy
    mkdir -p ~/krona/taxonomy
    ln -s ~/krona/taxonomy /home/host_name/miniconda3/envs/RT-Metagenomics/opt/krona/taxonomy
    ktUpdateTaxonomy.sh ~/krona/taxonomy

## Usage
The pipeline is currently under development process. So far, it is executed as a single node script that recquires a few arguments. *Future docs here*.

## Examples
*Future examples here*