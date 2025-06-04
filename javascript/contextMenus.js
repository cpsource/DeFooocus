// based on https://github.com/AUTOMATIC1111/stable-diffusion-webui/blob/v1.6.0/javascript/contextMenus.js

/**
 * Initialize the context menu utilities.
 *
 * Returns helper functions to append or remove menu options and to
 * attach the event listener responsible for displaying the context
 * menu.
 *
 * @returns {Array} Functions controlling context menu behaviour.
 */
var contextMenuInit = function() {
    let eventListenerApplied = false;
    let menuSpecs = new Map();

    const uid = function() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    };

    /**
     * Display the context menu at the cursor position.
     *
     * @param {Event} event - The triggering event.
     * @param {Element} element - DOM element that invoked the menu.
     * @param {Array} menuEntries - Menu entry descriptors.
     */
    function showContextMenu(event, element, menuEntries) {
        let posx = event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
        let posy = event.clientY + document.body.scrollTop + document.documentElement.scrollTop;

        let oldMenu = gradioApp().querySelector('#context-menu');
        if (oldMenu) {
            oldMenu.remove();
        }

        let baseStyle = window.getComputedStyle(gradioApp().querySelector('button.selected'));

        const contextMenu = document.createElement('nav');
        contextMenu.id = "context-menu";
        contextMenu.style.background = baseStyle.background;
        contextMenu.style.color = baseStyle.color;
        contextMenu.style.fontFamily = baseStyle.fontFamily;
        contextMenu.style.top = posy + 'px';
        contextMenu.style.left = posx + 'px';

        const contextMenuList = document.createElement('ul');
        contextMenuList.className = 'context-menu-items';
        contextMenu.append(contextMenuList);

        menuEntries.forEach(function(entry) {
            let contextMenuEntry = document.createElement('a');
            contextMenuEntry.innerHTML = entry['name'];
            contextMenuEntry.addEventListener("click", function() {
                entry['func']();
            });
            contextMenuList.append(contextMenuEntry);

        });

        gradioApp().appendChild(contextMenu);

        let menuWidth = contextMenu.offsetWidth + 4;
        let menuHeight = contextMenu.offsetHeight + 4;

        let windowWidth = window.innerWidth;
        let windowHeight = window.innerHeight;

        if ((windowWidth - posx) < menuWidth) {
            contextMenu.style.left = windowWidth - menuWidth + "px";
        }

        if ((windowHeight - posy) < menuHeight) {
            contextMenu.style.top = windowHeight - menuHeight + "px";
        }

    }

    /**
     * Register a new option for a specific target element.
     *
     * @param {string} targetElementSelector - CSS selector for the element that triggers the menu.
     * @param {string} entryName - Visible name of the menu entry.
     * @param {Function} entryFunction - Function executed on selection.
     * @returns {string} Unique identifier for the created entry.
     */
    function appendContextMenuOption(targetElementSelector, entryName, entryFunction) {

        var currentItems = menuSpecs.get(targetElementSelector);

        if (!currentItems) {
            currentItems = [];
            menuSpecs.set(targetElementSelector, currentItems);
        }
        let newItem = {
            id: targetElementSelector + '_' + uid(),
            name: entryName,
            func: entryFunction,
            isNew: true
        };

        currentItems.push(newItem);
        return newItem['id'];
    }

    /**
     * Remove a context menu option by its unique identifier.
     *
     * @param {string} uid - Identifier returned by appendContextMenuOption.
     */
    function removeContextMenuOption(uid) {
        menuSpecs.forEach(function(v) {
            let index = -1;
            v.forEach(function(e, ei) {
                if (e['id'] == uid) {
                    index = ei;
                }
            });
            if (index >= 0) {
                v.splice(index, 1);
            }
        });
    }

    /**
     * Attach global click and context menu listeners for displaying
     * and hiding the custom context menu.
     */
    function addContextMenuEventListener() {
        if (eventListenerApplied) {
            return;
        }
        gradioApp().addEventListener("click", function(e) {
            if (!e.isTrusted) {
                return;
            }

            let oldMenu = gradioApp().querySelector('#context-menu');
            if (oldMenu) {
                oldMenu.remove();
            }
        });
        gradioApp().addEventListener("contextmenu", function(e) {
            let oldMenu = gradioApp().querySelector('#context-menu');
            if (oldMenu) {
                oldMenu.remove();
            }
            menuSpecs.forEach(function(v, k) {
                if (e.composedPath()[0].matches(k)) {
                    showContextMenu(e, e.composedPath()[0], v);
                    e.preventDefault();
                }
            });
        });
        eventListenerApplied = true;

    }

    return [appendContextMenuOption, removeContextMenuOption, addContextMenuEventListener];
};

var initResponse = contextMenuInit();
var appendContextMenuOption = initResponse[0];
var removeContextMenuOption = initResponse[1];
var addContextMenuEventListener = initResponse[2];

/**
 * Stop any active repeating generation loop created by the example
 * context menu actions.
 */
let cancelGenerateForever = function() {
    clearInterval(window.generateOnRepeatInterval);
};

(function() {
    //Start example Context Menu Items
    /**
     * Continuously trigger a generation button until an interrupt button becomes visible.
     *
     * @param {string} genbuttonid - Selector for the generate button.
     * @param {string} interruptbuttonid - Selector for the interrupt button.
     */
    let generateOnRepeat = function(genbuttonid, interruptbuttonid) {
        let genbutton = gradioApp().querySelector(genbuttonid);
        let interruptbutton = gradioApp().querySelector(interruptbuttonid);
        if (!interruptbutton.offsetParent) {
            genbutton.click();
        }
        clearInterval(window.generateOnRepeatInterval);
        window.generateOnRepeatInterval = setInterval(function() {
            if (!interruptbutton.offsetParent) {
                genbutton.click();
            }
        },
        500);
    };

    /**
     * Shortcut bound to the menu item that starts endless generation.
     */
    let generateOnRepeatForButtons = function() {
        generateOnRepeat('#generate_button', '#stop_button');
    };
    appendContextMenuOption('#generate_button', 'Generate forever', generateOnRepeatForButtons);

})();
//End example Context Menu Items

/**
 * When the document is fully loaded attach the context menu listeners.
 */
document.onreadystatechange = function () {
    if (document.readyState == "complete") {
        addContextMenuEventListener();
    }
};
