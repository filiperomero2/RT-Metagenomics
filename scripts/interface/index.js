// Get all samples buttons
const samples = document.querySelectorAll(".sample-button");


// For each sample add a click event listener
// When clicked, the displayCard function will
// either display a card or hide it (if already)
// active
samples.forEach(sample=>{
    sample.addEventListener("click",event=>{
        displayCard(sample);
    })
})


// Add a keyup event listener that will show or
// hide all cards instantaneously.
document.documentElement.addEventListener("keyup",event=>{
    if(event.key === "Escape"){
        const elements = document.querySelectorAll(".active-button");
        if(elements.length===0){
            samples.forEach(sample=>{
                displayCard(sample);
            })
        }else{
            elements.forEach(element =>{
                element.remove();
            })
        }
        
    }
})


// Activate cards showing metagenomic results
// for a given sample.
const displayCard = (sample) =>{
    parent = sample.parentElement;
    const sampleName = sample.textContent;
    const sampleFile = sample.value;
    if(parent.querySelectorAll(".active-button").length > 0){
        parent.removeChild(parent.querySelector(".active-button"));
        return
    }
    parent.insertAdjacentHTML("beforeend",`<p class =\"active-button\" id=card><iframe class=\"iframes\" src=\"${sampleFile}\" width=\"1000px\" height=\"500\" title=\"${sampleName}\"></iframe></p>`);
}


// Refresh cards of already activated samples
const refreshCard = (sample) =>{
    parent = sample.parentElement;
    const sampleName = sample.textContent;
    const sampleFile = sample.value;
    parent.removeChild(parent.querySelector(".active-button"));
    parent.insertAdjacentHTML("beforeend",`<p class =\"active-button\" id=card><iframe class=\"iframes\" src=\"${sampleFile}\" width=\"1000px\" height=\"500\" title=\"${sampleName}\"></iframe></p>`);
}


// Establishes an interval over which cards
// will be reloaded. Only works with realtime mode
const reloadableSamples = document.querySelectorAll(".reloadable");
setInterval(()=>{
    reloadableSamples.forEach(sample=>{
        const parent = sample.parentElement;
        if(parent.querySelectorAll(".active-button").length > 0){
            refreshCard(sample)        
        }
    })
},120000)


// Organize HTML hardcoded sessions

// Exhibit results
document.querySelector("#results-button").addEventListener("click",event=>{
    document.querySelector("#citation").style.setProperty("display","none");
    document.querySelector("#contact").style.setProperty("display","none");
    document.querySelector("#results").style.setProperty("display","inline");
})


// Exhibit citation
document.querySelector("#citation-button").addEventListener("click",event=>{
    document.querySelector("#results").style.setProperty("display","none");
    document.querySelector("#contact").style.setProperty("display","none");
    document.querySelector("#citation").style.setProperty("display","inline");
})


// Exhibit contact
document.querySelector("#contact-button").addEventListener("click",event=>{
    document.querySelector("#results").style.setProperty("display","none");
    document.querySelector("#citation").style.setProperty("display","none");
    document.querySelector("#contact").style.setProperty("display","inline");
})


