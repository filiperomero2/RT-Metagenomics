#!/usr/bin/env Rscript


library(ggplot2)

myargs = commandArgs(trailingOnly=TRUE)

sample_name <- myargs[1]
sample_name_2 <- unlist(strsplit(x = sample_name,split = "/"))
sample_name_2 <- sample_name_2[length(sample_name_2)]

threshold <- as.numeric(myargs[2])

input_file_name <- paste(sample_name,".table_cov.sitewise.txt",sep="")
output_file_name <- paste(sample_name,".sequencing_depth_plot.pdf",sep="")
title_text <- paste("Sequencing depth across genome - ",sample_name_2,sep="")

df <- read.table(file = input_file_name,
                 header=F)

names(df) <- c("Reference",
               "Genome",
               "Depth")

p<-ggplot(data=df, aes(x=Genome, y=Depth)) +
  geom_bar(stat="identity") +
  geom_hline(yintercept=threshold, linetype="dashed", color = "red") +
  theme_minimal() +
  labs(title = title_text) + 
  theme(plot.title = element_text(hjust = 0.5))


pdf(file = output_file_name)
p
dev.off()

