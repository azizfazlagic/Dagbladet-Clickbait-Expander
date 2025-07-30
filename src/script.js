let isThrottled = false;

document.addEventListener("scroll", function() {
    if (!isThrottled) {
        isThrottled = true;
        setTimeout(() => {
            script();
            isThrottled = false;
        }, 500); 
    }
});

function script() {
    let elements = document.querySelectorAll("a");

    elements.forEach(current_element => {
        let url = current_element.href;
        if (!url.startsWith("https://www.dagbladet.no/")) {
            return;
        }

        let current_headline = current_element.querySelector(".headline");
        if (current_headline && isEligibleHeadline(current_headline)) {
            fetchAndUpdate(current_element, current_headline);
        }
    });
}


function isEligibleHeadline(headline) {
    let text = headline.innerText;
    return text.split(" ").length <= 4 && text.length < 50;
}

function fetchAndUpdate(element, headline) {
    fetch(element.href)
        .then(response => response.text())
        .then(htmlString => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlString, "text/html");
            const newTitle = doc.querySelector(".subtitle") ? doc.querySelector(".subtitle").innerText : null;
            const newSecondaryTitle = doc.querySelector("p") ? doc.querySelector("p").innerText : null;

            if (newTitle || newSecondaryTitle) {
                headline.outerHTML = "<h3>" + (newTitle || newSecondaryTitle) + "</h3>";
            } else {
                console.log("Removing element due to empty titles: " + headline.innerText);
                element.remove();
            }
        })
        .catch(error => {
            console.error("Error fetching article: ", error);
            element.remove();
        });
}
