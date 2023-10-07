// The code for scrolling blocks into view comes from:
// https://github.com/TurboWarp/scratch-gui/blob/develop/src/addons/addons/find-bar/blockly/Utils.js
// I had no clue how to do the math for that

function topStack(block) {
  let base = block;
  while (base.getOutputShape() && base.getSurroundParent()) {
    base = base.getSurroundParent();
  }
  return base;
}

function scrollBlockIntoView(blockOrId) {
  let workspace = Blockly.getMainWorkspace();
  let offsetX = 32;
  let offsetY = 32;
  let block = workspace.getBlockById(blockOrId);

  let root = block.getRootBlock();
  let base = topStack(block);
  let ePos = base.getRelativeToSurfaceXY(),
    rPos = root.getRelativeToSurfaceXY(),
    scale = workspace.scale,
    x = rPos.x * scale,
    y = ePos.y * scale,
    xx = block.width + x,
    yy = block.height + y,
    s = workspace.getMetrics();
  if (
    x < s.viewLeft + offsetX - 4 ||
    xx > s.viewLeft + s.viewWidth ||
    y < s.viewTop + offsetY - 4 ||
    yy > s.viewTop + s.viewHeight
  ) {
    let sx = x - s.contentLeft - offsetX,
      sy = y - s.contentTop - offsetY;

    workspace.scrollbar.set(sx, sy);
  }
}

function copyToClipboard(text) {
  var textarea = document.createElement("textarea");
  textarea.textContent = text;
  textarea.style.position = "fixed";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

setInterval(() => {
  try {
    let elems = Array.from(
      document
        .querySelector("g.blocklyBlockCanvas")
        .querySelectorAll("g.blocklyDraggable")
    );
    elems.forEach((e) => {
      e.oncontextmenu = (e) => {
        /** @type {Element[]} */
        const pathElems = e.path;
        const scriptOrig = pathElems.filter((e) => {
          try {
            return e.classList.value === "blocklyDraggable blocklySelected";
          } catch (e) {
            return false;
          }
        });
        if (
          scriptOrig[0].attributes["data-shapes"].value !== "hat" &&
          scriptOrig[0].attributes["data-category"].value !== "events"
        ) {
          return;
        }
        document.querySelector(".blocklyWidgetDiv .goog-menu").style.maxHeight =
          "185px";
        const menu = document
          .querySelector("div.goog-menu.goog-menu-vertical.blocklyContextMenu")
          .querySelectorAll(".goog-menuitem");
        /** @type {HTMLElement} */
        const copy = menu[menu.length - 1].cloneNode(true);
        copy.removeAttribute("id");
        copy.querySelector(".goog-menuitem-content").textContent =
          "Copy script link";
        copy.onclick = () => {
          const scriptId = scriptOrig[0].attributes["data-id"].value;
          const spriteName = Array.from(
            document.querySelectorAll(
              "div.sprite-selector_sprite-wrapper_SMB5H"
            )
          )
            .filter((e) =>
              e.querySelector("div").className.includes("is-selected")
            )[0]
            .textContent.replace("duplicateexportdelete", "");
          copyToClipboard(`[${spriteName}-${scriptId}]`);
          document
            .querySelector(
              "div.goog-menu.goog-menu-vertical.blocklyContextMenu"
            )
            .remove();
        };
        copy.onmouseenter = () => (copy.style.backgroundColor = "#d6e9f8");
        copy.onmouseleave = () => (copy.style.backgroundColor = "white");
        document
          .querySelector(".blocklyWidgetDiv .goog-menu")
          .appendChild(copy);
      };
    });
  } catch {}
}, 500);

let comments = setInterval(() => {
  let elems;
  try {
    elems = document.querySelectorAll(
      "g.blocklyBubbleCanvas g.blocklyDraggable"
    );
  } catch {
    return;
  }
  if (elems.length === 0) return;
  elems.forEach((e, i) => {
    // comment contains [Spritename-scriptid]
    let match = e.querySelector("text").textContent.match(/\[(.*)-(.*)\]/g);
    let linkedContent = e.querySelector("text").textContent;
    if (match !== null) {
      match.forEach(
        (e) =>
          (linkedContent = linkedContent.replace(
            e,
            `<a href="https://google.com" contenteditable="false">${e}</a>`
          ))
      );
      let textarea = e.querySelector("textarea");
      console.log("Wubfsubadf");
      textarea.outerHTML = textarea.outerHTML
        .replaceAll("textarea", "div")
        .replace(
          "></div",
          ` contenteditable="true" tabindex="${i}" onfocus="convertTextarea(event)">${linkedContent}</div`
        );
      textarea.classList.add("containsLink");
    }
  });
  clearInterval(comments);
}, 500);

function getEventListeners(element) {
  const eventListeners = {};
  const properties = Object.getOwnPropertyNames(element);
  for (const property of properties) {
    if (/^on/.test(property)) {
      const eventType = property.slice(2);
      const listeners = element[property];
      if (listeners instanceof Function) {
        eventListeners[eventType] = [listeners];
      } else if (listeners instanceof Array) {
        eventListeners[eventType] = listeners;
      }
    }
  }
  return eventListeners;
}

/** @param {Event} event */
function convertTextarea(event) {
  const originalElement = event.target;
  const clonedElement = originalElement.cloneNode(true);
  /** @type {HTMLTextAreaElement} */
  const newElement = document.createElement("textarea");
  for (const attribute of clonedElement.attributes) {
    newElement.setAttribute(attribute.name, attribute.value);
  }

  newElement.innerHTML = clonedElement.innerText;
  originalElement.parentNode.replaceChild(newElement, originalElement);
  const originalListeners = getEventListeners(originalElement);

  for (const eventType in originalListeners) {
    for (const listener of originalListeners[eventType]) {
      newElement.addEventListener(eventType, listener.listener);
    }
  }
  clonedElement.remove();
  newElement.removeAttribute("onfocus");
  newElement.setAttribute("onblur", "convertFormatted(event)");
  newElement.focus();
  newElement.onkeyup = () => {
    newElement.parentElement.parentElement.parentElement.querySelector(
      "text"
    ).innerHTML = newElement.value;
  };
}

/** @param {Event} event */
function convertFormatted(event) {
  const originalElement = event.target;
  console.log(originalElement.innerHTML);
  const clonedElement = originalElement.cloneNode(true);
  const newElement = document.createElement("div");
  for (const attribute of clonedElement.attributes) {
    newElement.setAttribute(attribute.name, attribute.value);
  }

  newElement.innerHTML = clonedElement.innerText;
  originalElement.parentNode.replaceChild(newElement, originalElement);
  const originalListeners = getEventListeners(originalElement);

  for (const eventType in originalListeners) {
    for (const listener of originalListeners[eventType]) {
      newElement.addEventListener(eventType, listener.listener);
    }
  }
  clonedElement.remove();
  newElement.removeAttribute("onblur");
  let content =
    newElement.parentElement.parentElement.parentElement.querySelector(
      "text"
    ).innerHTML;
  let match = content.match(/\[(.*)-(.*)\]/g);
  if (match !== null) {
    match.forEach(
      (e) =>
        (content = content.replace(
          e,
          `<a href="https://google.com" contenteditable="false">${e}</a>`
        ))
    );
  }
  newElement.innerHTML = content;
  newElement.setAttribute("onfocus", "convertTextarea(event)");
  newElement.blur();
}
