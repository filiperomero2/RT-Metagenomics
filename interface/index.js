// Activate cards showing metagenomic results for each sample
const samples = document.querySelectorAll(".sample-button");
samples.forEach(sample=>{
    sample.addEventListener("click",event=>{
        parent = sample.parentElement;
        const sampleFile = event.currentTarget.value;
        const sampleName = event.currentTarget.textContent;
        console.log(sampleFile);
        console.log(sampleName);
        if(parent.querySelectorAll(".active-button").length > 0){
            parent.removeChild(parent.querySelector(".active-button"));
            return
        }
        //parent.insertAdjacentHTML("beforeend",`<p class =\"active-button\" id=card><iframe src=\"${sampleFile}\" width=\"1000px\" height=\"500\" title=\"${sampleName}\"></iframe></p>`);
        parent.insertAdjacentHTML("beforeend",`<p class =\"active-button\" id=card><iframe class=\"iframes\" src=\"${sampleFile}\" width=\"1000px\" height=\"500\" title=\"${sampleName}\"></iframe></p>`);
    })
})

// Clear results section
document.documentElement.addEventListener("keyup",event=>{
    if(event.key === "Escape"){
        const elements = document.querySelectorAll(".active-button");
        console.log(elements);
        elements.forEach(element =>{
            element.remove();
        })
    }
})


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



/**
 * The code bellow has not been tested
 * neither the iframes class. Must check it.
 */

// Declare function to reload iframes
const reloadIframes = () =>{
    // suppose class name is a thing
    const iframes = document.querySelectorAll(".iframes");
    iframes.forEach(iframe=>{
        // check if the following will work
        iframe.location.reload();
    })
}

// Reload iframes every minute
setTimeout(reloadIframes(),60*1000);
