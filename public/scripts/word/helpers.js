// helpers.js
import { IndexedDBStorage } from "../IndexedDBStorage.js";


export function writeFile(file) {
    if (file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const textContent = e.target.result;
            await IndexedDBStorage.setItem('textContent', textContent);
            sessionStorage.setItem('textContent', 'changed');
            importConfig.value = ''; // Clear the file input
        };
        reader.readAsText(file);
    }
}

export function handleDocxImport(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const arrayBuffer = e.target.result;

            var options = {
                styleMap: [
                    "p[style-name='Section Title'] => h1:fresh",
                    "p[style-name='Subsection Title'] => h2:fresh",
                    "u => u",
                    "b => strong",
                    "i => em",
                    "p[style-name='Heading 1'] => h1:fresh",
                    "p[style-name='Heading 2'] => h2:fresh",
                    "p[style-name='Normal'] => p:fresh",
                    "r[style-name='Underline'] => u",
                    "r[style-name='Strong'] => strong",
                    "r[style-name='Emphasis'] => em",
                    "r => span",
                    "table => table",
                    "tr => tr",
                    "td => td",
                    "th => th"
                ],
                // convertImage: mammoth.images.imgElement(function (image) {
                //     console.log("here")
                //     return image.read("base64").then(function (imageBuffer) {
                //         console.log(imageBuffer)

                //         return {
                //             src: "data:" + image.contentType + ";base64," + imageBuffer,
                //             style: "max-width: 100%; height: auto;"
                //         };
                //     });
                // }),
                ignoreEmptyParagraphs: false,
                includeDefaultStyleMap: true
            };

            mammoth.convertToHtml({ arrayBuffer }, options)
                .then(async (result) => {
                    let html = result.value; // The generated HTML

                    // Post-processing to handle text color and background color
                    html = postProcessHtml(html);

                    // console.log(html);
                    await IndexedDBStorage.setItem('textContent', formatMammothHtml(html));
                    sessionStorage.setItem('textContent', 'changed')
                    // You can now use the HTML string as needed
                })
                .catch(err => {
                    console.error("Error converting DOCX to HTML:", err);
                });
        };
        reader.readAsArrayBuffer(file);
    }

    // event.target.files[0] = null;
}

function formatMammothHtml(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // doc.querySelectorAll('td').forEach(td => {
    //     td.innerHTML = td.textContent.trim().replace(/\n/g, '');
    //     td.classList.add('ql-align-center');
    // });

    doc.querySelectorAll('td').forEach(td => {
        td.innerHTML = td.textContent.trim().replace(/\n/g, '');
        // const childNodes = Array.from(td.childNodes);
        // const filteredNodes = childNodes.filter(node => {
        //     return node.nodeType !== Node.TEXT_NODE || node.textContent.trim() !== '' || node.tagName === 'IMG';
        // });

        // td.innerHTML = '';
        // filteredNodes.forEach(node => td.appendChild(node));
        // td.classList.add('ql-align-center');
    });

    // Add a <br> after each table
    doc.querySelectorAll('table').forEach(table => {
        const br = doc.createElement('br');
        table.parentNode.insertBefore(br, table.nextSibling);
    });

    // // Remove empty paragraphs but keep those with images
    // doc.querySelectorAll('p').forEach(p => {
    //     if (p.textContent.trim() === '' && !p.querySelector('img')) {
    //         p.remove();
    //     }
    // });

    return doc.body.innerHTML;
}

function postProcessHtml(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const elements = doc.querySelectorAll('*');
    elements.forEach(element => {
        const style = window.getComputedStyle(element);
        if (style.fontFamily) {
            element.style.fontFamily = style.fontFamily;
        }
        if (style.fontSize) {
            element.style.fontSize = style.fontSize;
        }
        if (style.color) {
            element.style.color = style.color;
        }
        if (style.backgroundColor) {
            element.style.backgroundColor = style.backgroundColor;
        }
        if (style.textAlign) {
            element.style.textAlign = style.textAlign;
        }
        if (style.fontWeight === 'bold') {
            element.style.fontWeight = 'bold';
        }
        if (style.fontStyle === 'italic') {
            element.style.fontStyle = 'italic';
        }
        if (style.textDecoration.includes('underline')) {
            element.style.textDecoration = 'underline';
        }
    });

    // Ensure images are correctly styled and retained
    const images = doc.querySelectorAll('img');
    images.forEach(img => {
        if (!img.style.maxWidth) {
            img.style.maxWidth = '100%';
        }
        if (!img.style.height) {
            img.style.height = 'auto';
        }
        if (!img.src.startsWith("data:image")) {
            console.warn("Image source is not a valid base64 data URI:", img.src);
        }
    });

    return doc.body.innerHTML;
}


