import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="flex h-[calc(100%)] flex-col items-center justify-center p-8">
      <div className="bg-surface ring-accent/40 mx-auto max-w-4xl space-y-6 rounded-lg p-8 shadow-lg ring">
        <h1 className="text-accent text-center text-4xl font-extrabold">
          About RT-Metagenomics
        </h1>
        <p className="text-surface-foreground text-lg leading-relaxed">
          The development of Oxford Nanopore Technologies offers unprecedented
          opportunities for conducting fast identification of pathogens across
          several epidemiological settings by metagenomic sequencing. As bases
          may be called at the time of sequencing, it is possible to perform
          taxonomic assignment of sequencing reads in real time. Nevertheless,
          popular tools used for metagenomic analysis are not designed to take
          full advantage of this amazing feature. In this sense, we developed{" "}
          <span className="text-accent font-bold">RT-Meta</span>, a pipeline
          that performs metagenomic analysis in real time and displays results
          in an interactive manner.
        </p>
        <h2 className="text-accent text-2xl font-bold">Key Features</h2>
        <ul className="text-surface-foreground list-inside list-disc space-y-2">
          <li>Real-time data processing</li>
          <li>Comprehensive taxonomic analysis</li>
          <li>Integration with popular tools like Kraken2</li>
          <li>Support for viral and microbial datasets</li>
          <li>Interactive visualization of results</li>
        </ul>
        <div className="text-center">
          <h2 className="text-accent text-2xl font-bold">Contact Us</h2>
          <p className="text-surface-foreground">
            For more information, visit our{" "}
            <a
              href="https://github.com/filiperomero2/RT-Metagenomics"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline"
            >
              GitHub repository
            </a>{" "}
            or reach out to us at{" "}
            <a
              href="mailto:filiperomero2@gmail.com"
              className="text-accent-600 underline"
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
