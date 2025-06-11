export default function AboutPage() {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-65px)] p-8 bg-gradient-to-b from-background to-content1 ">
      <div className="max-w-4xl mx-auto bg-content1 shadow-lg rounded-lg p-8 space-y-6">
        <h1 className="text-4xl font-extrabold text-primary-500 text-center">
          About RT-Metagenomics
        </h1>
        <p className="text-lg leading-relaxed text-content1-foreground">
          The development of Oxford Nanopore Technologies offers unprecedented
          opportunities for conducting fast identification of pathogens across
          several epidemiological settings by metagenomic sequencing. As bases
          may be called at the time of sequencing, it is possible to perform
          taxonomic assignment of sequencing reads in real time. Nevertheless,
          popular tools used for metagenomic analysis are not designed to take
          full advantage of this amazing feature. In this sense, we developed{" "}
          <span className="font-bold text-primary-600">RT-Meta</span>, a
          pipeline that performs metagenomic analysis in real time and displays
          results in an interactive manner.
        </p>
        <h2 className="text-2xl font-bold text-primary-500">Key Features</h2>
        <ul className="list-disc list-inside space-y-2 text-content1-foreground">
          <li>Real-time data processing</li>
          <li>Comprehensive taxonomic analysis</li>
          <li>Integration with popular tools like Kraken2</li>
          <li>Support for viral and microbial datasets</li>
          <li>Interactive visualization of results</li>
        </ul>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-primary-500">Contact Us</h2>
          <p className="text-content1-foreground">
            For more information, visit our{" "}
            <a
              href="https://github.com/filiperomero2/RT-Metagenomics"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 underline"
            >
              GitHub repository
            </a>{" "}
            or reach out to us at{" "}
            <a
              href="mailto:filiperomero2@gmail.com"
              className="text-primary-600 underline"
            >
              filiperomero2@gmail.com
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
