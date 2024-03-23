export function removeChild(parent, value) {
    const e = findChild(parent, value);
    if (e)
        parent.removeChild(e);
}

export function addOption(parent, value) {
    const elm = document.createElement("option");
    elm.text = value;
    parent.appendChild(elm);
}

export function addBlankOption(parent) {
    const elm = document.createElement("option");
    elm.ariaLabel = "Blank";
    parent.appendChild(elm);
}

function findChild(parent, value) {
    for (let i = 0; i < parent.children.length; i++) {
        if (parent.children[i].text === value)
            return parent.children[i];
    }
}