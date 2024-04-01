let isThrottled: boolean = false;
let extensionEnabled: boolean = true;

chrome.storage.sync.get(['extensionEnabled']).then((result) => {
    extensionEnabled = result.extensionEnabled !== false; // Default to true
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'toggleExtension') {
        extensionEnabled = message.enabled;
        console.log(`Extension ${extensionEnabled ? 'enabled' : 'disabled'}`);
    }
});

document.addEventListener("scroll", function(): void {
    if (!isThrottled && extensionEnabled) {
        isThrottled = true;
        setTimeout(() => {
            script();
            isThrottled = false;
        }, 500); 
    }
});

function script(): void {
    if (!extensionEnabled) return;
    
    const elements: NodeListOf<HTMLAnchorElement> = document.querySelectorAll("a");

    elements.forEach((current_element: HTMLAnchorElement) => {
        const url: string = current_element.href;
        if (!url.startsWith("https://www.dagbladet.no/")) {
            return;
        }

        const current_headline: HTMLElement | null = current_element.querySelector(".headline");
        if (current_headline && isEligibleHeadline(current_headline)) {
            fetchAndUpdate(current_element, current_headline);
        }
    });
}

function isEligibleHeadline(headline: HTMLElement): boolean {
    const text: string = headline.innerText;
    return text.split(" ").length <= 4 && text.length < 50;
}

function fetchAndUpdate(element: HTMLAnchorElement, headline: HTMLElement): void {
    fetch(element.href)
        .then((response: Response) => response.text())
        .then((htmlString: string) => {
            const parser: DOMParser = new DOMParser();
            const doc: Document = parser.parseFromString(htmlString, "text/html");
            const newTitle: string | null = doc.querySelector(".subtitle")?.textContent || null;
            const newSecondaryTitle: string | null = doc.querySelector("p")?.textContent || null;

            if (newTitle || newSecondaryTitle) {
                headline.outerHTML = "<h3>" + (newTitle || newSecondaryTitle) + "</h3>";
            } else {
                console.log("Removing element due to empty titles: " + headline.innerText);
                element.remove();
            }
        })
        .catch((error: Error) => {
            console.error("Error fetching article: ", error);
            element.remove();
        });
}
