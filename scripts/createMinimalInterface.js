// Load fs module
const fs = require('fs');

// Hardcoded html parts in strings
const firstPart = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Metagenomics App</title>
    <link rel="stylesheet" href="reset.css">
    <link rel="stylesheet" href="style.css">
    <link href="https://fonts.googleapis.com/css?family=Montserrat&display=swap" rel="stylesheet">
</head>
<body>
    <header>
        <div class="box">
            <h1>RT-META</h1>
            <nav>
                <ul>
                    <li><button id="results-button">Results</button></li>
                    <li><button id="citation-button">Citation</button></li>
                    <li><button id="contact-button">Contact</button></li>
                </ul>
            </nav>
        </div>
    </header>
    <main class="main">
        <div id="results">
            <h2 class="main-title">Results</h2>
            <ul class="sample-list">`;

const secondPart = `</ul>
</div>
<div id="citation">
    <h2 class="main-title">Citation</h2>
    <p style="text-align: center;">This app is an open source contribution intended at facilitating analysis of metagenomic data. It may be directly cited through the Github repo link.</p> 
</div>
<div id="contact">
    <h2 class="main-title">Filipe Moreira</h2>
    <p style="text-align: center;"> You can find me on <a href="https://twitter.com/filiperomero2">Twitter</a> and <a href="https:github.com/filiperomero2">GitHub</a>.</p> 
</div>
</main>
<footer>
<img class = "phyloimg-tail" src="cadde_logo.jpg">
<p class="copyright">&copy; Copyright - 2022</p>
</footer>
<script src="index.js"></script>
</body>
</html>`;

// Function that creates the unified HTML file with all krona plots.
// It uses the pieces array to parse paths properly.
const createMinimalInterface = async (HTMLFiles,parameters) =>{
    const interface = parameters.interface;
    let content = firstPart;
    let counter = 0;
    HTMLFiles.forEach(file =>{
        const pieces = file.split('/');
        const filePath = 'results/'+ pieces[pieces.length-2] + "/" + pieces[pieces.length-1];
        const sampleName = `${parameters.samples.names[counter]} - ${parameters.samples.barcodes[counter]} - ${parameters.samples.numberOfSequences[counter]} reads`;
        counter++; 
        if(parameters.mode === "postrun" || parameters.mode === "pr"){
            content += `\n<li><button class="sample-button" value="${filePath}">${sampleName}</button></li>\n`;
        }else if(parameters.mode === "realtime" || parameters.mode === "rt"){
            content += `\n<li><button class="sample-button reloadable" value="${filePath}">${sampleName}</button></li>\n`;
        }
    })
    content += secondPart;
    const HTMLFilePath = `${interface}index.html`;
    fs.writeFileSync(HTMLFilePath, content);
    console.log(`\n\n\n\nHTML file saved on ${HTMLFilePath} \n\nIf in realtime mode, access localhost:${parameters.port}\n\n`);
}

module.exports = createMinimalInterface;
