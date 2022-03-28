// Prototyping, nothing to see here...
minimapCall = `minimap2 -a -x map-ont -t ${threads} ${referenceSequence} ${inputFile} | samtools view -bS -F 4 - | samtools sort -o ${inputFile}.sorted.bam -`;
samtoolsIndexCall = `samtools index ${inputFile}.sorted.bam`;
medakaConsensusCall = `medaka consensus --model ${medakaModel} --threads 1 ${inputFile}.sorted.bam ${inputFile}.hdf`;
medakaVariantCall = `medaka variant ${referenceSequence} ${inputFile}.hdf ${inputFile}.vcf`;
medakaAnnotateCall = `medaka tools annotate  ${inputFile}.vcf ${referenceSequence} ${inputFile}.sorted.bam ${inputFile}.medaka-annotated.vcf`;
formatVCFCall = `bgzip -f ${inputFile}.vcf`;
indexVCFCall = `tabix -p vcf ${inputFile}.vcf.gz`;
bcftoolsCall = `bcftools consensus -f ${referenceSequence} ${inputFile}.vcf.gz  -o ${inputFile}.preconsensus.fasta`
// insert bedtools stuff here and test 
// add command line args engine and workflow
// Filter variants?
