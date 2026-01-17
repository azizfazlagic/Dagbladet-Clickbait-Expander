let isThrottled: boolean = false;
let extensionEnabled: boolean = true;

chrome.storage.sync.get(['extensionEnabled']).then((result) => {
    extensionEnabled = result.extensionEnabled !== false;
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
    
    const elements: HTMLAnchorElement[] = Array.from(document.querySelectorAll("a"));

    elements
        .filter(isDagbladetUrl)
        .map(element => ({ element, headline: element.querySelector(".headline") as HTMLElement | null }))
        .filter(({ headline }) => headline && isEligibleHeadline(headline))
        .forEach(({ element, headline }) => fetchAndUpdate(element, headline!));
}

function isDagbladetUrl(element: HTMLAnchorElement): boolean {
    return element.href.startsWith("https://www.dagbladet.no/") || 
           element.href.startsWith("https://borsen.dagbladet.no/");
}

function isEligibleHeadline(headline: HTMLElement): boolean {
    const text: string = headline.innerText;
    return text.split(" ").length <= 20 && text.length < 100;
}

function findFirstContent(doc: Document, selectors: string[]): string | null {
    return selectors
        .map(selector => doc.querySelector(selector)?.textContent?.trim())
        .find(content => content && content.length > 0) ?? null;
}

function getDescription(doc: Document): string | null {
    const articleSelectors = [".subtitle", "article p", ".article-lead", ".ingress", ".lead"];
    const metaSelector = 'meta[name="description"]';
    
    const articleDesc = findFirstContent(doc, articleSelectors);
    if (articleDesc) return articleDesc;
    
    const metaDesc = doc.querySelector(metaSelector)?.getAttribute('content')?.trim();
    if (metaDesc) return metaDesc;
    
    return getJsonLdDescription(doc);
}

function getJsonLdDescription(doc: Document): string | null {
    const jsonLd = doc.querySelector('script[type="application/ld+json"]');
    if (!jsonLd?.textContent) return null;
    
    try {
        const data = JSON.parse(jsonLd.textContent);
        return data.description ?? null;
    } catch (e) {
        console.log("Could not parse JSON LD data");
        return null;
    }
}

function fetchAndUpdate(element: HTMLAnchorElement, headline: HTMLElement): void {
    fetch(element.href)
        .then((response: Response) => response.text())
        .then((htmlString: string) => {
            const parser: DOMParser = new DOMParser();
            const doc: Document = parser.parseFromString(htmlString, "text/html");
            const newTitle = getDescription(doc);

            if (newTitle && newTitle.length > 10) {
                headline.outerHTML = `<h3>${newTitle}</h3>`;
            } else {
                console.log("No suitable replacement found for: " + headline.innerText);
            }
        })
        .catch((error: Error) => {
            console.error("Error fetching article: ", error);
        });
}
